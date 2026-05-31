import { getAdminRewardTokenMint } from "./brokeAdminRewards";

function compactWalletAddress(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

export type AdminBatchPayoutRow = {
  rank: number;
  walletAddress: string;
  rewardAmount: number;
  balanceSharePercent?: number;
};

export type AdminWalletStandardAccount = {
  address?: string;
  chains?: string[];
  features?: string[];
};

export type AdminWalletStandardWallet = {
  name?: string;
  chains?: string[];
  accounts?: AdminWalletStandardAccount[];
  features?: Record<string, unknown>;
};

type AdminWalletStandardApi = {
  register: (...wallets: AdminWalletStandardWallet[]) => void;
};

type AdminWalletStandardRegistry = {
  wallets: AdminWalletStandardWallet[];
  api: AdminWalletStandardApi;
  ready: boolean;
};

export type AdminWalletStandardSigner = {
  wallet: AdminWalletStandardWallet;
  account: AdminWalletStandardAccount;
  signAndSendTransaction?: (input: {
    account: AdminWalletStandardAccount;
    chain: string;
    transaction: Uint8Array;
    options?: Record<string, unknown>;
  }) => Promise<unknown>;
  signTransaction?: (input: {
    account: AdminWalletStandardAccount;
    chain: string;
    transaction: Uint8Array;
  }) => Promise<unknown>;
};

type AdminTransactionInstruction = {
  programId: string;
  keys: Array<{ pubkey: string; isSigner?: boolean; isWritable?: boolean }>;
  data: Uint8Array;
};

const ADMIN_SOLANA_MAINNET_CHAIN = "solana:mainnet";
const ADMIN_DEFAULT_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
const ADMIN_SOLANA_SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const ADMIN_SOLANA_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ADMIN_BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const ADMIN_BASE58_MAP = new Map(ADMIN_BASE58_ALPHABET.split("").map((char, index) => [char, index]));

function adminBase58Decode(value: string) {
  const input = value.trim();
  if (!input) return new Uint8Array();

  let leadingZeroCount = 0;
  while (leadingZeroCount < input.length && input[leadingZeroCount] === "1") leadingZeroCount += 1;

  const bytes = [0];
  for (const char of input.slice(leadingZeroCount)) {
    const digit = ADMIN_BASE58_MAP.get(char);
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

function adminBase58Encode(bytesInput: Uint8Array) {
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

  return "1".repeat(zeros) + digits.reverse().map((digit) => ADMIN_BASE58_ALPHABET[digit]).join("");
}

function adminPublicKeyBytes(address: string) {
  const bytes = adminBase58Decode(address);
  if (bytes.length !== 32) throw new Error(`Invalid Solana public key: ${compactWalletAddress(address)}`);
  return bytes;
}

function adminEncodeLength(value: number) {
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

function adminConcatBytes(parts: Uint8Array[]) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;

  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
}

function adminBigIntToLeBytes(value: bigint, length: number) {
  const output = new Uint8Array(length);
  let remaining = value;

  for (let index = 0; index < length; index += 1) {
    output[index] = Number(remaining & BigInt(0xff));
    remaining >>= BigInt(8);
  }

  if (remaining > BigInt(0)) throw new Error("Token amount is too large for one transfer instruction.");

  return output;
}

function adminNumberToLeBytes(value: number, length: number) {
  return adminBigIntToLeBytes(BigInt(value), length);
}

function adminDecimalToUnits(value: number | string, decimals: number) {
  const normalized = String(value).replace(/,/g, ".").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Invalid payout amount.");

  const [whole, fraction = ""] = normalized.split(".");
  const paddedFraction = `${fraction}${"0".repeat(decimals)}`.slice(0, decimals);
  const base = BigInt(10) ** BigInt(decimals);

  return BigInt(whole || "0") * base + BigInt(paddedFraction || "0");
}

function adminUnitsToSafeNumber(value: bigint) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Payout amount is too large for the browser batch sender.");
  }

  return Number(value);
}

function adminBytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function adminNormalizeRpcUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "";
  return envUrl.trim() || ADMIN_DEFAULT_SOLANA_RPC_URL;
}

async function adminSolanaRpc<T>(method: string, params: unknown[] = [], rpcUrl = adminNormalizeRpcUrl()): Promise<T> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  const data = (await response.json()) as { result?: T; error?: { message?: string } };

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Solana RPC ${response.status}`);
  }

  return data.result as T;
}

async function adminGetLatestBlockhash() {
  const result = await adminSolanaRpc<{ value?: { blockhash?: string } }>("getLatestBlockhash", [
    { commitment: "confirmed" },
  ]);
  const blockhash = result.value?.blockhash || "";

  if (!blockhash) throw new Error("Could not load latest Solana blockhash.");

  return blockhash;
}

async function adminGetMintDecimals(mintAddress: string) {
  // Raw Solana JSON-RPC uses `getAccountInfo` with jsonParsed encoding.
  // `getParsedAccountInfo` is a web3.js helper name, not a raw RPC method.
  const result = await adminSolanaRpc<{
    value?: { data?: { parsed?: { info?: { decimals?: number } } } };
  }>("getAccountInfo", [mintAddress, { encoding: "jsonParsed", commitment: "confirmed" }]);
  const decimals = result.value?.data?.parsed?.info?.decimals;

  if (typeof decimals !== "number" || decimals < 0) {
    throw new Error(`Could not read token decimals for ${compactWalletAddress(mintAddress)}.`);
  }

  return decimals;
}

async function adminFindTokenAccount(ownerAddress: string, mintAddress: string, requirePositiveBalance: boolean) {
  const result = await adminSolanaRpc<{
    value?: Array<{ pubkey?: string; account?: { data?: { parsed?: { info?: { tokenAmount?: { uiAmount?: number; amount?: string } } } } } }>;
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
        ? `Treasury has no funded token account for ${compactWalletAddress(mintAddress)}.`
        : `Recipient ${compactWalletAddress(ownerAddress)} has no token account for ${compactWalletAddress(mintAddress)}. Use payment links or ask them to hold the token first.`
    );
  }

  return pubkey;
}

function adminSerializeLegacyTransaction(feePayer: string, recentBlockhash: string, instructions: AdminTransactionInstruction[]) {
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

    return adminConcatBytes([
      new Uint8Array([programIndex]),
      adminEncodeLength(accountIndexes.length),
      new Uint8Array(accountIndexes),
      adminEncodeLength(instruction.data.length),
      instruction.data,
    ]);
  });
  const message = adminConcatBytes([
    new Uint8Array([requiredSignatures, readonlySigned, readonlyUnsigned]),
    adminEncodeLength(orderedMetas.length),
    ...orderedMetas.map((meta) => adminPublicKeyBytes(meta.pubkey)),
    adminPublicKeyBytes(recentBlockhash),
    adminEncodeLength(compiledInstructions.length),
    ...compiledInstructions,
  ]);
  const zeroSignatures = Array.from({ length: requiredSignatures }, () => new Uint8Array(64));

  return adminConcatBytes([adminEncodeLength(requiredSignatures), ...zeroSignatures, message]);
}

function adminBuildSolTransferInstruction(fromAddress: string, toAddress: string, amount: number) {
  const lamports = adminDecimalToUnits(amount, 9);
  if (lamports <= BigInt(0)) throw new Error("SOL payout amount must be greater than zero.");
  const data = adminConcatBytes([adminNumberToLeBytes(2, 4), adminBigIntToLeBytes(lamports, 8)]);

  return {
    programId: ADMIN_SOLANA_SYSTEM_PROGRAM_ID,
    keys: [
      { pubkey: fromAddress, isSigner: true, isWritable: true },
      { pubkey: toAddress, isWritable: true },
    ],
    data,
  } satisfies AdminTransactionInstruction;
}

function adminBuildTransferCheckedInstruction({
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
  const units = adminDecimalToUnits(amount, decimals);
  if (units <= BigInt(0)) throw new Error("Token payout amount must be greater than zero.");
  adminUnitsToSafeNumber(units);
  const data = adminConcatBytes([new Uint8Array([12]), adminBigIntToLeBytes(units, 8), new Uint8Array([decimals])]);

  return {
    programId: ADMIN_SOLANA_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: sourceTokenAccount, isWritable: true },
      { pubkey: mintAddress },
      { pubkey: destinationTokenAccount, isWritable: true },
      { pubkey: ownerAddress, isSigner: true },
    ],
    data,
  } satisfies AdminTransactionInstruction;
}

function adminChunkRows<T>(rows: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) chunks.push(rows.slice(index, index + size));
  return chunks;
}

function adminGetWalletStandardRegistry() {
  if (typeof window === "undefined") return null;

  const candidateWindow = window as unknown as Window & {
    __brokeAdminWalletStandardRegistry?: AdminWalletStandardRegistry;
    __brokeWalletStandardRegistry?: { wallets?: AdminWalletStandardWallet[] };
    navigator: Navigator & {
      wallets?: { push?: (...callbacks: Array<(api: AdminWalletStandardApi) => void>) => void };
    };
  };

  if (!candidateWindow.__brokeAdminWalletStandardRegistry) {
    const registry: AdminWalletStandardRegistry = {
      wallets: [],
      ready: false,
      api: {
        register: (...wallets: AdminWalletStandardWallet[]) => {
          wallets.forEach((wallet) => {
            if (!wallet) return;
            const alreadyRegistered = registry.wallets.some((item) => item === wallet || item.name === wallet.name);
            if (!alreadyRegistered) registry.wallets.push(wallet);
          });
        },
      },
    };
    candidateWindow.__brokeAdminWalletStandardRegistry = registry;
  }

  const registry = candidateWindow.__brokeAdminWalletStandardRegistry;

  if (!registry.ready) {
    registry.ready = true;

    try {
      window.addEventListener("wallet-standard:register-wallet", ((event: Event) => {
        const detail = (event as CustomEvent<(api: AdminWalletStandardApi) => void>).detail;
        if (typeof detail === "function") detail(registry.api);
      }) as EventListener);
    } catch {
      // Wallet Standard is optional.
    }

    try {
      const navigatorWithWallets = candidateWindow.navigator;
      if (!navigatorWithWallets.wallets) {
        Object.defineProperty(navigatorWithWallets, "wallets", {
          configurable: false,
          enumerable: false,
          value: Object.freeze({
            push: (...callbacks: Array<(api: AdminWalletStandardApi) => void>) => {
              callbacks.forEach((callback) => {
                try {
                  callback(registry.api);
                } catch {
                  // Ignore wallet registration callbacks that throw.
                }
              });
            },
          }),
        });
      }
    } catch {
      // Locked navigator properties are common in mobile wallet browsers.
    }
  }

  try {
    window.dispatchEvent(new CustomEvent("wallet-standard:app-ready", { detail: registry.api }));
  } catch {
    // Custom events are optional.
  }

  try {
    const sharedWallets = candidateWindow.__brokeWalletStandardRegistry?.wallets || [];
    registry.api.register(...sharedWallets);
  } catch {
    // Reusing the Profile wallet registry is optional.
  }

  return registry;
}

export async function adminGetWalletStandardSigner(expectedTreasuryWallet: string): Promise<AdminWalletStandardSigner> {
  const registry = adminGetWalletStandardRegistry();
  const wallets = registry?.wallets || [];
  const normalizedTreasury = expectedTreasuryWallet.toLowerCase();

  for (const wallet of wallets) {
    const connectFeature = wallet.features?.["standard:connect"] as
      | { connect?: (input?: { silent?: boolean }) => Promise<{ accounts?: AdminWalletStandardAccount[] } | void> }
      | undefined;
    const signAndSendFeature = wallet.features?.["solana:signAndSendTransaction"] as
      | { signAndSendTransaction?: AdminWalletStandardSigner["signAndSendTransaction"] }
      | undefined;
    const signTransactionFeature = wallet.features?.["solana:signTransaction"] as
      | { signTransaction?: AdminWalletStandardSigner["signTransaction"] }
      | undefined;

    if (!connectFeature?.connect || (!signAndSendFeature?.signAndSendTransaction && !signTransactionFeature?.signTransaction)) continue;

    const connectResult = await connectFeature.connect({ silent: false });
    const connectedAccounts = connectResult && typeof connectResult === "object" ? connectResult.accounts : undefined;
    const accounts = connectedAccounts || wallet.accounts || [];
    const account = accounts.find((item) => (item.address || "").toLowerCase() === normalizedTreasury) || accounts[0];

    if (!account?.address) continue;
    if (account.address.toLowerCase() !== normalizedTreasury) {
      throw new Error(`Connected ${wallet.name || "wallet"} address ${compactWalletAddress(account.address)} does not match treasury.`);
    }

    return {
      wallet,
      account,
      signAndSendTransaction: signAndSendFeature?.signAndSendTransaction,
      signTransaction: signTransactionFeature?.signTransaction,
    };
  }

  throw new Error("No Wallet Standard treasury signer was exposed. Open the app inside Phantom/Jupiter/Solflare wallet browser and try Rescan/Verify wallet first.");
}

function adminSignatureFromWalletResult(result: unknown) {
  const value = Array.isArray(result) ? result[0] : result;

  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return adminBase58Encode(value);

  const objectValue = value && typeof value === "object" ? value as { signature?: unknown; signatures?: unknown[]; signedTransaction?: unknown } : {};
  const signature = objectValue.signature || objectValue.signatures?.[0];

  if (typeof signature === "string") return signature;
  if (signature instanceof Uint8Array) return adminBase58Encode(signature);

  return "";
}

function adminReadableError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "Unknown wallet error";
}

async function adminSignSerializedTransactionAndSend(signer: AdminWalletStandardSigner, transaction: Uint8Array) {
  if (!signer.signTransaction) throw new Error("Wallet cannot sign transactions for the fallback sender.");

  const result = await signer.signTransaction({
    account: signer.account,
    chain: ADMIN_SOLANA_MAINNET_CHAIN,
    transaction,
  });
  const signed = Array.isArray(result) ? result[0] : result;
  const signedObject = signed && typeof signed === "object" ? signed as { signedTransaction?: unknown; transaction?: unknown } : {};
  const signedTransaction = signed instanceof Uint8Array
    ? signed
    : signedObject.signedTransaction instanceof Uint8Array
      ? signedObject.signedTransaction
      : signedObject.transaction instanceof Uint8Array
        ? signedObject.transaction
        : null;

  if (!signedTransaction) throw new Error("Wallet did not return a signed transaction.");

  return adminSolanaRpc<string>("sendTransaction", [
    adminBytesToBase64(signedTransaction),
    { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed" },
  ]);
}

export async function adminSignAndSendSerializedTransaction(signer: AdminWalletStandardSigner, transaction: Uint8Array) {
  if (signer.signAndSendTransaction) {
    try {
      const result = await signer.signAndSendTransaction({
        account: signer.account,
        chain: ADMIN_SOLANA_MAINNET_CHAIN,
        transaction,
        options: { skipPreflight: false, preflightCommitment: "confirmed" },
      });
      const signature = adminSignatureFromWalletResult(result);
      if (!signature) throw new Error("Wallet sent transaction but did not return a signature.");
      return signature;
    } catch (error) {
      if (!signer.signTransaction) {
        const message = adminReadableError(error);
        throw new Error(
          /access forbidden/i.test(message)
            ? "Wallet blocked direct batch sending. Try opening the app in the desktop extension browser, or use payment links as fallback."
            : message
        );
      }
      // Some mobile wallets, including Phantom in certain in-app browser states,
      // expose signAndSendTransaction but reject it with Access forbidden. Fall back
      // to signTransaction + app-side RPC broadcast so the admin still gets one
      // wallet approval per grouped transaction instead of one approval per user.
      return adminSignSerializedTransactionAndSend(signer, transaction);
    }
  }

  if (signer.signTransaction) {
    return adminSignSerializedTransactionAndSend(signer, transaction);
  }

  throw new Error("Wallet cannot sign or send transactions.");
}


export async function buildAdminBatchTransactions({
  rows,
  treasuryWallet,
  rewardPoolToken,
  onProgress,
}: {
  rows: AdminBatchPayoutRow[];
  treasuryWallet: string;
  rewardPoolToken: string;
  onProgress?: (message: string) => void;
}) {
  const token = rewardPoolToken.toUpperCase();
  const isSol = token === "SOL";
  const mint = getAdminRewardTokenMint(rewardPoolToken);
  const chunkSize = isSol ? 6 : 2;
  const chunks = adminChunkRows(rows, chunkSize);
  const transactions: Array<{ rows: AdminBatchPayoutRow[]; transaction: Uint8Array }> = [];

  if (!isSol && !mint) {
    throw new Error("Batch sender currently supports SOL, USDC, and $BROKE only.");
  }

  let sourceTokenAccount = "";
  let decimals = isSol ? 9 : 0;

  if (!isSol) {
    onProgress?.("Reading token mint + treasury token account...");
    decimals = await adminGetMintDecimals(mint);
    sourceTokenAccount = await adminFindTokenAccount(treasuryWallet, mint, true);
  }

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    onProgress?.(`Building transaction ${index + 1}/${chunks.length}...`);
    const recentBlockhash = await adminGetLatestBlockhash();
    const instructions: AdminTransactionInstruction[] = [];

    if (isSol) {
      chunk.forEach((row) => {
        instructions.push(adminBuildSolTransferInstruction(treasuryWallet, row.walletAddress, row.rewardAmount));
      });
    } else {
      for (const row of chunk) {
        const destinationTokenAccount = await adminFindTokenAccount(row.walletAddress, mint, false);
        instructions.push(
          adminBuildTransferCheckedInstruction({
            sourceTokenAccount,
            mintAddress: mint,
            destinationTokenAccount,
            ownerAddress: treasuryWallet,
            amount: row.rewardAmount,
            decimals,
          })
        );
      }
    }

    transactions.push({
      rows: chunk,
      transaction: adminSerializeLegacyTransaction(treasuryWallet, recentBlockhash, instructions),
    });
  }

  return transactions;
}
