import type { LeakScoreSignalId } from "./brokeLeakScore";

export const LEAK_SCORE_BASIC_TOKEN_DATA_ROUTE = "/api/leak-score/token-data";

export type LeakScoreTokenDataSourceId = "dexscreener" | "solana_rpc";
export type LeakScoreTokenDataSourceHealth = "complete" | "partial" | "limited";

export type LeakScoreTokenDataSource = {
  id: LeakScoreTokenDataSourceId;
  label: string;
  ok: boolean;
  helper: string;
};

export type LeakScoreTokenDataPair = {
  dexId: string;
  pairAddress: string;
  url: string;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  priceUsd: number | null;
  pairCreatedAt: string | null;
  ageDays: number | null;
};

export type LeakScoreBasicTokenData = {
  chain: string;
  tokenAddress: string;
  tokenName: string | null;
  tokenSymbol: string | null;
  fetchedAt: string;
  pair: LeakScoreTokenDataPair | null;
  tokenSupply: string | null;
  top10ConcentrationPercent: number | null;
  largestAccountsCount: number;
  holdersCount: number | null;
  holderCountStatus: "unavailable_without_indexer" | "not_requested";
  suggestedSignals: LeakScoreSignalId[];
  suggestedSignalNotes: Partial<Record<LeakScoreSignalId, string>>;
  warnings: string[];
  sources: LeakScoreTokenDataSource[];
  sourceHealth: LeakScoreTokenDataSourceHealth;
  sourceHealthLabel: string;
  sourceHealthHelper: string;
};

export type LeakScoreTokenDataResponse = {
  ok: boolean;
  code?: string;
  error?: string;
  data?: LeakScoreBasicTokenData;
};

export function isLikelySolanaMintAddress(value: unknown) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(value || "").trim());
}

export function normalizeLeakScoreChainForData(value: unknown) {
  const normalized = String(value || "Solana").trim().toLowerCase();
  if (normalized === "sol" || normalized === "solana") return "Solana";
  if (normalized === "eth" || normalized === "ethereum") return "Ethereum";
  if (normalized === "bsc" || normalized === "bnb" || normalized === "binance") return "BSC";
  if (normalized === "base") return "Base";
  return String(value || "Other").trim() || "Other";
}

export function formatLeakScoreUsd(value: number | null | undefined) {
  if (!Number.isFinite(value || 0) || !value) return "Unavailable";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export function formatLeakScoreNumber(value: number | null | undefined) {
  if (!Number.isFinite(value || 0) || !value) return "Unavailable";

  return new Intl.NumberFormat("en-US", {
    notation: value >= 100000 ? "compact" : "standard",
    maximumFractionDigits: value >= 100000 ? 2 : 0,
  }).format(value);
}

export function formatLeakScorePercent(value: number | null | undefined) {
  if (!Number.isFinite(value || 0) && value !== 0) return "Unavailable";

  return `${Number(value || 0).toFixed(1)}%`;
}

export function formatLeakScoreAgeDays(value: number | null | undefined) {
  if (!Number.isFinite(value || 0) || value === null || value === undefined) return "Unavailable";
  if (value < 1) return "<1 day";
  if (value === 1) return "1 day";
  return `${Math.round(value)} days`;
}

export function summarizeLeakScoreTokenData(data: LeakScoreBasicTokenData | null) {
  if (!data) return "No token data fetched yet.";

  const pair = data.pair;
  const pieces = [
    `Liquidity: ${formatLeakScoreUsd(pair?.liquidityUsd)}`,
    `24h volume: ${formatLeakScoreUsd(pair?.volume24hUsd)}`,
    `Market cap: ${formatLeakScoreUsd(pair?.marketCapUsd)}`,
    `Top 10 concentration: ${formatLeakScorePercent(data.top10ConcentrationPercent)}`,
  ];

  return pieces.join(" · ");
}


export function getLeakScoreTokenDataSourceHealth(sources: LeakScoreTokenDataSource[]) {
  const okCount = sources.filter((source) => source.ok).length;
  const total = sources.length || 2;

  if (okCount >= total && total > 0) {
    return {
      sourceHealth: "complete" as const,
      sourceHealthLabel: "Sources complete",
      sourceHealthHelper: "DEX pair data and Solana RPC account data both responded. Still treat this as a point-in-time research snapshot.",
    };
  }

  if (okCount > 0) {
    return {
      sourceHealth: "partial" as const,
      sourceHealthLabel: "Partial source data",
      sourceHealthHelper: "At least one source responded, but the automatic context is incomplete. Use it only as a manual research prompt.",
    };
  }

  return {
    sourceHealth: "limited" as const,
    sourceHealthLabel: "Sources limited",
    sourceHealthHelper: "Automatic sources did not return usable data. Do not apply leak-signal hints from this fetch.",
  };
}

export function formatLeakScoreFetchedAt(value: string | null | undefined) {
  const timestamp = new Date(String(value || "")).getTime();
  if (!Number.isFinite(timestamp)) return "Fetch time unavailable";

  return `Fetched ${new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function isLeakScoreTokenDataLimited(data: LeakScoreBasicTokenData | null | undefined) {
  return !data || data.sourceHealth === "limited";
}
