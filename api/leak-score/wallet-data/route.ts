import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_BROKE_TOKEN_MINT_ADDRESS } from "../../../lib/brokeAdminRewards";
import {
  cleanupWalletLeakAddressInput,
  getWalletLeakDataSourceHealth,
  isLikelySolanaWalletAddress,
  type WalletLeakBasicData,
  type WalletLeakBasicDataResponse,
  type WalletLeakDataSource,
  type WalletLeakVisibleTokenAccount,
} from "../../../lib/brokeWalletLeakData";

export const runtime = "nodejs";

const DEFAULT_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const LAMPORTS_PER_SOL = 1_000_000_000;

export type SolanaRpcResponse<T> = {
  result?: T;
  error?: {
    code?: number;
    message?: string;
  };
};

type BalanceResult = {
  value?: number;
};

type ParsedTokenAccountsResult = {
  value?: Array<{
    pubkey?: string;
    account?: {
      data?: {
        parsed?: {
          info?: {
            mint?: string;
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

function json(payload: WalletLeakBasicDataResponse, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function getSolanaRpcUrl() {
  return String(process.env.WALLET_LEAK_SOLANA_RPC_URL || process.env.LEAK_SCORE_SOLANA_RPC_URL || process.env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC_URL).trim();
}

function getBrokeMint() {
  return String(process.env.BROKE_TOKEN_MINT || process.env.NEXT_PUBLIC_BROKE_TOKEN_MINT || DEFAULT_BROKE_TOKEN_MINT_ADDRESS).trim();
}

async function rpc<T>(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "broke-wallet-leak-data",
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

function parseTokenUiAmount(value?: string | number | null) {
  const numeric = Number(String(value ?? "0"));
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeTokenAccounts(result: ParsedTokenAccountsResult, brokeMint: string) {
  const rawAccounts = Array.isArray(result.value) ? result.value : [];
  const visible: WalletLeakVisibleTokenAccount[] = rawAccounts
    .map((item) => {
      const info = item.account?.data?.parsed?.info;
      const amount = String(info?.tokenAmount?.uiAmountString || info?.tokenAmount?.uiAmount || "0");
      return {
        mint: String(info?.mint || ""),
        amount,
        decimals: typeof info?.tokenAmount?.decimals === "number" ? info.tokenAmount.decimals : null,
        accountAddress: String(item.pubkey || ""),
        isBroke: String(info?.mint || "") === brokeMint,
      };
    })
    .filter((item) => item.mint && item.accountAddress);

  const nonZero = visible.filter((item) => parseTokenUiAmount(item.amount) > 0);
  const brokeBalance = nonZero
    .filter((item) => item.isBroke)
    .reduce((total, item) => total + parseTokenUiAmount(item.amount), 0);

  const visibleTokenAccounts = nonZero
    .slice(0, 8)
    .map((item) => ({ ...item }));

  return {
    tokenAccountsCount: visible.length,
    nonZeroTokenAccountsCount: nonZero.length,
    brokeBalance: brokeBalance > 0 ? String(brokeBalance) : null,
    brokeTokenAccountFound: brokeBalance > 0,
    visibleTokenAccounts,
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return json({
        ok: false,
        code: "invalid_json_body",
        error: "Wallet data request body must be a JSON object.",
      }, 400);
    }

    const body = rawBody as { walletAddress?: unknown };
    const cleanup = cleanupWalletLeakAddressInput(body.walletAddress);
    const walletAddress = cleanup.cleanedAddress;

    if (!walletAddress) {
      return json({
        ok: false,
        code: "empty_wallet_address",
        error: "Paste a public Solana wallet address before fetching wallet context.",
      }, 400);
    }

    if (!isLikelySolanaWalletAddress(walletAddress)) {
      return json({
        ok: false,
        code: "invalid_solana_wallet",
        error: "This does not look like a valid Solana public wallet address.",
      }, 400);
    }

    const rpcUrl = getSolanaRpcUrl();
    const brokeMint = getBrokeMint();
    const fetchedAt = new Date().toISOString();
    const warnings: string[] = [
      "Read-only public wallet context only. This is not wallet surveillance, not PnL, and not trade-history analysis.",
      "Token-account counts do not show buys, sells, timing, realized profit, or project quality.",
    ];

    let balanceOk = false;
    let tokenAccountsOk = false;
    let solBalance: number | null = null;
    let tokenAccountsCount: number | null = null;
    let nonZeroTokenAccountsCount: number | null = null;
    let brokeBalance: string | null = null;
    let brokeTokenAccountFound = false;
    let visibleTokenAccounts: WalletLeakVisibleTokenAccount[] = [];

    try {
      const balanceResult = await rpc<BalanceResult>(rpcUrl, "getBalance", [walletAddress, { commitment: "confirmed" }]);
      solBalance = typeof balanceResult.value === "number" ? balanceResult.value / LAMPORTS_PER_SOL : null;
      balanceOk = solBalance !== null;
    } catch (error) {
      warnings.push(error instanceof Error ? `SOL balance unavailable: ${error.message}` : "SOL balance unavailable from RPC.");
    }

    try {
      const tokenAccountsResult = await rpc<ParsedTokenAccountsResult>(rpcUrl, "getParsedTokenAccountsByOwner", [
        walletAddress,
        { programId: TOKEN_PROGRAM_ID },
        { encoding: "jsonParsed", commitment: "confirmed" },
      ]);
      const normalized = normalizeTokenAccounts(tokenAccountsResult, brokeMint);
      tokenAccountsCount = normalized.tokenAccountsCount;
      nonZeroTokenAccountsCount = normalized.nonZeroTokenAccountsCount;
      brokeBalance = normalized.brokeBalance;
      brokeTokenAccountFound = normalized.brokeTokenAccountFound;
      visibleTokenAccounts = normalized.visibleTokenAccounts;
      tokenAccountsOk = true;
    } catch (error) {
      warnings.push(error instanceof Error ? `Token accounts unavailable: ${error.message}` : "Token accounts unavailable from RPC.");
    }

    const sources: WalletLeakDataSource[] = [
      {
        id: "solana_balance",
        label: "Solana RPC balance",
        ok: balanceOk,
        helper: balanceOk ? "SOL balance loaded from public Solana RPC." : "SOL balance was not available from the selected RPC.",
      },
      {
        id: "solana_token_accounts",
        label: "Solana RPC token accounts",
        ok: tokenAccountsOk,
        helper: tokenAccountsOk ? "SPL token-account context loaded from public Solana RPC." : "Token-account context was not available from the selected RPC.",
      },
    ];
    const sourceHealth = getWalletLeakDataSourceHealth(sources);

    if (!tokenAccountsOk) {
      warnings.push("Wallet token exposure could not be checked. Continue with manual behavior signals only.");
    } else if (nonZeroTokenAccountsCount === 0) {
      warnings.push("No non-zero SPL token accounts were visible in this point-in-time RPC snapshot.");
    }

    const data: WalletLeakBasicData = {
      chain: "Solana",
      walletAddress,
      fetchedAt,
      solBalance,
      tokenAccountsCount,
      nonZeroTokenAccountsCount,
      brokeMint,
      brokeBalance,
      brokeTokenAccountFound,
      visibleTokenAccounts,
      warnings,
      sources,
      ...sourceHealth,
    };

    return json({ ok: true, data });
  } catch (error) {
    return json({
      ok: false,
      code: "wallet_data_fetch_failed",
      error: error instanceof Error ? error.message : "Basic wallet data fetch failed.",
    }, 500);
  }
}
