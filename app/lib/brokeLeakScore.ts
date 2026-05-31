export const LEAK_SCORE_SHARE_CARD_FILE_NAME = "broke-leak-score-card.png";

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

export type LeakScoreResearchCheckId =
  | "project_name"
  | "chain"
  | "contract_context"
  | "signals"
  | "signal_notes"
  | "share_text"
  | "share_card";

export type LeakScoreResearchCheck = {
  id: LeakScoreResearchCheckId;
  label: string;
  ready: boolean;
  helper: string;
};

export type LeakScoreResearchStatus = {
  checks: LeakScoreResearchCheck[];
  readyCount: number;
  total: number;
  completionPercent: number;
  shareReady: boolean;
  cardReady: boolean;
  noteCount: number;
  headline: string;
  helper: string;
};

export type LeakScoreSignalNotes = Partial<Record<LeakScoreSignalId, string>>;

export type LeakScoreProjectDraft = {
  projectName: string;
  chain: string;
  contractAddress: string;
  selectedSignals: LeakScoreSignalId[];
  signalNotes: LeakScoreSignalNotes;
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
    label: "Low Leak Signal Pressure",
    shortLabel: "Low",
    helper: "Few visible leak signals. Still do normal research before acting.",
  },
  medium: {
    id: "medium",
    label: "Medium Leak Signal Pressure",
    shortLabel: "Medium",
    helper: "Some leak signals are visible. Slow down and verify the weak points.",
  },
  high: {
    id: "high",
    label: "High Leak Signal Pressure",
    shortLabel: "High",
    helper: "Several leak signals are visible. Treat the project as high-pressure until proven otherwise.",
  },
  extreme: {
    id: "extreme",
    label: "Extreme Leak Signal Pressure",
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

export function normalizeLeakScoreSignalNotes(input: unknown, selectedSignals?: LeakScoreSignalId[]): LeakScoreSignalNotes {
  if (!input || typeof input !== "object") return {};

  const selected = Array.isArray(selectedSignals) ? new Set(selectedSignals) : null;
  const record = input as Record<string, unknown>;
  const notes: LeakScoreSignalNotes = {};

  LEAK_SCORE_SIGNALS.forEach((signal) => {
    if (selected && !selected.has(signal.id)) return;

    const note = cleanLeakScoreText(record[signal.id], 180);
    if (note) notes[signal.id] = note;
  });

  return notes;
}

export function normalizeLeakScoreDraft(input?: Partial<LeakScoreProjectDraft> | null): LeakScoreProjectDraft {
  const selectedSignals = normalizeLeakScoreSignalIds(input?.selectedSignals);

  return {
    projectName: cleanLeakScoreText(input?.projectName, 64),
    chain: cleanLeakScoreText(input?.chain, 24) || "Solana",
    contractAddress: cleanLeakScoreText(input?.contractAddress, 120),
    selectedSignals,
    signalNotes: normalizeLeakScoreSignalNotes(input?.signalNotes, selectedSignals),
    updatedAt: cleanLeakScoreText(input?.updatedAt, 40) || new Date().toISOString(),
  };
}

export function buildProjectLeakScoreResearchStatus(draft: LeakScoreProjectDraft): LeakScoreResearchStatus {
  const normalizedDraft = normalizeLeakScoreDraft(draft);
  const result = calculateProjectLeakScore(normalizedDraft.selectedSignals);
  const hasProjectName = Boolean(normalizedDraft.projectName.trim());
  const hasChain = Boolean(normalizedDraft.chain.trim());
  const hasContractContext = Boolean(normalizedDraft.contractAddress.trim());
  const hasSignals = normalizedDraft.selectedSignals.length > 0;
  const noteCount = normalizedDraft.selectedSignals.filter((signalId) => Boolean(normalizedDraft.signalNotes[signalId])).length;
  const hasSignalNotes = noteCount > 0;
  const shareReady = hasProjectName && hasChain && hasSignals;

  const checks: LeakScoreResearchCheck[] = [
    {
      id: "project_name",
      label: "Project name",
      ready: hasProjectName,
      helper: hasProjectName ? "Name is set for the research draft." : "Add a project or token name before sharing.",
    },
    {
      id: "chain",
      label: "Chain selected",
      ready: hasChain,
      helper: hasChain ? `Chain context: ${normalizedDraft.chain}.` : "Select the chain you are researching.",
    },
    {
      id: "contract_context",
      label: "Contract context",
      ready: hasContractContext,
      helper: hasContractContext ? "Contract / mint context is attached." : "Optional, but useful before deeper research.",
    },
    {
      id: "signals",
      label: "Leak signals selected",
      ready: hasSignals,
      helper: hasSignals ? `${result.selectedCount}/${result.totalSignals} visible signals selected.` : "Select the leak signals you can actually see.",
    },
    {
      id: "signal_notes",
      label: "Research notes",
      ready: hasSignalNotes,
      helper: hasSignalNotes ? `${noteCount}/${result.selectedCount} selected signals include local notes.` : "Optional: add notes explaining why a signal was selected.",
    },
    {
      id: "share_text",
      label: "Share text",
      ready: shareReady,
      helper: shareReady ? "Text is ready with DYOR / not scam detection framing." : "Needs project name, chain, and at least one signal.",
    },
    {
      id: "share_card",
      label: "Share card",
      ready: shareReady,
      helper: shareReady ? "Card is ready with leak-signal framing." : "Needs project name, chain, and at least one signal.",
    },
  ];

  const readyCount = checks.filter((check) => check.ready).length;
  const total = checks.length;

  return {
    checks,
    readyCount,
    total,
    completionPercent: Math.round((readyCount / total) * 100),
    shareReady,
    cardReady: shareReady,
    noteCount,
    headline: shareReady ? "Research draft ready" : "Research draft incomplete",
    helper: shareReady
      ? "This is ready to share as manual DYOR leak-signal research, not as a project verdict."
      : "The app automatically checks what is missing before you share.",
  };
}

export function buildProjectLeakScoreShareText(draft: LeakScoreProjectDraft) {
  const normalizedDraft = normalizeLeakScoreDraft(draft);
  const result = calculateProjectLeakScore(normalizedDraft.selectedSignals);
  const selected = new Set(normalizedDraft.selectedSignals);
  const projectName = normalizedDraft.projectName || "Unnamed project draft";
  const selectedSignalsWithNotes = LEAK_SCORE_SIGNALS
    .filter((signal) => selected.has(signal.id))
    .map((signal) => ({
      label: signal.label,
      note: normalizedDraft.signalNotes[signal.id] || "",
    }));
  const signalText = selectedSignalsWithNotes.length
    ? selectedSignalsWithNotes.map((item) => item.note ? `• ${item.label} — note: ${item.note}` : `• ${item.label}`).join("\n")
    : "• No visible leak signals selected yet";
  const noteCount = selectedSignalsWithNotes.filter((item) => item.note).length;
  const addressLine = normalizedDraft.contractAddress
    ? `\nContract / mint: ${normalizedDraft.contractAddress}`
    : "";

  return [
    "BROKE Leak Signals research draft",
    "Before you buy a project, check for leaks.",
    `Project: ${projectName}`,
    `Chain: ${normalizedDraft.chain}${addressLine}`,
    `Manual signal score: ${result.score}/100 — ${result.tier.label}`,
    `Signal notes: ${noteCount}/${result.selectedCount}`,
    "Visible leak signals:",
    signalText,
    "",
    "Positioning: Manual Research / DYOR Tool / Educational / Leak Signals / Not Scam Detection.",
    "Note: signal notes are local personal context. This is not an accusation, not a scam label, and not financial advice.",
    "Stop wallet leaks. The market does not drain most wallets. Bad decisions do.",
  ].join("\n");
}
