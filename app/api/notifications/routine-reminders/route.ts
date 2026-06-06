import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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

type ReminderSettings = {
  enabled?: boolean;
  time?: string;
  timezone?: string;
};

type SettingsPayload = {
  reminders?: ReminderSettings;
  dailyReminder?: boolean;
  onboardingCompleted?: boolean;
};

type AppStatePayload = {
  dailyRoutineActions?: DailyRoutineActions;
  notificationState?: {
    routineReminderLastSentDate?: string;
    routineReminderLastSentAt?: string;
  };
};

type SettingsRow = {
  telegram_id: number | string;
  daily_reminder?: boolean | null;
  onboarding_completed?: boolean | null;
  settings_payload?: SettingsPayload | null;
  app_state_payload?: AppStatePayload | null;
};

const MAX_PER_RUN = 220;
const DUE_WINDOW_MINUTES = 12;

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

function getNotificationSecret() {
  return getOptionalEnv("CRON_SECRET") || getOptionalEnv("NOTIFICATIONS_SECRET");
}

function isAuthorized(request: NextRequest) {
  const secret = getNotificationSecret();

  if (!secret) return false;

  const key = request.nextUrl.searchParams.get("key");
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  return key === secret || bearer === secret;
}

function normalizeReminderTime(value: unknown) {
  const raw = String(value || "").trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(raw) ? raw : "21:00";
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

function getLocalParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));

  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0),
  };
}

function minutesFromTime(time: string) {
  const [hour, minute] = normalizeReminderTime(time).split(":").map(Number);
  return hour * 60 + minute;
}

function isDueNow(time: string, timezone: string, now = new Date()) {
  const local = getLocalParts(now, timezone);
  const target = minutesFromTime(time);
  const diff = local.minutes - target;
  return diff >= 0 && diff <= DUE_WINDOW_MINUTES;
}

function localDateKey(timezone: string, now = new Date()) {
  return getLocalParts(now, timezone).dateKey;
}

function getReminderSettings(row: SettingsRow) {
  const payload = row.settings_payload || {};
  const reminders = payload.reminders || {};
  const enabled = Boolean(reminders.enabled ?? payload.dailyReminder ?? row.daily_reminder);
  const time = normalizeReminderTime(reminders.time);
  const timezone = normalizeTimezone(reminders.timezone);

  return { enabled, time, timezone };
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

async function getEligibleSettingsRows() {
  return (await supabaseFetch(
    [
      "broke_settings",
      "?select=telegram_id,daily_reminder,onboarding_completed,settings_payload,app_state_payload",
      "&daily_reminder=eq.true",
      "&onboarding_completed=eq.true",
      `&limit=${MAX_PER_RUN}`,
    ].join("")
  )) as SettingsRow[];
}

function alreadySentToday(appState: AppStatePayload | null | undefined, dateKey: string) {
  return appState?.notificationState?.routineReminderLastSentDate === dateKey;
}

async function markReminderSent(row: SettingsRow, dateKey: string) {
  const telegramId = Number(row.telegram_id);
  const appState: AppStatePayload = {
    ...(row.app_state_payload || {}),
    notificationState: {
      ...(row.app_state_payload?.notificationState || {}),
      routineReminderLastSentDate: dateKey,
      routineReminderLastSentAt: new Date().toISOString(),
    },
  };

  await supabaseFetch("broke_settings?on_conflict=telegram_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      telegram_id: telegramId,
      app_state_payload: appState,
      updated_at: new Date().toISOString(),
    }),
  });
}

function buildRoutineMessage() {
  return [
    "$BROKE reminder",
    "",
    "Your routine is not complete yet.",
    "Run Check, track a leak or mark Clean Day before the day ends.",
  ].join("\n");
}

async function sendTelegramMessage(telegramId: number, text: string) {
  const botToken = getEnv("TELEGRAM_BOT_TOKEN");
  const webAppUrl = getEnv("WEBAPP_URL");

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: telegramId,
      text,
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open $BROKE",
              web_app: {
                url: webAppUrl,
              },
            },
          ],
        ],
      },
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram sendMessage failed");
  }

  return Number(data.result?.message_id || 0);
}

export async function GET(request: NextRequest) {
  try {
    if (!getNotificationSecret()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing CRON_SECRET or NOTIFICATIONS_SECRET. Notification endpoint is locked by default.",
        },
        { status: 500 }
      );
    }

    if (!isAuthorized(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
    const testTelegramId = Number(request.nextUrl.searchParams.get("testTelegramId") || 0);
    const rows = await getEligibleSettingsRows();
    const message = buildRoutineMessage();

    if (testTelegramId > 0) {
      if (dryRun) {
        return NextResponse.json({ ok: true, dryRun: true, testTelegramId, status: "test-ready" });
      }

      const telegramMessageId = await sendTelegramMessage(
        testTelegramId,
        ["$BROKE test reminder", "", "Telegram reminders are connected."].join("\n")
      );

      return NextResponse.json({ ok: true, testTelegramId, status: "test-sent", telegramMessageId });
    }

    const result = {
      checked: 0,
      due: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      dryRun,
      details: [] as Array<{ telegramId: number; status: string; reason?: string; time?: string; timezone?: string }>,
    };

    for (const row of rows) {
      const telegramId = Number(row.telegram_id);
      if (!telegramId) continue;

      result.checked += 1;

      const reminder = getReminderSettings(row);
      if (!reminder.enabled) {
        result.skipped += 1;
        result.details.push({ telegramId, status: "skipped", reason: "disabled" });
        continue;
      }

      if (!isDueNow(reminder.time, reminder.timezone)) {
        result.skipped += 1;
        result.details.push({ telegramId, status: "skipped", reason: "not-due", time: reminder.time, timezone: reminder.timezone });
        continue;
      }

      result.due += 1;

      const dateKey = localDateKey(reminder.timezone);
      const routineActions = row.app_state_payload?.dailyRoutineActions;

      if (isRoutineComplete(routineActions, dateKey)) {
        result.skipped += 1;
        result.details.push({ telegramId, status: "skipped", reason: "routine-complete", time: reminder.time, timezone: reminder.timezone });
        continue;
      }

      if (alreadySentToday(row.app_state_payload, dateKey)) {
        result.skipped += 1;
        result.details.push({ telegramId, status: "skipped", reason: "already-sent", time: reminder.time, timezone: reminder.timezone });
        continue;
      }

      try {
        if (dryRun) {
          result.sent += 1;
          result.details.push({ telegramId, status: "dry-run", time: reminder.time, timezone: reminder.timezone });
          continue;
        }

        await sendTelegramMessage(telegramId, message);
        await markReminderSent(row, dateKey);

        result.sent += 1;
        result.details.push({ telegramId, status: "sent", time: reminder.time, timezone: reminder.timezone });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "send-failed";
        result.failed += 1;
        result.details.push({ telegramId, status: "failed", reason, time: reminder.time, timezone: reminder.timezone });
      }
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Routine reminders failed",
      },
      { status: 500 }
    );
  }
}
