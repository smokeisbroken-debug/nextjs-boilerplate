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

type WalletLinkRow = {
  wallet_address?: string;
  provider?: string;
  is_verified?: boolean;
  broke_balance?: number | string | null;
  percent_of_supply?: number | string | null;
  holder_tier?: unknown;
  last_checked_at?: string | null;
  verified_at?: string | null;
};

const WEB_AUTH_COOKIE = "broke_tg_session";

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

function safeNumber(value: unknown) {
  const parsed = Number(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getWalletLink(input: { telegramUserId: number; walletAddress: string }) {
  const supabaseBase = getSupabaseBaseUrl();
  const serviceKey = getSupabaseServiceKey();
  const params = new URLSearchParams({
    select: "wallet_address,provider,is_verified,broke_balance,percent_of_supply,holder_tier,last_checked_at,verified_at",
    telegram_user_id: `eq.${input.telegramUserId}`,
    wallet_address: `eq.${input.walletAddress}`,
    order: "updated_at.desc",
    limit: "1",
  });

  const response = await fetch(`${supabaseBase}/rest/v1/broke_wallet_links?${params.toString()}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Could not read wallet verification status: ${text}`);
  }

  const rows = (await response.json()) as WalletLinkRow[];
  return rows[0] || null;
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
    const row = await getWalletLink({ telegramUserId: user.id, walletAddress });

    if (!row) {
      return json({ ok: true, verified: false, walletAddress, status: "watch" });
    }

    return json({
      ok: true,
      walletAddress: row.wallet_address || walletAddress,
      verified: Boolean(row.is_verified),
      provider: row.provider || (row.is_verified ? "signed_message" : "watch"),
      balance: safeNumber(row.broke_balance),
      percentOfSupply: safeNumber(row.percent_of_supply),
      holderTier: row.holder_tier || null,
      checkedAt: row.last_checked_at || "",
      verifiedAt: row.verified_at || "",
      status: row.is_verified ? "verified" : "watch",
    });
  } catch (error) {
    console.error("wallet verification status failed", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not read wallet verification status.",
      },
      500
    );
  }
}
