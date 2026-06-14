import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { BROKE_APP_BUILD_VERSION } from "@/app/lib/brokeAdminRewards";
import {
  COMMUNITY_BOSS_SYNC_ENABLED,
  findForbiddenCommunityBossFields,
  getCommunityBossBackendReadiness,
  getCommunityBossNoStoreHeaders,
  getCommunityBossProofPersistenceGate,
  getCurrentCommunityBossWeek,
  sanitizeCommunityBossProof,
} from "@/app/lib/brokeCommunityBoss";

export const runtime = "nodejs";

const WEB_AUTH_COOKIE = "broke_tg_session";
const TELEGRAM_WEBAPP_AUTH_MAX_AGE_SECONDS = 60 * 60 * 24;
const COMMUNITY_BOSS_PROOF_AUTH_REQUIRED =
  process.env.COMMUNITY_BOSS_PROOF_AUTH_REQUIRED === "true";

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

type CommunityBossProofAuthState = {
  checked: boolean;
  required: boolean;
  authenticated: boolean;
  source: "telegram_init_data" | "web_session" | "none";
  publicUserKey: string | null;
  publicDisplayName: string | null;
  publicHandle: string | null;
  reason: string | null;
};

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function getOptionalEnv(name: string) {
  return process.env[name] || "";
}

function getWebAuthSecret() {
  return getOptionalEnv("WEB_AUTH_SECRET") || getOptionalEnv("TELEGRAM_BOT_TOKEN");
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function signWebAuthPayload(payloadBase64: string) {
  const secret = getWebAuthSecret();
  if (!secret) return "";

  return crypto
    .createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("base64url");
}

function publicUserKey(userId: number | string) {
  return crypto
    .createHash("sha256")
    .update(`community-boss:${String(userId)}`)
    .digest("hex")
    .slice(0, 16);
}

function cleanPublicHandle(value: unknown) {
  const handle = String(value ?? "").replace(/^@+/, "").trim().slice(0, 32);
  return /^[A-Za-z0-9_.-]{2,32}$/.test(handle) ? handle : null;
}

function cleanPublicDisplayName(user: TelegramUser) {
  const name = [user.first_name, user.last_name]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, 48);

  return name || cleanPublicHandle(user.username) || "BROKE user";
}

function authStateFromUser(
  user: TelegramUser,
  source: CommunityBossProofAuthState["source"]
): CommunityBossProofAuthState {
  return {
    checked: true,
    required: COMMUNITY_BOSS_PROOF_AUTH_REQUIRED,
    authenticated: true,
    source,
    publicUserKey: publicUserKey(user.id),
    publicDisplayName: cleanPublicDisplayName(user),
    publicHandle: cleanPublicHandle(user.username),
    reason: null,
  };
}

function verifyTelegramInitData(initData: string): TelegramUser | null {
  const botToken = getOptionalEnv("TELEGRAM_BOT_TOKEN");
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  const authDateRaw = params.get("auth_date") || "";
  const authDate = Number(authDateRaw);
  if (Number.isFinite(authDate)) {
    const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
    if (ageSeconds > TELEGRAM_WEBAPP_AUTH_MAX_AGE_SECONDS) return null;
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

  if (!safeCompare(calculatedHash, hash)) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;

  try {
    return JSON.parse(userRaw) as TelegramUser;
  } catch {
    return null;
  }
}

function parseWebAuthCookie(request: NextRequest): TelegramUser | null {
  const raw = request.cookies.get(WEB_AUTH_COOKIE)?.value;
  if (!raw) return null;

  const [payloadBase64, signature] = raw.split(".");
  if (!payloadBase64 || !signature) return null;

  const expectedSignature = signWebAuthPayload(payloadBase64);
  if (!expectedSignature || !safeCompare(signature, expectedSignature)) return null;

  try {
    const session = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf8")
    ) as WebAuthSession;

    if (!session.user?.id || Date.now() > session.expiresAt) return null;

    return session.user;
  } catch {
    return null;
  }
}

function extractInitData(request: NextRequest, body: unknown) {
  const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const bodyInitData = typeof data.initData === "string" ? data.initData : "";
  const headerInitData = request.headers.get("x-telegram-init-data") || "";
  return bodyInitData || headerInitData;
}

function getCommunityBossProofAuthState(
  request: NextRequest,
  body: unknown
): CommunityBossProofAuthState {
  const initDataUser = verifyTelegramInitData(extractInitData(request, body));
  if (initDataUser) return authStateFromUser(initDataUser, "telegram_init_data");

  const cookieUser = parseWebAuthCookie(request);
  if (cookieUser) return authStateFromUser(cookieUser, "web_session");

  return {
    checked: true,
    required: COMMUNITY_BOSS_PROOF_AUTH_REQUIRED,
    authenticated: false,
    source: "none",
    publicUserKey: null,
    publicDisplayName: null,
    publicHandle: null,
    reason: getOptionalEnv("TELEGRAM_BOT_TOKEN") || getOptionalEnv("WEB_AUTH_SECRET")
      ? "No valid Telegram initData or web session was found."
      : "Auth secrets are not configured, so proof identity could not be verified.",
  };
}

export async function POST(request: NextRequest) {
  const currentWeek = getCurrentCommunityBossWeek();
  const readiness = getCommunityBossBackendReadiness();
  const persistence = getCommunityBossProofPersistenceGate();
  const body = await readJson(request);
  const auth = getCommunityBossProofAuthState(request, body);

  if (COMMUNITY_BOSS_PROOF_AUTH_REQUIRED && !auth.authenticated) {
    return NextResponse.json(
      {
        ok: false,
        buildVersion: BROKE_APP_BUILD_VERSION,
        error: "Community Boss proof auth required.",
        auth,
        persistence,
        guardrail: "Future persisted proof writes require server-side Telegram/session identity. No database write was made.",
      },
      {
        status: 401,
        headers: getCommunityBossNoStoreHeaders(),
      }
    );
  }

  const forbiddenFields = findForbiddenCommunityBossFields(body);

  if (forbiddenFields.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        buildVersion: BROKE_APP_BUILD_VERSION,
        error: "Forbidden Community Boss fields were rejected.",
        auth,
        persistence,
        forbiddenFields,
        guardrail: "Community Boss proof cannot include balance, wallet value, income, debt, transactions, payout, or private budget data.",
      },
      {
        status: 400,
        headers: getCommunityBossNoStoreHeaders(),
      }
    );
  }

  const proof = sanitizeCommunityBossProof(body, currentWeek);

  if (!proof.publicHandle && auth.publicHandle) {
    proof.publicHandle = auth.publicHandle;
  }

  if (!proof.publicDisplayName && auth.publicDisplayName) {
    proof.publicDisplayName = auth.publicDisplayName;
  }

  if (proof.weekKey !== currentWeek.weekKey) {
    return NextResponse.json(
      {
        ok: false,
        buildVersion: BROKE_APP_BUILD_VERSION,
        error: "Week key mismatch.",
        auth,
        expectedWeekKey: currentWeek.weekKey,
        receivedWeekKey: proof.weekKey,
      },
      {
        status: 409,
        headers: getCommunityBossNoStoreHeaders(),
      }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      buildVersion: BROKE_APP_BUILD_VERSION,
      mode: COMMUNITY_BOSS_SYNC_ENABLED ? "skeleton_enabled_no_writes" : "dry_run",
      syncEnabled: COMMUNITY_BOSS_SYNC_ENABLED,
      persisted: false,
      wouldWrite: false,
      wouldPersist: false,
      writePathReady: readiness.canWrite,
      proofPersistenceReady: readiness.canPersistProof,
      backendReadiness: readiness,
      persistence,
      auth,
      week: currentWeek,
      proof,
      nextStep: "A later patch can connect authenticated sanitized proof payloads to Supabase only after migration review, manual apply, and explicit write-path implementation.",
      guardrails: [
        "Server auth checked",
        "Payload sanitized",
        "Numbers clamped",
        "Forbidden private fields rejected",
        "Persistence gate checked",
        "No database write performed",
        "No payout math",
        "No wallet value",
      ],
    },
    {
      status: 202,
      headers: getCommunityBossNoStoreHeaders(),
    }
  );
}
