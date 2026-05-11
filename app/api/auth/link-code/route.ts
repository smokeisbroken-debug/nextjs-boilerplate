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
const LINK_CODE_TTL_MINUTES = 10;

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

function createCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 6; i += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
  }

  return code;
}

function createToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
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

function dbUserToTelegramUser(row: Record<string, unknown>): TelegramUser {
  return {
    id: Number(row.telegram_user_id),
    first_name: row.telegram_first_name ? String(row.telegram_first_name) : undefined,
    last_name: row.telegram_last_name ? String(row.telegram_last_name) : undefined,
    username: row.telegram_username ? String(row.telegram_username) : undefined,
  };
}

async function createLinkCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createCode();
    const token = createToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MINUTES * 60 * 1000).toISOString();

    try {
      await supabaseFetch("broke_web_link_codes", {
        method: "POST",
        headers: {
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          code,
          browser_token_hash: tokenHash,
          expires_at: expiresAt,
          status: "pending",
        }),
      });

      return {
        code,
        token,
        expiresAt,
      };
    } catch (error) {
      if (attempt === 4) throw error;
    }
  }

  throw new Error("Could not create link code");
}

async function checkLinkStatus(token: string) {
  const tokenHash = hashToken(token);
  const rows = (await supabaseFetch(
    `broke_web_link_codes?select=*&browser_token_hash=eq.${encodeURIComponent(tokenHash)}&order=created_at.desc&limit=1`
  )) as Record<string, unknown>[];

  const row = rows[0];

  if (!row) {
    return {
      linked: false,
      user: null as TelegramUser | null,
      expired: false,
    };
  }

  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    return {
      linked: false,
      user: null as TelegramUser | null,
      expired: true,
    };
  }

  if (row.status === "linked" && row.telegram_user_id) {
    return {
      linked: true,
      user: dbUserToTelegramUser(row),
      expired: false,
    };
  }

  return {
    linked: false,
    user: null as TelegramUser | null,
    expired: false,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || "");

    if (action === "create") {
      const payload = await createLinkCode();

      return NextResponse.json({
        ok: true,
        ...payload,
      });
    }

    if (action === "status") {
      const token = String(body.token || "");

      if (!token) {
        return NextResponse.json({ ok: false, error: "Missing link token" }, { status: 400 });
      }

      const status = await checkLinkStatus(token);

      if (status.expired) {
        return NextResponse.json({
          ok: false,
          error: "Link code expired. Generate a new code.",
        }, { status: 410 });
      }

      const response = NextResponse.json({
        ok: true,
        linked: status.linked,
        user: status.user,
      });

      if (status.linked && status.user) {
        response.cookies.set(WEB_AUTH_COOKIE, createSessionCookie(status.user), {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path: "/",
          maxAge: SESSION_MAX_AGE_SECONDS,
        });
      }

      return response;
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Link code API failed",
      },
      { status: 500 }
    );
  }
}
