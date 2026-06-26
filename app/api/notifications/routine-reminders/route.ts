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
  [key: string]: unknown;
};

type SettingsRow = {
  telegram_id: number | string;
  daily_reminder?: boolean | null;
  onboarding_completed?: boolean | null;
  settings_payload?: SettingsPayload | null;
  app_state_payload?: AppStatePayload | null;
};

type NotificationLogRow = {
  sent_at?: string | null;
  status?: string | null;
};

type RoutineReminderDetail = {
  telegramId: number;
  status: string;
  reason?: string;
  time?: string;
  timezone?: string;
  dateKey?: string;
};

const NOTIFICATION_TYPE = "routine_daily_check";
const MAX_PER_RUN = 300;
const EARLY_GRACE_MINUTES = 2;
const LATE_GRACE_MINUTES = 10 * 60;

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

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || "00";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));

  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    minutes:
      (Number.isFinite(hour) ? hour : 0) * 60 +
      (Number.isFinite(minute) ? minute : 0),
  };
}

function minutesFromTime(time: string) {
  const [hour, minute] = normalizeReminderTime(time).split(":").map(Number);
  return hour * 60 + minute;
}

function getDueState(time: string, timezone: string, now = new Date()) {
  const local = getLocalParts(now, timezone);
  const target = minutesFromTime(time);
  const diff = local.minutes - target;

  if (diff < -EARLY_GRACE_MINUTES) {
    return { due: false, reason: "not-due-yet", diffMinutes: diff };
  }

  if (diff > LATE_GRACE_MINUTES) {
    return { due: false, reason: "due-window-passed", diffMinutes: diff };
  }

  return { due: true, reason: "due", diffMinutes: diff };
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
      "&onboarding_completed=eq.true",
      "&order=updated_at.desc",
      `&limit=${MAX_PER_RUN}`,
    ].join("")
  )) as SettingsRow[];
}

function alreadySentTodayFromAppState(
  appState: AppStatePayload | null | undefined,
  dateKey: string
) {
  return appState?.notificationState?.routineReminderLastSentDate === dateKey;
}

function logDateMatchesLocalDay(
  log: NotificationLogRow,
  dateKey: string,
  timezone: string
) {
  if (log.status !== "sent" || !log.sent_at) return false;

  const sentAt = new Date(log.sent_at);
  if (!Number.isFinite(sentAt.getTime())) return false;

  return localDateKey(timezone, sentAt) === dateKey;
}

async function getRecentNotificationLogs(telegramId: number) {
  try {
    return (await supabaseFetch(
      [
        "broke_notification_logs",
        "?select=sent_at,status",
        `&telegram_id=eq.${telegramId}`,
        `&type=eq.${NOTIFICATION_TYPE}`,
        "&order=sent_at.desc",
        "&limit=8",
      ].join("")
    )) as NotificationLogRow[];
  } catch {
    return [];
  }
}

function alreadySentTodayFromLogs(
  logs: NotificationLogRow[],
  dateKey: string,
  timezone: string
) {
  return logs.some((log) => logDateMatchesLocalDay(log, dateKey, timezone));
}

async function getLatestAppStatePayload(telegramId: number) {
  try {
    const rows = (await supabaseFetch(
      `broke_settings?telegram_id=eq.${telegramId}&select=app_state_payload&limit=1`
    )) as Array<{ app_state_payload?: AppStatePayload | null }>;

    return rows[0]?.app_state_payload || null;
  } catch {
    return null;
  }
}

function buildMarkedAppState(
  current: AppStatePayload | null | undefined,
  fallback: AppStatePayload | null | undefined,
  dateKey: string
): AppStatePayload {
  const base = current || fallback || {};
  const fallbackActions = fallback?.dailyRoutineActions;
  const currentActions = current?.dailyRoutineActions;

  return {
    ...base,
    dailyRoutineActions: currentActions || fallbackActions,
    notificationState: {
      ...(fallback?.notificationState || {}),
      ...(current?.notificationState || {}),
      routineReminderLastSentDate: dateKey,
      routineReminderLastSentAt: new Date().toISOString(),
    },
  };
}

async function markReminderSent(row: SettingsRow, dateKey: string) {
  const telegramId = Number(row.telegram_id);
  const latestAppState = await getLatestAppStatePayload(telegramId);
  const appState = buildMarkedAppState(
    latestAppState,
    row.app_state_payload,
    dateKey
  );

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
    "Open the tracker, log one real leak or finish Clean Day before the day ends.",
  ].join("\n");
}

async function sendTelegramMessage(telegramId: number, text: string) {
  const botToken = getEnv("TELEGRAM_BOT_TOKEN");
  const webAppUrl =
    getOptionalEnv("WEBAPP_URL") || getOptionalEnv("NEXT_PUBLIC_WEBAPP_URL");

  const body: Record<string, unknown> = {
    chat_id: telegramId,
    text,
    disable_web_page_preview: true,
  };

  if (webAppUrl) {
    body.reply_markup = {
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
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram sendMessage failed");
  }

  return Number(data.result?.message_id || 0);
}

async function safeLogNotification(input: {
  telegramId: number;
  message: string;
  status: "sent" | "failed";
  reason?: string;
  telegramMessageId?: number | null;
}) {
  try {
    await supabaseFetch("broke_notification_logs", {
      method: "POST",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        telegram_id: input.telegramId,
        type: NOTIFICATION_TYPE,
        message: input.message,
        status: input.status,
        reason: input.reason || null,
        telegram_message_id: input.telegramMessageId ?? null,
        sent_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Notification logs are useful for duplicate protection, but they must not
    // block actual Telegram reminders when the log table is unavailable.
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!getNotificationSecret()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing CRON_SECRET or NOTIFICATIONS_SECRET. Notification endpoint is locked by default.",
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
        return NextResponse.json({
          ok: true,
          dryRun: true,
          testTelegramId,
          status: "test-ready",
        });
      }

      const telegramMessageId = await sendTelegramMessage(
        testTelegramId,
        ["$BROKE test reminder", "", "Telegram reminders are connected."].join("\n")
      );

      return NextResponse.json({
        ok: true,
        testTelegramId,
        status: "test-sent",
        telegramMessageId,
      });
    }

    const result = {
      checked: 0,
      due: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      dryRun,
      windowMinutes: LATE_GRACE_MINUTES,
      details: [] as RoutineReminderDetail[],
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

      const dueState = getDueState(reminder.time, reminder.timezone);
      if (!dueState.due) {
        result.skipped += 1;
        result.details.push({
          telegramId,
          status: "skipped",
          reason: dueState.reason,
          time: reminder.time,
          timezone: reminder.timezone,
        });
        continue;
      }

      result.due += 1;

      const dateKey = localDateKey(reminder.timezone);
      const routineActions = row.app_state_payload?.dailyRoutineActions;

      if (isRoutineComplete(routineActions, dateKey)) {
        result.skipped += 1;
        result.details.push({
          telegramId,
          status: "skipped",
          reason: "routine-complete",
          time: reminder.time,
          timezone: reminder.timezone,
          dateKey,
        });
        continue;
      }

      const recentLogs = await getRecentNotificationLogs(telegramId);
      const alreadySent =
        alreadySentTodayFromAppState(row.app_state_payload, dateKey) ||
        alreadySentTodayFromLogs(recentLogs, dateKey, reminder.timezone);

      if (alreadySent) {
        result.skipped += 1;
        result.details.push({
          telegramId,
          status: "skipped",
          reason: "already-sent",
          time: reminder.time,
          timezone: reminder.timezone,
          dateKey,
        });
        continue;
      }

      try {
        if (dryRun) {
          result.sent += 1;
          result.details.push({
            telegramId,
            status: "dry-run",
            time: reminder.time,
            timezone: reminder.timezone,
            dateKey,
          });
          continue;
        }

        const telegramMessageId = await sendTelegramMessage(telegramId, message);
        await markReminderSent(row, dateKey);
        await safeLogNotification({
          telegramId,
          message,
          status: "sent",
          telegramMessageId,
        });

        result.sent += 1;
        result.details.push({
          telegramId,
          status: "sent",
          time: reminder.time,
          timezone: reminder.timezone,
          dateKey,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "send-failed";
        await safeLogNotification({
          telegramId,
          message,
          status: "failed",
          reason,
        });

        result.failed += 1;
        result.details.push({
          telegramId,
          status: "failed",
          reason,
          time: reminder.time,
          timezone: reminder.timezone,
          dateKey,
        });
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
