import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

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
              amount?: string;
              decimals?: number;
              uiAmount?: number | null;
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
    amount?: string;
    decimals?: number;
    uiAmount?: number | null;
    uiAmountString?: string;
  };
};

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
  provider?: string | null;
  is_verified?: boolean | null;
  verified_at?: string | null;
};

const DEFAULT_BROKE_TOKEN_MINT = "9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray";
const DEFAULT_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
const WEB_AUTH_COOKIE = "broke_tg_session";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function isLikelySolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
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

function verifyTelegramInitData(initData: string): TelegramUser | null {
  const botToken = getOptionalEnv("TELEGRAM_BOT_TOKEN");
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!safeCompare(calculatedHash, hash)) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;

  try {
    return JSON.parse(userRaw) as TelegramUser;
  } catch {
    return null;
  }
}

function signPayload(payloadBase64: string) {
  const secret = getWebAuthSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

function parseWebAuthCookie(request: NextRequest): TelegramUser | null {
  const raw = request.cookies.get(WEB_AUTH_COOKIE)?.value;
  if (!raw) return null;

  const [payloadBase64, signature] = raw.split(".");
  if (!payloadBase64 || !signature) return null;

  const expectedSignature = signPayload(payloadBase64);
  if (!expectedSignature || !safeCompare(signature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as WebAuthSession;
    if (!session.user?.id || Date.now() > session.expiresAt) return null;
    return session.user;
  } catch {
    return null;
  }
}

function getAuthenticatedUserOrNull(request: NextRequest, initData: string) {
  return verifyTelegramInitData(initData) || parseWebAuthCookie(request);
}

function getSupabaseBaseUrl() {
  return getOptionalEnv("SUPABASE_URL").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
}

function getSupabaseServiceKey() {
  return getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
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

  if (percentOfSupply >= 5) {
    return {
      id: "leviathan",
      label: "Leviathan Frog",
      range: "5%+",
      description: "Top holder tier based on current visible token supply.",
    };
  }

  if (percentOfSupply >= 2) {
    return {
      id: "whale",
      label: "Whale Frog",
      range: "2–5%",
      description: "Large holder tier based on current visible token supply.",
    };
  }

  if (percentOfSupply >= 0.75) {
    return {
      id: "shark",
      label: "Shark Frog",
      range: "0.75–2%",
      description: "Strong holder tier based on current visible token supply.",
    };
  }

  if (percentOfSupply >= 0.25) {
    return {
      id: "strong",
      label: "Strong Frog",
      range: "0.25–0.75%",
      description: "Committed holder tier based on current visible token supply.",
    };
  }

  if (percentOfSupply >= 0.05) {
    return {
      id: "frog",
      label: "Frog",
      range: "0.05–0.25%",
      description: "Holder tier based on current visible token supply.",
    };
  }

  return {
    id: "tadpole",
    label: "Tadpole",
    range: "<0.05%",
    description: "Entry holder tier based on current visible token supply.",
  };
}

async function rpc<T>(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "broke-wallet-balance",
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

async function getExistingWalletLink(input: { telegramUserId: number; walletAddress: string }) {
  const supabaseBase = getSupabaseBaseUrl();
  const serviceKey = getSupabaseServiceKey();
  if (!supabaseBase || !serviceKey) return null;

  const params = new URLSearchParams({
    select: "provider,is_verified,verified_at",
    telegram_user_id: `eq.${input.telegramUserId}`,
    wallet_address: `eq.${input.walletAddress}`,
    order: "updated_at.desc",
    limit: "1",
  });

  const response = await fetch(`${supabaseBase}/rest/v1/broke_wallet_links?${params.toString()}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const rows = (await response.json()) as WalletLinkRow[];
  return rows[0] || null;
}

async function saveWalletBalanceSnapshot(input: {
  request: NextRequest;
  initData: string;
  walletAddress: string;
  balance: number;
  percentOfSupply: number;
  holderTier: unknown;
  checkedAt: string;
}) {
  const user = getAuthenticatedUserOrNull(input.request, input.initData);
  const supabaseBase = getSupabaseBaseUrl();
  const serviceKey = getSupabaseServiceKey();

  if (!user?.id || !supabaseBase || !serviceKey) return { persisted: false, verified: false };

  const existing = await getExistingWalletLink({ telegramUserId: user.id, walletAddress: input.walletAddress });
  const isVerified = Boolean(existing?.is_verified);
  const provider = existing?.provider || (isVerified ? "signed_message" : "watch");

  const response = await fetch(`${supabaseBase}/rest/v1/broke_wallet_links?on_conflict=telegram_user_id,wallet_address`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      telegram_user_id: user.id,
      wallet_address: input.walletAddress,
      provider,
      is_verified: isVerified,
      broke_balance: input.balance,
      percent_of_supply: input.percentOfSupply,
      holder_tier: input.holderTier,
      last_checked_at: input.checkedAt,
      verified_at: existing?.verified_at || null,
      updated_at: input.checkedAt,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.warn("wallet balance snapshot save failed", await response.text().catch(() => ""));
    return { persisted: false, verified: isVerified };
  }

  return { persisted: true, verified: isVerified };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      walletAddress?: string;
      mintAddress?: string;
      initData?: string;
    };

    const walletAddress = String(body.walletAddress || "").trim();
    const mintAddress = String(body.mintAddress || process.env.BROKE_TOKEN_MINT || DEFAULT_BROKE_TOKEN_MINT).trim();
    const rpcUrl = String(process.env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC_URL).trim();
    const initData = String(body.initData || "");

    if (!isLikelySolanaAddress(walletAddress)) {
      return json({ ok: false, error: "Invalid Solana wallet address." }, 400);
    }

    if (!isLikelySolanaAddress(mintAddress)) {
      return json({ ok: false, error: "Invalid $BROKE token mint address." }, 500);
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
    const holderTier = getHolderTier(percentOfSupply, balance);
    const checkedAt = new Date().toISOString();
    const persistence = await saveWalletBalanceSnapshot({
      request,
      initData,
      walletAddress,
      balance,
      percentOfSupply,
      holderTier,
      checkedAt,
    });

    return json({
      ok: true,
      walletAddress,
      mintAddress,
      balance,
      tokenSupply,
      percentOfSupply,
      holderTier,
      checkedAt,
      verified: persistence.verified,
      persisted: persistence.persisted,
      readOnly: true,
    });
  } catch (error) {
    console.error("wallet balance check failed", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not check wallet balance.",
      },
      500
    );
  }
}
