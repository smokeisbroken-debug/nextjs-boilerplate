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
    title?: string;
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
    return {
      saved: false,
      reason: "community-logging-not-configured",
    };
  }

  if (!isTargetCommunityGroup(message)) {
    return {
      saved: false,
      reason: "not-target-group",
    };
  }

  if (message.from?.is_bot) {
    return {
      saved: false,
      reason: "bot-message-ignored",
    };
  }

  const text = cleanMessageText(message.text || "");

  if (!text) {
    return {
      saved: false,
      reason: "empty-text",
    };
  }

  try {
    // Important:
    // Do NOT use on_conflict here. Some Supabase/PostgREST setups reject
    // partial unique indexes for on_conflict and the webhook silently fails.
    await supabaseFetch("broke_community_messages", {
      method: "POST",
      headers: {
        Prefer: "return=minimal",
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

    return {
      saved: true,
      reason: "saved",
    };
  } catch (error) {
    console.error("Community Telegram message save failed:", error);

    return {
      saved: false,
      reason: error instanceof Error ? error.message : "save-failed",
    };
  }
}


function isPrivateChat(message: TelegramMessage) {
  return message.chat?.type === "private";
}

function parseLinkCode(text: string) {
  const trimmed = text.trim();
  const startMatch = trimmed.match(/^\/start\s+link_([A-Z0-9]{6})$/i);
  const linkMatch = trimmed.match(/^\/link\s+([A-Z0-9]{6})$/i);

  return (startMatch?.[1] || linkMatch?.[1] || "").toUpperCase();
}

async function sendPlainTelegramMessage(chatId: number | string, text: string) {
  const botToken = getBotToken();

  if (!botToken) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN");
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram sendMessage failed");
  }

  return data;
}

async function linkWebsiteAccountFromTelegram(message: TelegramMessage, code: string) {
  if (!message.from?.id) {
    return {
      linked: false,
      reason: "missing-user",
    };
  }

  const rows = (await supabaseFetch(
    `broke_web_link_codes?select=*&code=eq.${encodeURIComponent(code)}&status=eq.pending&order=created_at.desc&limit=1`
  )) as Record<string, unknown>[];

  const row = rows[0];

  if (!row) {
    return {
      linked: false,
      reason: "code-not-found",
    };
  }

  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    await supabaseFetch(`broke_web_link_codes?id=eq.${encodeURIComponent(String(row.id))}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status: "expired",
      }),
    });

    return {
      linked: false,
      reason: "expired",
    };
  }

  await supabaseFetch(`broke_web_link_codes?id=eq.${encodeURIComponent(String(row.id))}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      status: "linked",
      telegram_user_id: message.from.id,
      telegram_username: message.from.username ?? null,
      telegram_first_name: message.from.first_name ?? null,
      telegram_last_name: message.from.last_name ?? null,
      linked_at: new Date().toISOString(),
    }),
  });

  return {
    linked: true,
    reason: "linked",
  };
}

async function handleWebsiteLinkCommand(message: TelegramMessage, text: string) {
  const code = parseLinkCode(text);

  if (!code || !message.chat?.id) {
    return false;
  }

  const result = await linkWebsiteAccountFromTelegram(message, code);

  if (result.linked) {
    await sendPlainTelegramMessage(
      message.chat.id,
      "✅ Website linked. Go back to the $BROKE Life Tracker page. It will sync automatically."
    );
  } else if (result.reason === "expired") {
    await sendPlainTelegramMessage(
      message.chat.id,
      "Link code expired. Generate a new code on the website and try again."
    );
  } else {
    await sendPlainTelegramMessage(
      message.chat.id,
      "Invalid link code. Generate a new code on the website and send it again."
    );
  }

  return true;
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
      groupId: getTelegramGroupId() || null,
      groupIdConfigured: Boolean(getTelegramGroupId()),
      supabaseConfigured: Boolean(
        getOptionalEnv("SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY")
      ),
      botTokenConfigured: Boolean(getBotToken()),
      webAppUrlConfigured: Boolean(getWebAppUrl()),
      privacyReminder: "BotFather /setprivacy must be Disable for normal group messages.",
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
    if (isPrivateChat(message) && text) {
      const handledLink = await handleWebsiteLinkCommand(message, text);

      if (handledLink) {
        return NextResponse.json({
          ok: true,
          websiteLinkCommand: true,
        });
      }
    }

    if (isTargetCommunityGroup(message)) {
      const communityResult = await saveCommunityTelegramMessage(message);

      return NextResponse.json({
        ok: true,
        groupMessage: true,
        chatId: String(chatId),
        textDetected: Boolean(text),
        communityResult,
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
