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

function getProvidedSetupKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  return request.nextUrl.searchParams.get("key") || bearer;
}

function authorizeSetupRequest(request: NextRequest) {
  const setupSecret = getSetupSecret();

  if (!setupSecret) {
    return {
      ok: false,
      status: 500,
      error: "Missing TELEGRAM_SETUP_SECRET. Webhook setup endpoints are locked by default.",
    };
  }

  if (getProvidedSetupKey(request) !== setupSecret) {
    return {
      ok: false,
      status: 401,
      error: "Wrong setup key",
    };
  }

  return { ok: true, status: 200, error: "" };
}

export async function GET(request: NextRequest) {
  const authorization = authorizeSetupRequest(request);

  if (!authorization.ok) {
    return NextResponse.json(
      { ok: false, error: authorization.error },
      { status: authorization.status }
    );
  }

  const botToken = getBotToken();
  const webAppUrl = getWebAppUrl();
  const webhookSecret = getWebhookSecret();

  if (!botToken || !webAppUrl || !webhookSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing TELEGRAM_BOT_TOKEN, WEBAPP_URL, or TELEGRAM_WEBHOOK_SECRET environment variable",
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
      secret_token: webhookSecret,
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
