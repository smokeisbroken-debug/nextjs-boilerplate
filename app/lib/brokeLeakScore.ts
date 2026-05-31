export type LeakScoreSignalId =
  | "wallet_concentration"
  | "unlocked_supply"
  | "weak_liquidity"
  | "suspicious_volume"
  | "fake_engagement"
  | "hype_pressure"
  | "unclear_team"
  | "no_working_product"
  | "poor_communication"
  | "rushed_decisions";

export type LeakScoreSignal = {
  id: LeakScoreSignalId;
  label: string;
  helper: string;
  weight: number;
};

export type LeakScoreTierId = "low" | "medium" | "high" | "extreme";

export type LeakScoreTier = {
  id: LeakScoreTierId;
  label: string;
  shortLabel: string;
  helper: string;
};

export type LeakScoreProjectDraft = {
  projectName: string;
  chain: string;
  contractAddress: string;
  selectedSignals: LeakScoreSignalId[];
  updatedAt: string;
};

export const LEAK_SCORE_SIGNALS: LeakScoreSignal[] = [
  {
    id: "wallet_concentration",
    label: "Wallet concentration",
    helper: "A small group of wallets appears to control too much supply.",
    weight: 14,
  },
  {
    id: "unlocked_supply",
    label: "Unlocked team / insider supply",
    helper: "Team, treasury, or early wallets appear unclear, unlocked, or hard to verify.",
    weight: 12,
  },
  {
    id: "weak_liquidity",
    label: "Liquidity weakness",
    helper: "Liquidity looks thin compared with the size of the project narrative.",
    weight: 12,
  },
  {
    id: "suspicious_volume",
    label: "Suspicious volume",
    helper: "Volume looks unusually high, repetitive, or disconnected from real community activity.",
    weight: 11,
  },
  {
    id: "fake_engagement",
    label: "Fake engagement signs",
    helper: "Replies, likes, or followers look inflated, generic, or botted.",
    weight: 10,
  },
  {
    id: "hype_pressure",
    label: "Hype pressure",
    helper: "The main message pushes urgency, FOMO, or easy money instead of substance.",
    weight: 10,
  },
  {
    id: "unclear_team",
    label: "Anonymous / unclear operators",
    helper: "Ownership, responsibilities, or project control are not explained clearly.",
    weight: 9,
  },
  {
    id: "no_working_product",
    label: "No working product",
    helper: "The project sells a big promise but shows little usable product or proof.",
    weight: 9,
  },
  {
    id: "poor_communication",
    label: "Poor communication",
    helper: "Updates are vague, defensive, inconsistent, or mostly price-focused.",
    weight: 7,
  },
  {
    id: "rushed_decisions",
    label: "Rushed decision setup",
    helper: "The project makes users feel they must act before checking the basics.",
    weight: 6,
  },
];

export const LEAK_SCORE_TIERS: Record<LeakScoreTierId, LeakScoreTier> = {
  low: {
    id: "low",
    label: "Low Leak Risk",
    shortLabel: "Low",
    helper: "Few visible leak signals. Still do normal research before acting.",
  },
  medium: {
    id: "medium",
    label: "Medium Leak Risk",
    shortLabel: "Medium",
    helper: "Some leak signals are visible. Slow down and verify the weak points.",
  },
  high: {
    id: "high",
    label: "High Leak Risk",
    shortLabel: "High",
    helper: "Several leak signals are visible. Treat the project as high-pressure until proven otherwise.",
  },
  extreme: {
    id: "extreme",
    label: "Extreme Leak Risk",
    shortLabel: "Extreme",
    helper: "Many severe leak signals are visible. Do not act from emotion or FOMO.",
  },
};

const LEAK_SCORE_SIGNAL_IDS = new Set<LeakScoreSignalId>(LEAK_SCORE_SIGNALS.map((signal) => signal.id));

export function calculateProjectLeakScore(selectedSignals: LeakScoreSignalId[]) {
  const selected = new Set(selectedSignals);
  const score = LEAK_SCORE_SIGNALS.reduce(
    (total, signal) => total + (selected.has(signal.id) ? signal.weight : 0),
    0
  );
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const tierId: LeakScoreTierId = normalizedScore >= 70
    ? "extreme"
    : normalizedScore >= 45
      ? "high"
      : normalizedScore >= 20
        ? "medium"
        : "low";

  return {
    score: normalizedScore,
    tier: LEAK_SCORE_TIERS[tierId],
    selectedCount: selectedSignals.length,
    totalSignals: LEAK_SCORE_SIGNALS.length,
  };
}

export function cleanLeakScoreText(input: unknown, maxLength = 80) {
  return String(input || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeLeakScoreSignalIds(input: unknown): LeakScoreSignalId[] {
  if (!Array.isArray(input)) return [];

  const unique: LeakScoreSignalId[] = [];

  input.forEach((value) => {
    const id = String(value || "") as LeakScoreSignalId;
    if (LEAK_SCORE_SIGNAL_IDS.has(id) && !unique.includes(id)) unique.push(id);
  });

  return unique.slice(0, LEAK_SCORE_SIGNALS.length);
}

export function normalizeLeakScoreDraft(input?: Partial<LeakScoreProjectDraft> | null): LeakScoreProjectDraft {
  return {
    projectName: cleanLeakScoreText(input?.projectName, 64),
    chain: cleanLeakScoreText(input?.chain, 24) || "Solana",
    contractAddress: cleanLeakScoreText(input?.contractAddress, 120),
    selectedSignals: normalizeLeakScoreSignalIds(input?.selectedSignals),
    updatedAt: cleanLeakScoreText(input?.updatedAt, 40) || new Date().toISOString(),
  };
}

export function buildProjectLeakScoreShareText(draft: LeakScoreProjectDraft) {
  const normalizedDraft = normalizeLeakScoreDraft(draft);
  const result = calculateProjectLeakScore(normalizedDraft.selectedSignals);
  const selected = new Set(normalizedDraft.selectedSignals);
  const selectedLabels = LEAK_SCORE_SIGNALS
    .filter((signal) => selected.has(signal.id))
    .map((signal) => signal.label);
  const projectName = normalizedDraft.projectName || "Unnamed project draft";
  const signalText = selectedLabels.length
    ? selectedLabels.map((label) => `• ${label}`).join("\n")
    : "• No visible leak signals selected yet";
  const addressLine = normalizedDraft.contractAddress
    ? `\nContract / mint: ${normalizedDraft.contractAddress}`
    : "";

  return [
    "BROKE Leak Score draft",
    `Project: ${projectName}`,
    `Chain: ${normalizedDraft.chain}${addressLine}`,
    `Score: ${result.score}/100 — ${result.tier.label}`,
    "Visible signals:",
    signalText,
    "",
    "Note: this is a manual DYOR checklist, not an accusation, not a scam label, and not financial advice.",
    "$BROKE helps people notice leaks before they become damage.",
  ].join("\n");
}
