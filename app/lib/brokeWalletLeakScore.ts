export const WALLET_LEAK_SCORE_SHARE_CARD_FILE_NAME = "broke-wallet-leak-score-card.png";

export type WalletLeakSignalId =
  | "fomo_entries"
  | "buying_after_green_candles"
  | "influencer_chasing"
  | "too_many_hype_tokens"
  | "no_research_before_buy"
  | "no_position_size_rules"
  | "panic_selling"
  | "holding_dead_projects"
  | "revenge_trading"
  | "no_exit_plan";

export type WalletLeakSignal = {
  id: WalletLeakSignalId;
  label: string;
  helper: string;
  weight: number;
};

export type WalletLeakTierId = "controlled" | "leaky" | "danger" | "drained";

export type WalletLeakTier = {
  id: WalletLeakTierId;
  label: string;
  shortLabel: string;
  helper: string;
};

export type WalletLeakSignalNotes = Partial<Record<WalletLeakSignalId, string>>;

export type WalletLeakDraft = {
  walletLabel: string;
  walletAddress: string;
  selectedSignals: WalletLeakSignalId[];
  signalNotes: WalletLeakSignalNotes;
  updatedAt: string;
};

export type WalletLeakResearchCheckId =
  | "wallet_context"
  | "behavior_signals"
  | "signal_notes"
  | "share_text"
  | "educational_frame";

export type WalletLeakResearchCheck = {
  id: WalletLeakResearchCheckId;
  label: string;
  ready: boolean;
  helper: string;
};

export type WalletLeakResearchStatus = {
  checks: WalletLeakResearchCheck[];
  readyCount: number;
  total: number;
  completionPercent: number;
  shareReady: boolean;
  noteCount: number;
  headline: string;
  helper: string;
};

export const WALLET_LEAK_SIGNALS: WalletLeakSignal[] = [
  {
    id: "fomo_entries",
    label: "FOMO entries",
    helper: "You entered because everyone was talking, not because the setup was checked.",
    weight: 13,
  },
  {
    id: "buying_after_green_candles",
    label: "Buying after big green candles",
    helper: "You often enter after the visible move already happened.",
    weight: 12,
  },
  {
    id: "influencer_chasing",
    label: "Influencer chase",
    helper: "Wallet decisions follow calls, screenshots, or hype threads before verification.",
    weight: 11,
  },
  {
    id: "too_many_hype_tokens",
    label: "Too many hype tokens",
    helper: "The wallet keeps rotating into new memes without enough research time.",
    weight: 10,
  },
  {
    id: "no_research_before_buy",
    label: "No research before buy",
    helper: "The buy happened before checking liquidity, holders, age, operators, and basic signals.",
    weight: 12,
  },
  {
    id: "no_position_size_rules",
    label: "No position-size rules",
    helper: "Buys are emotional instead of capped by a clear wallet-risk rule.",
    weight: 10,
  },
  {
    id: "panic_selling",
    label: "Panic selling",
    helper: "Exits happen mostly from fear, not from a planned invalidation rule.",
    weight: 9,
  },
  {
    id: "holding_dead_projects",
    label: "Holding dead projects too long",
    helper: "The wallet keeps dead bags because accepting the leak feels painful.",
    weight: 9,
  },
  {
    id: "revenge_trading",
    label: "Revenge trading",
    helper: "After a loss, the next buy is made to win it back quickly.",
    weight: 7,
  },
  {
    id: "no_exit_plan",
    label: "No exit plan",
    helper: "There is no written plan for partials, invalidation, or max loss before entry.",
    weight: 7,
  },
];

export const WALLET_LEAK_TIERS: Record<WalletLeakTierId, WalletLeakTier> = {
  controlled: {
    id: "controlled",
    label: "Controlled Wallet Leak Pressure",
    shortLabel: "Controlled",
    helper: "Few behavior leaks are visible. Keep checking decisions before entries.",
  },
  leaky: {
    id: "leaky",
    label: "Leaky Wallet Behavior",
    shortLabel: "Leaky",
    helper: "Several behavior leaks are visible. Slow down before the next buy.",
  },
  danger: {
    id: "danger",
    label: "High Wallet Leak Pressure",
    shortLabel: "High",
    helper: "High-pressure behavior is visible. Add rules before risking more funds.",
  },
  drained: {
    id: "drained",
    label: "Extreme Wallet Leak Pressure",
    shortLabel: "Extreme",
    helper: "The wallet behavior is likely draining future gains. Pause and rebuild discipline.",
  },
};

const WALLET_LEAK_SIGNAL_IDS = new Set<WalletLeakSignalId>(WALLET_LEAK_SIGNALS.map((signal) => signal.id));

export function cleanWalletLeakText(input: unknown, maxLength = 90) {
  return String(input || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeWalletLeakSignalIds(input: unknown): WalletLeakSignalId[] {
  if (!Array.isArray(input)) return [];

  const unique: WalletLeakSignalId[] = [];

  input.forEach((value) => {
    const id = String(value || "") as WalletLeakSignalId;
    if (WALLET_LEAK_SIGNAL_IDS.has(id) && !unique.includes(id)) unique.push(id);
  });

  return unique.slice(0, WALLET_LEAK_SIGNALS.length);
}

export function normalizeWalletLeakSignalNotes(input: unknown, selectedSignals?: WalletLeakSignalId[]): WalletLeakSignalNotes {
  if (!input || typeof input !== "object") return {};

  const selected = Array.isArray(selectedSignals) ? new Set(selectedSignals) : null;
  const record = input as Record<string, unknown>;
  const notes: WalletLeakSignalNotes = {};

  WALLET_LEAK_SIGNALS.forEach((signal) => {
    if (selected && !selected.has(signal.id)) return;

    const note = cleanWalletLeakText(record[signal.id], 180);
    if (note) notes[signal.id] = note;
  });

  return notes;
}

export function normalizeWalletLeakDraft(input?: Partial<WalletLeakDraft> | null): WalletLeakDraft {
  const selectedSignals = normalizeWalletLeakSignalIds(input?.selectedSignals);

  return {
    walletLabel: cleanWalletLeakText(input?.walletLabel, 64),
    walletAddress: cleanWalletLeakText(input?.walletAddress, 120),
    selectedSignals,
    signalNotes: normalizeWalletLeakSignalNotes(input?.signalNotes, selectedSignals),
    updatedAt: cleanWalletLeakText(input?.updatedAt, 40) || new Date().toISOString(),
  };
}

export function calculateWalletLeakScore(selectedSignals: WalletLeakSignalId[]) {
  const selected = new Set(selectedSignals);
  const score = WALLET_LEAK_SIGNALS.reduce(
    (total, signal) => total + (selected.has(signal.id) ? signal.weight : 0),
    0
  );
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const tierId: WalletLeakTierId = normalizedScore >= 70
    ? "drained"
    : normalizedScore >= 45
      ? "danger"
      : normalizedScore >= 20
        ? "leaky"
        : "controlled";

  return {
    score: normalizedScore,
    tier: WALLET_LEAK_TIERS[tierId],
    selectedCount: selectedSignals.length,
    totalSignals: WALLET_LEAK_SIGNALS.length,
  };
}

export function buildWalletLeakResearchStatus(draft: WalletLeakDraft): WalletLeakResearchStatus {
  const normalizedDraft = normalizeWalletLeakDraft(draft);
  const result = calculateWalletLeakScore(normalizedDraft.selectedSignals);
  const hasWalletContext = Boolean(normalizedDraft.walletLabel.trim() || normalizedDraft.walletAddress.trim());
  const hasSignals = normalizedDraft.selectedSignals.length > 0;
  const noteCount = normalizedDraft.selectedSignals.filter((signalId) => Boolean(normalizedDraft.signalNotes[signalId])).length;
  const hasSignalNotes = noteCount > 0;
  const shareReady = hasWalletContext && hasSignals;

  const checks: WalletLeakResearchCheck[] = [
    {
      id: "wallet_context",
      label: "Wallet context",
      ready: hasWalletContext,
      helper: hasWalletContext ? "A label or public wallet address is attached." : "Add a wallet label or public address before sharing.",
    },
    {
      id: "behavior_signals",
      label: "Behavior signals",
      ready: hasSignals,
      helper: hasSignals ? `${result.selectedCount}/${result.totalSignals} behavior leaks selected.` : "Select the behavior leaks you can honestly recognize.",
    },
    {
      id: "signal_notes",
      label: "Local notes",
      ready: hasSignalNotes,
      helper: hasSignalNotes ? `${noteCount}/${result.selectedCount} selected signals include notes.` : "Optional: add notes explaining the pattern.",
    },
    {
      id: "share_text",
      label: "Share text",
      ready: shareReady,
      helper: shareReady ? "Text is ready with manual self-check framing." : "Needs wallet context and at least one signal.",
    },
    {
      id: "educational_frame",
      label: "Educational framing",
      ready: true,
      helper: "This screen is a manual behavior checklist, not wallet surveillance or financial advice.",
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
    noteCount,
    headline: shareReady ? "Wallet review ready" : "Wallet review incomplete",
    helper: shareReady
      ? "Ready to share as a manual wallet-behavior self-check, not as on-chain surveillance."
      : "The app automatically checks what is missing before you share.",
  };
}

export function buildWalletLeakShareText(draft: WalletLeakDraft) {
  const normalizedDraft = normalizeWalletLeakDraft(draft);
  const result = calculateWalletLeakScore(normalizedDraft.selectedSignals);
  const selected = new Set(normalizedDraft.selectedSignals);
  const walletLabel = normalizedDraft.walletLabel || "Unnamed wallet review";
  const walletLine = normalizedDraft.walletAddress
    ? `Wallet: ${normalizedDraft.walletAddress}`
    : "Wallet: hidden / not attached";
  const selectedSignalsWithNotes = WALLET_LEAK_SIGNALS
    .filter((signal) => selected.has(signal.id))
    .map((signal) => ({
      label: signal.label,
      note: normalizedDraft.signalNotes[signal.id] || "",
    }));
  const signalText = selectedSignalsWithNotes.length
    ? selectedSignalsWithNotes.map((item) => item.note ? `• ${item.label} — note: ${item.note}` : `• ${item.label}`).join("\n")
    : "• No wallet behavior leaks selected yet";
  const noteCount = selectedSignalsWithNotes.filter((item) => item.note).length;

  return [
    "BROKE Wallet Leak Score draft",
    "Before you blame the market, check your wallet behavior.",
    `Review: ${walletLabel}`,
    walletLine,
    `Manual behavior score: ${result.score}/100 — ${result.tier.label}`,
    `Signal notes: ${noteCount}/${result.selectedCount}`,
    "Wallet behavior leaks:",
    signalText,
    "",
    "Positioning: Manual self-check / Educational / Wallet behavior leaks / Not financial advice.",
    "Note: this does not scan on-chain history yet, does not judge a wallet, and does not predict results.",
    "Stop wallet leaks. The market does not drain most wallets. Bad decisions do.",
  ].join("\n");
}
