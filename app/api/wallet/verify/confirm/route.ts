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

type VerificationRow = {
  id: string;
  telegram_user_id: number;
  wallet_address: string;
  nonce: string;
  message: string;
  status: string;
  expires_at: string;
};

const WEB_AUTH_COOKIE = "broke_tg_session";
const DEFAULT_BROKE_TOKEN_MINT = "9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray";
const DEFAULT_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

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

function parseUiAmountString(value?: string | number | null) {
  if (value === undefined || value === null) return 0;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getHolderTier(percentOfSupply: number, balance: number) {
  if (balance <= 0) return { id: "none", label: "No BROKE yet", range: "0%", description: "No tracked $BROKE balance found for this wallet." };
  if (percentOfSupply >= 5) return { id: "leviathan", label: "Leviathan Frog", range: "5%+", description: "Top holder tier based on current visible token supply." };
  if (percentOfSupply >= 2) return { id: "whale", label: "Whale Frog", range: "2–5%", description: "Large holder tier based on current visible token supply." };
  if (percentOfSupply >= 0.75) return { id: "shark", label: "Shark Frog", range: "0.75–2%", description: "Strong holder tier based on current visible token supply." };
  if (percentOfSupply >= 0.25) return { id: "strong", label: "Strong Frog", range: "0.25–0.75%", description: "Committed holder tier based on current visible token supply." };
  if (percentOfSupply >= 0.05) return { id: "frog", label: "Frog", range: "0.05–0.25%", description: "Holder tier based on current visible token supply." };
  return { id: "tadpole", label: "Tadpole", range: "<0.05%", description: "Entry holder tier based on current visible token supply." };
}

async function rpc<T>(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "broke-wallet-verify", method, params }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);

  const data = (await response.json()) as SolanaRpcResponse<T>;
  if (data.error) throw new Error(data.error.message || "Solana RPC error");
  if (!data.result) throw new Error("Empty Solana RPC response");
  return data.result;
}

async function checkBrokeBalance(walletAddress: string) {
  const mintAddress = String(process.env.BROKE_TOKEN_MINT || DEFAULT_BROKE_TOKEN_MINT).trim();
  const rpcUrl = String(process.env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC_URL).trim();

  const [accountsResult, supplyResult] = await Promise.all([
    rpc<TokenAccountResult>(rpcUrl, "getTokenAccountsByOwner", [walletAddress, { mint: mintAddress }, { encoding: "jsonParsed" }]),
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

function base58Decode(value: string) {
  let decoded = BigInt(0);

  for (const character of value) {
    const index = BASE58_ALPHABET.indexOf(character);
    if (index < 0) throw new Error("Invalid base58 Solana public key.");
    decoded = decoded * BigInt(58) + BigInt(index);
  }

  const bytes: number[] = [];
  while (decoded > BigInt(0)) {
    bytes.unshift(Number(decoded % BigInt(256)));
    decoded /= BigInt(256);
  }

  for (const character of value) {
    if (character === "1") bytes.unshift(0);
    else break;
  }

  return Buffer.from(bytes);
}

function verifyEd25519Signature(message: string, walletAddress: string, signatureBase64: string) {
  const publicKeyBytes = base58Decode(walletAddress);
  const signatureBytes = Buffer.from(signatureBase64, "base64");

  if (publicKeyBytes.length !== 32) throw new Error("Invalid Solana public key length.");
  if (signatureBytes.length !== 64) throw new Error("Invalid wallet signature length.");

  const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
  const keyObject = crypto.createPublicKey({
    key: Buffer.concat([spkiPrefix, publicKeyBytes]),
    format: "der",
    type: "spki",
  });

  return crypto.verify(null, Buffer.from(message, "utf8"), keyObject, signatureBytes);
}

async function findPendingChallenge(input: {
  telegramUserId: number;
  walletAddress: string;
  nonce: string;
}) {
  const supabaseBase = getSupabaseBaseUrl();
  const serviceKey = getSupabaseServiceKey();
  const params = new URLSearchParams({
    select: "id,telegram_user_id,wallet_address,nonce,message,status,expires_at",
    telegram_user_id: `eq.${input.telegramUserId}`,
    wallet_address: `eq.${input.walletAddress}`,
    nonce: `eq.${input.nonce}`,
    status: "eq.pending",
    order: "created_at.desc",
    limit: "1",
  });

  const response = await fetch(`${supabaseBase}/rest/v1/broke_wallet_verifications?${params.toString()}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Wallet verification table is not ready: ${text}`);
  }

  const rows = (await response.json()) as VerificationRow[];
  const row = rows[0];

  if (!row) throw new Error("Verification challenge expired or not found. Try again.");
  if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("Verification challenge expired. Try again.");

  return row;
}

async function markChallengeVerified(id: string, signatureBase64: string) {
  const supabaseBase = getSupabaseBaseUrl();
  const serviceKey = getSupabaseServiceKey();
  const verifiedAt = new Date().toISOString();
  const response = await fetch(`${supabaseBase}/rest/v1/broke_wallet_verifications?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ status: "verified", signature: signatureBase64, verified_at: verifiedAt }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Could not update verification challenge: ${text}`);
  }

  return verifiedAt;
}

async function upsertWalletLink(input: {
  telegramUserId: number;
  walletAddress: string;
  balance: number;
  percentOfSupply: number;
  holderTier: unknown;
  verifiedAt: string;
}) {
  const supabaseBase = getSupabaseBaseUrl();
  const serviceKey = getSupabaseServiceKey();
  const checkedAt = new Date().toISOString();
  const response = await fetch(`${supabaseBase}/rest/v1/broke_wallet_links?on_conflict=telegram_user_id,wallet_address`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      telegram_user_id: input.telegramUserId,
      wallet_address: input.walletAddress,
      provider: "signed_message",
      is_verified: true,
      broke_balance: input.balance,
      percent_of_supply: input.percentOfSupply,
      holder_tier: input.holderTier,
      last_checked_at: checkedAt,
      verified_at: input.verifiedAt,
      updated_at: checkedAt,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Could not save verified wallet link: ${text}`);
  }

  return checkedAt;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      walletAddress?: string;
      nonce?: string;
      message?: string;
      signature?: string;
      initData?: string;
    };

    const walletAddress = String(body.walletAddress || "").trim();
    const nonce = String(body.nonce || "").trim();
    const message = String(body.message || "");
    const signature = String(body.signature || "").trim();
    const initData = String(body.initData || "");

    if (!isLikelySolanaAddress(walletAddress)) return json({ ok: false, error: "Invalid Solana wallet address." }, 400);
    if (!nonce) return json({ ok: false, error: "Missing verification nonce." }, 400);
    if (!message) return json({ ok: false, error: "Missing verification message." }, 400);
    if (!signature) return json({ ok: false, error: "Missing wallet signature." }, 400);

    const user = getAuthenticatedUser(request, initData);
    const challenge = await findPendingChallenge({ telegramUserId: user.id, walletAddress, nonce });

    if (challenge.message !== message) {
      return json({ ok: false, error: "Verification message mismatch. Try again." }, 400);
    }

    const verified = verifyEd25519Signature(message, walletAddress, signature);

    if (!verified) {
      return json({ ok: false, error: "Wallet signature could not be verified." }, 401);
    }

    const balanceResult = await checkBrokeBalance(walletAddress);
    const verifiedAt = await markChallengeVerified(challenge.id, signature);
    const checkedAt = await upsertWalletLink({
      telegramUserId: user.id,
      walletAddress,
      balance: balanceResult.balance,
      percentOfSupply: balanceResult.percentOfSupply,
      holderTier: balanceResult.holderTier,
      verifiedAt,
    });

    return json({
      ok: true,
      walletAddress,
      verified: true,
      provider: "signed_message",
      verifiedAt,
      checkedAt,
      balance: balanceResult.balance,
      tokenSupply: balanceResult.tokenSupply,
      percentOfSupply: balanceResult.percentOfSupply,
      holderTier: balanceResult.holderTier,
      readOnly: true,
    });
  } catch (error) {
    console.error("wallet verification confirm failed", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not verify wallet ownership.",
      },
      500
    );
  }
}
