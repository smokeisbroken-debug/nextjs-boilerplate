import type { LeakScoreSignalId } from "./brokeLeakScore";

export const LEAK_SCORE_BASIC_TOKEN_DATA_ROUTE = "/api/leak-score/token-data";
export const LEAK_SCORE_TOKEN_DATA_CACHE_KEY = "broke-leak-score-token-data-cache-v1";
export const LEAK_SCORE_TOKEN_DATA_CACHE_TTL_MS = 10 * 60 * 1000;
export const LEAK_SCORE_TOKEN_DATA_CACHE_MAX_ENTRIES = 12;

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


export type LeakScoreTokenDataCacheEntry = {
  cacheKey: string;
  cachedAt: string;
  data: LeakScoreBasicTokenData;
};

export function getLeakScoreTokenDataCacheKey(chain: unknown, tokenAddress: unknown) {
  return `${normalizeLeakScoreChainForData(chain).toLowerCase()}:${String(tokenAddress || "").trim().toLowerCase()}`;
}

export function getLeakScoreTokenDataCacheAgeMs(entry: Pick<LeakScoreTokenDataCacheEntry, "cachedAt"> | null | undefined, now = Date.now()) {
  const cachedAtMs = new Date(String(entry?.cachedAt || "")).getTime();
  return Number.isFinite(cachedAtMs) ? Math.max(0, now - cachedAtMs) : Number.POSITIVE_INFINITY;
}

export function isLeakScoreTokenDataCacheFresh(entry: Pick<LeakScoreTokenDataCacheEntry, "cachedAt"> | null | undefined, now = Date.now()) {
  return getLeakScoreTokenDataCacheAgeMs(entry, now) <= LEAK_SCORE_TOKEN_DATA_CACHE_TTL_MS;
}

export function formatLeakScoreTokenDataCacheAge(entry: Pick<LeakScoreTokenDataCacheEntry, "cachedAt"> | null | undefined) {
  const ageMs = getLeakScoreTokenDataCacheAgeMs(entry);
  if (!Number.isFinite(ageMs)) return "cache age unavailable";
  const ageSeconds = Math.max(0, Math.round(ageMs / 1000));
  if (ageSeconds < 60) return `${ageSeconds}s old`;
  const ageMinutes = Math.round(ageSeconds / 60);
  if (ageMinutes < 60) return `${ageMinutes}m old`;
  const ageHours = Math.round(ageMinutes / 60);
  return `${ageHours}h old`;
}

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


export type LeakScoreTokenDataMetricTone = "ready" | "caution" | "warning" | "pending";

export type LeakScoreTokenDataMetricCard = {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: LeakScoreTokenDataMetricTone;
};

function getLeakScoreUsdMetricTone(value: number | null | undefined, cautionAt: number, warningBelow: number): LeakScoreTokenDataMetricTone {
  if (!Number.isFinite(value || 0) || !value) return "pending";
  if (value < warningBelow) return "warning";
  if (value < cautionAt) return "caution";
  return "ready";
}

export function buildLeakScoreTokenDataMetricCards(data: LeakScoreBasicTokenData | null): LeakScoreTokenDataMetricCard[] {
  if (!data) return [];

  const liquidity = data.pair?.liquidityUsd ?? null;
  const volume = data.pair?.volume24hUsd ?? null;
  const marketCap = data.pair?.marketCapUsd ?? null;
  const fdv = data.pair?.fdvUsd ?? null;
  const ageDays = data.pair?.ageDays ?? null;
  const concentration = data.top10ConcentrationPercent;

  const volumeLiquidityRatio = Number.isFinite(volume || 0) && Number.isFinite(liquidity || 0) && liquidity
    ? Number(volume || 0) / Number(liquidity || 1)
    : null;

  const concentrationTone: LeakScoreTokenDataMetricTone = !Number.isFinite(concentration || 0) && concentration !== 0
    ? "pending"
    : Number(concentration || 0) >= 50
      ? "warning"
      : Number(concentration || 0) >= 30
        ? "caution"
        : "ready";

  const ageTone: LeakScoreTokenDataMetricTone = !Number.isFinite(ageDays || 0) && ageDays !== 0
    ? "pending"
    : Number(ageDays || 0) < 1
      ? "warning"
      : Number(ageDays || 0) < 7
        ? "caution"
        : "ready";

  const volumeTone: LeakScoreTokenDataMetricTone = !Number.isFinite(volumeLiquidityRatio || 0) || volumeLiquidityRatio === null
    ? "pending"
    : volumeLiquidityRatio > 8
      ? "warning"
      : volumeLiquidityRatio > 3
        ? "caution"
        : "ready";

  return [
    {
      id: "liquidity",
      label: "Liquidity",
      value: formatLeakScoreUsd(liquidity),
      helper: liquidity ? "Visible DEX pair liquidity. Low liquidity can make exits fragile." : "DEX liquidity unavailable from visible pair data.",
      tone: getLeakScoreUsdMetricTone(liquidity, 20000, 5000),
    },
    {
      id: "volume24h",
      label: "24h volume",
      value: formatLeakScoreUsd(volume),
      helper: volumeLiquidityRatio === null
        ? "24h volume unavailable or liquidity missing."
        : `Volume/liquidity ratio: ${volumeLiquidityRatio.toFixed(1)}x. Treat abnormal churn as a manual research prompt.`,
      tone: volumeTone,
    },
    {
      id: "marketCap",
      label: "Market cap",
      value: formatLeakScoreUsd(marketCap),
      helper: marketCap ? "Visible market cap from DEX pair context." : "Market cap unavailable from visible source data.",
      tone: marketCap ? "ready" : "pending",
    },
    {
      id: "fdv",
      label: "FDV",
      value: formatLeakScoreUsd(fdv),
      helper: fdv ? "Fully diluted valuation from visible DEX pair context." : "FDV unavailable from visible source data.",
      tone: fdv ? "ready" : "pending",
    },
    {
      id: "pairAge",
      label: "Pair age",
      value: formatLeakScoreAgeDays(ageDays),
      helper: "Newer pairs require more manual context before emotional buying.",
      tone: ageTone,
    },
    {
      id: "top10",
      label: "Top 10 accounts",
      value: formatLeakScorePercent(concentration),
      helper: "Top token-account concentration from Solana RPC largest-account data, not a full holder map.",
      tone: concentrationTone,
    },
    {
      id: "supply",
      label: "Supply",
      value: data.tokenSupply ? formatLeakScoreNumber(Number(data.tokenSupply)) : "Unavailable",
      helper: "Token supply from Solana RPC when available.",
      tone: data.tokenSupply ? "ready" : "pending",
    },
    {
      id: "holders",
      label: "Holders",
      value: "Indexer needed",
      helper: "Reliable total holders need an indexer. Public RPC alone is not enough.",
      tone: "pending",
    },
  ];
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
