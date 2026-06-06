import type { LeakScoreBasicTokenData } from "./brokeLeakScoreTokenData";
import {
  cleanupLeakScoreTokenAddressInput,
  formatLeakScoreAgeDays,
  formatLeakScorePercent,
  formatLeakScoreUsd,
  isLikelySolanaMintAddress,
} from "./brokeLeakScoreTokenData";
import type { WalletLeakBasicData } from "./brokeWalletLeakData";
import {
  cleanupWalletLeakAddressInput,
  formatWalletLeakSol,
  formatWalletLeakTokenAmount,
  isLikelySolanaWalletAddress,
} from "./brokeWalletLeakData";

export const UNIVERSAL_LEAK_CHECK_SHARE_CARD_FILE_NAME = "broke-universal-leak-check-card.png";

export type UniversalLeakCheckKind = "token" | "wallet" | "unknown";
export type UniversalLeakCheckSourceConfidence = "strong" | "medium" | "limited";
export type UniversalLeakSignalSeverity = "low" | "medium" | "high";

export type UniversalLeakCheckInput = {
  original: string;
  cleanedAddress: string;
  kind: UniversalLeakCheckKind;
  sourceLabel: string;
  helper: string;
  detectedLabel: string;
  sourceHost: string;
  addressCount: number;
  firstUseTip: string;
};

export type UniversalLeakSignal = {
  id: string;
  label: string;
  severity: UniversalLeakSignalSeverity;
  evidence: string;
  action: string;
};

export type UniversalLeakRiskLevel = "watch" | "caution" | "danger";

export type UniversalLeakDanger = {
  id: string;
  title: string;
  riskLevel: UniversalLeakRiskLevel;
  plain: string;
  whyDangerous: string;
  checkNext: string;
};

export type UniversalLeakCheckMetric = {
  id: string;
  label: string;
  value: string;
  helper: string;
};

export type UniversalLeakCheckResultBase = {
  kind: Exclude<UniversalLeakCheckKind, "unknown">;
  title: string;
  address: string;
  pressure: number;
  pressureLabel: string;
  confidence: UniversalLeakCheckSourceConfidence;
  confidenceLabel: string;
  summary: string;
  decisionLabel: string;
  decisionSummary: string;
  dangerousLeaks: UniversalLeakDanger[];
  metrics: UniversalLeakCheckMetric[];
  signals: UniversalLeakSignal[];
  actions: string[];
  warnings: string[];
  fetchedAt: string;
};

export type UniversalTokenLeakCheckResult = UniversalLeakCheckResultBase & {
  kind: "token";
  tokenData: LeakScoreBasicTokenData;
};

export type UniversalWalletLeakCheckResult = UniversalLeakCheckResultBase & {
  kind: "wallet";
  walletData: WalletLeakBasicData;
};

export type UniversalLeakCheckResult = UniversalTokenLeakCheckResult | UniversalWalletLeakCheckResult;

export type UniversalLeakCheckAutoSummary = {
  label: string;
  headline: string;
  mainLeak: string;
  meaning: string;
  nextStep: string;
  topSignals: string[];
};

const SOLANA_BASE58_ADDRESS_PATTERN = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
const TOKEN_URL_MARKERS = new Set(["token", "tokens", "mint", "pair", "pairs", "dex", "chart"]);
const WALLET_URL_MARKERS = new Set(["wallet", "owner", "holder", "account", "address"]);

function cleanText(input: unknown, maxLength = 140) {
  return String(input || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}


function tryDecodeText(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractFirstUrl(value: string) {
  const direct = value.trim();
  try {
    return new URL(direct).toString();
  } catch {
    // Continue with text extraction.
  }

  const match = value.match(/https?:\/\/[^\s"'<>]+/i);
  if (!match) return "";

  try {
    return new URL(match[0].replace(/[),.;]+$/g, "")).toString();
  } catch {
    return "";
  }
}

function getSolanaAddressCandidates(value: string) {
  const matches = value.match(SOLANA_BASE58_ADDRESS_PATTERN) || [];
  return Array.from(new Set(matches.filter((candidate) => isLikelySolanaMintAddress(candidate) || isLikelySolanaWalletAddress(candidate))));
}

function looksLikeSensitiveSecret(value: string) {
  const lower = value.toLowerCase();
  if (/private\s*key|seed\s*phrase|secret\s*key|mnemonic/.test(lower)) return true;
  if (/https?:\/\//i.test(value) || SOLANA_BASE58_ADDRESS_PATTERN.test(value)) {
    SOLANA_BASE58_ADDRESS_PATTERN.lastIndex = 0;
    return false;
  }
  SOLANA_BASE58_ADDRESS_PATTERN.lastIndex = 0;
  const words = lower.split(/\s+/).filter((word) => /^[a-z]+$/.test(word));
  return words.length >= 12 && words.length <= 30;
}

function getUrlContext(value: string) {
  const urlText = extractFirstUrl(value);
  if (!urlText) {
    return { urlText: "", host: "", markers: [] as string[], sourceHint: "" as UniversalLeakCheckKind };
  }

  try {
    const parsed = new URL(urlText);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const pieces = [host, ...pathParts, ...Array.from(parsed.searchParams.keys())];
    const markers = pieces
      .map((piece) => piece.toLowerCase().replace(/[^a-z]/g, ""))
      .filter(Boolean);

    const tokenHost = /dexscreener|birdeye|jup\.ag|jupiter|raydium|geckoterminal|dexlab|meteora/.test(host);
    const explorerHost = /solscan|solanafm|explorer\.solana|xray/.test(host);
    const path = pathParts.map((part) => part.toLowerCase()).join("/");

    const sourceHint: UniversalLeakCheckKind = tokenHost || /token|tokens|mint|pair|pairs|swap/.test(path)
      ? "token"
      : explorerHost && /account|address|wallet|owner|holder/.test(path)
        ? "wallet"
        : "unknown";

    return { urlText, host, markers, sourceHint };
  } catch {
    return { urlText: "", host: "", markers: [] as string[], sourceHint: "" as UniversalLeakCheckKind };
  }
}

function getUniversalInputTip(kind: UniversalLeakCheckKind, sourceHost: string, addressCount: number) {
  if (kind === "token") {
    const hostCopy = sourceHost ? ` from ${sourceHost}` : "";
    return `Token-like input${hostCopy} detected. The app checks liquidity, pair context, supply, concentration, and volume signals.`;
  }

  if (kind === "wallet") {
    const hostCopy = sourceHost ? ` from ${sourceHost}` : "";
    return `Wallet-like input${hostCopy} detected. The app checks read-only public wallet context only.`;
  }

  if (addressCount > 1) {
    return "Multiple Solana-format addresses were found. The app uses the first detected address and checks the strongest matching path.";
  }

  return "Raw Solana address detected. It can be a token mint, wallet, or pair address, so the app will auto-detect the useful path.";
}

function normalizePressure(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getPressureLabel(pressure: number) {
  if (pressure >= 70) return "High leak pressure";
  if (pressure >= 40) return "Medium leak pressure";
  if (pressure >= 15) return "Low / watch leak pressure";
  return "Limited visible pressure";
}

function getSignalWeight(severity: UniversalLeakSignalSeverity) {
  if (severity === "high") return 28;
  if (severity === "medium") return 16;
  return 8;
}

function formatMultiplier(value: number | null | undefined) {
  if (!Number.isFinite(value || 0) || value === null || value === undefined) return "Unavailable";
  return `${Number(value).toFixed(value >= 10 ? 0 : 1)}x`;
}

function shortAddress(value: string | null | undefined) {
  const text = String(value || "").trim();
  if (text.length <= 12) return text || "Unavailable";
  return `${text.slice(0, 4)}…${text.slice(-4)}`;
}

function buildDecisionLabel(pressure: number, dangerCount: number) {
  if (pressure >= 70 || dangerCount >= 2) return "High caution";
  if (pressure >= 40 || dangerCount >= 1) return "Slow down";
  if (pressure >= 15) return "Research first";
  return "No major auto leak";
}

function buildDecisionSummary(kind: UniversalLeakCheckKind, pressure: number, dangerousLeaks: UniversalLeakDanger[]) {
  if (dangerousLeaks.some((item) => item.riskLevel === "danger")) {
    return kind === "token"
      ? "The automatic token check found one or more dangerous leak patterns. Treat this as a stop-and-verify result before any buy decision."
      : "The automatic wallet check found a high-pressure public-context pattern. Treat this as a wallet hygiene review prompt, not a wallet judgment.";
  }

  if (pressure >= 40 || dangerousLeaks.length) {
    return kind === "token"
      ? "The token has visible caution signals. It may still be legitimate, but the leak-risk context needs manual confirmation."
      : "The wallet snapshot has caution signals around gas runway, exposure breadth, account clutter, or source limits. Use them as cleanup/review prompts only.";
  }

  return kind === "token"
    ? "No major automatic token leak was visible from the available snapshot. This does not make the project safe; it only means the basic auto-check did not find a strong red flag."
    : "No major wallet-context leak was visible from the available public snapshot. This does not show PnL, trade timing, token quality, or intent.";
}

function getFirstSolanaAddress(value: string) {
  const candidates = value.match(SOLANA_BASE58_ADDRESS_PATTERN) || [];
  return candidates.find((candidate) => isLikelySolanaMintAddress(candidate)) || "";
}

function getUrlMarkers(value: string) {
  try {
    const parsed = new URL(value);
    const pieces = [
      parsed.hostname,
      ...parsed.pathname.split("/"),
      ...Array.from(parsed.searchParams.keys()),
    ];
    return pieces
      .map((piece) => piece.toLowerCase().replace(/[^a-z]/g, ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function normalizeUniversalLeakCheckInput(value: unknown): UniversalLeakCheckInput {
  const original = String(value || "");
  const cleanedOriginal = cleanText(original, 1200);
  const decodedInput = tryDecodeText(cleanedOriginal);

  const baseEmpty = {
    original,
    cleanedAddress: "",
    kind: "unknown" as UniversalLeakCheckKind,
    sourceLabel: "Empty input",
    helper: "Paste a token mint, public wallet, DEX Screener/Birdeye/Jupiter/Raydium URL, Solscan URL, or text containing a Solana address.",
    detectedLabel: "Waiting for input",
    sourceHost: "",
    addressCount: 0,
    firstUseTip: "Start with a token mint, wallet address, or supported URL. Do not paste private keys or seed phrases.",
  };

  if (!cleanedOriginal) return baseEmpty;

  if (looksLikeSensitiveSecret(decodedInput)) {
    return {
      ...baseEmpty,
      original,
      sourceLabel: "Sensitive input blocked",
      helper: "Never paste seed phrases, private keys, or secret keys. Universal Check only needs public token, wallet, or URL input.",
      detectedLabel: "Blocked for safety",
      firstUseTip: "Use public context only: token mint, public wallet, or public token/wallet URL.",
    };
  }

  const tokenCleanup = cleanupLeakScoreTokenAddressInput(decodedInput);
  const walletCleanup = cleanupWalletLeakAddressInput(decodedInput);
  const urlContext = getUrlContext(decodedInput);
  const markers = urlContext.markers.length ? urlContext.markers : getUrlMarkers(decodedInput);
  const addressCandidates = getSolanaAddressCandidates(decodedInput);
  const looksTokenUrl = urlContext.sourceHint === "token"
    || markers.some((marker) => TOKEN_URL_MARKERS.has(marker))
    || /dexscreener|birdeye|jup\.ag|jupiter|raydium|geckoterminal|dexlab|meteora/i.test(decodedInput);
  const looksWalletUrl = urlContext.sourceHint === "wallet"
    || markers.some((marker) => WALLET_URL_MARKERS.has(marker))
    || /wallet|holder|owner|account/i.test(decodedInput);
  const address = tokenCleanup.cleanedAddress || walletCleanup.cleanedAddress || getFirstSolanaAddress(decodedInput);
  const addressCount = addressCandidates.length || (address ? 1 : 0);

  if (!address) {
    const isUrlLike = Boolean(urlContext.urlText) || /^https?:\/\//i.test(decodedInput);
    return {
      original,
      cleanedAddress: cleanedOriginal,
      kind: "unknown",
      sourceLabel: isUrlLike ? "URL detected, no Solana address found" : "No Solana address extracted",
      helper: isUrlLike
        ? "The URL was recognized, but no Solana-format address was found. Paste a token/wallet page URL that includes the address, or paste the address directly."
        : "The app could not extract a Solana-format address. Use a mint, public wallet, supported explorer URL, or text that includes the address.",
      detectedLabel: isUrlLike ? "Unsupported URL format" : "Unknown input",
      sourceHost: urlContext.host,
      addressCount: 0,
      firstUseTip: "Use the full token/wallet address or a supported URL from Solscan, DEX Screener, Birdeye, Jupiter, or Raydium.",
    };
  }

  if (looksTokenUrl && !looksWalletUrl) {
    const cleanedAddress = tokenCleanup.cleanedAddress || address;
    return {
      original,
      cleanedAddress,
      kind: "token",
      sourceLabel: tokenCleanup.sourceLabel || (urlContext.host ? `Token URL · ${urlContext.host}` : "Token-like input detected"),
      helper: getUniversalInputTip("token", urlContext.host, addressCount),
      detectedLabel: "Token / pair input",
      sourceHost: urlContext.host,
      addressCount,
      firstUseTip: "The token path will explain liquidity pressure, holder concentration, fresh-pair risk, volume/liquidity imbalance, and source blind spots.",
    };
  }

  if (looksWalletUrl && !looksTokenUrl) {
    const cleanedAddress = walletCleanup.cleanedAddress || address;
    return {
      original,
      cleanedAddress,
      kind: "wallet",
      sourceLabel: walletCleanup.sourceLabel || (urlContext.host ? `Wallet URL · ${urlContext.host}` : "Wallet-like input detected"),
      helper: getUniversalInputTip("wallet", urlContext.host, addressCount),
      detectedLabel: "Public wallet input",
      sourceHost: urlContext.host,
      addressCount,
      firstUseTip: "The wallet path uses public RPC context only: SOL balance, token-account count, visible exposure, gas runway, and clutter prompts.",
    };
  }

  const sourceLabel = addressCount > 1
    ? "Multiple Solana addresses detected"
    : urlContext.host
      ? `Solana address extracted from ${urlContext.host}`
      : "Solana address detected";

  return {
    original,
    cleanedAddress: address,
    kind: "unknown",
    sourceLabel,
    helper: getUniversalInputTip("unknown", urlContext.host, addressCount),
    detectedLabel: "Auto-detect path",
    sourceHost: urlContext.host,
    addressCount,
    firstUseTip: "Auto-detect checks token and wallet routes when the address type is not obvious, then shows the stronger evidence path.",
  };
}

export function getUniversalLeakCheckInputStatus(input: UniversalLeakCheckInput) {
  if (!input.cleanedAddress) {
    return {
      canCheck: false,
      label: input.detectedLabel || "Paste something to check",
      helper: input.helper,
    };
  }

  if (!isLikelySolanaMintAddress(input.cleanedAddress) && !isLikelySolanaWalletAddress(input.cleanedAddress)) {
    return {
      canCheck: false,
      label: input.detectedLabel || "Unsupported input",
      helper: input.helper,
    };
  }

  return {
    canCheck: true,
    label: input.kind === "token" ? "Ready · token path" : input.kind === "wallet" ? "Ready · wallet path" : "Ready · auto-detect path",
    helper: input.helper,
  };
}

export function buildTokenAutoSignals(data: LeakScoreBasicTokenData): UniversalLeakSignal[] {
  const signals: UniversalLeakSignal[] = [];
  const liquidity = data.pair?.liquidityUsd ?? null;
  const volume = data.pair?.volume24hUsd ?? null;
  const ageDays = data.pair?.ageDays ?? null;
  const marketCap = data.pair?.marketCapUsd ?? null;
  const fdv = data.pair?.fdvUsd ?? null;
  const price = data.pair?.priceUsd ?? null;
  const valuation = marketCap || fdv || null;
  const concentration = data.top10ConcentrationPercent;
  const volumeLiquidityRatio = liquidity && volume ? volume / Math.max(liquidity, 1) : null;
  const valuationLiquidityRatio = liquidity && valuation ? valuation / Math.max(liquidity, 1) : null;
  const freshPair = ageDays !== null && ageDays <= 7;
  const veryFreshPair = ageDays !== null && ageDays <= 1;
  const weakLiquidity = liquidity !== null && liquidity < 20000;
  const veryWeakLiquidity = liquidity !== null && liquidity < 5000;
  const highConcentration = concentration !== null && concentration >= 45;
  const extremeConcentration = concentration !== null && concentration >= 70;

  if (liquidity !== null && liquidity < 5000) {
    signals.push({
      id: "very_weak_liquidity",
      label: "Very weak liquidity",
      severity: "high",
      evidence: `Visible liquidity is ${formatLeakScoreUsd(liquidity)}.`,
      action: "Check depth, lock/LP context, and avoid emotional size before acting.",
    });
  } else if (liquidity !== null && liquidity < 20000) {
    signals.push({
      id: "weak_liquidity",
      label: "Weak liquidity",
      severity: "medium",
      evidence: `Visible liquidity is ${formatLeakScoreUsd(liquidity)}.`,
      action: "Treat exits as fragile until liquidity context improves.",
    });
  } else if (liquidity === null) {
    signals.push({
      id: "liquidity_unavailable",
      label: "Liquidity unavailable",
      severity: "medium",
      evidence: "No visible liquidity was returned from the selected DEX source.",
      action: "Find a verified pair before making any decision from chart movement.",
    });
  }

  if (concentration !== null && concentration >= 70) {
    signals.push({
      id: "extreme_top10_concentration",
      label: "Extreme top-10 concentration",
      severity: "high",
      evidence: `Top 10 token accounts hold about ${formatLeakScorePercent(concentration)} of visible supply.`,
      action: "Verify team/treasury/CEX/pool wallet context before treating this as organic distribution.",
    });
  } else if (concentration !== null && concentration >= 45) {
    signals.push({
      id: "high_top10_concentration",
      label: "High top-10 concentration",
      severity: "medium",
      evidence: `Top 10 token accounts hold about ${formatLeakScorePercent(concentration)} of visible supply.`,
      action: "Review holder distribution and known wallet labels before trusting the holder map.",
    });
  }

  if (!data.pair) {
    signals.push({
      id: "no_visible_pair",
      label: "No visible DEX pair",
      severity: "medium",
      evidence: "DEX source did not return a visible Solana pair for this mint.",
      action: "Confirm the correct mint and pair before reading price or volume as real context.",
    });
  }

  if (ageDays !== null && ageDays <= 1) {
    signals.push({
      id: "new_pair",
      label: "Very young pair",
      severity: "medium",
      evidence: `Detected pair age is ${formatLeakScoreAgeDays(ageDays)}.`,
      action: "Slow down; new pairs need more verification than old established markets.",
    });
  } else if (ageDays !== null && ageDays <= 7) {
    signals.push({
      id: "recent_pair",
      label: "Recent pair",
      severity: "low",
      evidence: `Detected pair age is ${formatLeakScoreAgeDays(ageDays)}.`,
      action: "Check whether updates, liquidity, and community activity match the narrative.",
    });
  }

  if (volumeLiquidityRatio !== null && volumeLiquidityRatio >= 8) {
    signals.push({
      id: "extreme_volume_liquidity_imbalance",
      label: "Extreme volume/liquidity imbalance",
      severity: "high",
      evidence: `24h volume is about ${volumeLiquidityRatio.toFixed(1)}x detected liquidity.`,
      action: "Review wash-trading risk, routing, and whether the volume is sustainable.",
    });
  } else if (volumeLiquidityRatio !== null && volumeLiquidityRatio >= 3) {
    signals.push({
      id: "volume_liquidity_imbalance",
      label: "Volume/liquidity imbalance",
      severity: "medium",
      evidence: `24h volume is about ${volumeLiquidityRatio.toFixed(1)}x detected liquidity.`,
      action: "Check whether volume comes from real demand or short-lived churn.",
    });
  }

  if (valuationLiquidityRatio !== null && valuationLiquidityRatio >= 100) {
    signals.push({
      id: "extreme_valuation_liquidity_gap",
      label: "Extreme valuation/liquidity gap",
      severity: "high",
      evidence: `Visible valuation is about ${formatMultiplier(valuationLiquidityRatio)} detected liquidity.`,
      action: "Check whether market cap/FDV can actually be exited through available liquidity.",
    });
  } else if (valuationLiquidityRatio !== null && valuationLiquidityRatio >= 30) {
    signals.push({
      id: "valuation_liquidity_gap",
      label: "Valuation/liquidity gap",
      severity: "medium",
      evidence: `Visible valuation is about ${formatMultiplier(valuationLiquidityRatio)} detected liquidity.`,
      action: "Do not treat headline market cap as exit depth; compare it with real liquidity.",
    });
  }

  if (veryWeakLiquidity && freshPair) {
    signals.push({
      id: "fresh_pair_tiny_liquidity_combo",
      label: "Fresh pair + tiny liquidity",
      severity: "high",
      evidence: `Pair age is ${formatLeakScoreAgeDays(ageDays)} and liquidity is ${formatLeakScoreUsd(liquidity)}.`,
      action: "This is a dangerous entry context. Verify liquidity, lock status, and official source links before touching it.",
    });
  } else if (weakLiquidity && veryFreshPair) {
    signals.push({
      id: "new_pair_weak_liquidity_combo",
      label: "New pair + weak liquidity",
      severity: "medium",
      evidence: `Pair age is ${formatLeakScoreAgeDays(ageDays)} and liquidity is ${formatLeakScoreUsd(liquidity)}.`,
      action: "Slow down and wait for stronger market context instead of reacting to launch momentum.",
    });
  }

  if (freshPair && extremeConcentration) {
    signals.push({
      id: "fresh_pair_extreme_concentration_combo",
      label: "Fresh pair + extreme concentration",
      severity: "high",
      evidence: `Pair age is ${formatLeakScoreAgeDays(ageDays)} and top 10 accounts hold ${formatLeakScorePercent(concentration)}.`,
      action: "Check whether concentrated wallets are known/locked. Unknown concentration on a fresh pair is a major leak-risk pattern.",
    });
  } else if (freshPair && highConcentration) {
    signals.push({
      id: "fresh_pair_high_concentration_combo",
      label: "Fresh pair + high concentration",
      severity: "medium",
      evidence: `Pair age is ${formatLeakScoreAgeDays(ageDays)} and top 10 accounts hold ${formatLeakScorePercent(concentration)}.`,
      action: "Require wallet-label context before assuming the supply is fairly distributed.",
    });
  }

  if (data.pair && price === null) {
    signals.push({
      id: "price_unavailable",
      label: "Price context unavailable",
      severity: "low",
      evidence: "A pair was visible, but price data was unavailable from the selected source.",
      action: "Check another source before trusting chart screenshots or copied market-cap claims.",
    });
  }

  if (data.pair && !marketCap && !fdv) {
    signals.push({
      id: "valuation_unavailable",
      label: "Valuation unavailable",
      severity: "low",
      evidence: "Market cap and FDV were not returned by the visible pair source.",
      action: "Avoid decisions based only on social hype when valuation context is missing.",
    });
  }

  if (!data.tokenSupply) {
    signals.push({
      id: "supply_unavailable",
      label: "Supply unavailable",
      severity: "low",
      evidence: "Solana RPC did not return usable token supply for this check.",
      action: "Confirm the mint and token supply on another explorer before relying on concentration or valuation context.",
    });
  }

  if (data.sourceHealth === "limited") {
    signals.push({
      id: "limited_sources",
      label: "Limited automatic sources",
      severity: "medium",
      evidence: data.sourceHealthHelper,
      action: "Do not use the automatic score alone; continue manual research first.",
    });
  } else if (data.sourceHealth === "partial") {
    signals.push({
      id: "partial_sources",
      label: "Partial automatic sources",
      severity: "low",
      evidence: data.sourceHealthHelper,
      action: "Use the result as a research prompt, not a verdict.",
    });
  }

  return signals;
}

function buildTokenDangerExplanations(data: LeakScoreBasicTokenData, signals: UniversalLeakSignal[]): UniversalLeakDanger[] {
  const ids = new Set(signals.map((signal) => signal.id));
  const leaks: UniversalLeakDanger[] = [];
  const liquidity = data.pair?.liquidityUsd ?? null;
  const concentration = data.top10ConcentrationPercent;
  const ageDays = data.pair?.ageDays ?? null;
  const marketCap = data.pair?.marketCapUsd ?? null;
  const fdv = data.pair?.fdvUsd ?? null;
  const valuation = marketCap || fdv || null;
  const volume = data.pair?.volume24hUsd ?? null;
  const volumeLiquidityRatio = liquidity && volume ? volume / Math.max(liquidity, 1) : null;
  const valuationLiquidityRatio = liquidity && valuation ? valuation / Math.max(liquidity, 1) : null;

  if (ids.has("fresh_pair_tiny_liquidity_combo") || ids.has("very_weak_liquidity") || ids.has("liquidity_unavailable")) {
    leaks.push({
      id: "exit_depth_leak",
      title: "Exit-depth leak",
      riskLevel: ids.has("fresh_pair_tiny_liquidity_combo") || ids.has("very_weak_liquidity") ? "danger" : "caution",
      plain: liquidity === null
        ? "The app could not confirm usable liquidity from the automatic source."
        : `Detected liquidity is only ${formatLeakScoreUsd(liquidity)}.`,
      whyDangerous: "A chart can look active while real exit depth is thin. Small liquidity can turn one emotional buy into a hard-to-exit position.",
      checkNext: "Check LP depth, lock/burn context, route size impact, and whether the visible pair is the official pair.",
    });
  }

  if (ids.has("fresh_pair_extreme_concentration_combo") || ids.has("extreme_top10_concentration") || ids.has("high_top10_concentration")) {
    leaks.push({
      id: "supply_control_leak",
      title: "Supply-control leak",
      riskLevel: ids.has("fresh_pair_extreme_concentration_combo") || ids.has("extreme_top10_concentration") ? "danger" : "caution",
      plain: concentration === null
        ? "Top-wallet concentration could not be confirmed."
        : `Top 10 token accounts hold about ${formatLeakScorePercent(concentration)} of visible supply.`,
      whyDangerous: "Concentrated supply can mean a few wallets have enough control to move price, drain liquidity, or dominate future selling pressure.",
      checkNext: "Label the top wallets: team, treasury, LP, CEX, burned, locked, or unknown. Unknown large wallets are the part to fear.",
    });
  }

  if (ids.has("new_pair") || ids.has("recent_pair") || ids.has("new_pair_weak_liquidity_combo") || ids.has("fresh_pair_tiny_liquidity_combo")) {
    leaks.push({
      id: "freshness_leak",
      title: "Freshness leak",
      riskLevel: ids.has("fresh_pair_tiny_liquidity_combo") || ids.has("new_pair_weak_liquidity_combo") ? "danger" : "watch",
      plain: `Detected pair age is ${formatLeakScoreAgeDays(ageDays)}.`,
      whyDangerous: "New pairs have less history. The first candles often show hype, not durable demand, distribution quality, or real community strength.",
      checkNext: "Verify official links, token age, update history, deployer/authority context, and whether early volume is organic.",
    });
  }

  if (ids.has("extreme_volume_liquidity_imbalance") || ids.has("volume_liquidity_imbalance")) {
    leaks.push({
      id: "churn_leak",
      title: "Volume-churn leak",
      riskLevel: ids.has("extreme_volume_liquidity_imbalance") ? "danger" : "caution",
      plain: `24h volume is about ${formatMultiplier(volumeLiquidityRatio)} detected liquidity.`,
      whyDangerous: "High volume on low liquidity can be real demand, but it can also be churn, routing noise, or short-lived attention that disappears when you enter.",
      checkNext: "Compare trades, makers, volume across sources, and whether liquidity grew with volume or only volume spiked.",
    });
  }

  if (ids.has("extreme_valuation_liquidity_gap") || ids.has("valuation_liquidity_gap")) {
    leaks.push({
      id: "headline_valuation_leak",
      title: "Headline-valuation leak",
      riskLevel: ids.has("extreme_valuation_liquidity_gap") ? "danger" : "caution",
      plain: `Visible valuation is about ${formatMultiplier(valuationLiquidityRatio)} detected liquidity.`,
      whyDangerous: "Market cap and FDV are not exit liquidity. A large headline number with shallow liquidity can create fake confidence.",
      checkNext: "Compare FDV/market cap with pool depth, holder distribution, and realistic trade-size impact.",
    });
  }

  if (ids.has("limited_sources") || ids.has("partial_sources") || ids.has("no_visible_pair")) {
    leaks.push({
      id: "source_blind_spot_leak",
      title: "Source blind-spot leak",
      riskLevel: ids.has("limited_sources") || ids.has("no_visible_pair") ? "caution" : "watch",
      plain: data.sourceHealthHelper,
      whyDangerous: "Missing data is not safety. It only means the automatic check has less context and can miss important risk.",
      checkNext: "Confirm the mint, official pair, explorer data, liquidity, top wallets, and links manually before trusting the result.",
    });
  }

  return leaks.slice(0, 5);
}

function buildWalletDangerExplanations(data: WalletLeakBasicData, signals: UniversalLeakSignal[]): UniversalLeakDanger[] {
  const ids = new Set(signals.map((signal) => signal.id));
  const leaks: UniversalLeakDanger[] = [];
  const totalAccounts = data.tokenAccountsCount;
  const nonZeroAccounts = data.nonZeroTokenAccountsCount;
  const emptyAccounts = totalAccounts !== null && nonZeroAccounts !== null
    ? Math.max(0, totalAccounts - nonZeroAccounts)
    : null;

  if (ids.has("critical_gas_runway") || ids.has("low_gas_runway")) {
    leaks.push({
      id: "gas_runway_leak",
      title: "Gas-runway leak",
      riskLevel: ids.has("critical_gas_runway") ? "caution" : "watch",
      plain: `SOL balance is ${formatWalletLeakSol(data.solBalance)} for this public wallet snapshot.`,
      whyDangerous: "Low gas does not prove bad behavior, but it can block calm exits, cleanup, swaps, or transfers and push the owner into rushed top-ups.",
      checkNext: "Keep enough SOL for deliberate actions before entering new positions, closing accounts, or trying to move during volatility.",
    });
  }

  if (ids.has("very_wide_token_exposure") || ids.has("heavy_token_exposure") || ids.has("wide_token_exposure")) {
    leaks.push({
      id: "exposure_spread_leak",
      title: "Exposure-spread leak",
      riskLevel: ids.has("very_wide_token_exposure") ? "danger" : ids.has("heavy_token_exposure") ? "caution" : "watch",
      plain: `${nonZeroAccounts ?? "Multiple"} non-zero SPL token account${nonZeroAccounts === 1 ? "" : "s"} are visible.`,
      whyDangerous: "Wide exposure can hide old bags, dust positions, impulsive entries, and tokens the wallet owner no longer actively tracks. It is a review signal, not PnL.",
      checkNext: "Separate intentional holds from stale, dead, tiny, or unknown positions before adding more exposure.",
    });
  }

  if (ids.has("high_token_account_clutter") || ids.has("empty_token_account_clutter")) {
    leaks.push({
      id: "dust_clutter_leak",
      title: "Dust-clutter leak",
      riskLevel: ids.has("high_token_account_clutter") ? "caution" : "watch",
      plain: emptyAccounts !== null
        ? `${totalAccounts ?? "Many"} SPL token accounts are visible, with about ${emptyAccounts} empty account${emptyAccounts === 1 ? "" : "s"}.`
        : `${totalAccounts ?? "Many"} SPL token accounts are visible for this wallet.`,
      whyDangerous: "Token-account clutter can make a wallet look active while much of the activity is leftover dust or abandoned accounts. It creates noise during review.",
      checkNext: "Check which accounts are still relevant, close only accounts you understand, and avoid judging the wallet by account count alone.",
    });
  }

  if (ids.has("no_active_spl_exposure")) {
    leaks.push({
      id: "low_visible_exposure_leak",
      title: "Low visible exposure",
      riskLevel: "watch",
      plain: "No non-zero SPL token accounts were visible from the public RPC snapshot.",
      whyDangerous: "This can be normal for a clean wallet, a fresh wallet, or a wallet that moved positions elsewhere. It is not a safety badge.",
      checkNext: "Confirm whether this is the main wallet, a fresh wallet, or only one address from a wider setup before drawing conclusions.",
    });
  }

  if (ids.has("limited_wallet_sources") || ids.has("partial_wallet_sources")) {
    leaks.push({
      id: "wallet_source_blind_spot_leak",
      title: "Wallet source blind spot",
      riskLevel: ids.has("limited_wallet_sources") ? "caution" : "watch",
      plain: data.sourceHealthHelper,
      whyDangerous: "A basic RPC snapshot can miss behavior context. It does not show buys, sells, PnL, timing, intent, or whether tokens were airdropped.",
      checkNext: "Use this as public context only. Manual behavior review or an indexer-backed engine is needed for churn, FOMO, panic, or repeated risky-token exposure.",
    });
  }

  if (ids.has("broke_not_visible") && leaks.length < 4) {
    leaks.push({
      id: "broke_context_gap",
      title: "$BROKE context gap",
      riskLevel: "watch",
      plain: "The configured $BROKE mint was not visible in non-zero token accounts.",
      whyDangerous: "This is not a wallet risk by itself. It only means the app cannot add $BROKE-holder context to this wallet snapshot.",
      checkNext: "Use this only for $BROKE-specific context. Do not treat it as proof that the wallet is safe, unsafe, active, or inactive.",
    });
  }

  return leaks.slice(0, 5);
}

export function buildUniversalTokenLeakCheckResult(data: LeakScoreBasicTokenData): UniversalTokenLeakCheckResult {
  const signals = buildTokenAutoSignals(data);
  const pressure = normalizePressure(signals.reduce((total, signal) => total + getSignalWeight(signal.severity), 0));
  const pair = data.pair;
  const dangerousLeaks = buildTokenDangerExplanations(data, signals);
  const hasGoodContext = data.sourceHealth === "complete" && Boolean(pair);
  const confidence: UniversalLeakCheckSourceConfidence = hasGoodContext ? "strong" : data.sourceHealth === "partial" ? "medium" : "limited";
  const tokenLabel = data.tokenSymbol || data.tokenName || "Token";
  const confidenceLabel = confidence === "strong" ? "Strong source context" : confidence === "medium" ? "Medium source context" : "Limited source context";
  const requestedAddress = String(data.requestedAddress || "").trim();
  const resolvedFromPair = Boolean(requestedAddress && requestedAddress !== data.tokenAddress);
  const dangerCount = dangerousLeaks.filter((item) => item.riskLevel === "danger").length;

  return {
    kind: "token",
    title: `${tokenLabel} token check`,
    address: data.tokenAddress,
    pressure,
    pressureLabel: getPressureLabel(pressure),
    confidence,
    confidenceLabel,
    summary: signals.length
      ? `${signals.length} automatic token leak signal${signals.length === 1 ? "" : "s"} found from visible source data.`
      : "No major automatic token leak signals were visible in this snapshot.",
    decisionLabel: buildDecisionLabel(pressure, dangerCount),
    decisionSummary: buildDecisionSummary("token", pressure, dangerousLeaks),
    dangerousLeaks,
    metrics: [
      ...(resolvedFromPair ? [{
        id: "resolved_mint",
        label: "Resolved mint",
        value: shortAddress(data.tokenAddress),
        helper: data.resolutionHelper || `Input ${shortAddress(requestedAddress)} was resolved into the likely token mint.`,
      }] : []),
      {
        id: "liquidity",
        label: "Liquidity",
        value: formatLeakScoreUsd(pair?.liquidityUsd),
        helper: "Visible liquidity from the selected DEX context.",
      },
      {
        id: "volume",
        label: "24h volume",
        value: formatLeakScoreUsd(pair?.volume24hUsd),
        helper: "Point-in-time DEX volume context.",
      },
      {
        id: "market_cap",
        label: "Market cap",
        value: formatLeakScoreUsd(pair?.marketCapUsd),
        helper: "Headline valuation context when the DEX source returns it.",
      },
      {
        id: "top10",
        label: "Top 10 accounts",
        value: formatLeakScorePercent(data.top10ConcentrationPercent),
        helper: "Largest token-account concentration, not a full holder map.",
      },
      {
        id: "pair_age",
        label: "Pair age",
        value: formatLeakScoreAgeDays(pair?.ageDays),
        helper: "Newer pairs require more manual context.",
      },
    ],
    signals,
    actions: [
      "Read Dangerous leaks explained first. It tells you why the signal can drain a wallet, not just that a signal exists.",
      "Verify the mint, official links, liquidity depth, top wallets, pair age, and volume/liquidity balance before trusting any chart.",
      "Use Project Research only if you want to add manual notes after the automatic result.",
    ],
    warnings: [
      ...data.warnings,
      "This is leak-signal research context, not scam detection and not financial advice.",
    ],
    fetchedAt: data.fetchedAt,
    tokenData: data,
  };
}

export function getTokenEvidenceScore(data: LeakScoreBasicTokenData | null) {
  if (!data) return 0;
  let score = 0;
  if (data.pair) score += 4;
  if (data.tokenName || data.tokenSymbol) score += 2;
  if (data.tokenSupply) score += 2;
  if (data.top10ConcentrationPercent !== null) score += 2;
  if (data.sourceHealth === "complete") score += 2;
  if (data.sourceHealth === "partial") score += 1;
  return score;
}

function formatWalletAccountCount(value: number | null) {
  return value === null ? "Unavailable" : String(value);
}

function getWalletTokenExposureLabel(nonZeroCount: number | null) {
  if (nonZeroCount === null) return "Unavailable";
  if (nonZeroCount >= 100) return "Very wide";
  if (nonZeroCount >= 60) return "Heavy";
  if (nonZeroCount >= 25) return "Wide";
  if (nonZeroCount > 0) return "Limited";
  return "No visible SPL exposure";
}

export function buildWalletAutoSignals(data: WalletLeakBasicData): UniversalLeakSignal[] {
  const totalAccounts = data.tokenAccountsCount;
  const nonZeroAccounts = data.nonZeroTokenAccountsCount;
  const emptyAccounts = totalAccounts !== null && nonZeroAccounts !== null
    ? Math.max(0, totalAccounts - nonZeroAccounts)
    : null;
  const emptyAccountRatio = totalAccounts && emptyAccounts !== null
    ? emptyAccounts / Math.max(totalAccounts, 1)
    : null;
  const signals: UniversalLeakSignal[] = [];

  if (data.solBalance !== null && data.solBalance < 0.01) {
    signals.push({
      id: "critical_gas_runway",
      label: "Critical gas runway",
      severity: "medium",
      evidence: `SOL balance is ${formatWalletLeakSol(data.solBalance)}.`,
      action: "Keep enough SOL for intentional moves; low gas can force rushed decisions or failed exits.",
    });
  } else if (data.solBalance !== null && data.solBalance < 0.05) {
    signals.push({
      id: "low_gas_runway",
      label: "Low gas runway",
      severity: "low",
      evidence: `SOL balance is ${formatWalletLeakSol(data.solBalance)}.`,
      action: "This is not a wallet quality label, but low gas can create friction when action is needed.",
    });
  }

  if (nonZeroAccounts !== null && nonZeroAccounts >= 100) {
    signals.push({
      id: "very_wide_token_exposure",
      label: "Very wide token exposure",
      severity: "high",
      evidence: `${nonZeroAccounts} non-zero SPL token accounts are visible for this wallet.`,
      action: "Review exposure manually; token count alone is not PnL, but very wide exposure can hide forgotten positions.",
    });
  } else if (nonZeroAccounts !== null && nonZeroAccounts >= 60) {
    signals.push({
      id: "heavy_token_exposure",
      label: "Heavy token exposure",
      severity: "medium",
      evidence: `${nonZeroAccounts} non-zero SPL token accounts are visible for this wallet.`,
      action: "Check whether these positions are intentional, stale, or left from impulsive entries.",
    });
  } else if (nonZeroAccounts !== null && nonZeroAccounts >= 25) {
    signals.push({
      id: "wide_token_exposure",
      label: "Wide token exposure",
      severity: "low",
      evidence: `${nonZeroAccounts} non-zero SPL token accounts are visible for this wallet.`,
      action: "Use this as a cleanup prompt, not as proof of bad trading behavior.",
    });
  }

  if (totalAccounts !== null && totalAccounts >= 150) {
    signals.push({
      id: "high_token_account_clutter",
      label: "High token-account clutter",
      severity: "medium",
      evidence: emptyAccounts !== null
        ? `${totalAccounts} SPL token accounts are visible, including about ${emptyAccounts} empty accounts.`
        : `${totalAccounts} SPL token accounts are visible.`,
      action: "High account clutter can make wallet review harder; verify what is still relevant before making new decisions.",
    });
  } else if (totalAccounts !== null && totalAccounts >= 60 && emptyAccountRatio !== null && emptyAccountRatio >= 0.65) {
    signals.push({
      id: "empty_token_account_clutter",
      label: "Empty token-account clutter",
      severity: "low",
      evidence: `${totalAccounts} SPL token accounts are visible, and most appear empty in this snapshot.`,
      action: "Treat this as wallet hygiene context only; it does not show PnL, timing, or intent.",
    });
  }

  if (nonZeroAccounts === 0 && data.solBalance !== null && data.solBalance > 0) {
    signals.push({
      id: "no_active_spl_exposure",
      label: "No active SPL exposure visible",
      severity: "low",
      evidence: "No non-zero SPL token accounts were visible from the public RPC snapshot.",
      action: "This can be normal. Use it as context only, not as a claim that the wallet is safe or unsafe.",
    });
  }

  if (data.sourceHealth === "limited") {
    signals.push({
      id: "limited_wallet_sources",
      label: "Limited wallet context",
      severity: "medium",
      evidence: data.sourceHealthHelper,
      action: "Do not infer behavior from this snapshot. Use manual wallet review instead.",
    });
  } else if (data.sourceHealth === "partial") {
    signals.push({
      id: "partial_wallet_sources",
      label: "Partial wallet context",
      severity: "low",
      evidence: data.sourceHealthHelper,
      action: "Use this as basic context only; it does not show buys, sells, timing, or PnL.",
    });
  }

  if (!data.brokeTokenAccountFound) {
    signals.push({
      id: "broke_not_visible",
      label: "$BROKE not visible",
      severity: "low",
      evidence: "The configured $BROKE mint was not visible in non-zero token accounts.",
      action: "This only affects $BROKE-specific context; it is not a wallet quality label.",
    });
  }

  return signals;
}

export function buildUniversalWalletLeakCheckResult(data: WalletLeakBasicData): UniversalWalletLeakCheckResult {
  const signals = buildWalletAutoSignals(data);
  const pressure = normalizePressure(signals.reduce((total, signal) => total + getSignalWeight(signal.severity), 0));
  const confidence: UniversalLeakCheckSourceConfidence = data.sourceHealth === "complete" ? "medium" : data.sourceHealth === "partial" ? "medium" : "limited";
  const confidenceLabel = confidence === "medium" ? "Wallet Auto Signal context" : "Limited wallet context";
  const dangerousLeaks = buildWalletDangerExplanations(data, signals);
  const dangerCount = dangerousLeaks.filter((item) => item.riskLevel === "danger").length;

  return {
    kind: "wallet",
    title: "Wallet public context check",
    address: data.walletAddress,
    pressure,
    pressureLabel: getPressureLabel(pressure),
    confidence,
    confidenceLabel,
    summary: signals.length
      ? `${signals.length} automatic wallet leak signal${signals.length === 1 ? "" : "s"} found from public RPC context.`
      : "No major wallet-context signal was visible from basic public RPC data.",
    decisionLabel: buildDecisionLabel(pressure, dangerCount),
    decisionSummary: buildDecisionSummary("wallet", pressure, dangerousLeaks),
    dangerousLeaks,
    metrics: [
      {
        id: "sol_balance",
        label: "SOL balance",
        value: formatWalletLeakSol(data.solBalance),
        helper: "Point-in-time public SOL balance and gas runway context.",
      },
      {
        id: "token_accounts",
        label: "Token accounts",
        value: formatWalletAccountCount(data.tokenAccountsCount),
        helper: "Visible SPL token accounts for this public wallet.",
      },
      {
        id: "non_zero_tokens",
        label: "Exposure breadth",
        value: getWalletTokenExposureLabel(data.nonZeroTokenAccountsCount),
        helper: data.nonZeroTokenAccountsCount === null
          ? "Non-zero token exposure was not available."
          : `${data.nonZeroTokenAccountsCount} visible non-zero SPL token account${data.nonZeroTokenAccountsCount === 1 ? "" : "s"}.`,
      },
      {
        id: "broke_balance",
        label: "$BROKE visible",
        value: data.brokeTokenAccountFound ? formatWalletLeakTokenAmount(data.brokeBalance) : "Not found",
        helper: "Checks only the configured $BROKE mint.",
      },
    ],
    signals,
    actions: [
      "Read Wallet leaks explained first. It turns gas, exposure, clutter, and source-limit signals into plain wallet-hygiene context.",
      "Use Wallet Review if you want to add manual FOMO, panic, churn, or revenge-entry behavior notes.",
      "Treat gas runway, token exposure breadth, and account clutter as prompts, not verdicts.",
      "Do not infer PnL, trade quality, identity, or intent from public RPC token-account counts.",
    ],
    warnings: [
      ...data.warnings,
      "This is read-only public wallet context, not wallet surveillance, not PnL, and not financial advice.",
    ],
    fetchedAt: data.fetchedAt,
    walletData: data,
  };
}

export function getWalletEvidenceScore(data: WalletLeakBasicData | null) {
  if (!data) return 0;
  let score = 0;
  if (data.solBalance !== null) score += 1;
  if (data.tokenAccountsCount !== null) score += 2;
  if ((data.nonZeroTokenAccountsCount || 0) > 0) score += 2;
  if (data.brokeTokenAccountFound) score += 1;
  if (data.sourceHealth === "complete") score += 2;
  if (data.sourceHealth === "partial") score += 1;
  return score;
}

export function chooseUniversalLeakCheckResult(input: {
  tokenResult: UniversalTokenLeakCheckResult | null;
  walletResult: UniversalWalletLeakCheckResult | null;
  preferredKind: UniversalLeakCheckKind;
}) {
  const { tokenResult, walletResult, preferredKind } = input;
  if (preferredKind === "token" && tokenResult) return tokenResult;
  if (preferredKind === "wallet" && walletResult) return walletResult;
  if (tokenResult && !walletResult) return tokenResult;
  if (walletResult && !tokenResult) return walletResult;
  if (!tokenResult && !walletResult) return null;

  const tokenEvidence = getTokenEvidenceScore(tokenResult?.tokenData || null);
  const walletEvidence = getWalletEvidenceScore(walletResult?.walletData || null);

  if (tokenEvidence >= walletEvidence + 2) return tokenResult;
  if (walletEvidence > tokenEvidence + 2) return walletResult;
  return tokenResult || walletResult;
}

export function buildUniversalLeakCheckAutoSummary(result: UniversalLeakCheckResult): UniversalLeakCheckAutoSummary {
  const primaryDanger =
    result.dangerousLeaks.find((leak) => leak.riskLevel === "danger") ||
    result.dangerousLeaks.find((leak) => leak.riskLevel === "caution") ||
    result.dangerousLeaks[0] ||
    null;
  const primarySignal = result.signals.find((signal) => signal.severity === "high") || result.signals[0] || null;
  const topSignals = result.signals.slice(0, 3).map((signal) => signal.label);

  if (primaryDanger) {
    return {
      label: result.decisionLabel,
      headline: `${result.decisionLabel}: ${primaryDanger.title}`,
      mainLeak: primaryDanger.title,
      meaning: primaryDanger.plain,
      nextStep: primaryDanger.checkNext,
      topSignals,
    };
  }

  if (primarySignal) {
    return {
      label: result.decisionLabel,
      headline: `${result.decisionLabel}: ${primarySignal.label}`,
      mainLeak: primarySignal.label,
      meaning: primarySignal.evidence,
      nextStep: primarySignal.action,
      topSignals,
    };
  }

  return {
    label: result.decisionLabel,
    headline: result.kind === "token" ? "No major token leak found" : "No major wallet leak found",
    mainLeak: "No major automatic leak",
    meaning: result.decisionSummary,
    nextStep: "Still verify official links, source limits, and manual context before acting.",
    topSignals: [],
  };
}

export function buildUniversalLeakCheckShareText(result: UniversalLeakCheckResult) {
  const summary = buildUniversalLeakCheckAutoSummary(result);
  const signalLines = result.signals.length
    ? result.signals.slice(0, 4).map((signal) => `• ${signal.label} — ${signal.evidence}`).join("\n")
    : "• No major automatic signal visible in this snapshot.";

  return [
    "$BROKE Leak Check",
    `Type: ${result.kind === "token" ? "Token" : "Wallet"}`,
    `Result: ${summary.label}`,
    `Pressure: ${result.pressure}/100`,
    `Main leak: ${summary.mainLeak}`,
    `Meaning: ${summary.meaning}`,
    `Next: ${summary.nextStep}`,
    "",
    "Top signals:",
    signalLines,
    "",
    "DYOR before your wallet leaks. Educational leak-signal context, not scam detection, not wallet surveillance, not financial advice.",
  ].join("\n");
}
