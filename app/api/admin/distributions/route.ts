import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

type WebAuthSession = {
  user?: {
    id?: number;
  };
  expiresAt?: number;
};

type PayoutInput = {
  rank?: number;
  telegramId?: string;
  username?: string;
  displayName?: string;
  walletAddress?: string;
  verifiedBalance?: number;
  balanceSharePercent?: number;
  rewardAmount?: number;
  token?: string;
};

type DistributionMode = "test" | "real_manual";

type DistributionManifestInput = {
  type?: string;
  mode?: DistributionMode;
  generatedAt?: string;
  token?: string;
  poolAmount?: number;
  eligibleHolders?: number;
  treasuryWallet?: string;
  connectedWallet?: string;
  confirmRealDistribution?: string;
  adminNote?: string;
  rules?: {
    minHold?: number;
    minStreak?: number;
  };
  note?: string;
  payouts?: PayoutInput[];
};

type ManualSendRecord = {
  rank?: number;
  walletAddress?: string;
  txSignature?: string;
};

type DistributionPatchInput = {
  action?: "record_manual_sends" | "cancel_distribution" | "server_auto_send";
  distributionId?: string;
  records?: ManualSendRecord[];
  signaturesText?: string;
  confirmPhrase?: string;
};

type DistributionRow = {
  id: string;
  status: string;
  pool_token: string;
  pool_amount: number | string;
  calculated_total: number | string;
  treasury_wallet?: string | null;
  min_hold: number | string;
  min_streak: number;
  recipient_count: number;
  created_at: string;
  updated_at: string;
  manifest_payload?: unknown;
};

type PayoutRow = {
  id: number;
  distribution_id: string;
  rank: number;
  wallet_address: string;
  reward_amount: number | string;
  reward_token: string;
  status: string;
  tx_signature?: string | null;
  sent_at?: string | null;
};

const WEB_AUTH_COOKIE = "broke_tg_session";
const DEFAULT_TREASURY_WALLET = "5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9";
const REAL_DISTRIBUTION_CONFIRM_PHRASE = "PREPARE REAL DISTRIBUTION";

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

function getOptionalEnv(name: string) {
  return process.env[name] || "";
}

function parseCsv(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAdminTelegramIds() {
  return parseCsv(
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

function getTreasuryWalletAddress() {
  return String(
    getOptionalEnv("TREASURY_WALLET_ADDRESS") ||
      getOptionalEnv("NEXT_PUBLIC_TREASURY_WALLET_ADDRESS") ||
      DEFAULT_TREASURY_WALLET
  ).trim();
}

function getWebAuthSecret() {
  return getOptionalEnv("WEB_AUTH_SECRET") || getOptionalEnv("TELEGRAM_BOT_TOKEN");
}

function getRewardsAdminSecret() {
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

function parseWebAuthSession(request: NextRequest): WebAuthSession | null {
  const secret = getWebAuthSecret();
  const cookie = request.cookies.get(WEB_AUTH_COOKIE)?.value || "";

  if (!secret || !cookie || !cookie.includes(".")) return null;

  const [payloadBase64, signature] = cookie.split(".");
  const expected = crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");

  if (!safeCompareString(signature || "", expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as WebAuthSession;

    if (!session.expiresAt || session.expiresAt < Date.now()) return null;

    return session;
  } catch {
    return null;
  }
}

function isAuthorized(request: NextRequest) {
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

function getSupabaseBaseUrl() {
  return getEnv("SUPABASE_URL")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

function getSupabaseHeaders(extra?: HeadersInit) {
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...(extra || {}),
  };
}

function supabaseUrl(path: string) {
  return `${getSupabaseBaseUrl()}/rest/v1/${path}`;
}

async function supabaseFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cleanString(value: unknown, maxLength = 260) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeToken(value: unknown) {
  const token = cleanString(value || "USDC", 24).toUpperCase();
  if (["USDC", "SOL", "$BROKE", "BROKE"].includes(token)) return token === "BROKE" ? "$BROKE" : token;
  return "USDC";
}

function normalizeMode(value: unknown): DistributionMode {
  return value === "real_manual" ? "real_manual" : "test";
}

function normalizePayouts(input: unknown) {
  const rows = Array.isArray(input) ? input : [];

  return rows
    .map((row, index) => {
      const item = row && typeof row === "object" ? (row as PayoutInput) : {};
      const walletAddress = cleanString(item.walletAddress, 90);
      const rewardAmount = safeNumber(item.rewardAmount);
      const balanceSharePercent = safeNumber(item.balanceSharePercent);
      const verifiedBalance = safeNumber(item.verifiedBalance);
      const telegramId = cleanString(item.telegramId, 40);

      if (!walletAddress || rewardAmount <= 0 || balanceSharePercent < 0 || !telegramId) return null;

      return {
        rank: Math.max(1, Math.round(safeNumber(item.rank, index + 1))),
        telegramId,
        username: cleanString(item.username, 80),
        displayName: cleanString(item.displayName, 120),
        walletAddress,
        verifiedBalance: Number(verifiedBalance.toFixed(6)),
        balanceSharePercent: Number(balanceSharePercent.toFixed(8)),
        rewardAmount: Number(rewardAmount.toFixed(9)),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .slice(0, 500);
}

function normalizeDistributionId(value: unknown) {
  const id = cleanString(value, 80);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : "";
}

function normalizeTxSignature(value: unknown) {
  const tx = cleanString(value, 140).replace(/^https?:\/\/[^\s/]+\/tx\//i, "");
  return /^[1-9A-HJ-NP-Za-km-z]{40,120}$/.test(tx) ? tx : "";
}

function parseManualSendRecords(input: DistributionPatchInput) {
  const explicitRecords = Array.isArray(input.records) ? input.records : [];
  const parsedRecords = explicitRecords.map((record) => ({
    rank: record.rank && Number.isFinite(Number(record.rank)) ? Math.max(1, Math.round(Number(record.rank))) : undefined,
    walletAddress: cleanString(record.walletAddress, 90),
    txSignature: normalizeTxSignature(record.txSignature),
  }));

  const text = cleanString(input.signaturesText, 10000);
  const textRecords = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const normalized = line.replace(/^#/, "");
      const parts = normalized.includes(",")
        ? normalized.split(",")
        : normalized.includes("=")
          ? normalized.split("=")
          : normalized.split(/\s+/);
      const target = cleanString(parts[0], 100).replace(/^rank:/i, "");
      const txSignature = normalizeTxSignature(parts.slice(1).join(" ").trim());
      const rank = /^\d+$/.test(target) ? Number(target) : undefined;
      const walletAddress = rank ? "" : target;

      return { rank, walletAddress, txSignature };
    });

  return [...parsedRecords, ...textRecords]
    .filter((record) => record.txSignature && (record.rank || record.walletAddress))
    .slice(0, 500);
}

const SERVER_AUTO_SEND_CONFIRM_PHRASE = "SERVER AUTO SEND";
const DEFAULT_BROKE_MINT = "9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray";
const DEFAULT_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SERVER_SOLANA_MAINNET_RPC = "https://api.mainnet-beta.solana.com";
const SERVER_SOLANA_SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const SERVER_SOLANA_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SERVER_BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const SERVER_BASE58_MAP = new Map(SERVER_BASE58_ALPHABET.split("").map((char, index) => [char, index]));

function serverGetRpcUrl() {
  return (
    getOptionalEnv("SOLANA_RPC_URL") ||
    getOptionalEnv("HELIUS_RPC_URL") ||
    getOptionalEnv("NEXT_PUBLIC_SOLANA_RPC_URL") ||
    SERVER_SOLANA_MAINNET_RPC
  ).trim();
}

function serverGetTokenMint(token: string) {
  const normalized = normalizeToken(token);
  if (normalized === "$BROKE") return getOptionalEnv("BROKE_TOKEN_MINT") || getOptionalEnv("NEXT_PUBLIC_BROKE_TOKEN_MINT") || DEFAULT_BROKE_MINT;
  if (normalized === "USDC") return getOptionalEnv("USDC_TOKEN_MINT") || getOptionalEnv("NEXT_PUBLIC_USDC_TOKEN_MINT") || DEFAULT_USDC_MINT;
  return "";
}

function serverBase58Decode(value: string) {
  let bytes = [0];

  for (const char of value) {
    const digit = SERVER_BASE58_MAP.get(char);
    if (digit === undefined) throw new Error("Invalid base58 value.");

    let carry = digit;
    for (let index = 0; index < bytes.length; index += 1) {
      const next = bytes[index] * 58 + carry;
      bytes[index] = next & 0xff;
      carry = next >> 8;
    }

    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  for (const char of value) {
    if (char !== "1") break;
    bytes.push(0);
  }

  return new Uint8Array(bytes.reverse());
}

function serverBase58Encode(bytesInput: Uint8Array | Buffer) {
  const bytes = Array.from(bytesInput);
  let zeros = 0;

  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;

  const digits = [0];
  for (let index = zeros; index < bytes.length; index += 1) {
    let carry = bytes[index];

    for (let digitIndex = 0; digitIndex < digits.length; digitIndex += 1) {
      const next = digits[digitIndex] * 256 + carry;
      digits[digitIndex] = next % 58;
      carry = Math.floor(next / 58);
    }

    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  return "1".repeat(zeros) + digits.reverse().map((digit) => SERVER_BASE58_ALPHABET[digit]).join("");
}

function serverPublicKeyBytes(address: string) {
  const bytes = serverBase58Decode(address);
  if (bytes.length !== 32) throw new Error(`Invalid Solana public key: ${address.slice(0, 6)}...`);
  return bytes;
}

function serverEncodeLength(value: number) {
  const bytes: number[] = [];
  let remaining = value;

  do {
    let element = remaining & 0x7f;
    remaining >>= 7;
    if (remaining > 0) element |= 0x80;
    bytes.push(element);
  } while (remaining > 0);

  return new Uint8Array(bytes);
}

function serverConcatBytes(parts: Uint8Array[]) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;

  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
}

function serverBigIntToLeBytes(value: bigint, length: number) {
  const output = new Uint8Array(length);
  let remaining = value;

  for (let index = 0; index < length; index += 1) {
    output[index] = Number(remaining & BigInt(0xff));
    remaining >>= BigInt(8);
  }

  if (remaining > BigInt(0)) throw new Error("Token amount is too large for one transfer instruction.");

  return output;
}

function serverNumberToLeBytes(value: number, length: number) {
  return serverBigIntToLeBytes(BigInt(value), length);
}

function serverDecimalToUnits(value: number | string, decimals: number) {
  const normalized = String(value).replace(/,/g, ".").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Invalid payout amount.");

  const [whole, fraction = ""] = normalized.split(".");
  const paddedFraction = `${fraction}${"0".repeat(decimals)}`.slice(0, decimals);
  const base = BigInt(10) ** BigInt(decimals);

  return BigInt(whole || "0") * base + BigInt(paddedFraction || "0");
}

type ServerTransactionInstruction = {
  programId: string;
  keys: Array<{ pubkey: string; isSigner?: boolean; isWritable?: boolean }>;
  data: Uint8Array;
};

function serverBuildLegacyMessage(feePayer: string, recentBlockhash: string, instructions: ServerTransactionInstruction[]) {
  const metas = new Map<string, { pubkey: string; isSigner: boolean; isWritable: boolean; order: number }>();
  let order = 0;

  function pushMeta(pubkey: string, isSigner = false, isWritable = false) {
    const existing = metas.get(pubkey);

    if (existing) {
      existing.isSigner = existing.isSigner || isSigner;
      existing.isWritable = existing.isWritable || isWritable;
      return;
    }

    metas.set(pubkey, { pubkey, isSigner, isWritable, order });
    order += 1;
  }

  pushMeta(feePayer, true, true);
  instructions.forEach((instruction) => {
    instruction.keys.forEach((key) => pushMeta(key.pubkey, Boolean(key.isSigner), Boolean(key.isWritable)));
    pushMeta(instruction.programId, false, false);
  });

  const orderedMetas = Array.from(metas.values()).sort((a, b) => {
    if (a.pubkey === feePayer) return -1;
    if (b.pubkey === feePayer) return 1;
    if (a.isSigner !== b.isSigner) return Number(b.isSigner) - Number(a.isSigner);
    if (a.isWritable !== b.isWritable) return Number(b.isWritable) - Number(a.isWritable);
    return a.order - b.order;
  });
  const accountIndex = new Map(orderedMetas.map((meta, index) => [meta.pubkey, index]));
  const requiredSignatures = orderedMetas.filter((meta) => meta.isSigner).length;
  const readonlySigned = orderedMetas.filter((meta) => meta.isSigner && !meta.isWritable).length;
  const readonlyUnsigned = orderedMetas.filter((meta) => !meta.isSigner && !meta.isWritable).length;
  const compiledInstructions = instructions.map((instruction) => {
    const accountIndexes = instruction.keys.map((key) => {
      const index = accountIndex.get(key.pubkey);
      if (index === undefined) throw new Error("Internal account index error.");
      return index;
    });
    const programIndex = accountIndex.get(instruction.programId);
    if (programIndex === undefined) throw new Error("Internal program index error.");

    return serverConcatBytes([
      new Uint8Array([programIndex]),
      serverEncodeLength(accountIndexes.length),
      new Uint8Array(accountIndexes),
      serverEncodeLength(instruction.data.length),
      instruction.data,
    ]);
  });

  if (requiredSignatures !== 1) throw new Error("Server payout sender supports exactly one signer.");

  return serverConcatBytes([
    new Uint8Array([requiredSignatures, readonlySigned, readonlyUnsigned]),
    serverEncodeLength(orderedMetas.length),
    ...orderedMetas.map((meta) => serverPublicKeyBytes(meta.pubkey)),
    serverPublicKeyBytes(recentBlockhash),
    serverEncodeLength(compiledInstructions.length),
    ...compiledInstructions,
  ]);
}

function serverBuildSolTransferInstruction(fromAddress: string, toAddress: string, amount: number) {
  const lamports = serverDecimalToUnits(amount, 9);
  if (lamports <= BigInt(0)) throw new Error("SOL payout amount must be greater than zero.");
  const data = serverConcatBytes([serverNumberToLeBytes(2, 4), serverBigIntToLeBytes(lamports, 8)]);

  return {
    programId: SERVER_SOLANA_SYSTEM_PROGRAM_ID,
    keys: [
      { pubkey: fromAddress, isSigner: true, isWritable: true },
      { pubkey: toAddress, isWritable: true },
    ],
    data,
  } satisfies ServerTransactionInstruction;
}

function serverBuildTransferCheckedInstruction({
  sourceTokenAccount,
  mintAddress,
  destinationTokenAccount,
  ownerAddress,
  amount,
  decimals,
}: {
  sourceTokenAccount: string;
  mintAddress: string;
  destinationTokenAccount: string;
  ownerAddress: string;
  amount: number;
  decimals: number;
}) {
  const units = serverDecimalToUnits(amount, decimals);
  if (units <= BigInt(0)) throw new Error("Token payout amount must be greater than zero.");
  const data = serverConcatBytes([new Uint8Array([12]), serverBigIntToLeBytes(units, 8), new Uint8Array([decimals])]);

  return {
    programId: SERVER_SOLANA_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: sourceTokenAccount, isWritable: true },
      { pubkey: mintAddress },
      { pubkey: destinationTokenAccount, isWritable: true },
      { pubkey: ownerAddress, isSigner: true },
    ],
    data,
  } satisfies ServerTransactionInstruction;
}

async function serverSolanaRpc<T>(method: string, params: unknown[] = []): Promise<T> {
  const configuredRpcUrl = serverGetRpcUrl();
  const rpcUrls = Array.from(new Set([configuredRpcUrl, SERVER_SOLANA_MAINNET_RPC].filter(Boolean)));
  let lastError = "Solana RPC request failed.";

  for (const rpcUrl of rpcUrls) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
        cache: "no-store",
      });
      const text = await response.text();
      let data: { result?: T; error?: { message?: string } } = {};

      try {
        data = text ? JSON.parse(text) as { result?: T; error?: { message?: string } } : {};
      } catch {
        lastError = `SOLANA_RPC_URL did not return JSON-RPC. Check the endpoint URL.`;
        if (rpcUrl !== SERVER_SOLANA_MAINNET_RPC) continue;
        throw new Error(lastError);
      }

      if (!response.ok || data.error) {
        const rpcMessage = data.error?.message || `Solana RPC ${response.status}`;
        lastError = rpcMessage;

        // If the configured endpoint is an API/REST URL instead of a Solana JSON-RPC URL,
        // retry public mainnet once so small admin payouts are not blocked by a bad env value.
        if (/method not found/i.test(rpcMessage) && rpcUrl !== SERVER_SOLANA_MAINNET_RPC) continue;

        throw new Error(rpcMessage);
      }

      return data.result as T;
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
      if (/method not found|did not return JSON-RPC/i.test(lastError) && rpcUrl !== SERVER_SOLANA_MAINNET_RPC) continue;
      if (rpcUrl !== rpcUrls[rpcUrls.length - 1]) continue;
    }
  }

  if (/method not found/i.test(lastError)) {
    throw new Error("SOLANA_RPC_URL is not a valid Solana JSON-RPC endpoint. Use a mainnet RPC URL such as https://mainnet.helius-rpc.com/?api-key=YOUR_KEY.");
  }

  throw new Error(lastError);
}

async function serverGetLatestBlockhash() {
  const result = await serverSolanaRpc<{ value?: { blockhash?: string } }>("getLatestBlockhash", [
    { commitment: "confirmed" },
  ]);
  const blockhash = result.value?.blockhash || "";

  if (!blockhash) throw new Error("Could not load latest Solana blockhash.");

  return blockhash;
}

async function serverGetMintDecimals(mintAddress: string) {
  const result = await serverSolanaRpc<{
    value?: { data?: { parsed?: { info?: { decimals?: number } } } };
  }>("getParsedAccountInfo", [mintAddress, { commitment: "confirmed" }]);
  const decimals = result.value?.data?.parsed?.info?.decimals;

  if (typeof decimals !== "number" || decimals < 0) {
    throw new Error(`Could not read token decimals for ${mintAddress.slice(0, 6)}...`);
  }

  return decimals;
}

async function serverFindTokenAccount(ownerAddress: string, mintAddress: string, requirePositiveBalance: boolean) {
  const result = await serverSolanaRpc<{
    value?: Array<{ pubkey?: string; account?: { data?: { parsed?: { info?: { tokenAmount?: { amount?: string } } } } } }>;
  }>("getTokenAccountsByOwner", [
    ownerAddress,
    { mint: mintAddress },
    { encoding: "jsonParsed", commitment: "confirmed" },
  ]);
  const accounts = result.value || [];
  const preferred = requirePositiveBalance
    ? accounts.find((item) => BigInt(item.account?.data?.parsed?.info?.tokenAmount?.amount || "0") > BigInt(0))
    : accounts[0];
  const pubkey = preferred?.pubkey || "";

  if (!pubkey) {
    throw new Error(
      requirePositiveBalance
        ? `Payout wallet has no funded token account for ${mintAddress.slice(0, 6)}...`
        : `Recipient ${ownerAddress.slice(0, 6)}... has no token account for ${mintAddress.slice(0, 6)}...`
    );
  }

  return pubkey;
}

function serverParsePayoutSecretKey() {
  const raw = getOptionalEnv("BROKE_PAYOUT_WALLET_SECRET_KEY") || getOptionalEnv("PAYOUT_WALLET_SECRET_KEY") || "";

  if (!raw.trim()) throw new Error("Missing BROKE_PAYOUT_WALLET_SECRET_KEY. Use a dedicated low-balance payout wallet, not your main treasury wallet.");

  let bytes: Uint8Array;
  const trimmed = raw.trim();

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as number[];
    bytes = new Uint8Array(parsed.map((item) => Number(item)));
  } else {
    bytes = serverBase58Decode(trimmed);
  }

  if (bytes.length !== 64 && bytes.length !== 32) {
    throw new Error("BROKE_PAYOUT_WALLET_SECRET_KEY must be a 64-byte Solana secret key, 32-byte seed, JSON array, or base58 string.");
  }

  const seed = bytes.slice(0, 32);
  const derPrefix = Buffer.from("302e020100300506032b657004220420", "hex");
  const privateKey = crypto.createPrivateKey({ key: Buffer.concat([derPrefix, Buffer.from(seed)]), format: "der", type: "pkcs8" });
  const publicDer = crypto.createPublicKey(privateKey).export({ format: "der", type: "spki" }) as Buffer;
  const publicKey = publicDer.slice(-32);
  const publicAddress = serverBase58Encode(publicKey);
  const configuredAddress = (getOptionalEnv("BROKE_PAYOUT_WALLET_ADDRESS") || getOptionalEnv("PAYOUT_WALLET_ADDRESS") || "").trim();

  if (configuredAddress && configuredAddress !== publicAddress) {
    throw new Error("Payout wallet secret does not match BROKE_PAYOUT_WALLET_ADDRESS.");
  }

  return { privateKey, publicAddress };
}

function serverSignTransaction(message: Uint8Array, privateKey: crypto.KeyObject) {
  const signature = crypto.sign(null, Buffer.from(message), privateKey);
  if (signature.length !== 64) throw new Error("Invalid Ed25519 signature length.");
  return serverConcatBytes([serverEncodeLength(1), new Uint8Array(signature), message]);
}

async function serverSendSignedTransaction(message: Uint8Array, privateKey: crypto.KeyObject) {
  const signedTransaction = serverSignTransaction(message, privateKey);
  const signature = serverBase58Encode(signedTransaction.slice(1, 65));

  await serverSolanaRpc<string>("sendTransaction", [
    Buffer.from(signedTransaction).toString("base64"),
    { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed" },
  ]);

  return signature;
}

function serverChunkRows<T>(rows: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) chunks.push(rows.slice(index, index + size));
  return chunks;
}

async function serverMarkPayoutRowsSent(distributionId: string, records: Array<{ rank: number; txSignature: string }>) {
  const sentAt = new Date().toISOString();

  for (const record of records) {
    await supabaseFetch(`broke_reward_payouts?distribution_id=eq.${encodeURIComponent(distributionId)}&rank=eq.${record.rank}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "manual_sent",
        tx_signature: record.txSignature,
        sent_at: sentAt,
        updated_at: sentAt,
      }),
    });
  }
}

async function getDistributionRows(limit = 10) {
  return supabaseFetch<DistributionRow[]>(
    `broke_reward_distributions?select=*&order=created_at.desc&limit=${Math.max(1, Math.min(30, limit))}`
  );
}

async function getPayoutRows(distributionId: string) {
  return supabaseFetch<PayoutRow[]>(
    `broke_reward_payouts?select=*&distribution_id=eq.${encodeURIComponent(distributionId)}&order=rank.asc`
  );
}

async function updateDistributionStatus(distributionId: string, status: "prepared" | "manual_sent" | "cancelled") {
  await supabaseFetch(`broke_reward_distributions?id=eq.${encodeURIComponent(distributionId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });
}

function formatDistribution(row: DistributionRow) {
  return {
    id: row.id,
    status: row.status,
    poolToken: row.pool_token,
    poolAmount: safeNumber(row.pool_amount),
    calculatedTotal: safeNumber(row.calculated_total),
    treasuryWallet: row.treasury_wallet || "",
    minHold: safeNumber(row.min_hold),
    minStreak: Number(row.min_streak || 0),
    recipientCount: Number(row.recipient_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    manifest: row.manifest_payload || {},
  };
}

export async function GET(request: NextRequest) {
  if (!getRewardsAdminSecret() && getAdminTelegramIds().length === 0) {
    return json({ ok: false, error: "Missing REWARDS_ADMIN_SECRET or configured admin Telegram IDs." }, 500);
  }

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized. Enter REWARDS_ADMIN_SECRET or open as a configured Telegram admin." }, 401);
  }

  try {
    const distributionId = normalizeDistributionId(request.nextUrl.searchParams.get("distributionId"));
    const limit = Math.max(1, Math.min(30, Number(request.nextUrl.searchParams.get("limit") || 8)));

    if (distributionId) {
      const distributions = await supabaseFetch<DistributionRow[]>(
        `broke_reward_distributions?select=*&id=eq.${encodeURIComponent(distributionId)}&limit=1`
      );
      const payouts = await getPayoutRows(distributionId);

      return json({
        ok: true,
        distribution: distributions[0] ? formatDistribution(distributions[0]) : null,
        payouts,
      });
    }

    const distributions = await getDistributionRows(limit);

    return json({
      ok: true,
      distributions: distributions.map(formatDistribution),
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          error instanceof Error
            ? `${error.message}. Run the v59.37 reward distribution ledger migration first if the table is missing.`
            : "Could not load distributions.",
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  if (!getRewardsAdminSecret() && getAdminTelegramIds().length === 0) {
    return json({ ok: false, error: "Missing REWARDS_ADMIN_SECRET or configured admin Telegram IDs." }, 500);
  }

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized. Enter REWARDS_ADMIN_SECRET or open as a configured Telegram admin." }, 401);
  }

  try {
    const body = (await request.json()) as DistributionManifestInput;
    const token = normalizeToken(body.token);
    const mode = normalizeMode(body.mode);
    const poolAmount = safeNumber(body.poolAmount);
    const payouts = normalizePayouts(body.payouts);
    const minHold = Math.max(0, safeNumber(body.rules?.minHold));
    const minStreak = Math.max(0, Math.round(safeNumber(body.rules?.minStreak)));
    const treasuryWallet = cleanString(body.treasuryWallet || getTreasuryWalletAddress(), 90);
    const connectedWallet = cleanString(body.connectedWallet, 90);
    const treasuryMatched = Boolean(
      treasuryWallet && connectedWallet && treasuryWallet.toLowerCase() === connectedWallet.toLowerCase()
    );

    if (poolAmount <= 0) {
      return json({ ok: false, error: "Pool amount must be greater than zero." }, 400);
    }

    if (payouts.length === 0) {
      return json({ ok: false, error: "No payout recipients were provided." }, 400);
    }

    if (mode === "real_manual") {
      if (body.confirmRealDistribution !== REAL_DISTRIBUTION_CONFIRM_PHRASE) {
        return json({ ok: false, error: `Type ${REAL_DISTRIBUTION_CONFIRM_PHRASE} before preparing a real distribution.` }, 400);
      }

      const serverAutoSendEnabled = getOptionalEnv("BROKE_PAYOUT_AUTO_SEND_ENABLED") === "true";
      if (!treasuryMatched && !serverAutoSendEnabled) {
        return json({ ok: false, error: "Connect and verify the configured treasury wallet, or enable BROKE_PAYOUT_AUTO_SEND_ENABLED for dedicated payout wallet distribution." }, 400);
      }
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const calculatedTotal = Number(payouts.reduce((sum, row) => sum + row.rewardAmount, 0).toFixed(9));
    const status = mode === "real_manual" ? "prepared" : "draft";
    const distributionRow = {
      id,
      created_at: createdAt,
      updated_at: createdAt,
      status,
      pool_token: token,
      pool_amount: poolAmount,
      calculated_total: calculatedTotal,
      treasury_wallet: treasuryWallet,
      min_hold: minHold,
      min_streak: minStreak,
      recipient_count: payouts.length,
      manifest_payload: {
        type:
          body.type ||
          (mode === "real_manual"
            ? "BROKE_REWARD_DISTRIBUTION_REAL_MANUAL_MANIFEST"
            : "BROKE_REWARD_DISTRIBUTION_TEST_MANIFEST"),
        mode,
        generatedAt: body.generatedAt || createdAt,
        adminNote: cleanString(body.adminNote, 500),
        note:
          body.note ||
          (mode === "real_manual"
            ? "Real distribution prepared for manual treasury signing/sending. No token transfer was executed by the server."
            : "Manual test ledger only. No token transfer was executed."),
        treasury: {
          expectedWallet: treasuryWallet,
          connectedWallet,
          matched: treasuryMatched,
        },
        safety: {
          noPrivateKey: true,
          noServerTokenTransfers: true,
          walletSigningNotExecutedByServer: true,
          readyForManualTreasurySend: mode === "real_manual",
        },
      },
    };

    await supabaseFetch("broke_reward_distributions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(distributionRow),
    });

    const payoutRows = payouts.map((row) => ({
      distribution_id: id,
      rank: row.rank,
      telegram_id: row.telegramId,
      username: row.username || null,
      display_name: row.displayName || null,
      wallet_address: row.walletAddress,
      verified_balance: row.verifiedBalance,
      balance_share_percent: row.balanceSharePercent,
      reward_amount: row.rewardAmount,
      reward_token: token,
      status: "pending_manual_send",
      created_at: createdAt,
      updated_at: createdAt,
    }));

    await supabaseFetch("broke_reward_payouts", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payoutRows),
    });

    return json({
      ok: true,
      distribution: {
        id,
        status,
        mode,
        poolToken: token,
        poolAmount,
        recipientCount: payouts.length,
        calculatedTotal,
        createdAt,
      },
      safety: {
        noPrivateKey: true,
        noServerTokenTransfers: true,
        walletSigningNotExecutedByServer: true,
        readyForManualTreasurySend: mode === "real_manual",
      },
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message.includes("broke_reward_distributions") || error.message.includes("broke_reward_payouts")
              ? `${error.message}. Run the v59.37 reward distribution ledger migration first.`
              : error.message
            : "Could not save distribution batch.",
      },
      500
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!getRewardsAdminSecret() && getAdminTelegramIds().length === 0) {
    return json({ ok: false, error: "Missing REWARDS_ADMIN_SECRET or configured admin Telegram IDs." }, 500);
  }

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized. Enter REWARDS_ADMIN_SECRET or open as a configured Telegram admin." }, 401);
  }

  try {
    const body = (await request.json()) as DistributionPatchInput;
    const distributionId = normalizeDistributionId(body.distributionId);

    if (!distributionId) {
      return json({ ok: false, error: "Valid distributionId is required." }, 400);
    }

    if (body.action === "cancel_distribution") {
      await updateDistributionStatus(distributionId, "cancelled");

      await supabaseFetch(`broke_reward_payouts?distribution_id=eq.${encodeURIComponent(distributionId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "cancelled", updated_at: new Date().toISOString() }),
      });

      return json({ ok: true, distributionId, status: "cancelled" });
    }

    if (body.action === "server_auto_send") {
      if (cleanString(body.confirmPhrase, 80) !== SERVER_AUTO_SEND_CONFIRM_PHRASE) {
        return json({ ok: false, error: `Type ${SERVER_AUTO_SEND_CONFIRM_PHRASE} to unlock server auto-send.` }, 400);
      }

      if (getOptionalEnv("BROKE_PAYOUT_AUTO_SEND_ENABLED") !== "true") {
        return json({ ok: false, error: "Set BROKE_PAYOUT_AUTO_SEND_ENABLED=true before using server auto-send." }, 400);
      }

      const distributions = await supabaseFetch<DistributionRow[]>(
        `broke_reward_distributions?select=*&id=eq.${encodeURIComponent(distributionId)}&limit=1`
      );
      const distribution = distributions[0];

      if (!distribution) return json({ ok: false, error: "Distribution batch not found." }, 404);
      if (distribution.status !== "prepared") return json({ ok: false, error: `Distribution status must be prepared. Current: ${distribution.status}.` }, 400);

      const payouts = (await getPayoutRows(distributionId)).filter((row) => row.status !== "manual_sent");
      if (payouts.length === 0) return json({ ok: false, error: "No pending payout rows to send." }, 400);

      const maxRecipients = Math.max(1, Math.min(100, Number(getOptionalEnv("BROKE_PAYOUT_MAX_RECIPIENTS") || 30)));
      if (payouts.length > maxRecipients) {
        return json({ ok: false, error: `Server auto-send is capped at ${maxRecipients} recipients for safety.` }, 400);
      }

      const maxPool = safeNumber(getOptionalEnv("BROKE_PAYOUT_MAX_POOL"), 0);
      const calculatedTotal = safeNumber(distribution.calculated_total);
      if (maxPool > 0 && calculatedTotal > maxPool) {
        return json({ ok: false, error: `Distribution total ${calculatedTotal} exceeds BROKE_PAYOUT_MAX_POOL ${maxPool}.` }, 400);
      }

      const { privateKey, publicAddress } = serverParsePayoutSecretKey();
      const token = normalizeToken(distribution.pool_token);
      const isSol = token === "SOL";
      const mint = serverGetTokenMint(token);
      const chunkSize = isSol ? 6 : 2;
      const chunks = serverChunkRows(payouts, chunkSize);
      const sentRecords: Array<{ rank: number; walletAddress: string; txSignature: string }> = [];
      let sourceTokenAccount = "";
      let decimals = isSol ? 9 : 0;

      if (!isSol) {
        decimals = await serverGetMintDecimals(mint);
        sourceTokenAccount = await serverFindTokenAccount(publicAddress, mint, true);
      }

      for (const chunk of chunks) {
        const recentBlockhash = await serverGetLatestBlockhash();
        const instructions: ServerTransactionInstruction[] = [];

        if (isSol) {
          chunk.forEach((row) => {
            instructions.push(serverBuildSolTransferInstruction(publicAddress, row.wallet_address, safeNumber(row.reward_amount)));
          });
        } else {
          for (const row of chunk) {
            const destinationTokenAccount = await serverFindTokenAccount(row.wallet_address, mint, false);
            instructions.push(
              serverBuildTransferCheckedInstruction({
                sourceTokenAccount,
                mintAddress: mint,
                destinationTokenAccount,
                ownerAddress: publicAddress,
                amount: safeNumber(row.reward_amount),
                decimals,
              })
            );
          }
        }

        const message = serverBuildLegacyMessage(publicAddress, recentBlockhash, instructions);
        const txSignature = await serverSendSignedTransaction(message, privateKey);
        const records = chunk.map((row) => ({ rank: row.rank, walletAddress: row.wallet_address, txSignature }));
        await serverMarkPayoutRowsSent(distributionId, records);
        sentRecords.push(...records);
      }

      const updatedPayouts = await getPayoutRows(distributionId);
      const sentCount = updatedPayouts.filter((row) => row.status === "manual_sent" && row.tx_signature).length;
      const totalCount = updatedPayouts.length;
      const nextStatus = totalCount > 0 && sentCount >= totalCount ? "manual_sent" : "prepared";

      await updateDistributionStatus(distributionId, nextStatus);

      return json({
        ok: true,
        distributionId,
        updated: sentRecords.length,
        sentCount,
        totalCount,
        status: nextStatus,
        payoutWallet: publicAddress,
        records: sentRecords,
      });
    }

    if (body.action !== "record_manual_sends") {
      return json({ ok: false, error: "Unsupported distribution action." }, 400);
    }

    const records = parseManualSendRecords(body);

    if (records.length === 0) {
      return json({ ok: false, error: "Paste at least one rank/signature or wallet/signature row." }, 400);
    }

    const sentAt = new Date().toISOString();
    let updated = 0;

    for (const record of records) {
      const filter = record.rank
        ? `distribution_id=eq.${encodeURIComponent(distributionId)}&rank=eq.${record.rank}`
        : `distribution_id=eq.${encodeURIComponent(distributionId)}&wallet_address=eq.${encodeURIComponent(record.walletAddress || "")}`;

      if (!record.txSignature) continue;

      await supabaseFetch(`broke_reward_payouts?${filter}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "manual_sent",
          tx_signature: record.txSignature,
          sent_at: sentAt,
          updated_at: sentAt,
        }),
      });
      updated += 1;
    }

    const payouts = await getPayoutRows(distributionId);
    const sentCount = payouts.filter((row) => row.status === "manual_sent" && row.tx_signature).length;
    const totalCount = payouts.length;
    const nextStatus = totalCount > 0 && sentCount >= totalCount ? "manual_sent" : "prepared";

    await updateDistributionStatus(distributionId, nextStatus);

    return json({
      ok: true,
      distributionId,
      updated,
      sentCount,
      totalCount,
      status: nextStatus,
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not update distribution manual send status.",
      },
      500
    );
  }
}
