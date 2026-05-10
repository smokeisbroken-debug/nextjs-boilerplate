import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

function getWebAppUrl() {
  return process.env.WEBAPP_URL || process.env.NEXT_PUBLIC_WEBAPP_URL || "";
}

function getWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET || "";
}

function getSetupSecret() {
  return process.env.TELEGRAM_SETUP_SECRET || "";
}

export async function GET(request: NextRequest) {
  const botToken = getBotToken();
  const webAppUrl = getWebAppUrl();
  const webhookSecret = getWebhookSecret();
  const setupSecret = getSetupSecret();

  if (setupSecret) {
    const key = request.nextUrl.searchParams.get("key");

    if (key !== setupSecret) {
      return NextResponse.json({ ok: false, error: "Wrong setup key" }, { status: 401 });
    }
  }

  if (!botToken || !webAppUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing TELEGRAM_BOT_TOKEN or WEBAPP_URL environment variable",
      },
      { status: 500 }
    );
  }

  const webhookUrl = new URL("/api/telegram", webAppUrl).toString();

  const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message"],
      secret_token: webhookSecret || undefined,
      drop_pending_updates: true,
    }),
  });

  const telegram = await response.json();

  return NextResponse.json({
    ok: telegram.ok === true,
    webhookUrl,
    telegram,
  });
}
