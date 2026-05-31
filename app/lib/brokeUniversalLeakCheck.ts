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
};

export type UniversalLeakSignal = {
  id: string;
  label: string;
  severity: UniversalLeakSignalSeverity;
  evidence: string;
  action: string;
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
  const cleanedOriginal = cleanText(original, 400);

  if (!cleanedOriginal) {
    return {
      original,
      cleanedAddress: "",
      kind: "unknown",
      sourceLabel: "Empty input",
      helper: "Paste a token mint, public wallet address, Solscan URL, DEX token URL, or text containing a Solana address.",
    };
  }

  const tokenCleanup = cleanupLeakScoreTokenAddressInput(cleanedOriginal);
  const walletCleanup = cleanupWalletLeakAddressInput(cleanedOriginal);
  const markers = getUrlMarkers(cleanedOriginal);
  const looksTokenUrl = markers.some((marker) => TOKEN_URL_MARKERS.has(marker)) || /dexscreener|birdeye|jup\.ag|raydium|geckoterminal/i.test(cleanedOriginal);
  const looksWalletUrl = markers.some((marker) => WALLET_URL_MARKERS.has(marker)) || /wallet|holder|owner/i.test(cleanedOriginal);
  const address = tokenCleanup.cleanedAddress || walletCleanup.cleanedAddress || getFirstSolanaAddress(cleanedOriginal);

  if (!address) {
    return {
      original,
      cleanedAddress: cleanedOriginal,
      kind: "unknown",
      sourceLabel: "No Solana address extracted",
      helper: "The app could not extract a Solana-format address. Use a mint, public wallet, or supported explorer URL.",
    };
  }

  if (looksTokenUrl && !looksWalletUrl) {
    return {
      original,
      cleanedAddress: tokenCleanup.cleanedAddress || address,
      kind: "token",
      sourceLabel: tokenCleanup.sourceLabel || "Token-like input detected",
      helper: "Token-style URL/input detected. The check will fetch token liquidity, pair, supply, and concentration context.",
    };
  }

  if (looksWalletUrl && !looksTokenUrl) {
    return {
      original,
      cleanedAddress: walletCleanup.cleanedAddress || address,
      kind: "wallet",
      sourceLabel: walletCleanup.sourceLabel || "Wallet-like input detected",
      helper: "Wallet-style URL/input detected. The check will fetch read-only public wallet context.",
    };
  }

  return {
    original,
    cleanedAddress: address,
    kind: "unknown",
    sourceLabel: "Solana address detected",
    helper: "Raw Solana addresses can be token mints or wallets. The app will check both and use the stronger evidence path.",
  };
}

export function getUniversalLeakCheckInputStatus(input: UniversalLeakCheckInput) {
  if (!input.cleanedAddress) {
    return {
      canCheck: false,
      label: "Paste something to check",
      helper: input.helper,
    };
  }

  if (!isLikelySolanaMintAddress(input.cleanedAddress) && !isLikelySolanaWalletAddress(input.cleanedAddress)) {
    return {
      canCheck: false,
      label: "Unsupported input",
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
  const concentration = data.top10ConcentrationPercent;
  const volumeLiquidityRatio = liquidity && volume ? volume / Math.max(liquidity, 1) : null;

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

export function buildUniversalTokenLeakCheckResult(data: LeakScoreBasicTokenData): UniversalTokenLeakCheckResult {
  const signals = buildTokenAutoSignals(data);
  const pressure = normalizePressure(signals.reduce((total, signal) => total + getSignalWeight(signal.severity), 0));
  const pair = data.pair;
  const hasGoodContext = data.sourceHealth === "complete" && Boolean(pair);
  const confidence: UniversalLeakCheckSourceConfidence = hasGoodContext ? "strong" : data.sourceHealth === "partial" ? "medium" : "limited";
  const tokenLabel = data.tokenSymbol || data.tokenName || "Token";
  const confidenceLabel = confidence === "strong" ? "Strong source context" : confidence === "medium" ? "Medium source context" : "Limited source context";

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
    metrics: [
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
      "Verify the mint and official links before trusting any chart.",
      "Check liquidity depth, top wallets, pair age, and volume/liquidity balance.",
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

export function buildUniversalLeakCheckShareText(result: UniversalLeakCheckResult) {
  const signalLines = result.signals.length
    ? result.signals.map((signal) => `• ${signal.label} (${signal.severity}) — ${signal.evidence}`).join("\n")
    : "• No major automatic signal visible in this snapshot.";
  const metrics = result.metrics.map((metric) => `${metric.label}: ${metric.value}`).join(" · ");

  return [
    "$BROKE Universal Leak Check",
    `Type: ${result.kind === "token" ? "Token" : "Wallet"}`,
    `Address: ${result.address}`,
    `Pressure: ${result.pressure}/100 — ${result.pressureLabel}`,
    `Source context: ${result.confidenceLabel}`,
    metrics,
    "Automatic signals:",
    signalLines,
    "",
    "Positioning: leak-signal research context / educational / not scam detection / not wallet surveillance / not financial advice.",
  ].join("\n");
}
