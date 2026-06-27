import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type EmailReminderSettings = {
  enabled?: boolean;
  emailAddress?: string;
  dailyReminder?: boolean;
  weeklyReport?: boolean;
  streakWarning?: boolean;
};

type TelegramReminderSettings = {
  timezone?: string;
};

type SettingsPayload = {
  emailReminders?: EmailReminderSettings | null;
  reminders?: TelegramReminderSettings | null;
};

type DailyRoutineActions = {
  date?: string;
  openedApp?: boolean;
  reviewedWallet?: boolean;
  reviewedDay?: boolean;
  lockedNextMove?: boolean;
  checkedChart?: boolean;
  checkedSave?: boolean;
  sharedProgress?: boolean;
};

type AppStatePayload = {
  dailyRoutineActions?: DailyRoutineActions;
  streak?: {
    current?: number;
    best?: number;
  };
  [key: string]: unknown;
};

type SettingsRow = {
  telegram_id: number | string;
  onboarding_completed?: boolean | null;
  settings_payload?: SettingsPayload | null;
  app_state_payload?: AppStatePayload | null;
};

type EmailJobType = "daily" | "weekly" | "streak";

type EmailReminderDetail = {
  telegramId: number;
  email?: string;
  status: "eligible" | "skipped";
  reason?: string;
  types?: EmailJobType[];
  timezone?: string;
  dateKey?: string;
};

const MAX_PER_RUN = 300;
const MAX_DETAILS = 80;

function getOptionalEnv(name: string) {
  return process.env[name] || "";
}

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getSupabaseHeaders() {
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
}

function getSupabaseBaseUrl() {
  return getEnv("SUPABASE_URL")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

function supabaseUrl(path: string) {
  return `${getSupabaseBaseUrl()}/rest/v1/${path}`;
}

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(supabaseUrl(path), {
    ...options,
    headers: {
      ...getSupabaseHeaders(),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;

  const text = await response.text();

  return text ? JSON.parse(text) : null;
}

function getEmailSecret() {
  return (
    getOptionalEnv("EMAIL_REMINDERS_SECRET") ||
    getOptionalEnv("CRON_SECRET") ||
    getOptionalEnv("NOTIFICATIONS_SECRET")
  );
}

function isAuthorized(request: NextRequest) {
  const secret = getEmailSecret();

  if (!secret) return false;

  const key = request.nextUrl.searchParams.get("key");
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  return key === secret || bearer === secret;
}

function normalizeTimezone(value: unknown) {
  const timezone = String(value || "UTC").trim() || "UTC";

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return "UTC";
  }
}

function getLocalDateParts(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";

  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: get("weekday"),
  };
}

function normalizeEmailAddress(value: unknown) {
  return String(value || "").trim().slice(0, 160);
}

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "hidden";

  const visibleName = name.length <= 2 ? name[0] || "*" : `${name.slice(0, 2)}…`;
  const [domainName, ...rest] = domain.split(".");
  const visibleDomain = domainName ? `${domainName.slice(0, 2)}…` : "…";

  return `${visibleName}@${visibleDomain}.${rest.join(".") || "*"}`;
}

function normalizeEmailReminderSettings(
  input?: EmailReminderSettings | null
): Required<EmailReminderSettings> {
  return {
    enabled: Boolean(input?.enabled),
    emailAddress: normalizeEmailAddress(input?.emailAddress),
    dailyReminder: typeof input?.dailyReminder === "boolean" ? input.dailyReminder : true,
    weeklyReport: typeof input?.weeklyReport === "boolean" ? input.weeklyReport : true,
    streakWarning: typeof input?.streakWarning === "boolean" ? input.streakWarning : true,
  };
}

function isRoutineComplete(actions: DailyRoutineActions | undefined, dateKey: string) {
  if (!actions || actions.date !== dateKey) return false;

  return Boolean(
    actions.openedApp &&
      actions.reviewedWallet &&
      actions.reviewedDay &&
      actions.lockedNextMove &&
      actions.checkedChart &&
      actions.checkedSave &&
      actions.sharedProgress
  );
}

function getRequestedTypes(request: NextRequest): EmailJobType[] {
  const raw = request.nextUrl.searchParams.get("type") || "all";
  const values = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (values.includes("all")) return ["daily", "weekly", "streak"];

  const allowed = new Set<EmailJobType>(["daily", "weekly", "streak"]);
  const selected = values.filter((value): value is EmailJobType =>
    allowed.has(value as EmailJobType)
  );

  return selected.length > 0 ? selected : ["daily", "weekly", "streak"];
}

function detectEmailProvider() {
  const emailFrom = getOptionalEnv("EMAIL_FROM") || getOptionalEnv("MAIL_FROM");

  if (getOptionalEnv("RESEND_API_KEY")) {
    return {
      provider: "resend",
      configured: Boolean(emailFrom),
      canSend: false,
      missing: emailFrom ? [] : ["EMAIL_FROM"],
      mode: "skeleton-only",
    };
  }

  if (getOptionalEnv("SENDGRID_API_KEY")) {
    return {
      provider: "sendgrid",
      configured: Boolean(emailFrom),
      canSend: false,
      missing: emailFrom ? [] : ["EMAIL_FROM"],
      mode: "skeleton-only",
    };
  }

  const smtpMissing = [
    ["SMTP_HOST", getOptionalEnv("SMTP_HOST")],
    ["SMTP_USER", getOptionalEnv("SMTP_USER")],
    ["SMTP_PASS", getOptionalEnv("SMTP_PASS")],
    ["EMAIL_FROM", emailFrom],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (smtpMissing.length < 4) {
    return {
      provider: "smtp",
      configured: smtpMissing.length === 0,
      canSend: false,
      missing: smtpMissing,
      mode: "skeleton-only",
    };
  }

  return {
    provider: "none",
    configured: false,
    canSend: false,
    missing: ["RESEND_API_KEY or SENDGRID_API_KEY or SMTP_*", "EMAIL_FROM"],
    mode: "no-provider",
  };
}

async function getEligibleSettingsRows() {
  return (await supabaseFetch(
    [
      "broke_settings",
      "?select=telegram_id,onboarding_completed,settings_payload,app_state_payload",
      "&onboarding_completed=eq.true",
      "&order=updated_at.desc",
      `&limit=${MAX_PER_RUN}`,
    ].join("")
  )) as SettingsRow[];
}

function getDueTypes(input: {
  requestedTypes: EmailJobType[];
  settings: Required<EmailReminderSettings>;
  routineComplete: boolean;
  weekday: string;
}) {
  const due: EmailJobType[] = [];

  if (input.requestedTypes.includes("daily") && input.settings.dailyReminder) {
    due.push("daily");
  }

  if (
    input.requestedTypes.includes("weekly") &&
    input.settings.weeklyReport &&
    input.weekday === "Mon"
  ) {
    due.push("weekly");
  }

  if (
    input.requestedTypes.includes("streak") &&
    input.settings.streakWarning &&
    !input.routineComplete
  ) {
    due.push("streak");
  }

  return due;
}

export async function GET(request: NextRequest) {
  try {
    if (!getEmailSecret()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing EMAIL_REMINDERS_SECRET, CRON_SECRET or NOTIFICATIONS_SECRET. Email endpoint is locked by default.",
        },
        { status: 500 }
      );
    }

    if (!isAuthorized(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
    const requestedTypes = getRequestedTypes(request);
    const provider = detectEmailProvider();
    const rows = await getEligibleSettingsRows();
    const details: EmailReminderDetail[] = [];

    const result = {
      checked: 0,
      eligible: 0,
      wouldSend: 0,
      sent: 0,
      skipped: 0,
      blocked: 0,
      dryRun,
      requestedTypes,
      delivery: provider,
      details,
    };

    for (const row of rows) {
      const telegramId = Number(row.telegram_id);
      if (!telegramId) continue;

      result.checked += 1;

      const settings = normalizeEmailReminderSettings(
        row.settings_payload?.emailReminders
      );
      const email = normalizeEmailAddress(settings.emailAddress);
      const timezone = normalizeTimezone(row.settings_payload?.reminders?.timezone);
      const local = getLocalDateParts(timezone);
      const routineComplete = isRoutineComplete(
        row.app_state_payload?.dailyRoutineActions,
        local.dateKey
      );

      if (!settings.enabled) {
        result.skipped += 1;
        if (details.length < MAX_DETAILS) {
          details.push({ telegramId, status: "skipped", reason: "disabled" });
        }
        continue;
      }

      if (!email) {
        result.skipped += 1;
        if (details.length < MAX_DETAILS) {
          details.push({ telegramId, status: "skipped", reason: "missing-email" });
        }
        continue;
      }

      if (!isValidEmailAddress(email)) {
        result.skipped += 1;
        if (details.length < MAX_DETAILS) {
          details.push({
            telegramId,
            status: "skipped",
            reason: "invalid-email",
            email: maskEmail(email),
          });
        }
        continue;
      }

      const types = getDueTypes({
        requestedTypes,
        settings,
        routineComplete,
        weekday: local.weekday,
      });

      if (types.length === 0) {
        result.skipped += 1;
        if (details.length < MAX_DETAILS) {
          details.push({
            telegramId,
            status: "skipped",
            reason: "no-due-email-type",
            email: maskEmail(email),
            timezone,
            dateKey: local.dateKey,
          });
        }
        continue;
      }

      result.eligible += 1;
      result.wouldSend += types.length;

      if (!provider.configured || !provider.canSend || !dryRun) {
        result.blocked += types.length;
      }

      if (details.length < MAX_DETAILS) {
        details.push({
          telegramId,
          status: "eligible",
          email: maskEmail(email),
          types,
          timezone,
          dateKey: local.dateKey,
          reason: provider.canSend && dryRun ? "dry-run" : "delivery-disabled",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      ...result,
      note:
        "Email delivery is intentionally disabled in this skeleton. This endpoint only audits saved preferences and reports who would receive email after a provider is connected.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Email reminders failed",
      },
      { status: 500 }
    );
  }
}
