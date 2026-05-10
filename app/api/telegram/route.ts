import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type TelegramUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramMessage = {
  message_id?: number;
  text?: string;
  chat?: {
    id?: number | string;
    type?: string;
  };
  from?: TelegramUser;
};

type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

  const message = update.message;
  const chatId = message?.chat?.id;

  if (!chatId) {
    return NextResponse.json({ ok: true, ignored: "no-chat-id" });
  }

  const text = (message?.text || "").trim();

  try {
    if (text.startsWith("/start") || text.startsWith("/help") || text === "") {
      await sendTelegramMessage(chatId, message?.from?.first_name);
    } else {
      await sendTelegramMessage(chatId, message?.from?.first_name);
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
