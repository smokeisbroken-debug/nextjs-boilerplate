import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

const WEB_AUTH_COOKIE = "broke_tg_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const TELEGRAM_LOGIN_MAX_AGE_SECONDS = 60 * 60 * 24;

type TelegramLoginUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

type WebAuthSession = {
  user: TelegramLoginUser;
  expiresAt: number;
};

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

function createSessionCookie(user: TelegramLoginUser) {
  const session: WebAuthSession = {
    user,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = signPayload(payloadBase64);

  return `${payloadBase64}.${signature}`;
}

function safeCompareHex(a: string, b: string) {
  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function validateTelegramLogin(params: URLSearchParams) {
  const hash = params.get("hash") || "";
  const authDateRaw = params.get("auth_date") || "";
  const idRaw = params.get("id") || "";

  if (!hash || !authDateRaw || !idRaw) {
    throw new Error("Missing Telegram login parameters.");
  }

  const authDate = Number(authDateRaw);

  if (!Number.isFinite(authDate)) {
    throw new Error("Invalid Telegram auth_date.");
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;

  if (ageSeconds > TELEGRAM_LOGIN_MAX_AGE_SECONDS) {
    throw new Error("Telegram login expired. Please try again.");
  }

  const dataCheckString = Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(getEnv("TELEGRAM_BOT_TOKEN")).digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!safeCompareHex(hash, calculatedHash)) {
    throw new Error("Invalid Telegram login hash.");
  }

  const id = Number(idRaw);

  if (!Number.isSafeInteger(id)) {
    throw new Error("Invalid Telegram user id.");
  }

  return {
    id,
    first_name: params.get("first_name") || undefined,
    last_name: params.get("last_name") || undefined,
    username: params.get("username") || undefined,
    language_code: params.get("language_code") || undefined,
    photo_url: params.get("photo_url") || undefined,
  } satisfies TelegramLoginUser;
}

function createRedirect(request: NextRequest, error?: string) {
  const url = new URL("/", request.url);

  if (error) {
    url.searchParams.set("telegram_login", "failed");
    url.searchParams.set("reason", error);
  } else {
    url.searchParams.set("telegram_login", "ok");
  }

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  try {
    const user = validateTelegramLogin(request.nextUrl.searchParams);
    const response = createRedirect(request);

    response.cookies.set(WEB_AUTH_COOKIE, createSessionCookie(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });

    return response;
  } catch (error) {
    return createRedirect(request, error instanceof Error ? error.message : "telegram-login-failed");
  }
}
