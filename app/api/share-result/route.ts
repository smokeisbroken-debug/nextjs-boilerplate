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

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyTelegramInitData(initData: string): TelegramUser | null {
  if (!initData) return null;

  const botToken = getEnv("TELEGRAM_BOT_TOKEN");
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new Error("Missing Telegram hash");
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!safeCompare(calculatedHash, hash)) {
    throw new Error("Invalid Telegram initData hash");
  }

  const userRaw = params.get("user");

  if (!userRaw) {
    throw new Error("Telegram user not found");
  }

  return JSON.parse(userRaw) as TelegramUser;
}

function signPayload(payloadBase64: string) {
  return crypto
    .createHmac("sha256", getWebAuthSecret())
    .update(payloadBase64)
    .digest("base64url");
}

function parseWebAuthCookie(request: NextRequest): TelegramUser | null {
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

    return session.user;
  } catch {
    return null;
  }
}

function getAuthenticatedUser(request: NextRequest, initData: string) {
  const initDataUser = verifyTelegramInitData(initData);

  if (initDataUser) {
    return initDataUser;
  }

  const cookieUser = parseWebAuthCookie(request);

  if (cookieUser) {
    return cookieUser;
  }

  throw new Error("Login with Telegram first.");
}

function shortCaption() {
  return "";
}

async function sendPhotoToTelegram(chatId: number | string, image: File, caption: string) {
  const botToken = getEnv("TELEGRAM_BOT_TOKEN");
  const buffer = Buffer.from(await image.arrayBuffer());
  const blob = new Blob([buffer], {
    type: image.type || "image/png",
  });

  const formData = new FormData();
  formData.append("chat_id", String(chatId));
  if (caption.trim()) {
    formData.append("caption", caption.trim());
  }
  formData.append("photo", blob, image.name || "broke-result.png");

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram sendPhoto failed");
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const initData = String(formData.get("initData") || "");
    const target = String(formData.get("target") || "user");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Missing image file" },
        { status: 400 }
      );
    }

    const user = getAuthenticatedUser(request, initData);
    const chatId =
      target === "group" && process.env.TELEGRAM_GROUP_ID
        ? process.env.TELEGRAM_GROUP_ID
        : user.id;

    await sendPhotoToTelegram(chatId, image, shortCaption());

    return NextResponse.json({
      ok: true,
      target: target === "group" ? "group" : "user",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Share image failed",
      },
      { status: 500 }
    );
  }
}
