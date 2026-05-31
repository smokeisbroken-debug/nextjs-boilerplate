import { NextRequest, NextResponse } from "next/server";
import type { LeakScoreSignalId } from "../../../lib/brokeLeakScore";
import {
  getLeakScoreTokenDataSourceHealth,
  isLikelySolanaMintAddress,
  normalizeLeakScoreChainForData,
  type LeakScoreBasicTokenData,
  type LeakScoreTokenDataPair,
  type LeakScoreTokenDataResponse,
  type LeakScoreTokenDataSource,
} from "../../../lib/brokeLeakScoreTokenData";

export const runtime = "nodejs";

const DEFAULT_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
const DEXSCREENER_TOKEN_BASE_URL = "https://api.dexscreener.com/latest/dex/tokens";

type SolanaRpcResponse<T> = {
  result?: T;
  error?: {
    code?: number;
    message?: string;
  };
};

type TokenSupplyResult = {
  value?: {
    amount?: string;
    decimals?: number;
    uiAmount?: number | null;
    uiAmountString?: string;
  };
};

type LargestTokenAccountsResult = {
  value?: Array<{
    address?: string;
    amount?: string;
    decimals?: number;
    uiAmount?: number | null;
    uiAmountString?: string;
  }>;
};

type DexScreenerPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  pairCreatedAt?: number;
  baseToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  quoteToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  priceUsd?: string;
  liquidity?: {
    usd?: number;
  };
  volume?: {
    h24?: number;
  };
  fdv?: number;
  marketCap?: number;
};

type DexScreenerTokenResponse = {
  pairs?: DexScreenerPair[] | null;
};

function json(payload: LeakScoreTokenDataResponse, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function toNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toPositiveNumber(value: unknown): number | null {
  const numeric = toNumber(value);
  return numeric !== null && numeric > 0 ? numeric : null;
}

function normalizeAddress(value: unknown) {
  return String(value || "").trim();
}

function getSolanaRpcUrl() {
  return String(process.env.LEAK_SCORE_SOLANA_RPC_URL || process.env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC_URL).trim();
}

async function rpc<T>(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "broke-leak-score-token-data",
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

async function fetchDexScreenerPair(tokenAddress: string) {
  const response = await fetch(`${DEXSCREENER_TOKEN_BASE_URL}/${encodeURIComponent(tokenAddress)}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`DEX Screener HTTP ${response.status}`);
  }

  const data = (await response.json()) as DexScreenerTokenResponse;
  const pairs = Array.isArray(data.pairs) ? data.pairs : [];
  const tokenAddressLower = tokenAddress.toLowerCase();
  const solanaPairs = pairs
    .filter((pair) => String(pair.chainId || "").toLowerCase() === "solana")
    .filter((pair) => {
      const base = String(pair.baseToken?.address || "").toLowerCase();
      const quote = String(pair.quoteToken?.address || "").toLowerCase();
      return base === tokenAddressLower || quote === tokenAddressLower;
    })
    .sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0));

  const bestPair = solanaPairs[0] || null;

  if (!bestPair) return null;

  const pairCreatedAtMs = toPositiveNumber(bestPair.pairCreatedAt);
  const pairCreatedAt = pairCreatedAtMs ? new Date(pairCreatedAtMs).toISOString() : null;
  const ageDays = pairCreatedAtMs ? Math.max(0, Math.round((Date.now() - pairCreatedAtMs) / 86400000)) : null;
  const baseMatches = String(bestPair.baseToken?.address || "").toLowerCase() === tokenAddressLower;
  const token = baseMatches ? bestPair.baseToken : bestPair.quoteToken;
  const pair: LeakScoreTokenDataPair = {
    dexId: String(bestPair.dexId || "Unknown DEX"),
    pairAddress: String(bestPair.pairAddress || ""),
    url: String(bestPair.url || ""),
    liquidityUsd: toPositiveNumber(bestPair.liquidity?.usd),
    volume24hUsd: toPositiveNumber(bestPair.volume?.h24),
    marketCapUsd: toPositiveNumber(bestPair.marketCap),
    fdvUsd: toPositiveNumber(bestPair.fdv),
    priceUsd: toPositiveNumber(bestPair.priceUsd),
    pairCreatedAt,
    ageDays,
  };

  return {
    pair,
    tokenName: String(token?.name || "") || null,
    tokenSymbol: String(token?.symbol || "") || null,
  };
}

function parseUiAmount(value?: string | number | null) {
  const numeric = Number(String(value ?? "0"));
  return Number.isFinite(numeric) ? numeric : 0;
}

function buildSuggestedSignals(input: {
  pair: LeakScoreTokenDataPair | null;
  top10ConcentrationPercent: number | null;
}) {
  const suggestedSignals: LeakScoreSignalId[] = [];
  const suggestedSignalNotes: Partial<Record<LeakScoreSignalId, string>> = {};
  const pair = input.pair;

  if (input.top10ConcentrationPercent !== null && input.top10ConcentrationPercent >= 45) {
    suggestedSignals.push("wallet_concentration");
    suggestedSignalNotes.wallet_concentration = `Auto data hint: top 10 token accounts hold about ${input.top10ConcentrationPercent.toFixed(1)}% of visible supply.`;
  }

  if (pair?.liquidityUsd !== null && pair?.liquidityUsd !== undefined && pair.liquidityUsd < 10000) {
    suggestedSignals.push("weak_liquidity");
    suggestedSignalNotes.weak_liquidity = `Auto data hint: detected liquidity is about $${Math.round(pair.liquidityUsd).toLocaleString("en-US")}.`;
  }

  if (pair?.liquidityUsd && pair.volume24hUsd && pair.volume24hUsd / pair.liquidityUsd >= 5) {
    suggestedSignals.push("suspicious_volume");
    suggestedSignalNotes.suspicious_volume = `Auto data hint: 24h volume is more than 5x detected liquidity.`;
  }

  if (pair?.ageDays !== null && pair?.ageDays !== undefined && pair.ageDays <= 2) {
    suggestedSignals.push("rushed_decisions");
    suggestedSignalNotes.rushed_decisions = `Auto data hint: detected pair age is about ${pair.ageDays < 1 ? "<1" : pair.ageDays} day(s).`;
  }

  return {
    suggestedSignals: Array.from(new Set(suggestedSignals)),
    suggestedSignalNotes,
  };
}

async function fetchSolanaLargestAccounts(tokenAddress: string) {
  const rpcUrl = getSolanaRpcUrl();
  const [supplyResult, largestAccountsResult] = await Promise.all([
    rpc<TokenSupplyResult>(rpcUrl, "getTokenSupply", [tokenAddress, { commitment: "confirmed" }]),
    rpc<LargestTokenAccountsResult>(rpcUrl, "getTokenLargestAccounts", [tokenAddress, { commitment: "confirmed" }]),
  ]);

  const supply = parseUiAmount(supplyResult.value?.uiAmountString || supplyResult.value?.uiAmount);
  const accounts = Array.isArray(largestAccountsResult.value) ? largestAccountsResult.value : [];
  const top10Amount = accounts
    .slice(0, 10)
    .reduce((total, account) => total + parseUiAmount(account.uiAmountString || account.uiAmount), 0);
  const top10ConcentrationPercent = supply > 0 ? Math.max(0, Math.min(100, (top10Amount / supply) * 100)) : null;

  return {
    tokenSupply: supplyResult.value?.uiAmountString || supplyResult.value?.amount || null,
    top10ConcentrationPercent,
    largestAccountsCount: accounts.length,
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return json({
        ok: false,
        code: "invalid_json_body",
        error: "Token data request body must be a JSON object.",
      }, 400);
    }

    const body = rawBody as {
      chain?: unknown;
      contractAddress?: unknown;
    };
    const chain = normalizeLeakScoreChainForData(body.chain);
    const tokenAddress = normalizeAddress(body.contractAddress);

    if (chain !== "Solana") {
      return json({
        ok: false,
        code: "unsupported_chain",
        error: "Basic token data fetch currently supports Solana mint addresses only. Manual Leak Research still works for other chains.",
      }, 400);
    }

    if (!tokenAddress) {
      return json({
        ok: false,
        code: "empty_contract_address",
        error: "Paste a Solana mint address before fetching token data.",
      }, 400);
    }

    if (!isLikelySolanaMintAddress(tokenAddress)) {
      return json({
        ok: false,
        code: "invalid_solana_mint",
        error: "Enter a valid Solana mint address before fetching token data.",
      }, 400);
    }

    const warnings: string[] = [];
    const sources: LeakScoreTokenDataSource[] = [];
    let dexData: Awaited<ReturnType<typeof fetchDexScreenerPair>> = null;
    let rpcData: Awaited<ReturnType<typeof fetchSolanaLargestAccounts>> = {
      tokenSupply: null,
      top10ConcentrationPercent: null,
      largestAccountsCount: 0,
    };

    try {
      dexData = await fetchDexScreenerPair(tokenAddress);
      sources.push({
        id: "dexscreener",
        label: "DEX Screener",
        ok: Boolean(dexData?.pair),
        helper: dexData?.pair ? "Best visible Solana pair by detected liquidity." : "No visible Solana DEX pair returned for this mint.",
      });
      if (!dexData?.pair) warnings.push("No DEX Screener pair was found for this mint yet.");
    } catch (error) {
      sources.push({
        id: "dexscreener",
        label: "DEX Screener",
        ok: false,
        helper: error instanceof Error ? error.message : "DEX Screener fetch failed.",
      });
      warnings.push("DEX pair data could not be fetched right now.");
    }

    try {
      rpcData = await fetchSolanaLargestAccounts(tokenAddress);
      sources.push({
        id: "solana_rpc",
        label: "Solana RPC",
        ok: true,
        helper: "Fetched token supply and largest token accounts from Solana RPC.",
      });
    } catch (error) {
      sources.push({
        id: "solana_rpc",
        label: "Solana RPC",
        ok: false,
        helper: error instanceof Error ? error.message : "Solana RPC fetch failed.",
      });
      warnings.push("Solana RPC supply / largest-account data could not be fetched right now.");
    }

    const sourceHealth = getLeakScoreTokenDataSourceHealth(sources);

    warnings.push("Holder count is not shown in v59.46.5 because reliable total holders require an indexer, not public Solana RPC alone.");
    warnings.push("Fetched data is a point-in-time research snapshot. Liquidity, volume, and account concentration can change quickly.");
    if (sourceHealth.sourceHealth === "partial") {
      warnings.push("Source status is partial. Treat automatic hints only as manual research prompts.");
    }
    if (sourceHealth.sourceHealth === "limited") {
      warnings.push("Automatic sources are limited for this mint right now. Do not use this fetch as a decision basis.");
    }

    const suggestions = sourceHealth.sourceHealth === "limited" ? {
      suggestedSignals: [],
      suggestedSignalNotes: {},
    } : buildSuggestedSignals({
      pair: dexData?.pair || null,
      top10ConcentrationPercent: rpcData.top10ConcentrationPercent,
    });

    const data: LeakScoreBasicTokenData = {
      chain,
      tokenAddress,
      tokenName: dexData?.tokenName || null,
      tokenSymbol: dexData?.tokenSymbol || null,
      fetchedAt: new Date().toISOString(),
      pair: dexData?.pair || null,
      tokenSupply: rpcData.tokenSupply,
      top10ConcentrationPercent: rpcData.top10ConcentrationPercent,
      largestAccountsCount: rpcData.largestAccountsCount,
      holdersCount: null,
      holderCountStatus: "unavailable_without_indexer",
      suggestedSignals: suggestions.suggestedSignals,
      suggestedSignalNotes: suggestions.suggestedSignalNotes,
      warnings,
      sources,
      sourceHealth: sourceHealth.sourceHealth,
      sourceHealthLabel: sourceHealth.sourceHealthLabel,
      sourceHealthHelper: sourceHealth.sourceHealthHelper,
    };

    return json({ ok: true, data });
  } catch (error) {
    return json({
      ok: false,
      code: "token_data_fetch_failed",
      error: error instanceof Error ? error.message : "Token data fetch failed.",
    }, 500);
  }
}
