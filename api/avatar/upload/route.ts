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

type SolanaRpcResponse<T> = {
  result?: T;
  error?: {
    code?: number;
    message?: string;
  };
};

type TokenAccountResult = {
  value?: Array<{
    account?: {
      data?: {
        parsed?: {
          info?: {
            tokenAmount?: {
              uiAmountString?: string;
            };
          };
        };
      };
    };
  }>;
};

type TokenSupplyResult = {
  value?: {
    uiAmountString?: string;
  };
};

const WEB_AUTH_COOKIE = "broke_tg_session";
const DEFAULT_BROKE_TOKEN_MINT = "9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray";
const DEFAULT_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
const CUSTOM_AVATAR_UNLOCK_BALANCE = 500_000;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_BUCKET = "broke-avatars";
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

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

function isLikelySolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

function parseUiAmountString(value?: string | number | null) {
  if (value === undefined || value === null) return 0;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getHolderTier(percentOfSupply: number, balance: number) {
  if (balance <= 0) {
    return {
      id: "none",
      label: "No BROKE yet",
      range: "0%",
      description: "No tracked $BROKE balance found for this wallet.",
    };
  }

  if (percentOfSupply >= 5) return { id: "leviathan", label: "Leviathan Frog", range: "5%+", description: "Top holder tier." };
  if (percentOfSupply >= 2) return { id: "whale", label: "Whale Frog", range: "2–5%", description: "Large holder tier." };
  if (percentOfSupply >= 0.75) return { id: "shark", label: "Shark Frog", range: "0.75–2%", description: "Strong holder tier." };
  if (percentOfSupply >= 0.25) return { id: "strong", label: "Strong Frog", range: "0.25–0.75%", description: "Committed holder tier." };
  if (percentOfSupply >= 0.05) return { id: "frog", label: "Frog", range: "0.05–0.25%", description: "Holder tier." };
  return { id: "tadpole", label: "Tadpole", range: "<0.05%", description: "Entry holder tier." };
}

async function rpc<T>(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "broke-avatar-gate",
      method,
      params,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`RPC HTTP ${response.status}`);
  }

  const data = (await response.json()) as SolanaRpcResponse<T>;

  if (data.error) {
    throw new Error(data.error.message || "Solana RPC error");
  }

  if (!data.result) {
    throw new Error("Empty Solana RPC response");
  }

  return data.result;
}

async function checkBrokeBalance(walletAddress: string) {
  const mintAddress = String(process.env.BROKE_TOKEN_MINT || DEFAULT_BROKE_TOKEN_MINT).trim();
  const rpcUrl = String(process.env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC_URL).trim();

  if (!isLikelySolanaAddress(walletAddress)) {
    throw new Error("Invalid Solana wallet address.");
  }

  if (!isLikelySolanaAddress(mintAddress)) {
    throw new Error("Invalid $BROKE token mint address.");
  }

  const [accountsResult, supplyResult] = await Promise.all([
    rpc<TokenAccountResult>(rpcUrl, "getTokenAccountsByOwner", [
      walletAddress,
      { mint: mintAddress },
      { encoding: "jsonParsed" },
    ]),
    rpc<TokenSupplyResult>(rpcUrl, "getTokenSupply", [mintAddress]),
  ]);

  const balances = (accountsResult.value || []).map((item) =>
    parseUiAmountString(item.account?.data?.parsed?.info?.tokenAmount?.uiAmountString)
  );
  const balance = balances.reduce((sum, value) => sum + value, 0);
  const tokenSupply = parseUiAmountString(supplyResult.value?.uiAmountString);
  const percentOfSupply = tokenSupply > 0 ? (balance / tokenSupply) * 100 : 0;

  return {
    balance,
    tokenSupply,
    percentOfSupply,
    holderTier: getHolderTier(percentOfSupply, balance),
  };
}

function getSupabaseBaseUrl() {
  return getEnv("SUPABASE_URL")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

function getSupabaseServiceKey() {
  return getEnv("SUPABASE_SERVICE_ROLE_KEY");
}

async function hasVerifiedWalletLink(userId: number, walletAddress: string) {
  const supabaseBase = getSupabaseBaseUrl();
  const serviceKey = getSupabaseServiceKey();
  const params = new URLSearchParams({
    select: "id,is_verified,verified_at",
    telegram_user_id: `eq.${userId}`,
    wallet_address: `eq.${walletAddress}`,
    is_verified: "eq.true",
    limit: "1",
  });

  const response = await fetch(`${supabaseBase}/rest/v1/broke_wallet_links?${params.toString()}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Wallet verification table is not ready: ${text}`);
  }

  const rows = (await response.json()) as Array<{ id?: string; is_verified?: boolean; verified_at?: string }>;
  return Boolean(rows[0]?.is_verified);
}

function avatarExtension(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  return "png";
}

async function uploadAvatarToStorage(userId: number, image: File) {
  const supabaseBase = getSupabaseBaseUrl();
  const serviceKey = getSupabaseServiceKey();
  const extension = avatarExtension(image.type || "image/png");
  const objectPath = `${userId}/avatar-${Date.now()}.${extension}`;
  const uploadUrl = `${supabaseBase}/storage/v1/object/${AVATAR_BUCKET}/${objectPath}`;
  const arrayBuffer = await image.arrayBuffer();

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": image.type || "image/png",
      "x-upsert": "true",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body: Buffer.from(arrayBuffer),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Avatar storage upload failed: ${text}`);
  }

  return `${supabaseBase}/storage/v1/object/public/${AVATAR_BUCKET}/${objectPath}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const initData = String(formData.get("initData") || "");
    const walletAddress = String(formData.get("walletAddress") || "").trim();
    const user = getAuthenticatedUser(request, initData);

    if (!(image instanceof File)) {
      return json({ ok: false, error: "Missing avatar image." }, 400);
    }

    if (!ALLOWED_AVATAR_TYPES.has(image.type || "")) {
      return json({ ok: false, error: "Use PNG, JPG or WebP only." }, 400);
    }

    if (image.size > MAX_AVATAR_BYTES) {
      return json({ ok: false, error: "Avatar image must be 2 MB or less." }, 413);
    }

    const hasVerifiedWallet = await hasVerifiedWalletLink(user.id, walletAddress);

    if (!hasVerifiedWallet) {
      return json(
        {
          ok: false,
          error: "Verify wallet ownership before uploading a custom avatar.",
        },
        403
      );
    }

    const balanceResult = await checkBrokeBalance(walletAddress);

    if (balanceResult.balance < CUSTOM_AVATAR_UNLOCK_BALANCE) {
      return json(
        {
          ok: false,
          error: "Custom avatar unlocks at 500,000 BROKE.",
          balance: balanceResult.balance,
          percentOfSupply: balanceResult.percentOfSupply,
          holderTier: balanceResult.holderTier,
        },
        403
      );
    }

    const avatarUrl = await uploadAvatarToStorage(user.id, image);
    const checkedAt = new Date().toISOString();

    return json({
      ok: true,
      avatarUrl,
      checkedAt,
      balance: balanceResult.balance,
      percentOfSupply: balanceResult.percentOfSupply,
      holderTier: balanceResult.holderTier,
      readOnly: true,
      unlockBalance: CUSTOM_AVATAR_UNLOCK_BALANCE,
    });
  } catch (error) {
    console.error("custom avatar upload failed", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Avatar upload failed.",
      },
      500
    );
  }
}
