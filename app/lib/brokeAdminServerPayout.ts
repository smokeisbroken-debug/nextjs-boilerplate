import crypto from "crypto";
import {
  DEFAULT_BROKE_TOKEN_MINT_ADDRESS,
  DEFAULT_USDC_TOKEN_MINT_ADDRESS,
} from "./brokeAdminRewards";
import {
  cleanAdminString as cleanString,
  getOptionalAdminEnv as getOptionalEnv,
  safeAdminNumber as safeNumber,
} from "./brokeAdminApi";

export type ServerPayoutDistributionRow = {
  id?: string;
  status: string;
  pool_token: string;
  calculated_total: number | string;
};

export type ServerPayoutRow = {
  rank: number;
  wallet_address: string;
  reward_amount: number | string;
  status: string;
  tx_signature?: string | null;
};

export type ServerPayoutSentRecord = {
  rank: number;
  walletAddress: string;
  txSignature: string;
};

export type ServerPayoutFailedRecord = {
  rank: number;
  walletAddress: string;
  reason: string;
};

type ServerAutoSendDependencies = {
  getDistributionRows: (distributionId: string) => Promise<ServerPayoutDistributionRow[]>;
  getPayoutRows: (distributionId: string) => Promise<ServerPayoutRow[]>;
  markPayoutRowsFailed?: (distributionId: string, records: Array<{ rank: number }>) => Promise<void>;
  markPayoutRowsSent: (distributionId: string, records: Array<{ rank: number; txSignature: string }>) => Promise<void>;
  updateDistributionStatus: (distributionId: string, status: "prepared" | "manual_sent") => Promise<void>;
};

type ServerTransactionInstruction = {
  programId: string;
  keys: Array<{ pubkey: string; isSigner?: boolean; isWritable?: boolean }>;
  data: Uint8Array;
};

const DEFAULT_BROKE_MINT = DEFAULT_BROKE_TOKEN_MINT_ADDRESS;
const DEFAULT_USDC_MINT = DEFAULT_USDC_TOKEN_MINT_ADDRESS;
const SERVER_SOLANA_MAINNET_RPC = "https://api.mainnet-beta.solana.com";
const SERVER_SOLANA_SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const SERVER_SOLANA_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SERVER_BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const SERVER_BASE58_MAP = new Map(SERVER_BASE58_ALPHABET.split("").map((char, index) => [char, index]));

function normalizeServerRewardToken(value: unknown) {
  const token = cleanString(value || "USDC", 24).toUpperCase();
  if (["USDC", "SOL", "$BROKE", "BROKE"].includes(token)) return token === "BROKE" ? "$BROKE" : token;
  return "USDC";
}

function serverCleanRpcUrl(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, "").trim();
}

function serverLooksLikeSolanaJsonRpcUrl(value: string) {
  const rpcUrl = serverCleanRpcUrl(value);
  if (!rpcUrl) return false;

  try {
    const parsed = new URL(rpcUrl);
    if (!/^https?:$/.test(parsed.protocol)) return false;

    // Helius Enhanced API URLs such as /v0/transactions are REST endpoints, not Solana JSON-RPC.
    // They return "Method not found" for standard Solana RPC methods.
    if (/\/v\d+\//i.test(parsed.pathname)) return false;

    return true;
  } catch {
    return false;
  }
}

function serverGetRpcUrls() {
  // Keep this deliberately strict: payout sending is server-side, so it should use
  // only the private server env plus the public Solana fallback. Old NEXT_PUBLIC_* or
  // Enhanced API / REST URLs can remain in Vercel from previous experiments and must
  // not poison the payout sender.
  const privateRpc = serverCleanRpcUrl(getOptionalEnv("SOLANA_RPC_URL") || "");
  const candidates = [
    serverLooksLikeSolanaJsonRpcUrl(privateRpc) ? privateRpc : "",
    SERVER_SOLANA_MAINNET_RPC,
  ].filter(Boolean);

  return Array.from(new Set(candidates));
}

function serverBase58Decode(value: string) {
  const input = value.trim();
  if (!input) return new Uint8Array();

  let leadingZeroCount = 0;
  while (leadingZeroCount < input.length && input[leadingZeroCount] === "1") leadingZeroCount += 1;

  const bytes = [0];
  for (const char of input.slice(leadingZeroCount)) {
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

  const decoded = input.length === leadingZeroCount ? [] : bytes.reverse();
  return new Uint8Array([...Array(leadingZeroCount).fill(0), ...decoded]);
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

function serverIsValidSolanaPublicKey(address: string) {
  try {
    return serverBase58Decode(address).length === 32;
  } catch {
    return false;
  }
}

function serverPickTokenMint(candidates: string[], fallback: string) {
  const normalizedFallback = fallback.trim();

  for (const candidate of candidates) {
    const value = cleanString(candidate, 100).trim();
    if (!value) continue;
    if (value === SERVER_SOLANA_SYSTEM_PROGRAM_ID) continue;
    if (!serverIsValidSolanaPublicKey(value)) continue;
    return value;
  }

  return normalizedFallback;
}

function serverGetTokenMint(token: string) {
  const normalized = normalizeServerRewardToken(token);
  if (normalized === "$BROKE") {
    return serverPickTokenMint([getOptionalEnv("BROKE_TOKEN_MINT"), getOptionalEnv("NEXT_PUBLIC_BROKE_TOKEN_MINT")], DEFAULT_BROKE_MINT);
  }
  if (normalized === "USDC") {
    return serverPickTokenMint([getOptionalEnv("USDC_TOKEN_MINT"), getOptionalEnv("NEXT_PUBLIC_USDC_TOKEN_MINT")], DEFAULT_USDC_MINT);
  }
  return "";
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
  const rpcUrls = serverGetRpcUrls();
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
        lastError = `${rpcUrl === SERVER_SOLANA_MAINNET_RPC ? "Public fallback RPC" : "SOLANA_RPC_URL"} did not return JSON-RPC.`;
        continue;
      }

      if (!response.ok || data.error) {
        const rpcMessage = data.error?.message || `Solana RPC ${response.status}`;
        lastError = `${rpcUrl === SERVER_SOLANA_MAINNET_RPC ? "Public fallback RPC" : "SOLANA_RPC_URL"}: ${rpcMessage}`;
        continue;
      }

      return data.result as T;
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
      continue;
    }
  }

  throw new Error(`Solana RPC failed after private + public fallback attempts: ${lastError}`);
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
  // Raw Solana JSON-RPC does not expose a `getParsedAccountInfo` method.
  // `getParsedAccountInfo` is a web3.js helper; the real JSON-RPC method is
  // `getAccountInfo` with `encoding: "jsonParsed"`. Calling the helper name
  // directly caused public/private RPC endpoints to return `Method not found`.
  const result = await serverSolanaRpc<{
    value?: { data?: { parsed?: { info?: { decimals?: number } } } };
  }>("getAccountInfo", [mintAddress, { encoding: "jsonParsed", commitment: "confirmed" }]);
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

export async function serverAutoSendPreparedDistribution(distributionId: string, dependencies: ServerAutoSendDependencies) {
  if (getOptionalEnv("BROKE_PAYOUT_AUTO_SEND_ENABLED") !== "true") {
    throw new Error("Set BROKE_PAYOUT_AUTO_SEND_ENABLED=true before using server auto-send.");
  }

  const distributions = await dependencies.getDistributionRows(distributionId);
  const distribution = distributions[0];

  if (!distribution) throw new Error("Distribution batch not found.");
  if (distribution.status !== "prepared") throw new Error(`Distribution status must be prepared. Current: ${distribution.status}.`);

  const payouts = (await dependencies.getPayoutRows(distributionId)).filter((row) => row.status !== "manual_sent" && row.status !== "cancelled");
  if (payouts.length === 0) throw new Error("No pending payout rows to send.");

  const maxRecipients = Math.max(1, Math.min(100, Number(getOptionalEnv("BROKE_PAYOUT_MAX_RECIPIENTS") || 30)));
  if (payouts.length > maxRecipients) {
    throw new Error(`Server auto-send is capped at ${maxRecipients} recipients for safety.`);
  }

  const maxPool = safeNumber(getOptionalEnv("BROKE_PAYOUT_MAX_POOL"), 0);
  const calculatedTotal = safeNumber(distribution.calculated_total);
  if (maxPool > 0 && calculatedTotal > maxPool) {
    throw new Error(`Distribution total ${calculatedTotal} exceeds BROKE_PAYOUT_MAX_POOL ${maxPool}.`);
  }

  const { privateKey, publicAddress } = serverParsePayoutSecretKey();
  const token = normalizeServerRewardToken(distribution.pool_token);
  const isSol = token === "SOL";
  const mint = serverGetTokenMint(token);
  const chunkSize = isSol ? 6 : 2;
  const chunks = serverChunkRows(payouts, chunkSize);
  const sentRecords: ServerPayoutSentRecord[] = [];
  const failedRecords: ServerPayoutFailedRecord[] = [];
  let sourceTokenAccount = "";
  let decimals = isSol ? 9 : 0;

  if (!isSol) {
    decimals = await serverGetMintDecimals(mint);
    sourceTokenAccount = await serverFindTokenAccount(publicAddress, mint, true);
  }

  for (const chunk of chunks) {
    const instructions: ServerTransactionInstruction[] = [];
    const sendableRows: ServerPayoutRow[] = [];

    if (isSol) {
      for (const row of chunk) {
        try {
          instructions.push(serverBuildSolTransferInstruction(publicAddress, row.wallet_address, safeNumber(row.reward_amount)));
          sendableRows.push(row);
        } catch (error) {
          failedRecords.push({
            rank: row.rank,
            walletAddress: row.wallet_address,
            reason: error instanceof Error ? error.message : "Could not build SOL transfer.",
          });
        }
      }
    } else {
      for (const row of chunk) {
        try {
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
          sendableRows.push(row);
        } catch (error) {
          failedRecords.push({
            rank: row.rank,
            walletAddress: row.wallet_address,
            reason: error instanceof Error ? error.message : "Could not prepare token transfer.",
          });
        }
      }
    }

    if (instructions.length === 0 || sendableRows.length === 0) continue;

    try {
      const recentBlockhash = await serverGetLatestBlockhash();
      const message = serverBuildLegacyMessage(publicAddress, recentBlockhash, instructions);
      const txSignature = await serverSendSignedTransaction(message, privateKey);
      const records = sendableRows.map((row) => ({ rank: row.rank, walletAddress: row.wallet_address, txSignature }));
      await dependencies.markPayoutRowsSent(distributionId, records);
      sentRecords.push(...records);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Transaction send failed.";
      failedRecords.push(...sendableRows.map((row) => ({ rank: row.rank, walletAddress: row.wallet_address, reason })));
      if (dependencies.markPayoutRowsFailed) {
        await dependencies.markPayoutRowsFailed(distributionId, sendableRows.map((row) => ({ rank: row.rank })));
      }
      continue;
    }
  }

  if (dependencies.markPayoutRowsFailed && failedRecords.length > 0) {
    await dependencies.markPayoutRowsFailed(distributionId, failedRecords.map((record) => ({ rank: record.rank })));
  }

  const updatedPayouts = await dependencies.getPayoutRows(distributionId);
  const sentCount = updatedPayouts.filter((row) => row.status === "manual_sent" && row.tx_signature).length;
  const totalCount = updatedPayouts.length;
  const failedCount = failedRecords.length;
  const nextStatus = totalCount > 0 && sentCount >= totalCount ? "manual_sent" : "prepared";

  await dependencies.updateDistributionStatus(distributionId, nextStatus);

  return {
    distributionId,
    updated: sentRecords.length,
    sentCount,
    totalCount,
    failedCount,
    status: nextStatus,
    payoutWallet: publicAddress,
    records: sentRecords,
    failedRecords,
    partial: failedCount > 0 && sentRecords.length > 0,
  };
}
