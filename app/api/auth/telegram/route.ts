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
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

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

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyTelegramLogin(request: NextRequest): TelegramUser {
  const botToken = getEnv("TELEGRAM_BOT_TOKEN");
  const params = request.nextUrl.searchParams;
  const hash = params.get("hash");

  if (!hash) {
    throw new Error("Missing Telegram login hash");
  }

  const entries = Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b));

  const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!safeCompare(calculatedHash, hash)) {
    throw new Error("Invalid Telegram login hash");
  }

  const authDate = Number(params.get("auth_date") || 0);

  if (!authDate || Date.now() / 1000 - authDate > SESSION_MAX_AGE_SECONDS) {
    throw new Error("Telegram login expired");
  }

  const id = Number(params.get("id"));

  if (!id) {
    throw new Error("Telegram user id missing");
  }

  return {
    id,
    first_name: params.get("first_name") || undefined,
    last_name: params.get("last_name") || undefined,
    username: params.get("username") || undefined,
    photo_url: params.get("photo_url") || undefined,
  };
}

function createSessionCookie(user: TelegramUser) {
  const session: WebAuthSession = {
    user,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(session)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", getWebAuthSecret())
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyTelegramLogin(request);
    const session = createSessionCookie(user);
    const redirectUrl = new URL("/", request.nextUrl.origin);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set(WEB_AUTH_COOKIE, session, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const redirectUrl = new URL("/", request.nextUrl.origin);
    redirectUrl.searchParams.set(
      "auth_error",
      error instanceof Error ? error.message : "Telegram auth failed"
    );

    return NextResponse.redirect(redirectUrl);
  }
}
