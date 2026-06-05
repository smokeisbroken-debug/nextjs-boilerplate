export const PROJECT_COMPARE_SHARE_CARD_FILE_NAME = "broke-project-vs-project-card.png";

export type ProjectCompareSideId = "a" | "b";

export type ProjectCompareSide = {
  projectName: string;
  chain: string;
  contractAddress: string;
  manualSignalScore: number;
  selectedSignalCount: number;
  liquidityUsd: number | null;
  top10ConcentrationPct: number | null;
  note: string;
};

export type ProjectCompareDraft = {
  a: ProjectCompareSide;
  b: ProjectCompareSide;
  updatedAt: string;
};

export type ProjectCompareSideSummary = ProjectCompareSide & {
  id: ProjectCompareSideId;
  label: string;
  tier: "low" | "medium" | "high" | "extreme";
  tierLabel: string;
  displayName: string;
  liquidityLabel: string;
  concentrationLabel: string;
};

export type ProjectCompareSummary = {
  a: ProjectCompareSideSummary;
  b: ProjectCompareSideSummary;
  lowerSignalSide: ProjectCompareSideId | "tie";
  liquiditySide: ProjectCompareSideId | "tie" | "unknown";
  concentrationSide: ProjectCompareSideId | "tie" | "unknown";
  readiness: {
    readyCount: number;
    total: number;
    completionPercent: number;
    shareReady: boolean;
    headline: string;
    helper: string;
  };
};

export function cleanProjectCompareText(input: unknown, maxLength = 90) {
  return String(input || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function clampProjectCompareNumber(input: unknown, min: number, max: number, fallback = 0) {
  const value = Number(input);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), min), max);
}

function normalizeNullableNumber(input: unknown, min: number, max: number) {
  if (input === null || input === undefined || input === "") return null;
  const value = Number(input);
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(Number(value.toFixed(2)), min), max);
}

export function getProjectCompareTier(score: number): ProjectCompareSideSummary["tier"] {
  if (score >= 70) return "extreme";
  if (score >= 45) return "high";
  if (score >= 20) return "medium";
  return "low";
}

export function getProjectCompareTierLabel(score: number) {
  const tier = getProjectCompareTier(score);
  if (tier === "extreme") return "Extreme signal pressure";
  if (tier === "high") return "High signal pressure";
  if (tier === "medium") return "Medium signal pressure";
  return "Low signal pressure";
}

export function normalizeProjectCompareSide(input?: Partial<ProjectCompareSide> | null): ProjectCompareSide {
  return {
    projectName: cleanProjectCompareText(input?.projectName, 64),
    chain: cleanProjectCompareText(input?.chain, 24) || "Solana",
    contractAddress: cleanProjectCompareText(input?.contractAddress, 120),
    manualSignalScore: clampProjectCompareNumber(input?.manualSignalScore, 0, 100, 0),
    selectedSignalCount: clampProjectCompareNumber(input?.selectedSignalCount, 0, 20, 0),
    liquidityUsd: normalizeNullableNumber(input?.liquidityUsd, 0, 1_000_000_000_000),
    top10ConcentrationPct: normalizeNullableNumber(input?.top10ConcentrationPct, 0, 100),
    note: cleanProjectCompareText(input?.note, 180),
  };
}

export function normalizeProjectCompareDraft(input?: Partial<ProjectCompareDraft> | null): ProjectCompareDraft {
  return {
    a: normalizeProjectCompareSide(input?.a),
    b: normalizeProjectCompareSide(input?.b),
    updatedAt: cleanProjectCompareText(input?.updatedAt, 40) || new Date().toISOString(),
  };
}

function formatUsd(value: number | null) {
  if (value === null) return "Not added";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPct(value: number | null) {
  if (value === null) return "Not added";
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function summarizeSide(id: ProjectCompareSideId, side: ProjectCompareSide): ProjectCompareSideSummary {
  const tier = getProjectCompareTier(side.manualSignalScore);
  return {
    ...side,
    id,
    label: id === "a" ? "Project A" : "Project B",
    tier,
    tierLabel: getProjectCompareTierLabel(side.manualSignalScore),
    displayName: side.projectName || (id === "a" ? "Project A draft" : "Project B draft"),
    liquidityLabel: formatUsd(side.liquidityUsd),
    concentrationLabel: formatPct(side.top10ConcentrationPct),
  };
}

function compareLower(a: number, b: number): ProjectCompareSideId | "tie" {
  if (a === b) return "tie";
  return a < b ? "a" : "b";
}

function compareHigherNullable(a: number | null, b: number | null): ProjectCompareSideId | "tie" | "unknown" {
  if (a === null || b === null) return "unknown";
  if (a === b) return "tie";
  return a > b ? "a" : "b";
}

function compareLowerNullable(a: number | null, b: number | null): ProjectCompareSideId | "tie" | "unknown" {
  if (a === null || b === null) return "unknown";
  if (a === b) return "tie";
  return a < b ? "a" : "b";
}

export function buildProjectCompareSummary(draft: ProjectCompareDraft): ProjectCompareSummary {
  const normalized = normalizeProjectCompareDraft(draft);
  const a = summarizeSide("a", normalized.a);
  const b = summarizeSide("b", normalized.b);
  const hasNames = Boolean(a.projectName && b.projectName);
  const hasScores = a.manualSignalScore > 0 || b.manualSignalScore > 0 || a.selectedSignalCount > 0 || b.selectedSignalCount > 0;
  const hasContext = Boolean(a.chain && b.chain);
  const hasAnyNote = Boolean(a.note || b.note);
  const shareReady = hasNames && hasContext && hasScores;
  const checks = [hasNames, hasContext, hasScores, hasAnyNote, shareReady];
  const readyCount = checks.filter(Boolean).length;

  return {
    a,
    b,
    lowerSignalSide: compareLower(a.manualSignalScore, b.manualSignalScore),
    liquiditySide: compareHigherNullable(a.liquidityUsd, b.liquidityUsd),
    concentrationSide: compareLowerNullable(a.top10ConcentrationPct, b.top10ConcentrationPct),
    readiness: {
      readyCount,
      total: checks.length,
      completionPercent: Math.round((readyCount / checks.length) * 100),
      shareReady,
      headline: shareReady ? "Comparison draft ready" : "Comparison draft incomplete",
      helper: shareReady
        ? "Ready to share as a manual DYOR comparison, not as a winner call or investment advice."
        : "Add both project names and at least one signal-pressure value before sharing.",
    },
  };
}

function sideName(summary: ProjectCompareSummary, side: ProjectCompareSideId | "tie" | "unknown") {
  if (side === "a") return summary.a.displayName;
  if (side === "b") return summary.b.displayName;
  if (side === "tie") return "Tie";
  return "Unknown";
}

export function buildProjectCompareShareText(draft: ProjectCompareDraft) {
  const summary = buildProjectCompareSummary(draft);
  const lines = [
    "$BROKE Project vs Project leak-signal comparison",
    "Before you buy a project, check for leaks.",
    "",
    `A: ${summary.a.displayName} · ${summary.a.chain}`,
    `A signal pressure: ${summary.a.manualSignalScore}/100 · ${summary.a.tierLabel}`,
    `A visible signals: ${summary.a.selectedSignalCount}`,
    `A liquidity: ${summary.a.liquidityLabel}`,
    `A top-10 concentration: ${summary.a.concentrationLabel}`,
    summary.a.note ? `A note: ${summary.a.note}` : "",
    "",
    `B: ${summary.b.displayName} · ${summary.b.chain}`,
    `B signal pressure: ${summary.b.manualSignalScore}/100 · ${summary.b.tierLabel}`,
    `B visible signals: ${summary.b.selectedSignalCount}`,
    `B liquidity: ${summary.b.liquidityLabel}`,
    `B top-10 concentration: ${summary.b.concentrationLabel}`,
    summary.b.note ? `B note: ${summary.b.note}` : "",
    "",
    `Lower manual signal pressure: ${sideName(summary, summary.lowerSignalSide)}`,
    `Stronger liquidity context: ${sideName(summary, summary.liquiditySide)}`,
    `Lower top-10 concentration: ${sideName(summary, summary.concentrationSide)}`,
    "",
    "Positioning: manual comparison / DYOR tool / leak signals / not scam detection.",
    "Note: this is not a project ranking, not a price prediction, and not financial advice.",
    "Stop wallet leaks. The market does not drain most wallets. Bad decisions do.",
  ];

  return lines.filter(Boolean).join("\n");
}
