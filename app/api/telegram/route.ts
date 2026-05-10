import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type TelegramUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  is_bot?: boolean;
};

type TelegramMessage = {
  message_id?: number;
  text?: string;
  date?: number;
  chat?: {
    id?: number | string;
    type?: string;
  };
  from?: TelegramUser;
};

type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
};

const PROJECT_X_URL = "https://x.com/SmokeIsBroke";
const PROJECT_TG_URL = "https://t.me/SmokeIsBrokeSol";

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

function getWebAppUrl() {
  return process.env.WEBAPP_URL || process.env.NEXT_PUBLIC_WEBAPP_URL || "";
}

function getWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET || "";
}

function getTelegramGroupId() {
  return process.env.TELEGRAM_GROUP_ID || "";
}

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

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  return text ? JSON.parse(text) : null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function cleanMessageText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 500);
}

function getSenderName(user?: TelegramUser) {
  if (!user) return "Telegram member";

  if (user.username) {
    return `@${user.username}`;
  }

  return [user.first_name, user.last_name].filter(Boolean).join(" ") || "Telegram member";
}

function isConfiguredForCommunityLogging() {
  return Boolean(
    getOptionalEnv("SUPABASE_URL") &&
      getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") &&
      getTelegramGroupId()
  );
}

function isTargetCommunityGroup(message: TelegramMessage) {
  const groupId = getTelegramGroupId();

  if (!groupId || !message.chat?.id) {
    return false;
  }

  return String(message.chat.id) === String(groupId);
}

async function saveCommunityTelegramMessage(message: TelegramMessage) {
  if (!isConfiguredForCommunityLogging()) {
    return;
  }

  if (!isTargetCommunityGroup(message)) {
    return;
  }

  if (message.from?.is_bot) {
    return;
  }

  const text = cleanMessageText(message.text || "");

  if (!text) {
    return;
  }

  await supabaseFetch("broke_community_messages?on_conflict=telegram_message_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify({
      sender_name: getSenderName(message.from),
      username: message.from?.username ?? null,
      text,
      source: "telegram",
      telegram_message_id: message.message_id ?? null,
      created_at: new Date((message.date || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    }),
  });
}

async function sendTelegramMessage(chatId: number | string, firstName?: string) {
  const botToken = getBotToken();
  const webAppUrl = getWebAppUrl();

  if (!botToken || !webAppUrl) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or WEBAPP_URL");
  }

  const safeName = firstName ? escapeHtml(firstName) : "there";

  const text = [
    `Welcome, ${safeName}.`,
    "",
    "<b>$BROKE Life Tracker</b>",
    "Track your leaks. Fix your life.",
    "",
    "Open the Mini App below and start tracking expenses.",
    "",
    "<i>Not financial advice. Just financial clarity.</i>",
  ].join("\n");

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: "Open $BROKE Tracker",
          web_app: {
            url: webAppUrl,
          },
        },
      ],
      [
        {
          text: "Join Telegram",
          url: PROJECT_TG_URL,
        },
        {
          text: "Follow X",
          url: PROJECT_X_URL,
        },
      ],
    ],
  };

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: replyMarkup,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram sendMessage failed");
  }

  return data;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "telegram-webhook",
    message: "POST updates from Telegram should arrive here after setWebhook.",
    community: {
      groupIdConfigured: Boolean(getTelegramGroupId()),
      supabaseConfigured: Boolean(
        getOptionalEnv("SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY")
      ),
    },
  });
}

export async function POST(request: NextRequest) {
  const secret = getWebhookSecret();

  if (secret) {
    const incomingSecret = request.headers.get("x-telegram-bot-api-secret-token");

    if (incomingSecret !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  let update: TelegramUpdate;

  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true, ignored: "invalid-json" });
  }

  const message = update.message || update.edited_message;
  const chatId = message?.chat?.id;

  if (!message || !chatId) {
    return NextResponse.json({ ok: true, ignored: "no-chat-id" });
  }

  const text = (message.text || "").trim();

  try {
    if (isTargetCommunityGroup(message)) {
      await saveCommunityTelegramMessage(message);

      return NextResponse.json({
        ok: true,
        communityLogged: Boolean(text),
      });
    }

    if (text.startsWith("/start") || text.startsWith("/help") || text === "") {
      await sendTelegramMessage(chatId, message.from?.first_name);
    } else {
      await sendTelegramMessage(chatId, message.from?.first_name);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
