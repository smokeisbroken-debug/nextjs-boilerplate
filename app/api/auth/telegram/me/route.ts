import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

type WebAuthSession = {
  user: TelegramUser;
  expiresAt: number;
};

const WEB_AUTH_COOKIE = "broke_tg_session";

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getWebAuthSecret() {
  return process.env.WEB_AUTH_SECRET || getEnv("TELEGRAM_BOT_TOKEN");
}

function signPayload(payloadBase64: string) {
  return crypto
    .createHmac("sha256", getWebAuthSecret())
    .update(payloadBase64)
    .digest("base64url");
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function readSession(request: NextRequest) {
  const raw = request.cookies.get(WEB_AUTH_COOKIE)?.value;

  if (!raw) return null;

  const [payloadBase64, signature] = raw.split(".");

  if (!payloadBase64 || !signature) return null;

  if (!safeCompare(signature, signPayload(payloadBase64))) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf8")
    ) as WebAuthSession;

    if (!session.user?.id || Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = readSession(request);

    return NextResponse.json({
      ok: true,
      authenticated: Boolean(session),
      user: session?.user ?? null,
    });
  } catch {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      user: null,
    });
  }
}
