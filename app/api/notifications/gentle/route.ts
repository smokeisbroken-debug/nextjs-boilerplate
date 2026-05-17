import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type SettingsRow = {
  telegram_id: number;
  currency?: string | null;
  daily_reminder?: boolean | null;
  onboarding_completed?: boolean | null;
};

type ExpenseRow = {
  telegram_id: number;
  amount: number;
  category: string | null;
  need_type: string | null;
  created_at: string;
};

type NotificationLogRow = {
  sent_at: string;
  status: string;
};

const NOTIFICATION_TYPE = "gentle_daily_check";
const MAX_PER_RUN = 120;
const MIN_HOURS_BETWEEN = 22;
const MAX_PER_7_DAYS = 3;

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

function utcDayStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}


function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function money(value: number, currency: string) {
  const symbol = currency === "EUR" ? "€" : currency === "MDL" ? "L" : "$";
  return `${symbol}${Math.round(value).toLocaleString("en-US")}`;
}

async function getEligibleSettingsRows() {
  return (await supabaseFetch(
    [
      "broke_settings",
      "?select=telegram_id,currency,daily_reminder,onboarding_completed",
      "&daily_reminder=eq.true",
      "&onboarding_completed=eq.true",
      `&limit=${MAX_PER_RUN}`,
    ].join("")
  )) as SettingsRow[];
}

async function getTodayExpenses(telegramId: number) {
  return (await supabaseFetch(
    [
      "broke_expenses",
      "?select=telegram_id,amount,category,need_type,created_at",
      `&telegram_id=eq.${telegramId}`,
      `&created_at=gte.${encodeURIComponent(utcDayStart().toISOString())}`,
      "&order=created_at.desc",
      "&limit=50",
    ].join("")
  )) as ExpenseRow[];
}

async function getRecentNotificationLogs(telegramId: number) {
  return (await supabaseFetch(
    [
      "broke_notification_logs",
      "?select=sent_at,status",
      `&telegram_id=eq.${telegramId}`,
      `&type=eq.${NOTIFICATION_TYPE}`,
      `&sent_at=gte.${encodeURIComponent(daysAgo(7))}`,
      "&order=sent_at.desc",
      "&limit=10",
    ].join("")
  )) as NotificationLogRow[];
}

function shouldSkipFromLogs(logs: NotificationLogRow[]) {
  const successfulLogs = logs.filter((log) => log.status === "sent");

  const lastSentAt = successfulLogs[0]?.sent_at;

  if (lastSentAt) {
    const lastSentMs = new Date(lastSentAt).getTime();
    const minGapMs = MIN_HOURS_BETWEEN * 60 * 60 * 1000;

    if (Number.isFinite(lastSentMs) && Date.now() - lastSentMs < minGapMs) {
      return "already-sent-recently";
    }
  }

  if (successfulLogs.length >= MAX_PER_7_DAYS) {
    return "weekly-cap-reached";
  }

  return "";
}

function buildGentleMessage(settings: SettingsRow, todayExpenses: ExpenseRow[]) {
  const currency = settings.currency || "USD";

  if (todayExpenses.length > 0) {
    const total = todayExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return [
      "Quiet $BROKE check-in.",
      "",
      `You already tracked ${money(total, currency)} today.`,
      "No need to overdo it.",
      "",
      "One honest record is better than fake discipline.",
    ].join("\n");
  }

  const messages = [
    [
      "Quiet $BROKE check-in.",
      "",
      "No pressure.",
      "Just one small question:",
      "",
      "Did your wallet leak today?",
      "",
      "If yes, track one expense. That is enough.",
    ],
    [
      "Small leaks are easy to ignore.",
      "",
      "Coffee. Delivery. Smoking. Shopping.",
      "",
      "Track one thing today if it happened.",
      "No spam. No guilt. Just clarity.",
    ],
    [
      "Your wallet does not need a lecture.",
      "",
      "It needs one honest record.",
      "",
      "Open $BROKE Tracker if there was a leak today.",
    ],
  ];

  const index = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % messages.length;

  return messages[index].join("\n");
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
              text: "Open $BROKE Tracker",
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

async function logNotification(input: {
  telegramId: number;
  message: string;
  status: "sent" | "skipped" | "failed";
  reason?: string;
  telegramMessageId?: number | null;
}) {
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
}

function isAuthorized(request: NextRequest) {
  const secret = getOptionalEnv("CRON_SECRET") || getOptionalEnv("NOTIFICATIONS_SECRET");

  if (!secret) {
    return true;
  }

  const key = request.nextUrl.searchParams.get("key");
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  return key === secret || bearer === secret;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (getOptionalEnv("GENTLE_NOTIFICATIONS_ENABLED") === "false") {
      return NextResponse.json({ ok: true, disabled: true });
    }

    const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
    const settingsRows = await getEligibleSettingsRows();

    const result = {
      checked: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      dryRun,
      details: [] as Array<{ telegramId: number; status: string; reason?: string }>,
    };

    for (const settings of settingsRows) {
      const telegramId = Number(settings.telegram_id);

      if (!telegramId) continue;

      result.checked += 1;

      const logs = await getRecentNotificationLogs(telegramId);
      const skipReason = shouldSkipFromLogs(logs);

      if (skipReason) {
        result.skipped += 1;
        result.details.push({ telegramId, status: "skipped", reason: skipReason });
        continue;
      }

      const todayExpenses = await getTodayExpenses(telegramId);

      if (todayExpenses.length > 0) {
        result.skipped += 1;
        result.details.push({ telegramId, status: "skipped", reason: "already-tracked-today" });
        continue;
      }

      const message = buildGentleMessage(settings, todayExpenses);

      try {
        if (dryRun) {
          result.sent += 1;
          result.details.push({ telegramId, status: "dry-run" });
          continue;
        }

        const telegramMessageId = await sendTelegramMessage(telegramId, message);
        await logNotification({
          telegramId,
          message,
          status: "sent",
          telegramMessageId,
        });

        result.sent += 1;
        result.details.push({ telegramId, status: "sent" });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "send-failed";

        await logNotification({
          telegramId,
          message,
          status: "failed",
          reason,
        });

        result.failed += 1;
        result.details.push({ telegramId, status: "failed", reason });
      }
    }

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Gentle notifications failed",
      },
      { status: 500 }
    );
  }
}
