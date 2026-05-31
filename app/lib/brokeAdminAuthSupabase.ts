import { NextRequest } from "next/server";
import crypto from "crypto";
import { DEFAULT_TREASURY_WALLET_ADDRESS, parseAdminCsv } from "./brokeAdminRewards";
import {
  getOptionalAdminEnv as getOptionalEnv,
  getRequiredAdminEnv as getEnv,
} from "./brokeAdminApi";

export type BrokeAdminWebAuthSession = {
  user?: {
    id?: number;
  };
  expiresAt?: number;
};

const WEB_AUTH_COOKIE = "broke_tg_session";
const DEFAULT_TREASURY_WALLET = DEFAULT_TREASURY_WALLET_ADDRESS;

export function getAdminTelegramIds() {
  return parseAdminCsv(
    [
      getOptionalEnv("BROKE_ADMIN_TELEGRAM_IDS"),
      getOptionalEnv("ADMIN_TELEGRAM_IDS"),
      getOptionalEnv("NEXT_PUBLIC_BROKE_ADMIN_TELEGRAM_IDS"),
      getOptionalEnv("NEXT_PUBLIC_ADMIN_TELEGRAM_IDS"),
    ]
      .filter(Boolean)
      .join(",")
  );
}

export function getTreasuryWalletAddress() {
  return String(
    getOptionalEnv("TREASURY_WALLET_ADDRESS") ||
      getOptionalEnv("NEXT_PUBLIC_TREASURY_WALLET_ADDRESS") ||
      DEFAULT_TREASURY_WALLET
  ).trim();
}

function getWebAuthSecret() {
  return getOptionalEnv("WEB_AUTH_SECRET") || getOptionalEnv("TELEGRAM_BOT_TOKEN");
}

export function getRewardsAdminSecret() {
  return (
    getOptionalEnv("REWARDS_ADMIN_SECRET") ||
    getOptionalEnv("DIAGNOSTICS_SECRET") ||
    getOptionalEnv("TELEGRAM_SETUP_SECRET")
  );
}

function safeCompareString(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function parseWebAuthSession(request: NextRequest): BrokeAdminWebAuthSession | null {
  const secret = getWebAuthSecret();
  const cookie = request.cookies.get(WEB_AUTH_COOKIE)?.value || "";

  if (!secret || !cookie || !cookie.includes(".")) return null;

  const [payloadBase64, signature] = cookie.split(".");
  const expected = crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");

  if (!safeCompareString(signature || "", expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as BrokeAdminWebAuthSession;

    if (!session.expiresAt || session.expiresAt < Date.now()) return null;

    return session;
  } catch {
    return null;
  }
}

export function isAdminDistributionRequestAuthorized(request: NextRequest) {
  const adminSecret = getRewardsAdminSecret();
  const key = request.nextUrl.searchParams.get("key") || "";
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const secretAuthorized = Boolean(adminSecret && (key === adminSecret || bearer === adminSecret));

  if (secretAuthorized) return true;

  const session = parseWebAuthSession(request);
  const telegramId = session?.user?.id ? String(session.user.id) : "";

  return Boolean(telegramId && getAdminTelegramIds().includes(telegramId));
}

export function isAdminDistributionAuthConfigured() {
  return Boolean(getRewardsAdminSecret() || getAdminTelegramIds().length > 0);
}

export function isBrokePayoutAutoSendEnabled() {
  return getOptionalEnv("BROKE_PAYOUT_AUTO_SEND_ENABLED") === "true";
}

export function getSupabaseBaseUrl() {
  return getEnv("SUPABASE_URL")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

export function getSupabaseHeaders(extra?: HeadersInit) {
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...(extra || {}),
  };
}

export function supabaseUrl(path: string) {
  return `${getSupabaseBaseUrl()}/rest/v1/${path}`;
}

export async function supabaseAdminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(supabaseUrl(path), {
    ...(init || {}),
    headers: getSupabaseHeaders(init?.headers),
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${text.slice(0, 700)}`);
  }

  if (!text) return null as T;

  return JSON.parse(text) as T;
}
