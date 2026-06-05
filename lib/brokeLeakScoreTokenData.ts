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
  requestedAddress?: string | null;
  resolutionSource?: "mint_input" | "dex_pair_address";
  resolutionLabel?: string | null;
  resolutionHelper?: string | null;
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


export type LeakScoreTokenAddressCleanupResult = {
  original: string;
  cleanedAddress: string;
  changed: boolean;
  sourceLabel: string;
  helper: string;
};

const SOLANA_BASE58_ADDRESS_PATTERN = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
const SOLANA_ADDRESS_QUERY_KEYS = new Set([
  "address",
  "addr",
  "mint",
  "token",
  "tokenaddress",
  "contract",
  "contractaddress",
  "ca",
  "inputcurrency",
  "outputcurrency",
]);

function stripLeakScoreAddressNoise(value: string) {
  return value
    .trim()
    .replace(/^['"`]+|['"`,;:.]+$/g, "")
    .replace(/[​-‍﻿]/g, "");
}

function getFirstValidSolanaAddressCandidate(values: string[]) {
  for (const value of values) {
    const candidate = stripLeakScoreAddressNoise(value);
    if (isLikelySolanaMintAddress(candidate)) return candidate;
  }

  return "";
}

export function cleanupLeakScoreTokenAddressInput(value: unknown): LeakScoreTokenAddressCleanupResult {
  const original = String(value || "");
  const trimmed = stripLeakScoreAddressNoise(original);

  if (!trimmed) {
    return {
      original,
      cleanedAddress: "",
      changed: original !== "",
      sourceLabel: "Empty input",
      helper: "Paste a Solana mint address, Solscan token URL, or token page URL.",
    };
  }

  if (isLikelySolanaMintAddress(trimmed)) {
    return {
      original,
      cleanedAddress: trimmed,
      changed: trimmed !== original,
      sourceLabel: trimmed !== original ? "Whitespace cleaned" : "Mint address detected",
      helper: trimmed !== original ? "Extra spaces or punctuation were removed locally." : "Ready as a Solana-format address. Confirm this is the token mint, not a wallet or pair address.",
    };
  }

  const decoded = (() => {
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  })();

  try {
    const parsedUrl = new URL(decoded);
    const queryCandidates: string[] = [];
    parsedUrl.searchParams.forEach((paramValue, paramKey) => {
      if (SOLANA_ADDRESS_QUERY_KEYS.has(paramKey.toLowerCase().replace(/[^a-z]/g, ""))) {
        queryCandidates.push(paramValue);
      }
    });

    const queryAddress = getFirstValidSolanaAddressCandidate(queryCandidates);
    if (queryAddress) {
      return {
        original,
        cleanedAddress: queryAddress,
        changed: queryAddress !== original,
        sourceLabel: "Address extracted from URL",
        helper: "Extracted a mint-like address from the URL query. Confirm it is the token mint before fetching.",
      };
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const markerCandidates: string[] = [];
    for (let index = 0; index < pathParts.length; index += 1) {
      const part = pathParts[index].toLowerCase();
      if (["token", "address", "account", "mint", "tokens"].includes(part) && pathParts[index + 1]) {
        markerCandidates.push(pathParts[index + 1]);
      }
    }

    const markerAddress = getFirstValidSolanaAddressCandidate(markerCandidates);
    if (markerAddress) {
      return {
        original,
        cleanedAddress: markerAddress,
        changed: markerAddress !== original,
        sourceLabel: "Mint extracted from explorer URL",
        helper: "Cleaned a Solscan/Solana explorer-style token URL into a mint-like address.",
      };
    }

    const pathCandidates = pathParts.flatMap((part) => part.match(SOLANA_BASE58_ADDRESS_PATTERN) || []);
    const pathAddress = getFirstValidSolanaAddressCandidate(pathCandidates);
    if (pathAddress) {
      const isDexLike = parsedUrl.hostname.toLowerCase().includes("dexscreener") || parsedUrl.hostname.toLowerCase().includes("dex");
      return {
        original,
        cleanedAddress: pathAddress,
        changed: pathAddress !== original,
        sourceLabel: isDexLike ? "Address extracted from DEX URL" : "Address extracted from URL",
        helper: isDexLike
          ? "DEX URLs can contain pair addresses. Confirm the extracted address is the token mint before fetching."
          : "Extracted a Solana-format address from the pasted URL. Confirm it is the token mint before fetching.",
      };
    }
  } catch {
    // Not a URL; fall through to plain-text extraction.
  }

  const textCandidates = decoded.match(SOLANA_BASE58_ADDRESS_PATTERN) || [];
  const textAddress = getFirstValidSolanaAddressCandidate(textCandidates);
  if (textAddress) {
    return {
      original,
      cleanedAddress: textAddress,
      changed: textAddress !== original,
      sourceLabel: "Address extracted from pasted text",
      helper: "Removed surrounding text and kept the first Solana-format address. Confirm it is the token mint before fetching.",
    };
  }

  return {
    original,
    cleanedAddress: trimmed,
    changed: trimmed !== original,
    sourceLabel: trimmed !== original ? "Paste cleaned" : "No mint extracted",
    helper: "No Solana mint-like address could be extracted. Paste the token mint, not a ticker, website, pair label, or wallet name.",
  };
}

export function getLeakScoreTokenAddressPasteHelper(value: unknown) {
  const result = cleanupLeakScoreTokenAddressInput(value);
  if (!result.cleanedAddress) return result.helper;
  if (result.changed) return `${result.sourceLabel}: ${result.cleanedAddress.slice(0, 4)}…${result.cleanedAddress.slice(-4)}. ${result.helper}`;
  return result.helper;
}

export type LeakScoreTokenDataInputStatus = {
  status: "empty" | "unsupported_chain" | "invalid_mint" | "ready";
  canFetch: boolean;
  label: string;
  helper: string;
};

export function getLeakScoreTokenDataInputStatus(chain: unknown, tokenAddress: unknown): LeakScoreTokenDataInputStatus {
  const normalizedChain = normalizeLeakScoreChainForData(chain);
  const mint = String(tokenAddress || "").trim();

  if (normalizedChain !== "Solana") {
    return {
      status: "unsupported_chain",
      canFetch: false,
      label: "Solana only for now",
      helper: "Basic token data currently supports Solana mint addresses only. You can still use the manual checklist for other chains.",
    };
  }

  if (!mint) {
    return {
      status: "empty",
      canFetch: false,
      label: "Mint address needed",
      helper: "Paste a Solana mint address to fetch liquidity, volume, supply, pair age, and top-account concentration.",
    };
  }

  if (!isLikelySolanaMintAddress(mint)) {
    return {
      status: "invalid_mint",
      canFetch: false,
      label: "Check mint format",
      helper: "This does not look like a Solana mint address. Use the token mint, not a website, ticker, pair URL, or wallet label.",
    };
  }

  return {
    status: "ready",
    canFetch: true,
    label: "Ready to fetch",
    helper: "Read-only check. Nothing is published and no wallet action is required.",
  };
}

export function getLeakScoreTokenDataErrorCopy(code: string | undefined, fallback: string | undefined) {
  switch (code) {
    case "invalid_json_body":
      return "Token data request could not be read. Reload and try again.";
    case "empty_contract_address":
      return "Paste a Solana mint address before fetching token data.";
    case "unsupported_chain":
      return "Basic token data currently supports Solana only. Manual Leak Research still works for other chains.";
    case "invalid_solana_mint":
      return "This does not look like a valid Solana mint address. Paste the token mint, not a ticker, pair URL, website, or wallet name.";
    case "token_data_fetch_failed":
      return fallback || "Token data sources are unavailable right now. Try Force refresh later or continue with manual research.";
    default:
      return fallback || "Basic token data is unavailable right now. Try again later or continue with manual research.";
  }
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

export type LeakScoreTokenDataConfidence = {
  tone: LeakScoreTokenDataMetricTone;
  label: string;
  helper: string;
};

export type LeakScoreTokenDataSourceDetail = {
  id: string;
  status: string;
  label: string;
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

export function getLeakScoreTokenDataConfidence(data: LeakScoreBasicTokenData | null): LeakScoreTokenDataConfidence {
  if (!data) {
    return {
      tone: "pending",
      label: "No context yet",
      helper: "Fetch basic token data or continue with manual research only.",
    };
  }

  const hasPairContext = Boolean(data.pair);
  const hasRpcContext = Number.isFinite(data.top10ConcentrationPercent || 0) || Boolean(data.tokenSupply);

  if (data.sourceHealth === "complete" && hasPairContext && hasRpcContext) {
    return {
      tone: "ready",
      label: "Good context",
      helper: "DEX pair data and Solana RPC context are available. This is still a research snapshot, not a verdict.",
    };
  }

  if (data.sourceHealth === "limited") {
    return {
      tone: "warning",
      label: "Limited context",
      helper: "Automatic sources did not return enough usable context. Continue manually and avoid applying auto hints.",
    };
  }

  return {
    tone: "caution",
    label: "Partial context",
    helper: "Some automatic context is available, but one or more source areas are missing or incomplete.",
  };
}

export function buildLeakScoreTokenDataSourceDetails(data: LeakScoreBasicTokenData | null): LeakScoreTokenDataSourceDetail[] {
  if (!data) return [];

  const details: LeakScoreTokenDataSourceDetail[] = data.sources.map((source) => ({
    id: source.id,
    status: source.ok ? "Connected" : "Limited",
    label: source.label,
    helper: source.helper,
    tone: source.ok ? "ready" : "caution",
  }));

  details.push({
    id: "visible_pair",
    status: data.pair ? "Pair context" : "No pair found",
    label: "Visible DEX pair",
    helper: data.pair
      ? `${data.pair.dexId || "DEX"} pair selected by visible liquidity. Pair age and liquidity come from this source.`
      : "No visible Solana DEX pair was returned. This can happen for new, inactive, or unsupported tokens.",
    tone: data.pair ? "ready" : "caution",
  });

  details.push({
    id: "top_accounts",
    status: Number.isFinite(data.top10ConcentrationPercent || 0) || data.top10ConcentrationPercent === 0 ? "RPC context" : "Unavailable",
    label: "Top account concentration",
    helper: Number.isFinite(data.top10ConcentrationPercent || 0) || data.top10ConcentrationPercent === 0
      ? `Top 10 token accounts: ${formatLeakScorePercent(data.top10ConcentrationPercent)}. This is not a full holder map.`
      : "Largest-account concentration was not available from RPC for this fetch.",
    tone: Number.isFinite(data.top10ConcentrationPercent || 0) || data.top10ConcentrationPercent === 0 ? "ready" : "caution",
  });

  details.push({
    id: "holders_indexer",
    status: "Indexer needed",
    label: "Total holders",
    helper: "Reliable total holder count needs an indexer. Public Solana RPC alone is intentionally not treated as enough.",
    tone: "pending",
  });

  return details;
}

export function formatLeakScoreTokenDataFreshness(data: LeakScoreBasicTokenData | null, cacheMode?: "live" | "cache" | "cleared" | "") {
  if (!data) return "No source snapshot";
  const prefix = cacheMode === "cache" ? "Cached snapshot" : cacheMode === "live" ? "Live snapshot" : "Source snapshot";
  return `${prefix} · ${formatLeakScoreFetchedAt(data.fetchedAt)}`;
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
