import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

type CurrencyRepairScope = "missing" | "all";

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

function getSupabaseHeaders() {
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
}

function getSupabaseBaseUrl() {
  return getEnv("SUPABASE_URL")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

function supabaseUrl(path: string) {
  return `${getSupabaseBaseUrl()}/rest/v1/${path}`;
}

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(supabaseUrl(path), {
    ...options,
    headers: {
      ...getSupabaseHeaders(),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function verifyTelegramInitData(initData: string) {
  const botToken = getEnv("TELEGRAM_BOT_TOKEN");

  if (!initData) {
    throw new Error("Missing Telegram initData");
  }

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

  if (calculatedHash !== hash) {
    throw new Error("Invalid Telegram initData hash. Check TELEGRAM_BOT_TOKEN in Vercel.");
  }

  const userRaw = params.get("user");

  if (!userRaw) {
    throw new Error("Telegram user not found in initData");
  }

  return JSON.parse(userRaw) as TelegramUser;
}

function getWebAuthSecret() {
  return process.env.WEB_AUTH_SECRET || getEnv("TELEGRAM_BOT_TOKEN");
}

function signWebAuthPayload(payloadBase64: string) {
  return crypto
    .createHmac("sha256", getWebAuthSecret())
    .update(payloadBase64)
    .digest("base64url");
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function parseWebAuthCookie(request: NextRequest): TelegramUser | null {
  const raw = request.cookies.get(WEB_AUTH_COOKIE)?.value;

  if (!raw) return null;

  const [payloadBase64, signature] = raw.split(".");

  if (!payloadBase64 || !signature) return null;

  const expectedSignature = signWebAuthPayload(payloadBase64);

  if (!safeCompare(signature, expectedSignature)) return null;

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

function getAuthenticatedTelegramUser(request: NextRequest, body: Record<string, unknown>) {
  const initData = String(body.initData || "");

  if (initData) return verifyTelegramInitData(initData);

  const webUser = parseWebAuthCookie(request);

  if (webUser) return webUser;

  throw new Error("Missing Telegram auth. Open in Telegram or login with Telegram on web.");
}

function normalizeCurrency(value: unknown) {
  const currency = String(value || "").trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Invalid repair currency");
  }

  return currency;
}

function normalizeRepairScope(value: unknown): CurrencyRepairScope {
  return value === "all" ? "all" : "missing";
}

function idsToInFilter(ids: string[]) {
  return ids
    .map((id) => String(id).trim())
    .filter(Boolean)
    .join(",");
}


async function repairExpenseCurrencies(telegramId: number, currency: string, repairScope: CurrencyRepairScope) {
  if (repairScope === "all") {
    const rows = (await supabaseFetch(`broke_expenses?telegram_id=eq.${telegramId}&select=id`)) as Array<{ id: string }>;

    await supabaseFetch(`broke_expenses?telegram_id=eq.${telegramId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ currency }),
    });

    return rows.length;
  }

  const rows = (await supabaseFetch(`broke_expenses?telegram_id=eq.${telegramId}&select=id,currency&limit=1000`)) as Array<{
    id: string;
    currency?: string | null;
  }>;
  const missingIds = rows
    .filter((row) => !row.currency || !String(row.currency).trim())
    .map((row) => String(row.id));

  if (!missingIds.length) return 0;

  const idFilter = idsToInFilter(missingIds);

  await supabaseFetch(`broke_expenses?telegram_id=eq.${telegramId}&id=in.(${idFilter})`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ currency }),
  });

  return missingIds.length;
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripUndefined);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)])
    );
  }

  return value;
}

async function syncSettingsAndAppState(
  telegramId: number,
  settings: unknown,
  appState: unknown
) {
  const payload: Record<string, unknown> = {
    telegram_id: telegramId,
    updated_at: new Date().toISOString(),
  };

  let settingsSynced = false;
  let appStateSynced = false;

  if (settings && typeof settings === "object") {
    payload.settings_payload = stripUndefined(settings);
    settingsSynced = true;
  }

  if (appState && typeof appState === "object") {
    payload.app_state_payload = stripUndefined(appState);
    appStateSynced = true;
  }

  if (!settingsSynced && !appStateSynced) {
    return { settingsSynced, appStateSynced };
  }

  await supabaseFetch("broke_settings?on_conflict=telegram_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(payload),
  });

  return { settingsSynced, appStateSynced };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const user = getAuthenticatedTelegramUser(request, body);
    const telegramId = Number(user.id);
    const currency = normalizeCurrency(body.currency);
    const repairScope = normalizeRepairScope(body.repairScope);

    const expensesUpdated = await repairExpenseCurrencies(telegramId, currency, repairScope);
    const { settingsSynced, appStateSynced } = await syncSettingsAndAppState(
      telegramId,
      body.settings,
      body.appState
    );

    return NextResponse.json({
      ok: true,
      currency,
      repairScope,
      expensesUpdated,
      settingsSynced,
      appStateSynced,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Currency repair failed",
      },
      { status: 400 }
    );
  }
}
