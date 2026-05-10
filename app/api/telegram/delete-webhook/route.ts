import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

function getSetupSecret() {
  return process.env.TELEGRAM_SETUP_SECRET || "";
}

export async function GET(request: NextRequest) {
  const botToken = getBotToken();
  const setupSecret = getSetupSecret();

  if (setupSecret) {
    const key = request.nextUrl.searchParams.get("key");

    if (key !== setupSecret) {
      return NextResponse.json({ ok: false, error: "Wrong setup key" }, { status: 401 });
    }
  }

  if (!botToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing TELEGRAM_BOT_TOKEN environment variable",
      },
      { status: 500 }
    );
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      drop_pending_updates: true,
    }),
  });

  const telegram = await response.json();

  return NextResponse.json({
    ok: telegram.ok === true,
    telegram,
  });
}
