export type BrokeMascotStageId =
  | "tired_frog"
  | "awake_frog"
  | "leak_fixer"
  | "wallet_guardian"
  | "broke_legend";

export type BrokeMascotBadgeId =
  | "wallet_hp"
  | "streak"
  | "daily_routine"
  | "leak_fixed"
  | "clean_day";

export type BrokeMascotStageAsset = {
  readonly id: BrokeMascotStageId;
  readonly stage: number;
  readonly title: string;
  readonly description: string;
  readonly src: string;
  readonly activityHint: string;
};

export type BrokeMascotBadgeAsset = {
  readonly id: BrokeMascotBadgeId;
  readonly title: string;
  readonly description: string;
  readonly src: string;
};

export const BROKE_MASCOT_STAGE_ASSETS: readonly BrokeMascotStageAsset[] = [
  {
    id: "tired_frog",
    stage: 1,
    title: "Tired Frog",
    description: "Starting state for low activity or early onboarding.",
    src: "/mascot/stages/stage-1-tired-frog.png",
    activityHint: "Low Wallet HP, low routine consistency, or first use.",
  },
  {
    id: "awake_frog",
    stage: 2,
    title: "Awake Frog",
    description: "The user has started building daily app activity.",
    src: "/mascot/stages/stage-2-awake-frog.png",
    activityHint: "Basic checks, app opens, and early streak progress.",
  },
  {
    id: "leak_fixer",
    stage: 3,
    title: "Leak Fixer",
    description: "The user is actively fixing leaks and reviewing progress.",
    src: "/mascot/stages/stage-3-leak-fixer.png",
    activityHint: "Routine completions, leak fixes, chart review, and clean days.",
  },
  {
    id: "wallet_guardian",
    stage: 4,
    title: "Wallet Guardian",
    description: "A stronger stage for consistent users with healthy Wallet HP.",
    src: "/mascot/stages/stage-4-wallet-guardian.png",
    activityHint: "High Wallet HP, stable streak, and repeated useful activity.",
  },
  {
    id: "broke_legend",
    stage: 5,
    title: "BROKE Legend",
    description: "Top visual stage for strong long-term consistency.",
    src: "/mascot/stages/stage-5-broke-legend.png",
    activityHint: "Long streak, strong routine history, high Wallet HP, and many badges.",
  },
] as const;

export const BROKE_MASCOT_BADGE_ASSETS: readonly BrokeMascotBadgeAsset[] = [
  {
    id: "wallet_hp",
    title: "Wallet HP",
    description: "Represents wallet health and safer behavior.",
    src: "/mascot/badges/wallet-hp.png",
  },
  {
    id: "streak",
    title: "Streak",
    description: "Represents daily consistency.",
    src: "/mascot/badges/streak.png",
  },
  {
    id: "daily_routine",
    title: "Daily Routine",
    description: "Represents completed daily app actions.",
    src: "/mascot/badges/daily-routine.png",
  },
  {
    id: "leak_fixed",
    title: "Leak Fixed",
    description: "Represents fixed leaks and better habits.",
    src: "/mascot/badges/leak-fixed.png",
  },
  {
    id: "clean_day",
    title: "Clean Day",
    description: "Represents a day without tracked leaks.",
    src: "/mascot/badges/clean-day.png",
  },
] as const;

export function getBrokeMascotStageAsset(stage: number): BrokeMascotStageAsset {
  const normalizedStage = Math.min(Math.max(Math.round(stage), 1), BROKE_MASCOT_STAGE_ASSETS.length);
  return BROKE_MASCOT_STAGE_ASSETS[normalizedStage - 1] ?? BROKE_MASCOT_STAGE_ASSETS[0];
}

export function getBrokeMascotBadgeAsset(id: BrokeMascotBadgeId): BrokeMascotBadgeAsset {
  return BROKE_MASCOT_BADGE_ASSETS.find((badge) => badge.id === id) ?? BROKE_MASCOT_BADGE_ASSETS[0];
}
