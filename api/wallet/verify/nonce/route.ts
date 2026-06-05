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
const WALLET_VERIFICATION_TTL_MINUTES = 10;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

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

  if (aBuffer.length !== bBuffer.length) return false;

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyTelegramInitData(initData: string): TelegramUser | null {
  if (!initData) return null;

  const botToken = getEnv("TELEGRAM_BOT_TOKEN");
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) throw new Error("Missing Telegram hash");

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!safeCompare(calculatedHash, hash)) throw new Error("Invalid Telegram initData hash");

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("Telegram user not found");

  return JSON.parse(userRaw) as TelegramUser;
}

function signPayload(payloadBase64: string) {
  return crypto.createHmac("sha256", getWebAuthSecret()).update(payloadBase64).digest("base64url");
}

function parseWebAuthCookie(request: NextRequest): TelegramUser | null {
  const raw = request.cookies.get(WEB_AUTH_COOKIE)?.value;
  if (!raw) return null;

  const [payloadBase64, signature] = raw.split(".");
  if (!payloadBase64 || !signature) return null;
  if (!safeCompare(signature, signPayload(payloadBase64))) return null;

  try {
    const session = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as WebAuthSession;
    if (!session.user?.id || Date.now() > session.expiresAt) return null;
    return session.user;
  } catch {
    return null;
  }
}

function getAuthenticatedUser(request: NextRequest, initData: string) {
  const initDataUser = verifyTelegramInitData(initData);
  if (initDataUser) return initDataUser;

  const cookieUser = parseWebAuthCookie(request);
  if (cookieUser) return cookieUser;

  throw new Error("Login with Telegram first.");
}

function isLikelySolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

function getSupabaseBaseUrl() {
  return getEnv("SUPABASE_URL").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
}

function getSupabaseServiceKey() {
  return getEnv("SUPABASE_SERVICE_ROLE_KEY");
}

async function insertVerificationChallenge(input: {
  telegramUserId: number;
  walletAddress: string;
  nonce: string;
  message: string;
  expiresAt: string;
}) {
  const supabaseBase = getSupabaseBaseUrl();
  const serviceKey = getSupabaseServiceKey();
  const response = await fetch(`${supabaseBase}/rest/v1/broke_wallet_verifications`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      telegram_user_id: input.telegramUserId,
      wallet_address: input.walletAddress,
      nonce: input.nonce,
      message: input.message,
      status: "pending",
      expires_at: input.expiresAt,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Wallet verification table is not ready: ${text}`);
  }
}

function buildVerificationMessage(input: {
  walletAddress: string;
  nonce: string;
  expiresAt: string;
}) {
  return [
    "SmokeIsBroke wallet verification",
    "",
    `Wallet: ${input.walletAddress}`,
    `Nonce: ${input.nonce}`,
    "Purpose: verify read-only $BROKE holder status inside the app.",
    "This is not a transaction. No token transfer. No seed phrase.",
    `Expires: ${input.expiresAt}`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      walletAddress?: string;
      initData?: string;
    };

    const walletAddress = String(body.walletAddress || "").trim();
    const initData = String(body.initData || "");

    if (!isLikelySolanaAddress(walletAddress)) {
      return json({ ok: false, error: "Invalid Solana wallet address." }, 400);
    }

    const user = getAuthenticatedUser(request, initData);
    const nonce = crypto.randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + WALLET_VERIFICATION_TTL_MINUTES * 60 * 1000).toISOString();
    const message = buildVerificationMessage({ walletAddress, nonce, expiresAt });

    await insertVerificationChallenge({
      telegramUserId: user.id,
      walletAddress,
      nonce,
      message,
      expiresAt,
    });

    return json({
      ok: true,
      walletAddress,
      nonce,
      message,
      expiresAt,
      purpose: "read-only-holder-proof",
    });
  } catch (error) {
    console.error("wallet verification nonce failed", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not start wallet verification.",
      },
      500
    );
  }
}
