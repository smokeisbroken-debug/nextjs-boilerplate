"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  BROKE_APP_BUILD_NOTE,
  BROKE_APP_BUILD_VERSION,
  DEFAULT_BROKE_TOKEN_MINT_ADDRESS,
  DEFAULT_TREASURY_WALLET_ADDRESS,
  REAL_DISTRIBUTION_CONFIRM_PHRASE,
  SERVER_AUTO_SEND_CONFIRM_PHRASE,
  buildAdminDistributionManifest,
  buildAdminDistributionSendSheet,
  buildAdminPayoutPaymentLink,
  buildAdminPayoutPaymentLinksCsv,
  calculateAdminPayoutRows,
  parseAdminCsv,
  walletAddressEquals,
} from "./lib/brokeAdminRewards";
import {
  adminGetWalletStandardSigner,
  adminSignAndSendSerializedTransaction,
  buildAdminBatchTransactions,
} from "./lib/brokeAdminWalletTransactions";
import {
  LEAK_SCORE_SHARE_CARD_FILE_NAME,
  LEAK_SCORE_SIGNALS,
  buildProjectLeakScoreShareText,
  calculateProjectLeakScore,
  normalizeLeakScoreDraft,
  type LeakScoreProjectDraft,
  type LeakScoreSignalId,
} from "./lib/brokeLeakScore";

type Tab = "home" | "add" | "chart" | "growth" | "leakscore" | "whatif" | "settings";
type AppMode = "standard" | "pro";
type NeedType = "Needed" | "Not needed" | "Maybe";
type Language = "en" | "ru";
type Currency =
  | "USD"
  | "EUR"
  | "MDL"
  | "NGN"
  | "PKR"
  | "GBP"
  | "INR"
  | "CAD"
  | "AUD"
  | "NZD"
  | "ZAR"
  | "GHS"
  | "KES"
  | "UGX"
  | "TZS"
  | "XAF"
  | "XOF"
  | "EGP"
  | "MAD"
  | "TRY"
  | "AED"
  | "SAR"
  | "PHP"
  | "IDR"
  | "VND"
  | "THB"
  | "MYR"
  | "SGD"
  | "BDT"
  | "LKR"
  | "NPR"
  | "BRL"
  | "MXN"
  | "UAH"
  | "PLN"
  | "RON"
  | "GEL"
  | "KZT";

const supportedCurrencies: Currency[] = [
  "USD",
  "EUR",
  "MDL",
  "NGN",
  "PKR",
  "GBP",
  "INR",
  "CAD",
  "AUD",
  "NZD",
  "ZAR",
  "GHS",
  "KES",
  "UGX",
  "TZS",
  "XAF",
  "XOF",
  "EGP",
  "MAD",
  "TRY",
  "AED",
  "SAR",
  "PHP",
  "IDR",
  "VND",
  "THB",
  "MYR",
  "SGD",
  "BDT",
  "LKR",
  "NPR",
  "BRL",
  "MXN",
  "UAH",
  "PLN",
  "RON",
  "GEL",
  "KZT",
];

const defaultCurrency: Currency = "USD";
const usdReferenceCurrency: Currency = "USD";

type CurrencyMode = "display" | "convert";

const currencyModeOptions: { value: CurrencyMode; label: string; helper: string }[] = [
  {
    value: "display",
    label: "Display only",
    helper: "Currency changes the symbol only. Existing totals stay exactly as stored.",
  },
  {
    value: "convert",
    label: "Convert values",
    helper: "Use cached exchange rates for entries that remember their original currency.",
  },
];

type MoneyFormatOptions = {
  includeCode?: boolean;
  precision?: "whole" | "auto";
};

type ExchangeRateSnapshot = {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  rate: number;
  rateDate?: string;
  source?: string;
  fetchedAt?: string;
  cached?: boolean;
  cacheStatus?: string;
};

type ExchangeRateMap = Record<string, ExchangeRateSnapshot>;

type ExchangeRateStatus = "idle" | "loading" | "ready" | "partial" | "error";

type ExchangeRateState = {
  rates: ExchangeRateMap;
  status: ExchangeRateStatus;
  error: string;
};

type CurrencyRepairScope = "missing" | "all";

type CurrencyRepairResult = {
  expensesUpdated: number;
  incomeFieldsUpdated: number;
  fixedCostFieldsUpdated: number;
  growthTargetsUpdated: number;
  debtItemsUpdated: number;
  cloudExpenseSync?: boolean;
  cloudAppStateSync?: boolean;
  serverExpenseRepair?: boolean;
  repairScope?: CurrencyRepairScope;
};
type ChartRange = "day" | "week" | "month";
type RegionPreset =
  | "Global"
  | "Custom"
  | "Nigeria"
  | "Ghana"
  | "Kenya"
  | "South Africa"
  | "Pakistan"
  | "India"
  | "Bangladesh"
  | "Philippines"
  | "Indonesia"
  | "Vietnam"
  | "Thailand"
  | "Malaysia"
  | "Brazil"
  | "Mexico"
  | "Turkey"
  | "Egypt"
  | "Morocco"
  | "UAE"
  | "Saudi Arabia"
  | "United Kingdom"
  | "Canada"
  | "Australia"
  | "Moldova"
  | "Romania"
  | "Ukraine"
  | "Poland"
  | "Europe"
  | "United States";
type LifeMode = "Student" | "Worker" | "Freelancer" | "Living with family" | "No stable income";
type IncomeStyle = "Monthly" | "Weekly" | "Daily" | "Allowance" | "Irregular";

type GrowthFrequency = "daily" | "weekly" | "monthly";
type GrowthRisk = "low" | "medium" | "high";

type GrowthPlanProgressEntry = {
  id: string;
  amount: number;
  createdAt: string;
  note?: string;
};

type GrowthSimulation = {
  id: string;
  title: string;
  startingAmount: number;
  contributionAmount: number;
  contributionFrequency: GrowthFrequency;
  durationMonths: number;
  expectedAnnualGrowth: number;
  riskLevel: GrowthRisk;
  reinvest: boolean;
  createdAt: string;
  progressEntries: GrowthPlanProgressEntry[];
};

type GrowthPoint = {
  month: number;
  balance: number;
  contributed: number;
  gain: number;
};

type GrowthGoalMode = "common" | "custom";

type GrowthGoalPreset = {
  id: string;
  label: string;
  targetAmount: number;
  icon: string;
  description: string;
};

type GrowthLifeMeaningItem = {
  id: string;
  label: string;
  detail: string;
  icon: string;
  coverageLabel: string;
};

type GrowthMeaningPeriod = "one" | "year";
type GrowthPlannerTab = "costs" | "goal";

type GrowthManualTarget = {
  id: string;
  name: string;
  amount: string;
  period: GrowthMeaningPeriod;
  currency?: Currency;
};

type GrowthShareContext = {
  primaryTargetName: string;
  primaryTargetPeriodLabel: string;
  primaryTargetCoverageLabel: string;
  primaryTargetMonthsLabel: string;
  secondaryTargetName: string;
  secondaryTargetPeriodLabel: string;
  secondaryTargetCoverageLabel: string;
  secondaryTargetMonthsLabel: string;
  activeGoalName: string;
  activeGoalTarget: number;
  activeGoalTimeLabel: string;
  monthlyContribution: number;
  manualTargetName: string;
  manualTargetAmount: number;
  manualTargetTimeLabel: string;
};

type DebtRadarKind = "debt" | "bill" | "maintenance";
type DebtRadarPriority = "low" | "medium" | "high";

type DebtPaymentEntry = {
  id: string;
  amount: number;
  createdAt: string;
  note?: string;
  currency?: Currency;
};

type DebtRadarItem = {
  id: string;
  name: string;
  kind: DebtRadarKind;
  monthlyAmount: string;
  remainingAmount: string;
  dueDay: string;
  priority: DebtRadarPriority;
  currency?: Currency;
  remainingCurrency?: Currency;
  paymentHistory?: DebtPaymentEntry[];
};

type HomeHabitLeakType =
  | "lights"
  | "fan"
  | "tv"
  | "water"
  | "charger"
  | "ac-heater"
  | "fridge"
  | "custom";

type HomeHabitLeakEntry = {
  id: string;
  type: HomeHabitLeakType;
  label: string;
  createdAt: string;
  note?: string;
  stackKey?: string;
};

type HomeHabitLeakInsight = {
  weeklyCount: number;
  topLabel: string;
  topCount: number;
  lateNightCount: number;
  weekendCount: number;
  activeDays: number;
  repeatLabel: string;
};

type DebtRadarTotals = {
  debtMonthly: number;
  billMonthly: number;
  maintenanceMonthly: number;
  totalMonthly: number;
  totalRemainingDebt: number;
  highPriorityCount: number;
};

type GrowthPlannerState = {
  realLifeTargets: GrowthManualTarget[];
  savingGoalName: string;
  savingGoalAmount: string;
  savingGoalCurrency?: Currency;
  updatedAt?: string;
};

type CloudAppState = {
  growthSimulations: GrowthSimulation[];
  growthPlanner: GrowthPlannerState;
  debtRadarItems: DebtRadarItem[];
  homeHabitLeaks: HomeHabitLeakEntry[];
  dailyRoutineActions?: DailyRoutineActions;
  dailyRoutineReward?: DailyRoutineRewardState;
  activeStreakProof?: ActiveStreakProofState;
  rewardNotificationPrefs?: RewardNotificationPrefs;
  localLeakMission?: LocalLeakMission | null;
  appMode?: AppMode;
  updatedAt?: string;
};

type SurvivalForecast = {
  totalIncome: number;
  fixedCosts: number;
  spentThisMonth: number;
  realBalance: number;
  daysUntilIncome: number;
  nextPaydayDate: string;
  safeDailyBudget: number;
  currentDailyPace: number;
  leakDailyPace: number;
  surviveDays: number;
  diesBeforePaydayBy: number;
  walletHpForecast: number;
  status: "surviving" | "danger" | "critical";
  statusLabel: string;
  dangerLabel: string;
};

type Expense = {
  id: string;
  amount: number;
  category: string;
  needType: NeedType;
  note: string;
  createdAt: string;
  triggerTags?: LeakTriggerId[];
  /** Optional smarter-cost baseline. If present, only amount - necessaryAmount counts as leak pressure. */
  necessaryAmount?: number;
  /** Cached avoidable excess for sync/cloud compatibility. */
  avoidableLeakAmount?: number;
  currency?: Currency;
  originalAmount?: number;
  originalCurrency?: Currency;
  convertedForDisplay?: boolean;
  usdReferenceAmount?: number;
  usdReferenceCurrency?: Currency;
};

type OnboardingStarterExpense = {
  category: string;
  amount: number;
  needType: NeedType;
  note: string;
};

type HolderTierId = "none" | "tadpole" | "frog" | "strong" | "shark" | "whale" | "leviathan";

type HolderTier = {
  id: HolderTierId;
  label: string;
  range: string;
  description: string;
};

type WalletLinkSettings = {
  walletAddress: string;
  isVerified: boolean;
  provider: "watch" | "verified";
  brokeBalance: number;
  percentOfSupply: number;
  holderTier: HolderTier;
  lastCheckedAt: string;
  verifiedAt: string;
  showHolderStatus: boolean;
  showTokenBalance: boolean;
};

type Settings = {
  currency: Currency;
  currencyMode: CurrencyMode;
  language: Language;
  dailyReminder: boolean;
  onboardingCompleted?: boolean;
  profile: {
    region: RegionPreset;
    country: string;
    lifeMode: LifeMode;
    incomeStyle: IncomeStyle;
    hasRent: boolean;
    workHoursPerMonth: number;
  };
  income: {
    salary: number;
    side: number;
    other: number;
  };
  incomeCurrencies: {
    salary?: Currency;
    side?: Currency;
    other?: Currency;
  };
  fixedCosts: {
    rent: number;
    utilities: number;
    food: number;
    transport: number;
    phone: number;
    data: number;
    education: number;
  };
  fixedCostCurrencies: {
    rent?: Currency;
    utilities?: Currency;
    food?: Currency;
    transport?: Currency;
    phone?: Currency;
    data?: Currency;
    education?: Currency;
  };
  survival: {
    nextPaydayDate: string;
  };
  privacy: {
    publicProofMode: boolean;
  };
  identity: {
    nickname: string;
    avatarPreset: "default" | "wallet" | "survivor" | "degen" | "stealth";
    identityStyle: "classic" | "clean" | "proof" | "stealth" | "builder";
    statusText: string;
    customAvatarUrl: string;
    customAvatarUpdatedAt: string;
  };
  shareProfile: ProfileShareSettings;
  wallet: WalletLinkSettings;
  categoryNames: Record<string, string>;
};

type ChartPressureStatus = "safe" | "warning" | "danger" | "quiet";

type ChartPoint = {
  label: string;
  key: string;
  spent: number;
  leakAmount: number;
  count: number;
  open: number;
  close: number;
  pressure: number;
  status: ChartPressureStatus;
  biggestLeakCategory: string;
  isCycleStart?: boolean;
};

type CategorySummary = {
  category: string;
  /** Backward-compatible amount field. By default this is tracked spending. */
  amount: number;
  /** All recorded spending in the category, including Needed. */
  trackedAmount?: number;
  /** Weighted leak pressure: Needed = 0%, Maybe = 50%, Not needed = 100%. */
  leakAmount?: number;
  count: number;
  icon: string;
};

type MonthlyLeakCategory = {
  category: string;
  icon: string;
  total: number;
  count: number;
  average: number;
  neededTotal: number;
  maybeTotal: number;
  notNeededTotal: number;
  leakTotal: number;
  sharePercent: number;
  commentTitle: string;
  commentBody: string;
  purchases: Expense[];
};

type MonthlyLeakArchive = {
  monthKey: string;
  monthLabel: string;
  totalSpent: number;
  totalLeaks: number;
  totalCount: number;
  topCategory: MonthlyLeakCategory | null;
  repeatedCategory: MonthlyLeakCategory | null;
  biggestExpense: Expense | null;
  categories: MonthlyLeakCategory[];
  summaryComment: string;
};

type LeakPattern = {
  id: string;
  category: string;
  icon: string;
  title: string;
  body: string;
  why: string;
  fix: string;
  count: number;
  total: number;
  average: number;
  severity: "low" | "medium" | "high";
  tag: string;
};

type LeakPatternSignal = {
  id: string;
  label: string;
  title: string;
  body: string;
  count: number;
  total: number;
  severity: "low" | "medium" | "high";
};

type LeakPatternLabSummary = {
  headline: string;
  detail: string;
  dominantTrigger: string;
  confidence: "Waiting" | "Learning" | "Clear";
  riskLevel: "quiet" | "watch" | "danger";
  patternPressure: number;
  highRiskCount: number;
  signals: LeakPatternSignal[];
};

type WeeklyPatternSummaryCard = {
  id: string;
  label: string;
  title: string;
  body: string;
  value: string;
  severity: "low" | "medium" | "high";
};

type WeeklyPatternSummary = {
  tone: "quiet" | "watch" | "danger";
  headline: string;
  body: string;
  strongestPattern: string;
  nextMove: string;
  totalLeaks: number;
  leakPressure: number;
  confidence: "Waiting" | "Learning" | "Clear";
  cards: WeeklyPatternSummaryCard[];
};

type PatternChallengeRecommendation = {
  template: ChallengeTemplate | null;
  title: string;
  reason: string;
  focus: string;
  nextMove: string;
  urgency: "waiting" | "soft" | "strong";
};

type PatternHistoryRecord = {
  id?: string;
  periodType: "weekly";
  periodKey: string;
  periodLabel: string;
  tone: WeeklyPatternSummary["tone"];
  headline: string;
  body: string;
  strongestPattern: string;
  nextMove: string;
  totalLeaks: number;
  leakPressure: number;
  confidence: WeeklyPatternSummary["confidence"];
  cards: WeeklyPatternSummaryCard[];
  createdAt?: string;
  updatedAt?: string;
};

type WeeklyReviewDay = {
  key: string;
  label: string;
  spent: number;
  leaks: number;
  count: number;
};

type WeeklyReview = {
  totalSpent: number;
  totalLeaks: number;
  totalCount: number;
  leakPressure: number;
  biggestLeakCategory: string;
  biggestLeakAmount: number;
  mostRepeatedCategory: string;
  mostRepeatedCount: number;
  bestDay: WeeklyReviewDay | null;
  worstDay: WeeklyReviewDay | null;
  oneFixTitle: string;
  oneFixBody: string;
  summary: string;
  days: WeeklyReviewDay[];
};

type OneFixDifficulty = "easy" | "normal" | "hard";

type OneFixRecommendation = {
  id: string;
  category: string;
  icon: string;
  title: string;
  body: string;
  target: string;
  estimatedSave: number;
  difficulty: OneFixDifficulty;
  difficultyLabel: string;
  reason: string;
  source: string;
};

type ComebackState = {
  daysAway: number;
  lastActiveLabel: string;
  estimatedMissedLeaks: number;
  biggestLeakCategory: string;
  biggestLeakAmount: number;
  title: string;
  body: string;
  insight: string;
};

type LeakStreakItem = {
  id: string;
  category: string;
  label: string;
  icon: string;
  daysClean: number;
  countThisMonth: number;
  totalThisMonth: number;
  lastLeakLabel: string;
  status: "clean" | "broken_today" | "no_history";
  title: string;
  detail: string;
  suggestion: string;
  tone: "green" | "orange" | "red" | "muted";
};

type Streak = {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  updatedAt?: string | null;
};

type ChallengeStatus = "active" | "completed" | "failed";

type ChallengeTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  durationDays: number;
  maxSpend: number;
  rewardHp: number;
  icon: string;
};

type UserChallenge = {
  id: string;
  challengeId: string;
  status: ChallengeStatus;
  startedAt: string;
  endsAt: string;
  completedAt?: string | null;
};

type ChallengeProgress = {
  title: string;
  description: string;
  category: string;
  icon: string;
  status: ChallengeStatus;
  spent: number;
  maxSpend: number;
  rewardHp: number;
  durationDays: number;
  daysLeft: number;
  percentUsed: number;
};

type LocalLeakMission = {
  id: string;
  category: string;
  startedAt: string;
  endsAt: string;
  baselineWeekly: number;
  targetSpend: number;
  createdAt: string;
};

type BadgeItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: string | null;
};

type XpAction =
  | "open_app"
  | "add_expense"
  | "add_note"
  | "mark_need_type"
  | "open_chart"
  | "check_challenge"
  | "daily_streak";

type LeaderboardProfile = {
  telegramId: number;
  displayName: string;
  username: string | null;
  publicLeaderboard: boolean;
  brokeScore: number;
  dailyXp: number;
  weeklyXp: number;
  totalXp: number;
  trustLevel: number;
  currentStreak: number;
  bestStreak: number;
  badgeCount: number;
  challengesCompleted: number;
  updatedAt: string | null;
  rank?: number;
};

type LeaderboardState = {
  me: LeaderboardProfile | null;
  daily: LeaderboardProfile[];
  weekly: LeaderboardProfile[];
  allTime: LeaderboardProfile[];
};

type WalletInsight = {
  id: string;
  title: string;
  body: string;
  detail: string;
  icon: string;
  tone: "green" | "orange" | "red" | "gold";
};

type SmartInsightContext = {
  debtRadarTotals?: DebtRadarTotals;
  growthPlanner?: GrowthPlannerState;
  /** Same exchange-rate map used by Home totals; keeps Smart Insights in the same display currency. */
  exchangeRates?: ExchangeRateMap;
  oldExpenseCurrencyMissingCount?: number;
};

type V2IdentityStats = {
  weeklySurvivalScore: number;
  biggestLeakCategory: string;
  biggestLeakAmount: number;
  weeklyLeaks: number;
  monthlyLeaks: number;
  lifeHoursLost: number;
  status: string;
  statusDetail: string;
  doomAlertTitle: string;
  doomAlertBody: string;
  selfRoast: string;
};

type DailyRoutineActionKey =
  | "openedApp"
  | "reviewedWallet"
  | "reviewedDay"
  | "lockedNextMove"
  | "checkedChart"
  | "checkedSave"
  | "sharedProgress";

type DailyRoutineActions = {
  date: string;
  openedApp: boolean;
  reviewedWallet: boolean;
  reviewedDay: boolean;
  lockedNextMove: boolean;
  checkedChart: boolean;
  checkedSave: boolean;
  sharedProgress: boolean;
};

type DailyRoutineRewardState = {
  date: string;
  claimed: boolean;
};

type ActiveStreakProofAction = "track_leak" | "clean_day" | "one_fix" | "daily_challenge" | "daily_routine";

type ActiveStreakProofLog = {
  date: string;
  actions: ActiveStreakProofAction[];
};

type ActiveStreakProofState = {
  logs: ActiveStreakProofLog[];
  recoveredMissedDates: string[];
  recoveryUsedAt: string | null;
  updatedAt?: string;
};

type ActiveStreakProofStatus = {
  currentStreak: number;
  bestStreak: number;
  progressDays: number;
  eligible: boolean;
  activeToday: boolean;
  todayActions: ActiveStreakProofAction[];
  recoveryMode: boolean;
  recoveryAvailable: boolean;
  recoveryUsedRecently: boolean;
  recoveryActionsNeeded: number;
  recoveryMissedDate: string | null;
  lastProofDate: string | null;
  label: string;
  detail: string;
};

type ActiveStreakProofTimelineDay = {
  date: string;
  label: string;
  dayName: string;
  protected: boolean;
  recovered: boolean;
  isToday: boolean;
  isYesterday: boolean;
  actions: ActiveStreakProofAction[];
};

type RewardNotificationPrefs = {
  dailyProofReminder: boolean;
  recoveryReminder: boolean;
  milestoneReminder: boolean;
  reminderTime: string;
  updatedAt?: string;
};

type ProfileShareItemId =
  | "survival"
  | "walletHp"
  | "streak"
  | "badges"
  | "rank"
  | "biggestLeak"
  | "lifeHours"
  | "status"
  | "holder";

type ProfileShareSettings = {
  enabledItems: ProfileShareItemId[];
};

type ProfileShareMetric = {
  label: string;
  value: string;
  detail?: string;
};

type ReturnHookAction = "add_leak" | "check_chart" | "share_result" | "keep_streak";

type ReturnHookGoal = {
  createdAt: string;
  targetDate: string;
  action: ReturnHookAction;
  title: string;
  detail: string;
};

type CommunityMessage = {
  id: string;
  senderName: string;
  username: string | null;
  text: string;
  source: "telegram" | "web" | "system";
  createdAt: string;
};

type AppToast = {
  id: number;
  title: string;
  detail: string;
  tone: "xp" | "badge" | "info";
};

const APP_NOTIFY_EVENT = "broke-app-notify";

function notifyApp(title: string, detail = "", tone: AppToast["tone"] = "info") {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(APP_NOTIFY_EVENT, {
      detail: {
        title,
        detail,
        tone,
      },
    })
  );
}

type LeakReflectionTone = "needed" | "maybe" | "leak" | "pattern" | "heavy";

type LeakReflection = {
  id: number;
  title: string;
  body: string;
  insight: string;
  amountLabel: string;
  necessaryAmountLabel?: string;
  categoryLabel: string;
  needType: NeedType;
  categoryCount: number;
  categoryTotalLabel: string;
  question: string;
  exampleAnswer: string;
  icon: string;
  tone: LeakReflectionTone;
};

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

type TelegramState = {
  isTelegram: boolean;
  user: TelegramUser | null;
  platform: string;
  version: string;
  colorScheme: string;
  startParam: string;
  initData: string;
};

type WebAuthState = {
  authenticated: boolean;
  loading: boolean;
  user: TelegramUser | null;
};

type AdminAccessState = {
  canSeePanel: boolean;
  sourceLabel: string;
  telegramId: string;
  connectedWallet: string;
  treasuryWallet: string;
  walletAllowed: boolean;
  treasuryMatched: boolean;
  telegramAllowed: boolean;
  treasuryConfigured: boolean;
  walletConfigured: boolean;
};

type AdminLegitimateHolderRow = {
  rank: number;
  telegramId: string;
  username: string;
  displayName: string;
  walletAddress: string;
  verifiedBalance: number;
  activeStreakDays: number;
  balanceSharePercent: number;
  todayProtected: boolean;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
};

type AdminHoldersResponse = {
  ok: boolean;
  error?: string;
  generatedAt?: string;
  mintAddress?: string;
  treasuryWallet?: string;
  topLegitimateHolders?: AdminLegitimateHolderRow[];
  eligiblePayoutCandidates?: AdminLegitimateHolderRow[];
  summary?: {
    snapshotDate: string;
    totalUsersScanned: number;
    totalVerifiedWallets: number;
    totalEligibleHolders: number;
    totalEligibleBalance: number;
    minHold: number;
    minStreak: number;
  };
  notes?: string[];
};
type AdminDistributionSaveResponse = {
  ok: boolean;
  error?: string;
  distribution?: {
    id: string;
    status: string;
    mode?: "test" | "real_manual";
    poolToken: string;
    poolAmount: number;
    recipientCount: number;
    calculatedTotal: number;
    createdAt: string;
  };
  safety?: {
    noTokenTransfers?: boolean;
    noWalletSigning?: boolean;
    noPrivateKey: boolean;
    noServerTokenTransfers?: boolean;
    walletSigningNotExecutedByServer?: boolean;
    readyForManualTreasurySend?: boolean;
  };
  autoSend?: AdminDistributionUpdateResponse;
  updated?: number;
  sentCount?: number;
  totalCount?: number;
  status?: string;
  payoutWallet?: string;
  records?: Array<{ rank: number; walletAddress: string; txSignature: string }>;
};

type AdminDistributionUpdateResponse = {
  ok: boolean;
  error?: string;
  distributionId?: string;
  updated?: number;
  sentCount?: number;
  totalCount?: number;
  status?: string;
  payoutWallet?: string;
  records?: Array<{ rank: number; walletAddress: string; txSignature: string }>;
};

type AdminDistributionSmokeResponse = {
  ok: boolean;
  error?: string;
  buildVersion?: string;
  smoke?: {
    ok: boolean;
    total: number;
    passed: number;
    failed: number;
  };
};

type AdminDistributionSmokeStatus = "idle" | "checking" | "passed" | "failed";


type CloudStatus = "local" | "syncing" | "cloud" | "error";

type BrokeApiResponse = {
  ok: boolean;
  settings?: Settings;
  expenses?: Expense[];
  expense?: Expense;
  streak?: Streak;
  challengeTemplates?: ChallengeTemplate[];
  activeChallenge?: UserChallenge | null;
  challengeProgress?: ChallengeProgress | null;
  badges?: BadgeItem[];
  leaderboard?: LeaderboardState;
  appState?: CloudAppState;
  appStateCloudSync?: boolean;
  patternHistory?: PatternHistoryRecord[];
  patternHistorySaved?: boolean;
  patternHistoryRecord?: PatternHistoryRecord | null;
  expenseCurrencyRepair?: { updated: number; cloudExpenseSync: boolean };
  xpAwarded?: number;
  error?: string;
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
    start_param?: string;
  };
  platform?: string;
  version?: string;
  colorScheme?: string;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  HapticFeedback?: {
    impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred?: (type: "error" | "success" | "warning") => void;
    selectionChanged?: () => void;
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const STORAGE_KEY = "broke-life-tracker-v1";
const LEAK_MISSION_KEY = "broke-local-leak-mission-v1";
const ONBOARDING_KEY = "broke-life-tracker-onboarding-completed-v1";
const APP_MODE_KEY = "broke-app-mode-v1";
const LOCAL_APP_STATE_CHANGE_EVENT = "broke-local-app-state-change";
const PROJECT_X_URL = "https://x.com/SmokeIsBroke";
const PROJECT_TG_URL = "https://t.me/SmokeIsBrokeSol";
const TELEGRAM_WEB_APP_SCRIPT = "https://telegram.org/js/telegram-web-app.js";
const TELEGRAM_LOGIN_SCRIPT = "https://telegram.org/js/telegram-widget.js?22";
const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "BrokeLifeTrackerBot";
const BROKE_TOKEN_MINT_ADDRESS = (process.env.NEXT_PUBLIC_BROKE_TOKEN_MINT || DEFAULT_BROKE_TOKEN_MINT_ADDRESS).trim();
const TREASURY_WALLET_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS || DEFAULT_TREASURY_WALLET_ADDRESS).trim();
const ADMIN_TELEGRAM_IDS = parseAdminCsv(
  process.env.NEXT_PUBLIC_BROKE_ADMIN_TELEGRAM_IDS || process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_IDS || ""
);
const ADMIN_WALLET_ADDRESSES = parseAdminCsv(
  [process.env.NEXT_PUBLIC_BROKE_ADMIN_WALLET_ADDRESSES || "", TREASURY_WALLET_ADDRESS]
    .filter(Boolean)
    .join(",")
);

const emptyTelegramState: TelegramState = {
  isTelegram: false,
  user: null,
  platform: "browser",
  version: "-",
  colorScheme: "dark",
  startParam: "",
  initData: "",
};

const emptyStreak: Streak = {
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  updatedAt: null,
};

const A = {
  appFrog: "/01_app_frog_icon.png",
  homeMascot: "/02_main_home_mascot.png",
  chartFrog: "/03_mini_chart_card_frog_sticker.png",
  addFrog: "/04_add_screen_small_frog_icon.png",
  whatIfFrog: "/05_what_if_banner_frog_icon.png",
  walletMascot: "/06_wallet_mascot_icon.png",

  income: "/07_income_dashboard_icon.png",
  lifeCost: "/08_life_cost_dashboard_icon.png",
  leaks: "/09_money_leaks_dashboard_icon.png",
  balance: "/10_real_balance_dashboard_icon.png",
  walletHp: "/11_wallet_hp_icon.png",

  coffee: "/12_category_coffee.png",
  smoking: "/13_category_smoking.png",
  takeouts: "/14_category_takeouts.png",
  shopping: "/15_category_shopping.png",
  subscriptions: "/16_category_subscriptions.png",
  taxi: "/17_category_taxi.png",
  custom: "/18_category_custom.png",

  bell: "/19_icon_bell_notification.png",
  back: "/20_icon_back_arrow.png",
  help: "/21_icon_help_question.png",
  export: "/22_icon_export_share.png",
  pencil: "/23_icon_pencil_edit.png",
  calendar: "/24_icon_calendar.png",

  navHome: "/25_nav_home.png",
  navAdd: "/26_nav_add.png",
  navChart: "/27_nav_chart.png",
  navWhatIf: "/28_nav_what_if.png",
  navSettings: "/29_nav_settings.png",

  currency: "/30_icon_currency_settings.png",
  reminder: "/31_icon_daily_reminder.png",
  categories: "/32_icon_custom_categories.png",
  deleteData: "/33_icon_delete_my_data.png",

  streakFire: "/34_streak_fire_icon.png",
  streakFrog: "/35_streak_card_frog.png",
  bestStreak: "/36_best_streak_icon.png",
  dailyCheck: "/37_daily_check_icon.png",
  progressFlame: "/38_progress_flame_badge.png",
  streakBroken: "/39_streak_broken_icon.png",

  challengeTakeout: "/40_challenge_takeout.png",
  challengeSmoking: "/41_challenge_smoking.png",
  challengeCoffee: "/42_challenge_coffee.png",
  challengeShopping: "/43_challenge_shopping.png",
  challengeSubscriptions: "/44_challenge_subscriptions.png",
  challengeWalletRecovery: "/45_challenge_wallet_recovery.png",
  challengeLocked: "/46_challenge_locked.png",
  challengeCompleted: "/47_challenge_completed.png",
  challengeFailed: "/48_challenge_failed.png",
  challengeTrophy: "/49_challenge_trophy.png",

  badgeStableWallet: "/badge_stable_wallet.png",
  badgeSmallLeak: "/badge_small_leak.png",
  badgePressureMode: "/badge_pressure_mode.png",
  badgeHeavyLeak: "/badge_heavy_leak.png",
  badgeFullBrokeMode: "/badge_full_broke_mode.png",
  badgeSavingMode: "/badge_saving_mode.png",
  badgeGoodMonth: "/badge_good_month.png",
  badgeOverspending: "/badge_overspending.png",
  badgeRecoveryMode: "/badge_recovery_mode.png",
  badgeStreak: "/badge_streak.png",

  badgeFirstExpense: "/badge_first_expense.png",
  badge10Expenses: "/badge_10_expenses.png",
  badge50Expenses: "/badge_50_expenses.png",
  badge100Expenses: "/badge_100_expenses.png",
  badgeDailyTracker: "/badge_daily_tracker.png",
  badge3DayStreak: "/badge_3_day_streak.png",
  badge7DayStreak: "/badge_7_day_streak.png",
  badge14DayStreak: "/badge_14_day_streak.png",
  badge30DayStreak: "/badge_30_day_streak.png",
  badgeStreakSaver: "/badge_streak_saver.png",
  badgeFirstChallenge: "/badge_first_challenge.png",
  badgeChallengeComplete: "/badge_challenge_complete.png",
  badge3Challenges: "/badge_3_challenges.png",
  badge5Challenges: "/badge_5_challenges.png",
  badgeChallengeMaster: "/badge_challenge_master.png",
  badgeFirst100Xp: "/badge_first_100_xp.png",
  badge1000Xp: "/badge_1000_xp.png",
  badgeTop10Daily: "/badge_top_10_daily.png",
  badgeTop10Weekly: "/badge_top_10_weekly.png",
  badgeTrustLevel3: "/badge_trust_level_3.png",

  premiumBadgeEarlySupporter: "/premium_badge_early_supporter.png",
  premiumBadgeFounder: "/premium_badge_founder.png",
  premiumBadgeOgTracker: "/premium_badge_og_tracker.png",
  premiumBadgeWalletKing: "/premium_badge_wallet_king.png",
  premiumBadgeDiamondHands: "/premium_badge_diamond_hands.png",
  premiumBadgeLeakDestroyer: "/premium_badge_leak_destroyer.png",
  premiumBadgeChallengeElite: "/premium_badge_challenge_elite.png",
  premiumBadgeStreakLegend: "/premium_badge_streak_legend.png",
  premiumBadgeTop1Daily: "/premium_badge_top_1_daily.png",
  premiumBadgeTop1Weekly: "/premium_badge_top_1_weekly.png",
  premiumBadgeTop3Daily: "/premium_badge_top_3_daily.png",
  premiumBadgeTop3Weekly: "/premium_badge_top_3_weekly.png",
  premiumBadge5000Xp: "/premium_badge_5000_xp.png",
  premiumBadge10000Xp: "/premium_badge_10000_xp.png",
  premiumBadgeTrustLegend: "/premium_badge_trust_legend.png",
};

const defaultCategoryNames: Record<string, string> = {
  Coffee: "Coffee",
  Smoking: "Smoking",
  Takeouts: "Takeouts",
  Shopping: "Shopping",
  Subscriptions: "Subscriptions",
  Taxi: "Taxi",
  Data: "Data",
  School: "School",
  Snacks: "Snacks",
  Gaming: "Gaming",
  Family: "Family",
  Custom: "Custom",
};

const profileShareItemIds = [
  "survival",
  "walletHp",
  "streak",
  "badges",
  "rank",
  "biggestLeak",
  "lifeHours",
  "status",
  "holder",
] as const satisfies readonly ProfileShareItemId[];

const defaultProfileShareSettings: ProfileShareSettings = {
  enabledItems: ["survival", "walletHp", "streak", "badges"],
};

const defaultHolderTier: HolderTier = {
  id: "none",
  label: "No BROKE yet",
  range: "0%",
  description: "No tracked $BROKE balance found for this wallet.",
};

const defaultWalletLinkSettings: WalletLinkSettings = {
  walletAddress: "",
  isVerified: false,
  provider: "watch",
  brokeBalance: 0,
  percentOfSupply: 0,
  holderTier: defaultHolderTier,
  lastCheckedAt: "",
  verifiedAt: "",
  showHolderStatus: true,
  showTokenBalance: false,
};

const CUSTOM_AVATAR_UNLOCK_BALANCE = 500_000;
const CUSTOM_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const defaultSettings: Settings = {
  currency: defaultCurrency,
  currencyMode: "display",
  language: "en",
  dailyReminder: true,
  onboardingCompleted: false,
  profile: {
    region: "Global",
    country: "Global",
    lifeMode: "Worker",
    incomeStyle: "Monthly",
    hasRent: true,
    workHoursPerMonth: 160,
  },
  income: {
    salary: 2800,
    side: 600,
    other: 450,
  },
  incomeCurrencies: {
    salary: defaultCurrency,
    side: defaultCurrency,
    other: defaultCurrency,
  },
  fixedCosts: {
    rent: 1200,
    utilities: 200,
    food: 350,
    transport: 150,
    phone: 80,
    data: 0,
    education: 0,
  },
  fixedCostCurrencies: {
    rent: defaultCurrency,
    utilities: defaultCurrency,
    food: defaultCurrency,
    transport: defaultCurrency,
    phone: defaultCurrency,
    data: defaultCurrency,
    education: defaultCurrency,
  },
  survival: {
    nextPaydayDate: "",
  },
  privacy: {
    publicProofMode: true,
  },
  identity: {
    nickname: "",
    avatarPreset: "default",
    identityStyle: "classic",
    statusText: "Broke, but self-aware",
    customAvatarUrl: "",
    customAvatarUpdatedAt: "",
  },
  shareProfile: defaultProfileShareSettings,
  wallet: defaultWalletLinkSettings,
  categoryNames: defaultCategoryNames,
};

const emptyCosts: Settings["fixedCosts"] = {
  rent: 0,
  utilities: 0,
  food: 0,
  transport: 0,
  phone: 0,
  data: 0,
  education: 0,
};

const incomeKeys = ["salary", "side", "other"] as const;
const fixedCostKeys = ["rent", "utilities", "food", "transport", "phone", "data", "education"] as const;

type IncomeKey = (typeof incomeKeys)[number];
type FixedCostKey = (typeof fixedCostKeys)[number];

function currencyMapForKeys<T extends readonly string[]>(keys: T, currency: Currency) {
  return keys.reduce((acc, key) => {
    acc[key as T[number]] = currency;
    return acc;
  }, {} as Record<T[number], Currency>);
}

const regionPresets: Record<
  RegionPreset,
  {
    country: string;
    currency: Currency;
    workHoursPerMonth: number;
    fixedCosts: Settings["fixedCosts"];
  }
> = {
  Global: {
    country: "Global",
    currency: "USD",
    workHoursPerMonth: 160,
    fixedCosts: emptyCosts,
  },
  Custom: {
    country: "",
    currency: "USD",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  Nigeria: {
    country: "Nigeria",
    currency: "NGN",
    workHoursPerMonth: 120,
    fixedCosts: { ...emptyCosts, food: 25000, transport: 12000, data: 7000 },
  },
  Ghana: {
    country: "Ghana",
    currency: "GHS",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  Kenya: {
    country: "Kenya",
    currency: "KES",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  "South Africa": {
    country: "South Africa",
    currency: "ZAR",
    workHoursPerMonth: 140,
    fixedCosts: emptyCosts,
  },
  Pakistan: {
    country: "Pakistan",
    currency: "PKR",
    workHoursPerMonth: 120,
    fixedCosts: { ...emptyCosts, food: 18000, transport: 7000, data: 2500 },
  },
  India: {
    country: "India",
    currency: "INR",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  Bangladesh: {
    country: "Bangladesh",
    currency: "BDT",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  Philippines: {
    country: "Philippines",
    currency: "PHP",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  Indonesia: {
    country: "Indonesia",
    currency: "IDR",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  Vietnam: {
    country: "Vietnam",
    currency: "VND",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  Thailand: {
    country: "Thailand",
    currency: "THB",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  Malaysia: {
    country: "Malaysia",
    currency: "MYR",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  Brazil: {
    country: "Brazil",
    currency: "BRL",
    workHoursPerMonth: 140,
    fixedCosts: emptyCosts,
  },
  Mexico: {
    country: "Mexico",
    currency: "MXN",
    workHoursPerMonth: 140,
    fixedCosts: emptyCosts,
  },
  Turkey: {
    country: "Turkey",
    currency: "TRY",
    workHoursPerMonth: 140,
    fixedCosts: emptyCosts,
  },
  Egypt: {
    country: "Egypt",
    currency: "EGP",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  Morocco: {
    country: "Morocco",
    currency: "MAD",
    workHoursPerMonth: 120,
    fixedCosts: emptyCosts,
  },
  UAE: {
    country: "United Arab Emirates",
    currency: "AED",
    workHoursPerMonth: 160,
    fixedCosts: emptyCosts,
  },
  "Saudi Arabia": {
    country: "Saudi Arabia",
    currency: "SAR",
    workHoursPerMonth: 160,
    fixedCosts: emptyCosts,
  },
  "United Kingdom": {
    country: "United Kingdom",
    currency: "GBP",
    workHoursPerMonth: 160,
    fixedCosts: emptyCosts,
  },
  Canada: {
    country: "Canada",
    currency: "CAD",
    workHoursPerMonth: 160,
    fixedCosts: emptyCosts,
  },
  Australia: {
    country: "Australia",
    currency: "AUD",
    workHoursPerMonth: 160,
    fixedCosts: emptyCosts,
  },
  Moldova: {
    country: "Moldova",
    currency: "MDL",
    workHoursPerMonth: 160,
    fixedCosts: { ...emptyCosts, rent: 5000, utilities: 1500, food: 3500, transport: 800, phone: 250 },
  },
  Romania: {
    country: "Romania",
    currency: "RON",
    workHoursPerMonth: 160,
    fixedCosts: emptyCosts,
  },
  Ukraine: {
    country: "Ukraine",
    currency: "UAH",
    workHoursPerMonth: 160,
    fixedCosts: emptyCosts,
  },
  Poland: {
    country: "Poland",
    currency: "PLN",
    workHoursPerMonth: 160,
    fixedCosts: emptyCosts,
  },
  Europe: {
    country: "Europe",
    currency: "EUR",
    workHoursPerMonth: 160,
    fixedCosts: { ...emptyCosts, rent: 700, utilities: 160, food: 280, transport: 80, phone: 35 },
  },
  "United States": {
    country: "United States",
    currency: "USD",
    workHoursPerMonth: 160,
    fixedCosts: { ...emptyCosts, rent: 1200, utilities: 200, food: 350, transport: 150, phone: 80 },
  },
};

const regionOptions = Object.keys(regionPresets) as RegionPreset[];
const lifeModeOptions: LifeMode[] = [
  "Student",
  "Worker",
  "Freelancer",
  "Living with family",
  "No stable income",
];
const incomeStyleOptions: IncomeStyle[] = [
  "Monthly",
  "Weekly",
  "Daily",
  "Allowance",
  "Irregular",
];

const currencyOptions: {
  value: Currency;
  label: string;
}[] = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "MDL", label: "MDL (L)" },
  { value: "NGN", label: "NGN (₦)" },
  { value: "PKR", label: "PKR (Rs)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "INR", label: "INR (₹)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
  { value: "NZD", label: "NZD (NZ$)" },
  { value: "ZAR", label: "ZAR (R)" },
  { value: "GHS", label: "GHS (₵)" },
  { value: "KES", label: "KES (KSh)" },
  { value: "UGX", label: "UGX (USh)" },
  { value: "TZS", label: "TZS (TSh)" },
  { value: "XAF", label: "XAF (FCFA)" },
  { value: "XOF", label: "XOF (CFA)" },
  { value: "EGP", label: "EGP (£)" },
  { value: "MAD", label: "MAD" },
  { value: "TRY", label: "TRY (₺)" },
  { value: "AED", label: "AED" },
  { value: "SAR", label: "SAR" },
  { value: "PHP", label: "PHP (₱)" },
  { value: "IDR", label: "IDR (Rp)" },
  { value: "VND", label: "VND (₫)" },
  { value: "THB", label: "THB (฿)" },
  { value: "MYR", label: "MYR (RM)" },
  { value: "SGD", label: "SGD (S$)" },
  { value: "BDT", label: "BDT (৳)" },
  { value: "LKR", label: "LKR (Rs)" },
  { value: "NPR", label: "NPR (Rs)" },
  { value: "BRL", label: "BRL (R$)" },
  { value: "MXN", label: "MXN ($)" },
  { value: "UAH", label: "UAH (₴)" },
  { value: "PLN", label: "PLN (zł)" },
  { value: "RON", label: "RON" },
  { value: "GEL", label: "GEL (₾)" },
  { value: "KZT", label: "KZT (₸)" },
];


const languageOptions: {
  value: Language;
  label: string;
}[] = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
];

const ruText: Record<string, string> = {
  "$BROKE": "$BROKE",
  "$BROKE Chart": "$BROKE Chart",
  "$BROKE Chart?": "$BROKE Chart?",
  "$BROKE Community": "$BROKE Community",
  "$BROKE Life Tracker": "$BROKE Life Tracker",
  "$BROKE Life Tracker guide": "Гайд $BROKE Life Tracker",
  "$BROKE RESULT": "$BROKE RESULT",
  "$BROKE Score": "$BROKE Score",
  "$BROKE Score updated": "$BROKE Score обновлён",
  "Home": "Главная",
  "Add": "Добавить",
  "Chart": "График",
  "Save": "Экономия",
  "Rewards": "Награды",
  "Settings": "Настройки",
  "Back": "Назад",
  "Action": "Действие",
  "Close": "Закрыть",
  "Close guide": "Закрыть гайд",
  "Guide": "Гайд",
  "How to use $BROKE": "Как пользоваться $BROKE",
  "Got it": "Понятно",
  "Income": "Доход",
  "Life Cost": "Расходы жизни",
  "Money Leaks": "Утечки денег",
  "Real Balance": "Реальный баланс",
  "Real balance": "Реальный баланс",
  "This month": "За месяц",
  "Left to stack": "Осталось накопить",
  "Wallet HP": "Wallet HP",
  "Stable Wallet": "Стабильный кошелёк",
  "Small Leak": "Малая утечка",
  "Hold the line, fix the leaks.": "Держи линию. Закрывай утечки.",
  "Your wallet": "Твой кошелёк",
  "is not broken.": "не сломан.",
  "It is leaking.": "Он протекает.",
  "Your wallet is quiet. Keep it that way.": "Твой кошелёк спокоен. Держи так же.",
  "Life Profile": "Профиль жизни",
  "Make the tracker fit your country, currency, and lifestyle.": "Настрой приложение под страну, валюту и свой образ жизни.",
  "Language": "Язык",
  "Country preset": "Страна из списка",
  "Your country": "Твоя страна",
  "Type your country": "Напиши свою страну",
  "Currency": "Валюта",
  "Life mode": "Тип жизни",
  "Income style": "Тип дохода",
  "Rent applies": "Есть аренда",
  "Work / study hours per month": "Рабочие / учебные часы в месяц",
  "Rent mode": "Режим аренды",
  "No-rent mode": "Без аренды",
  "Region": "Регион",
  "Profile": "Профиль",
  "Mode": "Режим",
  "Your tracker fits your life.": "Трекер подстроен под твою жизнь.",
  "Student": "Студент",
  "Worker": "Работник",
  "Freelancer": "Фрилансер",
  "Living with family": "Живу с семьёй",
  "No stable income": "Нет стабильного дохода",
  "Monthly": "Ежемесячно",
  "Weekly": "Неделя",
  "Daily": "День",
  "Allowance": "Карманные / поддержка",
  "Irregular": "Нерегулярно",
  "Allowance / support": "Карманные / поддержка",
  "Freelance income": "Доход фриланса",
  "Expected income": "Ожидаемый доход",
  "Salary": "Зарплата",
  "Side hustle / extra": "Подработка / дополнительно",
  "Other / support": "Другое / поддержка",
  "Estimated monthly": "Примерно за месяц",
  "Estimated monthly income": "Примерный месячный доход",
  "Fixed Life Costs": "Постоянные расходы",
  "Fixed life costs": "Постоянные расходы",
  "Total fixed costs": "Всего постоянных расходов",
  "Total Fixed Costs": "Всего постоянных расходов",
  "Only add what applies. If you live with family or you are a student, rent can stay off.": "Добавляй только то, что относится к тебе. Если живёшь с семьёй или учишься, аренду можно отключить.",
  "Use the way money actually comes to you: salary, allowance, daily, weekly, or irregular.": "Укажи, как деньги реально приходят к тебе: зарплата, поддержка, ежедневно, еженедельно или нерегулярно.",
  "Yes": "Да",
  "No": "Нет",
  "On": "Вкл",
  "Off": "Выкл",
  "Visible": "Видимый",
  "Hidden": "Скрыто",
  "Hide": "Скрыть",
  "Show": "Показать",
  "Open": "Открыть",
  "Join": "Войти",
  "Private": "Приватно",
  "Public progress": "Публичный прогресс",
  "Public Leaderboard": "Публичный рейтинг",
  "Private mode": "Приватный режим",
  "Leaderboard: private": "Рейтинг: приватно",
  "Amount": "Сумма",
  "Category": "Категория",
  "Was it needed?": "Это было нужно?",
  "Needed": "Нужно",
  "Maybe": "Возможно",
  "Not needed": "Не нужно",
  "Needed = necessary. It protects accuracy and does not count as a leak.": "Needed = необходимо. Это сохраняет точность и не считается утечкой.",
  "Maybe = grey zone. $BROKE counts half of it as leak pressure.": "Maybe = серая зона. $BROKE считает половину как давление утечки.",
  "Not needed = full leak. It lowers Wallet HP and powers Rewards/Growth insights.": "Not needed = полная утечка. Она снижает Wallet HP и питает инсайты Rewards/Growth.",
  "New expenses are now saved with their original currency.": "Новые расходы теперь сохраняются с исходной валютой.",
  "New entries remember this currency for future conversion.": "Новые записи запоминают эту валюту для будущей конвертации.",
  "Currency currently changes display only. New entries remember this currency for future conversion.": "Валюта пока меняет только отображение. Новые записи запоминают эту валюту для будущей конвертации.",
  "Exchange-rate cache is now prepared server-side. Real conversion stays off until Currency Mode is added.": "Серверный кэш курсов уже подготовлен. Реальная конвертация остаётся выключенной до добавления Currency Mode.",
  "Convert mode now uses cached exchange rates for entries with original currency metadata.": "Convert mode теперь использует кэш курсов для записей с исходной валютой.",
  "Convert mode shows remembered amounts through exchange rates. Inputs still show the currency the number is stored in, so saved values stay safe.": "Конвертированное отображение включено для расходов, доходов, фиксированных расходов, Growth targets и Debt Radar. Non-USD виды также показывают примерный USD-ориентир, где он доступен.",
  "Currency Mode": "Режим валюты",
  "Display only": "Только отображение",
  "Convert values": "Конвертировать значения",
  "Currency changes the symbol only. Existing totals stay exactly as stored.": "Валюта меняет только символ. Существующие суммы остаются как сохранены.",
  "Saved as a preference now. Converted totals turn on in the next step after testing.": "Сейчас это сохраняется как настройка. Пересчитанные суммы включим следующим шагом после теста.",
  "Current behavior": "Текущее поведение",
  "Prepared mode": "Подготовленный режим",
  "No totals are converted yet.": "Суммы пока ещё не конвертируются.",
  "Personal goal amounts added now are saved as": "Суммы личной цели, добавленные сейчас, сохраняются как",
  "for future conversion.": "для будущей конвертации.",
  "Amounts added now are stored with their original currency. Real conversion is still being prepared.": "Суммы, добавленные сейчас, сохраняются с исходной валютой. Реальная конвертация ещё готовится.",
  "Add Expense": "Добавить расход",
  "Track Leak": "Записать утечку",
  "Behavior mode": "Режим поведения",
  "Track the trigger, not only the amount.": "Записывай триггер, а не только сумму.",
  "Amount shows the damage. Decision type and trigger chips help Pattern Lab explain why it happened.": "Сумма показывает ущерб. Тип решения и триггеры помогают Pattern Lab понять, почему это произошло.",
  "New records are saved with their original currency.": "Новые записи сохраняются с исходной валютой.",
  "Quick leak presets": "Быстрые утечки",
  "Leak category": "Категория утечки",
  "Decision type": "Тип решения",
  "Survival cost": "Расход на выживание",
  "necessary": "необходимо",
  "Grey zone": "Серая зона",
  "questionable": "сомнительно",
  "Full leak": "Полная утечка",
  "avoidable": "можно избежать",
  "Survival cost = necessary. It protects accuracy and does not count as a leak.": "Расход на выживание = необходимо. Он сохраняет точность и не считается утечкой.",
  "Grey zone = questionable. $BROKE counts half of it as leak pressure.": "Серая зона = спорно. $BROKE считает половину как давление утечки.",
  "Full leak = avoidable. It lowers Wallet HP and powers Rewards/Growth insights.": "Полная утечка = можно было избежать. Она снижает Wallet HP и питает инсайты Rewards/Growth.",
  "Trigger chips": "Триггеры",
  "optional, but useful": "необязательно, но полезно",
  "Pattern context": "Контекст паттерна",
  "No trigger selected yet": "Триггер пока не выбран",
  "Selected triggers are saved as structured context. The note keeps safe fallback tags for older versions.": "Выбранные триггеры сохраняются как структурированный контекст. Заметка сохраняет безопасные fallback-теги для старых версий.",
  "Add context... e.g. tired after work": "Добавь контекст... например устал после работы",
  "Track honestly. The app cannot detect a pattern without context.": "Записывай честно. Без контекста приложение не увидит паттерн.",
  "First-session promise": "Обещание первой сессии",
  "One real leak should unlock one useful insight.": "Одна реальная утечка должна открыть один полезный инсайт.",
  "No spreadsheet feeling. Save a leak, read the signal, then decide the next move.": "Без ощущения таблицы. Сохрани утечку, прочитай сигнал и выбери следующий шаг.",
  "This is not a finance dashboard. It is a first-session loop: track one real leak, see what it did to Wallet HP, then get one clear next move.": "Это не финансовый дашборд. Это цикл первой сессии: запиши одну реальную утечку, увидь влияние на Wallet HP и получи следующий понятный шаг.",
  "Track one leak": "Запиши одну утечку",
  "Save one real expense, then mark it as Survival, Grey zone, or Full leak.": "Сохрани один реальный расход и отметь его как выживание, серую зону или полную утечку.",
  "Read Wallet HP": "Проверь Wallet HP",
  "See whether the month is stable or whether small leaks are creating pressure.": "Увидь, месяц стабилен или мелкие утечки уже создают давление.",
  "Get the pattern": "Получи паттерн",
  "Pattern Lab starts explaining the trigger behind the leak, not just the amount.": "Pattern Lab начинает объяснять триггер за утечкой, а не только сумму.",
  "private numbers can wait. The first result should come fast.": "приватные цифры могут подождать. Первый результат должен появиться быстро.",
  "Track leak": "Записать утечку",
  "Read pattern": "Прочитать паттерн",
  "Take next move": "Сделать следующий шаг",
  "New here?": "Новичок?",
  "Do not fill the whole app first.": "Не заполняй всё приложение сначала.",
  "Track one real leak. That is enough to unlock Wallet HP, the first chart signal, and a useful next move.": "Запиши одну реальную утечку. Этого достаточно, чтобы открыть Wallet HP, первый сигнал графика и полезный следующий шаг.",
  "After saving this leak": "После сохранения этой утечки",
  "Wallet HP updates": "Wallet HP обновится",
  "Pattern Lab learns context": "Pattern Lab изучит контекст",
  "Next move becomes clearer": "Следующий шаг станет понятнее",
  "Tip: choose one trigger if you know it. This is what makes future pattern reads feel personal.": "Совет: выбери один триггер, если знаешь его. Это делает будущие паттерны более личными.",
  "Start with one action. This screen is the loop: track a leak, read the pattern, then come back tomorrow.": "Начни с одного действия. Этот экран — цикл: запиши утечку, прочитай паттерн и вернись завтра.",
  "Open Track Leak": "Открыть Track Leak",
  "Stress": "Стресс",
  "Boredom": "Скука",
  "Impulse": "Импульс",
  "After payday": "После зарплаты",
  "Late night": "Поздняя ночь",
  "Social pressure": "Давление окружения",
  "Weekend": "Выходные",
  "Habit": "Привычка",
  "pressure buy": "покупка под давлением",
  "nothing to do": "нечего делать",
  "fast decision": "быстрое решение",
  "money just landed": "деньги только пришли",
  "low discipline": "мало дисциплины",
  "others pushed it": "повлияли другие",
  "weekend mode": "режим выходных",
  "repeat loop": "повторяющийся цикл",
  "Add a quick note...": "Добавь короткую заметку...",
  "Track daily leaks. Small leaks sink big wallets.": "Записывай утечки каждый день. Малые утечки топят большие кошельки.",
  "Expense tracked": "Расход записан",
  "Expense cloud save failed": "Не удалось сохранить расход в облако",
  "Expense cloud delete failed": "Не удалось удалить расход из облака",
  "Delete expense": "Удалить расход",
  "Coffee": "Кофе",
  "Smoking": "Курение",
  "Takeouts": "Еда на заказ",
  "Shopping": "Покупки",
  "Subscriptions": "Подписки",
  "Taxi": "Такси",
  "Data": "Интернет",
  "School": "Учёба",
  "Snacks": "Перекусы",
  "Gaming": "Игры",
  "Family": "Семья",
  "Custom": "Другое",
  "delivery / takeout": "доставка / еда на заказ",
  "custom": "другое",
  "takeout": "еда на заказ",
  "Latest Records": "Последние записи",
  "Recent Expenses": "Последние расходы",
  "No records yet.": "Записей пока нет.",
  "No records": "Записей нет",
  "No leaks tracked yet. Add your first expense.": "Утечек пока нет. Добавь первый расход.",
  "No tracked expenses this month.": "В этом месяце расходов пока нет.",
  "Tracked Expenses": "Записанные расходы",
  "Total records": "Всего записей",
  "Month spent": "Расходы за месяц",
  "Marked leaks": "Отмеченные утечки",
  "No activity": "Нет активности",
  "Wallet Survival": "Выживание кошелька",
  "This week": "Эта неделя",
  "Find the leak before it becomes your lifestyle.": "Найди утечку, пока она не стала стилем жизни.",
  "Public proof without private numbers.": "Найди утечку, пока она не стала образом жизни.",
  "See what drains you, how much it costs, and what to fix next.": "Смотри, что тебя сливает, сколько это стоит и что исправить дальше.",
  "Survival Score": "Оценка выживания",
  "Your weekly wallet score.": "Недельная оценка кошелька.",
  "Biggest Leak": "Главная утечка",
  "No visible leak this week.": "На этой неделе явной утечки нет.",
  "Hours Lost": "Потерянные часы",
  "Time traded for leaks.": "Время, обменянное на утечки.",
  "Status": "Статус",
  "Doomspending Alert": "Тревога импульсивных трат",
  "Leak detected": "Утечка найдена",
  "No doomspending detected": "Импульсивные траты не найдены",
  "Self-roast insight": "Самоироничный инсайт",
  "No leak": "Нет утечки",
  "None": "Нет",
  "No Not needed / Maybe spending was marked this week.": "На этой неделе не было расходов, отмеченных как Не нужно / Возможно.",
  "Full $BROKE Mode": "Полный $BROKE Mode",
  "Leak Survivor": "Выживший кошелёк",
  "Leak Pressure": "Давление утечек",
  "Pressure": "Давление",
  "Alert": "Тревога",
  "Survivor": "Выжил",
  "Stable": "Стабильно",
  "You kept the wallet clean this week.": "Ты держал кошелёк чистым на этой неделе.",
  "Small leaks exist, but the wallet is holding.": "Мелкие утечки есть, но кошелёк держится.",
  "The leaks are visible now. Fix the pattern.": "Утечки уже видны. Исправь паттерн.",
  "Random spending is starting to become a lifestyle.": "Случайные траты начинают превращаться в стиль жизни.",
  "The wallet is under pressure. Stop the bleeding.": "Кошелёк под давлением. Останови слив.",
  "The leak was already there. Now it is visible.": "Утечка уже была. Теперь она видна.",
  "Daily Routine": "Ежедневная рутина",
  "7 real actions protect the streak.": "7 реальных действий защищают страйк.",
  "Complete the routine through real actions. Finish 7/7 to protect today’s Active Streak.": "Выполняй рутину реальными действиями. Закрой 7/7, чтобы защитить сегодняшний Active Streak.",
  "Open the app": "Открыть приложение",
  "Start the day with a wallet check.": "Начни день с проверки кошелька.",
  "Track 1 expense": "Записать 1 расход",
  "Add at least one real expense today.": "Добавь хотя бы один реальный расход сегодня.",
  "Mark a real leak": "Отметить реальную утечку",
  "Add one expense as Not needed or Maybe.": "Отметь один расход как Не нужно или Возможно.",
  "Add context": "Добавить контекст",
  "Add a note to one expense so the habit is visible.": "Добавь заметку к одному расходу, чтобы привычка стала видимой.",
  "Check $BROKE Chart": "Проверить $BROKE Chart",
  "Open the Chart tab and look at today’s damage.": "Открой график и посмотри сегодняшний урон.",
  "Check Rewards plan": "Проверить Rewards plan",
  "Open Rewards and review one leak-cut scenario.": "Открой Rewards и проверь один сценарий сокращения утечки.",
  "Share public proof": "Поделиться публичным прогрессом",
  "Share or copy a safe progress card. No private money data.": "Поделись или скопируй безопасную карточку прогресса. Без личных финансовых данных.",
  "Discipline rule:": "Правило дисциплины:",
  "you cannot tap tasks complete. Complete the action, then the checkmark appears.": "нельзя просто нажать и закрыть задание. Сделай действие — тогда появится галочка.",
  "Daily Routine proof ready": "Daily Routine proof готов",
  "Active Streak protected": "Active Streak защищён",
  "Streak protected": "Страйк защищён",
  "7/7 complete": "7/7 выполнено",
  "Daily Routine now counts as Active Streak proof. No XP claim needed.": "Daily Routine теперь засчитывается как proof для Active Streak. XP claim не нужен.",
  "No Telegram claim needed for routine streak proof.": "Telegram claim не нужен для routine streak proof.",
  "Daily routine complete": "Ежедневная рутина выполнена",
  "Daily Routine proof already saved.": "Daily Routine proof уже сохранён.",
  "Share Result": "Поделиться результатом",
  "Telegram / X ready": "Готово для Telegram / X",
  "Public share card": "Публичная карточка",
  "Public share hides income and real balance.": "Публичная карточка скрывает доход и реальный баланс.",
  "Share cards hide income and real balance. They only show safe public progress like Wallet HP, status, score, rank, streak and badges.": "Share-карточки скрывают доход и реальный баланс. Они показывают только безопасный публичный прогресс: Wallet HP, статус, счёт, место, серию и бейджи.",
  "Potential yearly savings": "Потенциальная экономия за год",
  "Anti-doomspending identity app.": "Анти-думспендинг identity app.",
  "Share on X": "Поделиться в X",
  "Share in TG": "Поделиться в TG",
  "Share": "Поделиться",
  "Copy share text": "Скопировать текст",
  "Copied": "Скопировано",
  "Preparing image...": "Готовим картинку...",
  "Send clean image to TG": "Отправить чистую картинку в TG",
  "Image was sent to your Telegram bot chat. Open the bot chat and forward it anywhere.": "Картинка отправлена в чат с Telegram-ботом. Открой бота и перешли её куда нужно.",
  "Telegram WebView cannot share image files directly. Bot delivery failed too, so the PNG was downloaded.": "Telegram WebView не может напрямую делиться файлами изображений. Отправка через бота тоже не прошла, поэтому PNG скачан.",
  "Image sharing was cancelled or is not supported by this browser.": "Отправка изображения отменена или не поддерживается этим браузером.",
  "Could not create share image.": "Не удалось создать картинку для share.",
  "Leak": "Утечка",
  "Top": "Топ",
  "Hours lost": "Потерянные часы",
  "Survival": "Выживание",
  "Today": "Сегодня",
  "Today's Damage": "Урон сегодня",
  "Today’s leak": "Сегодняшняя утечка",
  "Today&apos;s Leak": "Сегодняшняя утечка",
  "Last 7 days": "Последние 7 дней",
  "7D Preview": "7 дней",
  "Day": "День",
  "Week": "Неделя",
  "Month": "Месяц",
  "Current point": "Текущая точка",
  "Spending Volume — Last 7 days": "Объём расходов — последние 7 дней",
  "tracked today": "записано сегодня",
  "Damage": "Урон",
  "You watch crypto charts every day.": "Ты каждый день смотришь crypto-чарты.",
  "But do you watch your own": "Но смотришь ли ты свой",
  "But do you watch your own $BROKE Chart?": "Но смотришь ли ты свой $BROKE Chart?",
  "Cut one leak.": "Урежь одну утечку.",
  "Survive better.": "Выживай увереннее.",
  "Potential leak cut": "Потенциальное сокращение утечек",
  "Yearly leak reduction": "Годовое сокращение утечек",
  "Potential Saved": "Потенциальная экономия",
  "Based on your tracked expenses this month.": "На основе твоих расходов за месяц.",
  "Demo mode. Add expenses to get real scenarios.": "Демо-режим. Добавь расходы, чтобы увидеть реальные сценарии.",
  "Simulate a 30-day save": "Симуляция экономии на 30 дней",
  "Daily Save": "Экономия в день",
  "Start Saving": "Начать экономить",
  "Emergency Fund": "Резервный фонд",
  "New Gadget": "Новый гаджет",
  "Trip": "Поездка",
  "Financial Freedom": "Финансовая свобода",
  "Cut Taxi": "Сократить такси",
  "Reduce Smoking": "Сократить курение",
  "Cut Coffee": "Сократить кофе",
  "reduction": "сокращение",
  "Leak Challenges": "Челленджи против утечек",
  "Active Challenge": "Активный челлендж",
  "No Takeout 3 Days": "3 дня без еды на заказ",
  "Coffee Control": "Контроль кофе",
  "Smoking Cut 7 Days": "7 дней сокращения курения",
  "Shopping Freeze": "Заморозка покупок",
  "Subscription Killer": "Убийца подписок",
  "Wallet HP Recovery": "Восстановление Wallet HP",
  "First Challenge": "Первый челлендж",
  "Challenge Complete": "Челлендж выполнен",
  "Challenge Master": "Мастер челленджей",
  "Complete your first challenge.": "Выполни первый челлендж.",
  "Complete 3 challenges.": "Выполни 3 челленджа.",
  "Complete 5 challenges.": "Выполни 5 челленджей.",
  "Complete 10 challenges.": "Выполни 10 челленджей.",
  "Keep takeout spending under the limit for 3 days.": "Держи расходы на еду на заказ ниже лимита 3 дня.",
  "Keep coffee leaks under control for one week.": "Держи утечки на кофе под контролем одну неделю.",
  "Reduce smoking spend for one week.": "Сократи расходы на курение на одну неделю.",
  "Avoid random shopping leaks for 7 days.": "Избегай случайных покупок 7 дней.",
  "Control subscriptions and recurring costs.": "Контролируй подписки и повторяющиеся расходы.",
  "Keep total leaks low and rebuild Wallet HP.": "Держи утечки низкими и восстанови Wallet HP.",
  "Start your first leak challenge.": "Начни первый челлендж против утечек.",
  "Completed": "Выполнено",
  "Failed": "Провалено",
  "Locked": "Закрыто",
  "Start": "Начать",
  "Active now": "Активно",
  "All leaks": "Все утечки",
  "Leaderboard joined": "Рейтинг подключён",
  "Leaderboard update failed": "Не удалось обновить рейтинг",
  "How does this leaderboard work?": "Как работает этот рейтинг?",
  "Daily Top 10": "Топ-10 дня",
  "Weekly Top 10": "Топ-10 недели",
  "All Time": "За всё время",
  "You are hidden from public ranking.": "Ты скрыт из публичного рейтинга.",
  "Your public progress is visible.": "Твой публичный прогресс виден.",
  "Your score": "Твой счёт",
  "Trust L1": "Доверие L1",
  "Badge Vault": "Хранилище бейджей",
  "Achievements are hidden": "Достижения скрыты",
  "Unlocked badge": "Бейдж открыт",
  "Badge unlocked": "Бейдж открыт",
  "First Expense": "Первый расход",
  "Daily Tracker": "Ежедневный трекер",
  "Daily Streak": "Ежедневная серия",
  "Streak Saver": "Сохранённая серия",
  "Pressure Mode": "Режим давления",
  "Good Month": "Хороший месяц",
  "Heavy Leak": "Сильная утечка",
  "Overspending": "Перерасход",
  "Saving Mode": "Режим экономии",
  "Recovery Mode": "Режим восстановления",
  "100 XP": "100 XP",
  "1000 XP": "1000 XP",
  "10 Logs": "10 записей",
  "50 Logs": "50 записей",
  "100 Logs": "100 записей",
  "3 Day Streak": "Серия 3 дня",
  "7 Day Streak": "Серия 7 дней",
  "14 Day Streak": "Серия 14 дней",
  "30 Day Streak": "Серия 30 дней",
  "3 Challenges": "3 челленджа",
  "5 Challenges": "5 челленджей",
  "Start tracking and the first badges will unlock here.": "Начни записывать расходы, и первые бейджи откроются здесь.",
  "Premium Early Supporter": "Premium Early Supporter",
  "Premium Founder": "Premium Founder",
  "Premium OG Tracker": "Premium OG Tracker",
  "Premium Wallet King": "Premium Wallet King",
  "Premium Diamond Hands": "Premium Diamond Hands",
  "Premium Leak Destroyer": "Premium Leak Destroyer",
  "Premium Challenge Elite": "Premium Challenge Elite",
  "Premium Streak Legend": "Premium Streak Legend",
  "Premium Top 1 Daily": "Premium Top 1 Daily",
  "Premium Top 1 Weekly": "Premium Top 1 Weekly",
  "Premium Top 3 Daily": "Premium Top 3 Daily",
  "Premium Top 3 Weekly": "Premium Top 3 Weekly",
  "Premium 5000 XP": "Premium 5000 XP",
  "Premium 10000 XP": "Premium 10000 XP",
  "Premium Trust Legend": "Premium Trust Legend",
  "Rare early premium badge for active public-test users.": "Редкий ранний premium-бейдж для активных участников публичного теста.",
  "Streak": "Серия",
  "Streak Progress": "Прогресс серии",
  "Current streak": "Текущая серия",
  "Best streak": "Лучшая серия",
  "Best": "Лучшая",
  "Last active": "Последняя активность",
  "Alive today": "Сегодня активна",
  "Start today": "Начни сегодня",
  "Keep going": "Продолжай",
  "Add one expense today to keep the streak alive.": "Добавь один расход сегодня, чтобы сохранить серию.",
  "You already tracked a leak today.": "Ты уже записал утечку сегодня.",
  "Keep a streak alive after building momentum.": "Сохрани серию после набора темпа.",
  "Reach a 3-day tracking streak.": "Достигни серии 3 дня.",
  "Reach a 7-day tracking streak.": "Достигни серии 7 дней.",
  "Reach a 14-day tracking streak.": "Достигни серии 14 дней.",
  "Reach a 30-day tracking streak.": "Достигни серии 30 дней.",
  "Reach a 60-day tracking streak.": "Достигни серии 60 дней.",
  "Account sync": "Синхронизация аккаунта",
  "Cloud synced": "Облако синхронизировано",
  "Cloud sync failed": "Синхронизация облака не удалась",
  "Cloud reset failed": "Сброс облака не удался",
  "Local only": "Только локально",
  "Local demo": "Локальный демо-режим",
  "Web Demo": "Web Demo",
  "Web Synced": "Web синхронизирован",
  "Web cloud": "Web cloud",
  "Web demo mode. Login with Telegram to enable cloud sync.": "Web demo mode. Войди через Telegram, чтобы включить cloud sync.",
  "Website is synced with your Telegram account.": "Сайт синхронизирован с твоим Telegram-аккаунтом.",
  "Website progress now uses the same Supabase profile as your Telegram Mini App.": "Прогресс сайта теперь использует тот же Supabase-профиль, что и Telegram Mini App.",
  "Use one account on website and Telegram": "Один аккаунт для сайта и Telegram",
  "Login with Telegram to sync expenses, streaks, badges, challenges and leaderboard across website and Telegram.": "Войди через Telegram, чтобы синхронизировать расходы, серии, бейджи, челленджи и рейтинг между сайтом и Telegram.",
  "Loading Telegram login...": "Загрузка Telegram login...",
  "Telegram App": "Telegram App",
  "Telegram WebView": "Telegram WebView",
  "Telegram user": "Пользователь Telegram",
  "BrokeLifeTrackerBot": "BrokeLifeTrackerBot",
  "User": "Пользователь",
  "User ID": "User ID",
  "Start param": "Start param",
  "Version": "Версия",
  "Platform": "Платформа",
  "Sync & connection details": "Синхронизация и детали подключения",
  "Syncing...": "Синхронизация...",
  "Checking...": "Проверка...",
  "Sync error": "Ошибка синхронизации",
  "Settings synced": "Настройки синхронизированы",
  "Settings cloud save failed": "Не удалось сохранить настройки в облако",
  "Record updated": "Запись обновлена",
  "Connect Telegram to claim XP.": "Подключи Telegram, чтобы получить XP.",
  "Connect Telegram to use the public leaderboard.": "Подключи Telegram, чтобы использовать публичный рейтинг.",
  "Connect Telegram to sync your account and start challenges.": "Подключи Telegram, чтобы синхронизировать аккаунт и начать челленджи.",
  "Community Live will show recent Telegram group messages once the bot is connected.": "Community Live покажет последние сообщения Telegram-группы после подключения бота.",
  "This sidebar is read-only. Open Telegram if you want to join the conversation.": "Эта панель только для чтения. Открой Telegram, чтобы участвовать в разговоре.",
  "Newest messages stay at the bottom. To reply, open the Telegram group.": "Новые сообщения остаются снизу. Чтобы ответить, открой Telegram-группу.",
  "Read only": "Только чтение",
  "Live Telegram": "Live Telegram",
  "Community feed unavailable": "Community feed недоступен",
  "Loading tracker...": "Загрузка трекера...",
  "Checking your wallet leaks.": "Проверяем утечки кошелька.",
  "Syncing cloud progress...": "Синхронизация облачного прогресса...",
  "Checking your Telegram profile before setup.": "Проверяем Telegram-профиль перед настройкой.",
  "Life Setup": "Настройка жизни",
  "Welcome,": "Привет,",
  "Choose region": "Выбери регион",
  "Set life mode": "Выбери тип жизни",
  "Find local leaks": "Найди локальные утечки",
  "Ready": "Готово",
  "01": "01",
  "02": "02",
  "03": "03",
  "Choose one": "Выбери",
  "Track today": "Записать сегодня",
  "First Leak Mission": "Миссия первой утечки",
  "Catch one leak in under 10 seconds.": "Поймай одну утечку меньше чем за 10 секунд.",
  "First leak": "Первая утечка",
  "Pick a leak": "Выбери утечку",
  "Coffee leak": "Утечка на кофе",
  "Smoking leak": "Утечка на курение",
  "Takeout leak": "Утечка на еду",
  "Random buy": "Случайная покупка",
  "Get insight": "Получить инсайт",
  "First leak tracked": "Первая утечка записана",
  "First leak cloud save failed": "Не удалось сохранить первую утечку в облако",
  "Help": "Помощь",
  "1. Set your Life Profile": "1. Настрой профиль жизни",
  "2. Add real expenses": "2. Добавляй реальные расходы",
  "3. Mark leaks honestly": "3. Отмечай утечки честно",
  "4. Use Daily Routine": "4. Используй ежедневную рутину",
  "5. Read Wallet Survival": "5. Смотри выживание кошелька",
  "6. Check the $BROKE Chart": "6. Проверяй $BROKE Chart",
  "7. Share safely": "7. Делись безопасно",
  "$BROKE is not a normal expense tracker. It helps you find wallet leaks, build discipline, and share safe progress.": "$BROKE — не обычный трекер расходов. Он помогает видеть утечки денег, строить дисциплину и делиться безопасным прогрессом.",
  "Choose your country or type your own, set currency, life mode, income style, rent mode and work/study hours. This makes the app fit your real life.": "Выбери страну или напиши свою, задай валюту, тип жизни, тип дохода, аренду и часы работы/учёбы. Так app подстроится под твою реальность.",
  "Go to Add, enter the amount, choose a category, and mark if it was Needed, Maybe, or Not needed.": "Открой Добавить, введи сумму, выбери категорию и отметь: Нужно, Возможно или Не нужно.",
  "Needed does not count as a leak. Maybe counts as half. Not needed counts as a full wallet leak.": "Нужно не считается утечкой. Возможно считается наполовину. Не нужно считается полной утечкой.",
  "Complete 7 real daily actions: open app, track expense, mark a leak, add context, check chart, check Rewards, and share public proof.": "Выполни 7 реальных действий в день: открыть app, записать расход, отметить утечку, добавить контекст, проверить график, проверить Rewards и поделиться безопасным прогрессом.",
  "Survival Score, Biggest Leak, Hours Lost, Status and Doomspending Alert show what is draining your wallet this week.": "Оценка выживания, главная утечка, потерянные часы, статус и тревога импульсивных трат показывают, что сливает кошелёк на этой неделе.",
  "The chart shows Wallet Pressure, not fake profit candles. Green days are controlled. Red days mean leak danger.": "График показывает Wallet Pressure, а не fake profit свечи. Зелёные дни — контроль. Красные — опасная утечка.",
  "Simple rule:": "Простое правило:",
  "Track honestly. Fix one leak at a time. Protect Wallet HP.": "Записывай честно. Закрывай одну утечку за раз. Защищай Wallet HP.",
  "No clear leak yet": "Явной утечки пока нет",
  "Leak Insight": "Инсайт утечки",
  "Rent comparison": "Сравнение с арендой",
  "Hidden bill": "Скрытый счёт",
  "Repeating pattern": "Повторяющийся паттерн",
  "Monthly projection": "Прогноз на месяц",
  "Wallet HP warning": "Предупреждение Wallet HP",
  "Wallet still breathing": "Кошелёк ещё держится",
  "Challenge signal": "Сигнал для челленджа",
  "A large share of your free money is leaking away.": "Большая часть свободных денег утекает.",
  "You spent more than your post-life-cost budget.": "Ты потратил больше, чем бюджет после обязательных расходов.",
  "Real balance dropped to danger zone.": "Реальный баланс опустился в опасную зону.",
  "A streak and better habits pushed the wallet back up.": "Серия и лучшие привычки подняли кошелёк обратно.",
  "A strong month with healthy balance and discipline.": "Сильный месяц со здоровым балансом и дисциплиной.",
  "No leak detected yet. Add expenses and mark Maybe / Not needed to find patterns.": "Утечка пока не найдена. Добавь расходы и отмечай Возможно / Не нужно, чтобы увидеть паттерны.",
  "That is no longer a small purchase. That is a pattern.": "Это уже не мелкая покупка. Это паттерн.",
  "It looks small until you compare it to a real bill.": "Кажется мелочью, пока не сравнишь с настоящим счётом.",
  "This is where the wallet starts leaking quietly.": "Вот здесь кошелёк начинает тихо протекать.",
  "Small leaks this week are already bigger than your phone bill.": "Мелкие утечки за неделю уже больше счёта за телефон.",
  "One time is a purchase. Repeating is a habit.": "Один раз — покупка. Повторяется — привычка.",
  "That is not one mistake. That is the monthly rhythm.": "Это не одна ошибка. Это месячный ритм.",
  "The wallet is not broken. It is bleeding through repeated decisions.": "Кошелёк не сломан. Он кровоточит через повторяющиеся решения.",
  "Good. Now keep the leaks from turning into a monthly bill.": "Хорошо. Теперь не дай утечкам стать ежемесячным счётом.",
  "This is a good moment to start a": "Это хороший момент начать",
  "control challenge": "челлендж контроля",
  "Global": "Глобально",
  "Nigeria": "Нигерия",
  "Ghana": "Гана",
  "Kenya": "Кения",
  "South Africa": "ЮАР",
  "Pakistan": "Пакистан",
  "India": "Индия",
  "Bangladesh": "Бангладеш",
  "Philippines": "Филиппины",
  "Indonesia": "Индонезия",
  "Vietnam": "Вьетнам",
  "Thailand": "Таиланд",
  "Malaysia": "Малайзия",
  "Brazil": "Бразилия",
  "Mexico": "Мексика",
  "Turkey": "Турция",
  "Egypt": "Египет",
  "Morocco": "Марокко",
  "UAE": "ОАЭ",
  "Saudi Arabia": "Саудовская Аравия",
  "United Kingdom": "Великобритания",
  "Canada": "Канада",
  "Australia": "Австралия",
  "Moldova": "Молдова",
  "Romania": "Румыния",
  "Ukraine": "Украина",
  "Poland": "Польша",
  "Europe": "Европа",
  "United States": "США",
  "United Arab Emirates": "ОАЭ",
  "Utilities": "Коммунальные",
  "Food basics": "Базовая еда",
  "Transport": "Транспорт",
  "Phone": "Телефон",
  "Data / Internet": "Интернет / связь",
  "School / study": "Школа / учёба",
  "Rent": "Аренда",
  "Tap for all": "Смотреть все",
  "Unlocked": "Открыто",
  "Top pending": "В ожидании",
  "Permanent": "Постоянный",
  "Notifications": "Уведомления",
  "Daily Reminder": "Ежедневное напоминание",
  "Delete My Data": "Удалить мои данные",
  "Delete all $BROKE Life Tracker data?": "Удалить все данные $BROKE Life Tracker?",
  "Menu": "Меню",
  "Trust Level 3": "Доверие 3 уровня",
  "Reach Trust Level 3.": "Достигни доверия 3 уровня.",
  "Reach Trust Level 3 with strong total XP.": "Достигни доверия 3 уровня с высоким общим XP.",
  "Earn your first 100 XP.": "Заработай первые 100 XP.",
  "Earn 1000 total XP.": "Заработай 1000 XP всего.",
  "Earn 5000 total XP.": "Заработай 5000 XP всего.",
  "Earn 10000 total XP.": "Заработай 10000 XP всего.",
  "Track your first expense.": "Запиши первый расход.",
  "Track 10 expenses.": "Запиши 10 расходов.",
  "Track 50 expenses.": "Запиши 50 расходов.",
  "Track 100 expenses.": "Запиши 100 расходов.",
  "Track a serious number of expenses over time.": "Запиши серьёзное количество расходов со временем.",
  "Track a few expenses and $BROKE will show what your wallet is trying to tell you.": "Запиши несколько расходов, и $BROKE покажет, что кошелёк пытается сказать.",
  "Track a month with only small leaks.": "Пройди месяц только с малыми утечками.",
  "Keep Wallet HP high and leaks low.": "Держи Wallet HP высоким, а утечки низкими.",
  "Keep Wallet HP elite while actively tracking.": "Держи Wallet HP на элитном уровне, активно записывая расходы.",
  "Destroy leaks through completed challenges.": "Уничтожай утечки через выполненные челленджи.",
  "Build trust, XP, and challenge activity early.": "Рано строй доверие, XP и активность в челленджах.",
  "Hold long-term discipline without breaking momentum.": "Держи долгосрочную дисциплину без потери темпа.",
  "Reach top 10 in Daily Movers.": "Попади в топ-10 Daily Movers.",
  "Reach top 10 in Weekly Discipline.": "Попади в топ-10 Weekly Discipline.",
  "Reach top 3 in Daily Movers.": "Попади в топ-3 Daily Movers.",
  "Reach top 3 in Weekly Discipline.": "Попади в топ-3 Weekly Discipline.",
  "Reach #1 in Daily Movers.": "Стань #1 в Daily Movers.",
  "Reach #1 in Weekly Discipline.": "Стань #1 в Weekly Discipline.",
  "English": "English",
  "Russian": "Русский",
  "Русский": "Русский",
  "USD": "USD",
  "EUR": "EUR",
  "MDL": "MDL",
  "NGN": "NGN",
  "PKR": "PKR",
  "GBP": "GBP",
  "INR": "INR",
  "CAD": "CAD",
  "AUD": "AUD",
  "NZD": "NZD",
  "ZAR": "ZAR",
  "GHS": "GHS",
  "KES": "KES",
  "UGX": "UGX",
  "TZS": "TZS",
  "XAF": "XAF",
  "XOF": "XOF",
  "EGP": "EGP",
  "MAD": "MAD",
  "TRY": "TRY",
  "AED": "AED",
  "SAR": "SAR",
  "PHP": "PHP",
  "IDR": "IDR",
  "VND": "VND",
  "THB": "THB",
  "MYR": "MYR",
  "SGD": "SGD",
  "BDT": "BDT",
  "LKR": "LKR",
  "NPR": "NPR",
  "BRL": "BRL",
  "MXN": "MXN",
  "UAH": "UAH",
  "PLN": "PLN",
  "RON": "RON",
  "GEL": "GEL",
  "KZT": "KZT",
  "USD ($)": "USD ($)",
  "EUR (€)": "EUR (€)",
  "MDL (L)": "MDL (L)",
  "NGN (₦)": "NGN (₦)",
  "PKR (Rs)": "PKR (Rs)",
  "GBP (£)": "GBP (£)",
  "INR (₹)": "INR (₹)",
  "CAD (C$)": "CAD (C$)",
  "AUD (A$)": "AUD (A$)",
  "NZD (NZ$)": "NZD (NZ$)",
  "ZAR (R)": "ZAR (R)",
  "GHS (₵)": "GHS (₵)",
  "KES (KSh)": "KES (KSh)",
  "UGX (USh)": "UGX (USh)",
  "TZS (TSh)": "TZS (TSh)",
  "XAF (FCFA)": "XAF (FCFA)",
  "XOF (CFA)": "XOF (CFA)",
  "EGP (£)": "EGP (£)",
  "TRY (₺)": "TRY (₺)",
  "PHP (₱)": "PHP (₱)",
  "IDR (Rp)": "IDR (Rp)",
  "VND (₫)": "VND (₫)",
  "THB (฿)": "THB (฿)",
  "MYR (RM)": "MYR (RM)",
  "SGD (S$)": "SGD (S$)",
  "BDT (৳)": "BDT (৳)",
  "LKR (Rs)": "LKR (Rs)",
  "NPR (Rs)": "NPR (Rs)",
  "BRL (R$)": "BRL (R$)",
  "MXN ($)": "MXN ($)",
  "UAH (₴)": "UAH (₴)",
  "PLN (zł)": "PLN (zł)",
  "GEL (₾)": "GEL (₾)",
  "KZT (₸)": "KZT (₸)",
  "days": "дней",
  "day": "день",
  "done": "выполнено",
  "unlocked": "открыто",
  "this week": "на этой неделе",
  "today": "сегодня",
  "latest": "последних",
  "All": "Все",
  "survival": "выживание",
  "Leak:": "Утечка:",
  "Ready for Telegram / X": "Готово для Telegram / X",
  "X ready": "Готово для X",
  "14/45 unlocked": "14/45 открыто",
  "Spending Volume": "Объём расходов",
  "Spending Volume — Последние 7 дней": "Объём расходов — последние 7 дней",
  "Last 7 дней": "Последние 7 дней",
  "Latest Expenses": "Последние расходы",
  "Challenge": "Челлендж",
  "Could go alone": "Можно было без этого",
  "crypto charts": "крипто-графики",
  "crypto-chartы": "крипто-графики",
  "You watch crypto-chartы every день.": "Ты каждый день смотришь крипто-графики.",
  "Trust": "Доверие",
  "streak": "серия",
  "badges": "бейджей",
  "badge": "бейдж",
  "challenges": "челленджей",
  "challenge": "челлендж",
  "How does this ranking work?": "Как работает этот рейтинг?",
  "Hours lost:": "Потеряно часов:",
  "#1 Daily": "#1 за день",
  "Cut Custom": "Сократить другое",
  "Cut custom": "Сократить другое",
  "Today Mission": "Миссия на сегодня",
  "Protect your Wallet HP today.": "Защити Wallet HP сегодня.",
  "Track one real expense, avoid your biggest leak, and keep the routine alive.": "Запиши один реальный расход, избегай главной утечки и сохрани рутину.",
  "Track one real expense": "Записать один реальный расход",
  "Avoid biggest leak:": "Избегай главной утечки:",
  "Keep daily discipline alive": "Сохрани ежедневную дисциплину",
  "Yearly risk": "Риск за год",
  "Track now": "Записать сейчас",
  "active": "активно",
  "Quick Add": "Быстрое добавление",
  "amount stays editable": "сумму можно изменить",
  "Latest impact": "Последний эффект",
  "tracked.": "записано.",
  "looks small once. Repeated daily, it becomes a real wallet leak.": "один раз выглядит мелочью. Каждый день — это уже реальная утечка кошелька.",
  "If repeated daily": "Если повторять ежедневно",
  "Yearly damage": "Урон за год",
  "Life hours traded": "Часы жизни обменяны",
  "estimated": "примерно",
  "/month": "/мес",
  "/year": "/год",
  "Takeout": "Еда на заказ",
  "Biggest Leak Challenge": "Челлендж главной утечки",
  "Suggested": "Предложено",
  "Find your first leak": "Найди первую утечку",
  "Start mission": "Начать миссию",
  "Track first leak": "Записать первую утечку",
  "Track mission expense": "Записать расход миссии",
  "Spent": "Потрачено",
  "Limit": "Лимит",
  "Days left": "Дней осталось",
  "3-day target": "Цель на 3 дня",
  "Possible save": "Можно сохранить",
  "Mission started": "Миссия началась",
  "Track a leak first": "Сначала запиши утечку",
  "Add one Not needed or Maybe expense.": "Добавь один расход Не нужно или Возможно.",
  "Mission active": "Миссия активна",
  "Mission survived": "Миссия пройдена",
  "Mission survived.": "Миссия пройдена.",
  "Mission failed": "Миссия провалена",
  "Mission failed.": "Миссия провалена.",
  "Mission in progress.": "Миссия в процессе.",
  "Mission Result": "Результат миссии",
  "You stayed under the leak limit. Wallet HP protected.": "Ты удержался ниже лимита утечки. Wallet HP защищён.",
  "The leak broke the limit. Reset and run it back.": "Утечка пробила лимит. Сбрось и попробуй снова.",
  "Keep tracking. The result card unlocks when this mission ends.": "Продолжай записывать. Карточка результата откроется после завершения миссии.",
  "Saved": "Сохранено",
  "Over limit": "Сверх лимита",
  "Protected": "Защищён",
  "Share result": "Поделиться результатом",
  "Start new mission": "Новая миссия",
  "$BROKE Mission Result": "$BROKE Результат миссии",
  "Copy mission result": "Скопируй результат миссии",
  "Wallet HP protected.": "Wallet HP защищён.",
  "Mission result copied. Paste it in Telegram, X, or anywhere you want.": "Результат миссии скопирован. Вставь его в Telegram, X или куда нужно.",
  "Mission image was sent to your Telegram bot chat.": "Картинка миссии отправлена в чат с Telegram-ботом.",
  "Mission image downloaded. You can post it in Telegram or X.": "Картинка миссии скачана. Её можно опубликовать в Telegram или X.",
  "$BROKE MISSION": "$BROKE МИССИЯ",
  "Limit broken": "Лимит пробит",
  "Wallet HP protected": "Wallet HP защищён",
  "Days": "Дни",
  "Result": "Результат",
  "Survived": "Выжил",

  "Chart Pulse": "Пульс графика",
  "tracked": "записано",
  "No damage yet": "Пока без урона",
  "records": "записей",
  "leak pressure": "давление утечек",
  "Add expenses to make the chart alive.": "Добавь расходы, чтобы график ожил.",
  "Leaks": "Утечки",
  "pressure": "давление",
  "Top category": "Главная категория",
  "Avg/day": "Среднее/день",
  "daily pace": "дневной темп",
  "No chart data yet": "Пока нет данных для графика",
  "Add one expense and this screen turns into your Wallet Pressure Chart.": "Добавь один расход, и экран станет Wallet Pressure Chart.",
  "Wallet Survival Report": "Отчёт выживания кошелька",
  "Wallet Insights": "Инсайты кошелька",
  "View": "Смотреть",
  "Badges": "Бейджи",
  "Public card": "Публичная карточка",
  "Connection": "Подключение",
  "Telegram": "Telegram",
  "Synced": "Синхронизировано",
  "Web": "Веб",
  "Challenges": "Челленджи",
  "Active": "Активно",
  "Choose": "Выбрать",
  "Optional": "Опционально",
  "Leak Cut Scenarios": "Сценарии сокращения утечек",
  "ideas": "идей",
  "Income Setup": "Настройка дохода",
  "month": "месяц",
  "Clean UI": "Чистый интерфейс",
  "Next Best Action": "Следующее лучшее действие",
  "Start with one honest record. The app gets smarter after real data.": "Начни с одной честной записи. Приложение становится умнее после реальных данных.",
  "Avoid random spending today": "Избегай случайных трат сегодня",
  "Avoid": "Избегай",
  "Wallet HP is under pressure. Protect it by blocking the biggest leak for one day.": "Wallet HP под давлением. Защити его, заблокировав главную утечку на один день.",
  "Control random spending": "Контролируй случайные траты",
  "Control": "Контролируй",
  "This is the loudest leak right now. Keep it under control before it becomes normal.": "Это самая громкая утечка сейчас. Держи её под контролем, пока она не стала нормой.",
  "Track next move": "Записать следующий шаг",
  "Keep the wallet clean": "Держи кошелёк чистым",
  "No major leak detected. Keep tracking and protect the streak.": "Крупной утечки не видно. Продолжай записывать и защищай серию.",
  "7 actions to keep your wallet alive today.": "7 действий, чтобы кошелёк сегодня выжил.",
  "Your weekly score, status, and biggest leak.": "Твой недельный счёт, статус и главная утечка.",
  "See what habit is draining you most.": "Смотри, какая привычка сливает больше всего.",
  "Create a clean public progress card.": "Создай чистую публичную карточку прогресса.",
  "Preview wallet movement and today’s damage.": "Предпросмотр движения кошелька и сегодняшнего урона.",
  "Pick a leak-control mission when you are ready.": "Выбери миссию контроля утечки, когда будешь готов.",
  "Only public progress. No income or balance exposed.": "Только публичный прогресс. Доход и баланс не раскрываются.",
  "Test how much you could save by reducing leaks.": "Проверь, сколько можно сохранить, если сократить утечки.",
  "Adjust income without exposing private data publicly.": "Настрой доход без публичного раскрытия личных данных.",
  "Rent, food, transport, internet, and basics.": "Аренда, еда, транспорт, интернет и базовые расходы.",
  "Daily / Weekly Reports": "Дневные / недельные отчёты",
  "Generate quick shareable wallet reports.": "Создавай быстрые отчёты кошелька для шаринга.",
  "Reports": "Отчёты",
  "Daily Wallet Report": "Дневной отчёт кошелька",
  "Weekly Wallet Report": "Недельный отчёт кошелька",
  "Clean day": "Чистый день",
  "Small leak": "Маленькая утечка",
  "Leak warning": "Предупреждение об утечке",
  "Score": "Счёт",
  "Share daily report": "Поделиться дневным отчётом",
  "Share weekly report": "Поделиться недельным отчётом",
  "Privacy rule:": "Правило приватности:",
  "Reports never expose income or real balance.": "Отчёты никогда не показывают доход или реальный баланс.",
  "Report copied. Paste it in Telegram, X, or anywhere you want.": "Отчёт скопирован. Вставь его в Telegram, X или куда нужно.",
  "Copy report": "Скопируй отчёт",
  "$BROKE Daily Wallet Report": "$BROKE Дневной отчёт кошелька",
  "$BROKE Weekly Wallet Report": "$BROKE Недельный отчёт кошелька",
  "Spent today": "Потрачено сегодня",
  "Leaks today": "Утечки сегодня",
  "Daily score": "Дневной счёт",
  "Weekly leaks": "Недельные утечки",
  "Biggest leak": "Главная утечка",
  "Life hours lost": "Потерянные часы жизни",
  "No clear category movement yet today.": "Сегодня пока нет явного движения по категориям.",
  "No major weekly leak is visible yet.": "Крупной недельной утечки пока не видно.",
  "$BROKE DAILY REPORT": "$BROKE ДНЕВНОЙ ОТЧЁТ",
  "$BROKE WEEKLY REPORT": "$BROKE НЕДЕЛЬНЫЙ ОТЧЁТ",
  "Report image was sent to your Telegram bot chat.": "Картинка отчёта отправлена в чат с Telegram-ботом.",
  "Report image downloaded. You can post it in Telegram or X.": "Картинка отчёта скачана. Её можно опубликовать в Telegram или X.",
  "Growth": "Рост",
  "$BROKE Growth Lab": "$BROKE Growth Lab",
  "Leak to Growth": "Утечка в рост",
  "Turn money leaks into future value.": "Превращай денежные утечки в будущую ценность.",
  "Planning only. No real funds, no custody, no staking, and no investments.": "Только симуляция. Реальные средства не вносятся, хранения денег нет, доход не гарантируется.",
  "This month’s detected leaks": "Найденные утечки за месяц",
  "This month's detected leaks": "Найденные утечки за месяц",
  "No leaks yet. Add expenses to create a real plan.": "Утечек пока нет. Добавь расходы, чтобы создать реальный план.",
  "Use detected leaks": "Использовать найденные утечки",
  "Create simulation": "Создать симуляцию",
  "Simulation name": "Название симуляции",
  "Starting amount": "Стартовая сумма",
  "Contribution": "Пополнение",
  "Duration": "Срок",
  "months": "месяцев",
  "Yearly growth": "Годовой рост",
  "% simulated": "% симуляция",
  "Low risk": "Низкий риск",
  "Medium risk": "Средний риск",
  "High risk": "Высокий риск",
  "Reinvest simulated gains": "Реинвестировать симулированную прибыль",
  "Your Growth Simulation": "Твоя симуляция роста",
  "Projected": "Прогноз",
  "Total contributed": "Всего внесено",
  "Final value": "Итоговая сумма",
  "Estimated gain": "Оценочная прибыль",
  "Monthly redirected": "Перенаправлено в месяц",
  "Worst case": "Худший сценарий",
  "Base case": "Базовый сценарий",
  "Best case": "Лучший сценарий",
  "This is only a personal planning simulation. It is not investing, staking, custody, or financial advice.": "Это только симуляция. Это не финансовый совет и не гарантия дохода.",
  "Save plan": "Сохранить симуляцию",
  "Share growth card": "Поделиться карточкой роста",
  "Saved simulations": "Сохранённые симуляции",
  "No saved plans yet.": "Сохранённых планов пока нет.",
  "Create one leak plan and save it here.": "Создай один план утечек и сохрани его здесь.",
  "Growth card saved. Share text copied.": "Карточка роста сохранена. Текст скопирован.",
  "Growth plan copied.": "План роста скопирован.",
  "Leak to Growth Plan": "План утечки в рост",
  "Simulation only. No guaranteed returns.": "Только симуляция. Доход не гарантируется.",
  "Find the leak. Redirect it into growth.": "Найди утечку. Перенаправь её в рост.",
  "Generate share card": "Создать карточку",
  "Creating card...": "Создаём карточку...",
  "Goal card ready": "Карточка цели готова",
  "Saving goal share card preview": "Предпросмотр карточки роста",
  "In Telegram WebView, direct file share can be blocked. Use Download card, copy the text, or long-press the image preview.": "В Telegram WebView прямая отправка файла может блокироваться. Нажми Download card, скопируй текст или удержи изображение предпросмотра.",
  "Download card": "Скачать карточку",
  "Share text copied.": "Текст скопирован.",
  "Growth card generated. Save it from the preview below. Share text copied.": "Карточка создана. Сохрани её из предпросмотра ниже. Текст скопирован.",
  "Growth card generated. Save it from the preview below.": "Карточка создана. Сохрани её из предпросмотра ниже.",
  "Send card to TG bot": "Отправить карточку в TG-бота",
  "Sending to bot...": "Отправляем в бота...",
  "Growth card was sent to your Telegram bot chat. Open the bot chat and forward it anywhere.": "Карточка роста отправлена в чат с Telegram-ботом. Открой бота и перешли её куда нужно.",
  "Telegram bot delivery needs Telegram initData. Open the app inside Telegram and try again. The card preview is ready below and share text was copied.": "Для отправки в Telegram-бота нужен Telegram initData. Открой приложение внутри Telegram и попробуй снова. Предпросмотр карточки готов ниже, текст скопирован.",
  "Telegram bot delivery needs Telegram initData. Open the app inside Telegram and try again. The card preview is ready below.": "Для отправки в Telegram-бота нужен Telegram initData. Открой приложение внутри Telegram и попробуй снова. Предпросмотр карточки готов ниже.",
  "Bot delivery failed. The card preview is ready below and share text was copied.": "Отправка через бота не прошла. Предпросмотр карточки готов ниже, текст скопирован.",
  "Bot delivery failed. The card preview is ready below.": "Отправка через бота не прошла. Предпросмотр карточки готов ниже.",
  "The main flow sends this PNG to your Telegram bot chat. If Telegram blocks delivery, you can still download the card, copy the text, or long-press the preview.": "Основной способ — отправить PNG в чат с Telegram-ботом. Если Telegram заблокирует отправку, можно скачать карточку, скопировать текст или удержать изображение предпросмотра.",
  "Home Guide": "Гайд Home",
  "Home: Wallet Command Center": "Home: центр управления кошельком",
  "Home is the main control room. It shows your Wallet HP, life cost, leaks, daily routine, reports, badges, and the next action to take.": "Home — главный центр управления. Здесь видны Wallet HP, расходы жизни, утечки, ежедневная рутина, отчёты, бейджи и следующее действие.",
  "Daily Home rule": "Правило Home на день",
  "Open Home once per day, read the Next Best Action, then fix one leak instead of trying to change everything at once.": "Открывай Home один раз в день, читай Next Best Action и исправляй одну утечку вместо попытки изменить всё сразу.",
  "1. Read the four main numbers": "1. Прочитай четыре главные цифры",
  "Income shows the money you planned for the period.": "Income показывает деньги, запланированные на период.",
  "Life Cost shows fixed costs like rent, bills, transport, food basics, and required expenses.": "Life Cost показывает фиксированные расходы: аренду, счета, транспорт, базовую еду и обязательные траты.",
  "Money Leaks shows optional or questionable spending that can quietly drain the wallet.": "Money Leaks показывает необязательные или спорные траты, которые тихо сливают кошелёк.",
  "Real Balance shows what is left after costs and tracked spending.": "Real Balance показывает, что осталось после расходов жизни и записанных трат.",
  "2. Understand Wallet HP": "2. Пойми Wallet HP",
  "Wallet HP is the health score of the wallet.": "Wallet HP — это показатель здоровья кошелька.",
  "High HP means the wallet is stable.": "Высокий HP означает, что кошелёк стабилен.",
  "Low HP means leaks are putting pressure on the month.": "Низкий HP означает, что утечки давят на месяц.",
  "The goal is not perfection. The goal is to keep HP alive by reducing the loudest leak.": "Цель не в идеальности. Цель — сохранить HP, уменьшая самую громкую утечку.",
  "3. Use Next Best Action": "3. Используй Next Best Action",
  "Next Best Action tells the user what to do now.": "Next Best Action показывает, что сделать сейчас.",
  "It can suggest adding the first record, controlling the biggest leak, checking the chart, or sharing safe progress.": "Он может предложить добавить первую запись, взять под контроль главную утечку, проверить график или поделиться безопасным прогрессом.",
  "This keeps the app from feeling like a notebook and turns it into a daily discipline tool.": "Так приложение перестаёт быть блокнотом и становится инструментом ежедневной дисциплины.",
  "4. Check reports and cards": "4. Проверяй отчёты и карточки",
  "Daily and weekly reports summarize what happened without exposing private income.": "Дневные и недельные отчёты показывают итоги без раскрытия личного дохода.",
  "Share cards are safe for Telegram or X because they focus on status, Wallet HP, score, leaks, and public progress.": "Share-карточки безопасны для Telegram или X, потому что показывают статус, Wallet HP, счёт, утечки и публичный прогресс.",
  "Use reports when you want community proof without showing sensitive numbers.": "Используй отчёты, когда нужен social proof без личных чисел.",
  "5. Complete the daily routine": "5. Выполняй ежедневную рутину",
  "The routine is not a fake one-click task.": "Рутина — это не фейковое задание в один клик.",
  "It is completed when the user really opens the app, tracks expenses, marks leaks, checks charts, checks Rewards, and shares progress.": "Она выполняется, когда пользователь реально открывает app, записывает расходы, отмечает утечки, смотрит график, проверяет Rewards и делится прогрессом.",
  "This makes $BROKE feel like discipline, not just finance tracking.": "Это делает $BROKE дисциплиной, а не просто учётом финансов.",
  "Add Guide": "Гайд Add",
  "Add: Track Expenses Correctly": "Add: как правильно записывать расходы",
  "Add is where the app becomes honest. Every useful chart, leak score, Growth simulation, and report depends on real records here.": "Add — место, где приложение становится честным. Каждый полезный график, leak score, Growth simulation и отчёт зависят от реальных записей здесь.",
  "Add rule": "Правило Add",
  "Track the expense immediately, choose the real category, and mark Needed / Maybe / Not needed honestly.": "Записывай трату сразу, выбирай реальную категорию и честно отмечай Needed / Maybe / Not needed.",
  "1. Enter the real amount": "1. Вводи реальную сумму",
  "Use the amount field for the exact spending amount.": "Используй поле суммы для точной траты.",
  "Small expenses matter because repeated small leaks become monthly damage.": "Маленькие расходы важны, потому что повторяющиеся мелкие утечки становятся месячным уроном.",
  "Do not wait until the end of the week if you can track the expense now.": "Не жди конца недели, если можно записать расход сейчас.",
  "2. Choose the right category": "2. Выбери правильную категорию",
  "Categories make the biggest leak visible.": "Категории делают главную утечку видимой.",
  "Coffee, smoking, takeout, shopping, transport, subscriptions, and custom categories should be used consistently.": "Кофе, курение, еда на заказ, покупки, транспорт, подписки и свои категории нужно использовать последовательно.",
  "If the same habit is tracked under different names, the app cannot detect the leak properly.": "Если одна привычка записана под разными названиями, app не сможет правильно найти утечку.",
  "3. Mark Needed / Maybe / Not needed": "3. Отмечай Needed / Maybe / Not needed",
  "Needed means the expense was necessary and does not count as a leak.": "Needed означает, что трата была необходимой и не считается утечкой.",
  "Maybe means the expense was questionable and counts as half pressure.": "Maybe означает спорную трату и считается как половина давления.",
  "Not needed means it was a full money leak.": "Not needed означает полноценную money leak.",
  "Honest marking makes Wallet HP, Rewards, Chart, and Growth Lab much more accurate.": "Честная отметка делает Wallet HP, Rewards, Chart и Growth Lab намного точнее.",
  "4. Add notes when context matters": "4. Добавляй заметки, когда важен контекст",
  "Notes explain why the expense happened.": "Заметки объясняют, почему случилась трата.",
  "This helps users notice emotional spending, boredom spending, stress spending, or routine habits.": "Это помогает замечать эмоциональные траты, траты от скуки, стрессовые покупки или привычки.",
  "A short note is enough. The goal is awareness, not paperwork.": "Короткой заметки достаточно. Цель — осознанность, а не бюрократия.",
  "5. Use quick add carefully": "5. Используй Quick Add аккуратно",
  "Quick Add is for repeated expenses.": "Quick Add нужен для повторяющихся расходов.",
  "It is fast, but the amount should still be checked.": "Это быстро, но сумму всё равно нужно проверять.",
  "If the quick amount is wrong, edit it before saving the record.": "Если быстрая сумма неправильная, измени её перед сохранением.",
  "Chart Guide": "Гайд Chart",
  "$BROKE Chart: Wallet Pressure": "$BROKE Chart: давление кошелька",
  "Chart turns spending into daily pressure candles. It helps users see controlled days, leak danger days, and the habits that hurt Wallet HP.": "Chart превращает расходы в дневные свечи давления. Он помогает видеть контролируемые дни, опасные дни утечек и привычки, которые бьют по Wallet HP.",
  "Chart rule": "Правило Chart",
  "Do not only watch crypto charts. Watch your own wallet chart and find the day where the leak started.": "Смотри не только crypto-чарты. Смотри свой график кошелька и находи день, где началась утечка.",
  "1. Choose the right range": "1. Выбери правильный период",
  "Day shows the current daily damage.": "Day показывает текущий дневной урон.",
  "Week shows the last seven days and is best for habits.": "Week показывает последние семь дней и лучше всего подходит для привычек.",
  "Month shows the larger pressure across the current month.": "Month показывает большее давление за текущий месяц.",
  "Switch ranges to understand whether a leak is temporary or becoming normal.": "Переключай периоды, чтобы понять, утечка временная или уже становится нормой.",
  "2. Read leak pressure": "2. Читай leak pressure",
  "Spending volume shows how heavy the outgoing money was.": "Spending volume показывает, насколько тяжёлым был отток денег.",
  "A high volume day is not always bad if it was needed.": "День с большим объёмом не всегда плохой, если траты были нужными.",
  "A high volume day with Not needed or Maybe expenses is a warning signal.": "День с большим объёмом и Not needed / Maybe — это сигнал тревоги.",
  "3. Find the top category": "3. Найди главную категорию",
  "Top category shows the strongest spending movement in the selected period.": "Top category показывает самое сильное движение расходов за выбранный период.",
  "If the same category keeps appearing, it is probably a lifestyle leak.": "Если одна категория появляется снова и снова, это, скорее всего, lifestyle leak.",
  "This is the category to control first.": "Эту категорию нужно контролировать первой.",
  "4. Use Wallet Insights": "4. Используй Wallet Insights",
  "Wallet Insights explain what the chart means in plain language.": "Wallet Insights объясняют график простым языком.",
  "They turn numbers into actions.": "Они превращают цифры в действия.",
  "Use them when a user does not know what to fix next.": "Используй их, когда непонятно, что исправлять дальше.",
  "5. Share only safe chart context": "5. Делись только безопасным контекстом",
  "Chart data can be emotional and personal.": "Данные графика могут быть личными и эмоциональными.",
  "Public sharing should avoid private income and real balance.": "В публичном share не стоит показывать личный доход и реальный баланс.",
  "Use clean share cards or public summaries instead of raw personal numbers.": "Используй clean share cards или публичные итоги вместо личных сырых чисел.",
  "Growth Guide": "Гайд Growth",
  "Growth Lab: Leak to Growth": "Growth Lab: утечка в рост",
  "Growth Lab shows what could happen if money leaks were redirected into saving, building, or simulated growth. It is a planning tool, not staking and not an investment product.": "Growth Lab показывает, что могло бы произойти, если перенаправить money leaks в накопления, развитие или симуляцию роста. Это инструмент планирования, не staking и не инвестиционный продукт.",
  "Growth Lab rule": "Правило Growth Lab",
  "Simulation only. No deposits, no custody, no guaranteed returns, and no financial advice.": "Только симуляция. Без депозитов, без хранения средств, без гарантированной доходности и без финансового совета.",
  "1. Understand what Growth Lab is": "1. Пойми, что такое Growth Lab",
  "Growth Lab is a simulator.": "Growth Lab — это симулятор.",
  "It does not hold user funds.": "Он не хранит деньги пользователей.",
  "It does not promise income.": "Он не обещает доход.",
  "It shows possible outcomes if repeated leaks are redirected into a plan.": "Он показывает возможные сценарии, если повторяющиеся утечки перенаправить в план.",
  "2. Use detected leaks": "2. Используй найденные утечки",
  "Use detected leaks reads the tracked Not needed and Maybe expenses.": "Use detected leaks берёт записанные расходы Not needed и Maybe.",
  "It converts the leak into a weekly contribution idea.": "Он превращает утечку в идею еженедельного пополнения.",
  "This connects the real app data to a simple growth scenario.": "Так реальные данные приложения связываются с простым сценарием роста.",
  "3. Manual simulation": "3. Ручная симуляция",
  "Starting amount is the amount the user begins with.": "Starting amount — сумма, с которой пользователь начинает.",
  "Contribution is the amount added daily, weekly, or monthly.": "Contribution — сумма, добавляемая ежедневно, еженедельно или ежемесячно.",
  "Duration controls how long the simulation runs.": "Duration задаёт срок симуляции.",
  "Yearly growth is only a user-selected assumption.": "Yearly growth — только предположение, выбранное пользователем.",
  "4. Read Worst / Base / Best case": "4. Читай Worst / Base / Best case",
  "Worst case shows a conservative outcome.": "Worst case показывает осторожный сценарий.",
  "Base case uses the selected assumption.": "Base case использует выбранное предположение.",
  "Best case shows a more optimistic path.": "Best case показывает более оптимистичный путь.",
  "These are scenarios, not predictions.": "Это сценарии, а не прогнозы.",
  "5. Share the Growth card": "5. Делись Growth card",
  "Send card to TG bot generates a clean PNG card.": "Send card to TG bot создаёт чистую PNG-карточку.",
  "The bot sends it to the user chat, and the user can forward it anywhere.": "Бот отправляет её пользователю в чат, а пользователь может переслать её куда нужно.",
  "The card is designed for public sharing and does not show private income.": "Карточка создана для публичного share и не показывает личный доход.",
  "Rewards Guide": "Гайд Rewards",
  "Rewards: Leak Cut Scenarios": "Rewards: сценарии сокращения утечек",
  "Rewards shows what could be saved if one leak was reduced. It is the practical side of $BROKE: stop one leak, protect Wallet HP, and build proof of progress.": "Rewards показывает, сколько можно сохранить, если уменьшить одну утечку. Это практическая часть $BROKE: остановить утечку, защитить Wallet HP и создать proof of progress.",
  "Rewards rule": "Правило Rewards",
  "Pick one realistic reduction. A small reduction that actually happens is stronger than a perfect plan that nobody follows.": "Выбери одно реалистичное сокращение. Маленькое сокращение, которое реально выполняется, сильнее идеального плана, которого никто не придерживается.",
  "1. Read potential leak cut": "1. Читай potential leak cut",
  "Potential leak cut shows how much could be protected if spending is reduced.": "Potential leak cut показывает, сколько можно защитить, если уменьшить расходы.",
  "It is based on tracked expenses and selected reduction levels.": "Это основано на записанных расходах и выбранных уровнях сокращения.",
  "If there is no real data, the app can show demo scenarios until expenses are added.": "Если реальных данных нет, app может показывать demo-сценарии до добавления расходов.",
  "2. Adjust reduction levels": "2. Настраивай reduction levels",
  "Each card can simulate cutting a category by a percentage.": "Каждая карточка может симулировать сокращение категории на процент.",
  "This helps the user test realistic changes before committing.": "Это помогает протестировать реалистичные изменения перед решением.",
  "The goal is not to remove life. The goal is to stop the leak that gives the least value.": "Цель не в том, чтобы убрать жизнь. Цель — остановить утечку, которая даёт меньше всего пользы.",
  "3. Start leak challenges": "3. Запускай leak challenges",
  "Challenges turn savings into a simple mission.": "Challenges превращают экономию в простую миссию.",
  "Examples include no takeout, coffee control, smoking cut, shopping freeze, or subscription killer.": "Примеры: no takeout, coffee control, smoking cut, shopping freeze или subscription killer.",
  "Challenges should be concrete and short enough to complete.": "Challenges должны быть конкретными и достаточно короткими, чтобы их реально завершить.",
  "4. Track public progress": "4. Отслеживай публичный прогресс",
  "Leaderboard and challenge progress are public-friendly.": "Leaderboard и progress челленджей подходят для публичного показа.",
  "They show discipline without revealing private financial details.": "Они показывают дисциплину без раскрытия личных финансовых деталей.",
  "This creates community proof around the $BROKE identity.": "Это создаёт community proof вокруг $BROKE identity.",
  "5. Use Rewards with Growth Lab": "5. Используй Rewards вместе с Growth Lab",
  "Rewards shows what can be reduced.": "Rewards показывает, что можно уменьшить.",
  "Growth Lab shows what that saved amount could become in a simulation.": "Growth Lab показывает, чем эта сохранённая сумма могла бы стать в симуляции.",
  "Together they create the full story: find the leak, stop the leak, redirect the leak.": "Вместе они создают полную историю: найти утечку, остановить утечку, перенаправить утечку.",
  "Settings Guide": "Гайд Settings",
  "Settings: Make the App Fit Real Life": "Settings: настрой app под реальную жизнь",
  "Settings controls the life profile behind the calculations. Country, currency, life mode, rent mode, income style, and sync settings make the app realistic for different users.": "Settings управляет life profile за расчётами. Страна, валюта, режим жизни, аренда, стиль дохода и sync делают app реалистичным для разных пользователей.",
  "Settings rule": "Правило Settings",
  "Set the profile once, then update it only when real life changes. Wrong settings create wrong Wallet HP and wrong leak pressure.": "Настрой профиль один раз, потом меняй только при реальных изменениях. Неверные настройки дают неверный Wallet HP и неправильное давление утечек.",
  "1. Life Profile": "1. Life Profile",
  "Life Profile adapts the app to the user.": "Life Profile адаптирует app под пользователя.",
  "A student, worker, freelancer, or person living with family should not be judged by the same assumptions.": "Студент, работник, фрилансер или человек, живущий с семьёй, не должны оцениваться по одним и тем же предположениям.",
  "Country and currency help make numbers feel real.": "Страна и валюта делают числа более реальными.",
  "2. Income setup": "2. Настройка дохода",
  "Income should match the user's real situation.": "Доход должен соответствовать реальной ситуации пользователя.",
  "Monthly, weekly, daily, allowance, and irregular income should be entered differently.": "Monthly, weekly, daily, allowance и irregular income нужно вводить по-разному.",
  "The app uses income to understand pressure, not to expose private data.": "App использует доход, чтобы понять давление, а не чтобы раскрывать личные данные.",
  "3. Fixed costs": "3. Фиксированные расходы",
  "Fixed costs are required costs like rent, bills, transport basics, food basics, school, or family support.": "Fixed costs — обязательные расходы: аренда, счета, базовый транспорт, базовая еда, школа или поддержка семьи.",
  "These costs reduce available money before leaks are calculated.": "Эти расходы уменьшают доступные деньги до расчёта утечек.",
  "If fixed costs are wrong, Wallet HP will feel wrong.": "Если fixed costs неверные, Wallet HP будет казаться неправильным.",
  "4. Sync and account state": "4. Sync и состояние аккаунта",
  "Telegram sync keeps progress connected to the user profile.": "Telegram sync связывает прогресс с профилем пользователя.",
  "Web sync allows website and Telegram usage to match.": "Web sync позволяет сайту и Telegram использовать один прогресс.",
  "If sync shows an error, the app can still work locally until cloud sync recovers.": "Если sync показывает ошибку, app может работать локально до восстановления cloud sync.",
  "5. Data control": "5. Контроль данных",
  "Settings includes reset and data management areas.": "Settings содержит reset и управление данными.",
  "Reset should be used carefully because it can remove local progress.": "Reset нужно использовать осторожно, потому что он может удалить локальный прогресс.",
  "Public cards are safer than raw exports because they hide income and real balance.": "Public cards безопаснее сырых экспортов, потому что скрывают доход и real balance.",
  "Guide tabs": "Вкладки гайда",
  "Wallet Survival Setup": "Настройка выживания кошелька",
  "Fit the app to your life": "Настрой app под свою жизнь",
  "Set money coming in": "Настрой входящие деньги",
  "Set fixed life costs": "Настрой расходы жизни",
  "Prepare the first real leak": "Подготовь первую реальную утечку",
  "Start the 3-day path": "Начни 3-дневный путь",
  "Costs": "Расходы",
  "This is not a boring expense tracker. It is a wallet survival system: find the leak, protect Wallet HP, then redirect the saved money into growth.": "Это не скучный трекер расходов. Это система выживания кошелька: найди утечку, защити Wallet HP, потом перенаправь сохранённые деньги в рост.",
  "Find the leak": "Найди утечку",
  "Track one real expense and mark if it was Needed, Maybe, or Not needed.": "Запиши одну реальную трату и отметь её как Needed, Maybe или Not needed.",
  "Fast Start": "Быстрый старт",
  "Skip the setup. Track one real leak now.": "Пропусти настройку. Запиши одну реальную утечку сейчас.",
  "Best for first-time users: profile, income and fixed costs can be added later.": "Лучше для новых пользователей: профиль, доход и постоянные расходы можно добавить позже.",
  "Fast start: Track leak": "Быстрый старт: записать утечку",
  "Private numbers can wait.": "Личные цифры могут подождать.",
  "Add income later and still reach the first leak. Accuracy improves when you fill it in.": "Добавь доход позже и всё равно дойди до первой утечки. Точность улучшится, когда заполнишь.",
  "Add later": "Добавить позже",
  "Fixed costs can wait.": "Постоянные расходы могут подождать.",
  "Track one real leak first, then return here when you know the monthly numbers.": "Сначала запиши одну реальную утечку, потом вернись сюда, когда будешь знать месячные цифры.",
  "Protect Wallet HP": "Защити Wallet HP",
  "Your HP shows if leaks are putting pressure on the month.": "HP показывает, давят ли утечки на месяц.",
  "Redirect into Growth": "Перенаправь в Growth",
  "Use Growth Lab to simulate what saved leaks could become.": "Используй Growth Lab, чтобы симулировать, во что могли бы превратиться сохранённые утечки.",
  "Privacy rule": "Правило приватности",
  "Public cards hide income and real balance. You share progress, not private numbers.": "Публичные карточки скрывают доход и реальный баланс. Ты делишься прогрессом, а не личными числами.",
  "Make the app local.": "Сделай app локальным.",
  "Country, currency and life mode change the meaning of every number. A student, worker and freelancer should not be judged by the same setup.": "Страна, валюта и life mode меняют смысл каждой цифры. Студент, работник и фрилансер не должны оцениваться по одной настройке.",
  "Set what comes in.": "Настрой, что приходит.",
  "Use the way money actually reaches you: salary, allowance, daily work, weekly pay, or irregular income.": "Укажи, как деньги реально приходят: зарплата, allowance, дневная работа, недельная оплата или нерегулярный доход.",
  "Not public": "Не публично",
  "Income is used for calculations. Share cards do not expose it.": "Доход используется для расчётов. Share-карточки его не показывают.",
  "Set what must be paid.": "Настрой обязательные платежи.",
  "Only add costs that apply. If you live with family or you are a student, rent can stay off.": "Добавляй только те расходы, которые подходят. Если живёшь с семьёй или ты студент, аренду можно отключить.",
  "Real balance before leaks": "Реальный баланс до утечек",
  "Prepare one expense.": "Подготовь одну трату.",
  "This does not create a fake record. It prepares the Add tab so the user can confirm the first real local leak.": "Это не создаёт фейковую запись. Это подготавливает вкладку Add, чтобы пользователь сам подтвердил первую реальную локальную утечку.",
  "Expected amount": "Ожидаемая сумма",
  "Discipline rule": "Правило дисциплины",
  "Do not just click and pretend. After onboarding, Add opens and the record must be saved manually.": "Нельзя просто нажать и притвориться. После onboarding откроется Add, и запись нужно сохранить вручную.",
  "Your wallet system is ready.": "Твоя система кошелька готова.",
  "Needs data": "Нужны данные",
  "First 3-day path": "Первый 3-дневный путь",
  "Day 1 — track your first leak.": "День 1 — запиши первую утечку.",
  "Day 2 — check the chart and biggest leak.": "День 2 — проверь график и главную утечку.",
  "Day 3 — share a safe public result card.": "День 3 — поделись безопасной публичной карточкой результата.",
  "Skip setup": "Пропустить настройку",
  "Open Add and track it": "Открыть Add и записать",
  "First leak from onboarding": "Первая утечка из onboarding",
  "Avoid your biggest leak today": "Избегай главной утечки сегодня",
  "Detected:": "Найдено:",
  "Track a leak first so the app can detect it.": "Сначала запиши утечку, чтобы app смог её найти.",
  "your custom leak": "твоя своя утечка",
  "no leak detected yet": "утечка пока не найдена",
  "Start here": "Начни здесь",
  "Your wallet has no movement yet.": "У кошелька пока нет движения.",
  "Track one real expense to unlock Wallet HP, Chart movement, Rewards scenarios, Growth Lab and share cards.": "Запиши один реальный расход, чтобы открыть Wallet HP, движение графика, Rewards-сценарии, Growth Lab и share-карточки.",
  "Add first expense": "Добавь первый расход",
  "Use a real spend, not a fake test.": "Используй реальную трату, не фейковый тест.",
  "Mark the leak": "Отметь утечку",
  "Needed, Maybe or Not needed.": "Needed, Maybe или Not needed.",
  "Unlock the system": "Открой систему",
  "Chart, Rewards, Growth and reports become real.": "Chart, Rewards, Growth и отчёты станут реальными.",
  "No leaks tracked yet.": "Утечки пока не записаны.",
  "Add your first expense to make Wallet HP, Chart and Growth Lab real.": "Добавь первый расход, чтобы Wallet HP, Chart и Growth Lab стали реальными.",
  "$BROKE Chart is waiting": "$BROKE Chart ждёт",
  "No wallet movement yet.": "Пока нет движения кошелька.",
  "Track one expense to create today’s pressure candle.": "Запиши один расход, чтобы создать сегодняшнюю свечу давления.",
  "Track first expense": "Записать первый расход",
  "Growth Lab needs one real leak": "Growth Lab нужна одна реальная утечка",
  "No leaks detected yet.": "Утечки пока не найдены.",
  "Add one Not needed or Maybe expense first. Then Growth Lab can turn that leak into a realistic plan.": "Сначала добавь один расход Not needed или Maybe. Затем Growth Lab сможет превратить эту утечку в реалистичный план.",
  "Add first leak": "Добавить первую утечку",
  "Rewards is in demo mode": "Rewards в демо-режиме",
  "No real scenarios yet.": "Пока нет реальных сценариев.",
  "Add expenses first. Then $BROKE will show what you could save by reducing your real leaks.": "Сначала добавь расходы. Затем $BROKE покажет, сколько можно сохранить, уменьшая реальные утечки.",
  "Add expense to unlock Rewards": "Добавить расход, чтобы открыть Rewards",
  "First 3-Day User Journey": "Первый 3-дневный путь",
  "complete": "выполнено",
  "Turn first use into a habit.": "Преврати первое использование в привычку.",
  "Follow the first 3 days: track a real leak, read the chart, then share a safe public result card.": "Пройди первые 3 дня: запиши реальную утечку, посмотри график, затем поделись безопасной публичной карточкой.",
  "Track Day 1 leak": "Записать утечку Day 1",
  "Check Chart": "Проверить Chart",
  "Open share card": "Открыть share-карточку",
  "Keep streak alive": "Сохрани серию",
  "Day 1 — Track first leak": "Day 1 — запиши первую утечку",
  "First real movement detected.": "Первое реальное движение найдено.",
  "Add one real Needed / Maybe / Not needed expense.": "Добавь один реальный расход Needed / Maybe / Not needed.",
  "Day 2 — Check Chart": "Day 2 — проверь Chart",
  "Chart checked. You saw the wallet movement.": "Chart проверен. Ты увидел движение кошелька.",
  "Open Chart and find the biggest movement.": "Открой Chart и найди главное движение.",
  "Unlock this after your first expense.": "Откроется после первого расхода.",
  "Day 3 — Share result": "Day 3 — поделись результатом",
  "Public progress shared.": "Публичный прогресс опубликован.",
  "Open the public card and share without private numbers.": "Открой публичную карточку и поделись без личных чисел.",
  "Unlock this after checking Chart.": "Откроется после проверки Chart.",
  "none yet": "пока нет",
  "Return Hook": "Крючок возврата",
  "not locked": "не закреплено",
  "tomorrow": "завтра",
  "Return tomorrow and track one real leak": "Вернись завтра и запиши одну реальную утечку",
  "The first return should create real wallet movement, not a fake click.": "Первое возвращение должно создать реальное движение кошелька, а не фейковый клик.",
  "Return tomorrow and check the chart": "Вернись завтра и проверь график",
  "See if the same leak repeats and where wallet pressure starts.": "Посмотри, повторяется ли та же утечка и где начинается давление на кошелёк.",
  "Return tomorrow and share a safe result": "Вернись завтра и поделись безопасным результатом",
  "Use a public card. It hides income and real balance.": "Используй публичную карточку. Она скрывает доход и реальный баланс.",
  "Return tomorrow and keep the streak alive": "Вернись завтра и сохрани серию",
  "One small real action tomorrow is better than a perfect plan today.": "Одно маленькое реальное действие завтра лучше идеального плана сегодня.",
  "Lock tomorrow goal": "Закрепить цель на завтра",
  "Tomorrow goal locked": "Цель на завтра закреплена",
  "Return hook completed": "Крючок возврата выполнен",
  "Target": "Цель",
  "No fake completion. The app only counts real tracking, chart checks, or real share actions.": "Без фейкового выполнения. App считает только реальные записи, проверки графика или настоящие share-действия.",
  "Today’s Focus": "Фокус на сегодня",
  "Tomorrow Hook": "Крючок на завтра",
  "path": "путь",
  "Track your first real leak": "Запиши первую реальную утечку",
  "One real expense unlocks Wallet HP, Chart, Rewards, Growth Lab and public share cards.": "Один реальный расход открывает Wallet HP, Chart, Rewards, Growth Lab и публичные share-карточки.",
  "Check your wallet movement": "Проверь движение кошелька",
  "Open Chart once and find the category that started the biggest pressure.": "Открой Chart один раз и найди категорию, которая дала главное давление.",
  "Share safe public progress": "Поделись безопасным публичным прогрессом",
  "Open the public card. It hides income and real balance, but shows discipline.": "Открой публичную карточку. Она скрывает доход и реальный баланс, но показывает дисциплину.",
  "Lock one reason to return tomorrow": "Закрепи причину вернуться завтра",
  "The app should not end after one session. Set tomorrow’s real action now.": "App не должен заканчиваться одной сессией. Задай реальное действие на завтра.",
  "Tomorrow goal is locked": "Цель на завтра закреплена",
  "Continue goal": "Продолжить цель",
  "Track": "Запись",
  "First real leak": "Первая реальная утечка",
  "Read": "Анализ",
  "Chart movement": "Движение Chart",
  "Public result": "Публичный результат",
  "Return": "Возврат",
  "Tomorrow hook": "Крючок на завтра",
  "Home is now simplified: one main action here, extra systems below in collapsible sections.": "Home упрощён: здесь одно главное действие, дополнительные системы ниже в раскрывающихся секциях.",
  "Optional 3-day mission built from your real leak pattern.": "Опциональная 3-дневная миссия на основе твоей реальной утечки.",
  "Needs leak": "Нужна утечка",
  "Quick preset if you want to start faster.": "Быстрый пресет, если хочешь начать быстрее.",
  "Survival Mode": "Режим выживания",
  "Can you survive until payday?": "Доживёшь ли ты до следующего дохода?",
  "Surviving until payday": "Доживаешь до следующего дохода",
  "Danger before payday": "Опасность до следующего дохода",
  "Critical wallet pressure": "Критическое давление на кошелёк",
  "Days until income": "Дней до дохода",
  "Safe daily budget": "Безопасный дневной бюджет",
  "Current pace": "Текущий темп",
  "Wallet HP forecast": "Прогноз Wallet HP",
  "Survival forecast": "Прогноз выживания",
  "Safe at current pace": "Безопасно при текущем темпе",
  "Share survival card": "Поделиться survival-карточкой",
  "Creating survival card...": "Создаём survival-карточку...",
  "Can I survive until payday?": "Доживу ли я до дохода?",
  "Safe/day": "Безопасно/день",
  "Current/day": "Сейчас/день",
  "See future damage before it happens.": "Увидь будущий урон до того, как он случится.",
  "Next payday date": "Дата следующего дохода",
  "Used for Survival Mode. Change it anytime after payday.": "Используется для Survival Mode. Можно изменить после зарплаты.",
  "Payday date": "Дата дохода",
  "Survival Mode uses this exact date instead of assuming the 1st of the month.": "Survival Mode использует эту точную дату, а не предполагает 1-е число месяца.",
  "Next payday": "Следующий доход",
  "Monthly Leak History": "Месячная история утечек",
  "Grouped from your saved expenses.": "Сгруппировано из сохранённых расходов.",
  "Total spent": "Всего потрачено",
  "Total leaks": "Всего утечек",
  "Records": "Записей",
  "App comment": "Комментарий app",
  "$BROKE MONTHLY HISTORY": "$BROKE МЕСЯЧНАЯ ИСТОРИЯ",
  "No repeated leak yet": "Повторяющейся утечки пока нет",
  "Small purchases become a lifestyle if you never count them.": "Маленькие покупки становятся стилем жизни, если их не считать.",
  "Creating history card...": "Создаём карточку истории...",
  "Share monthly history card": "Поделиться карточкой месячной истории",
  "No monthly memory yet": "Месячной памяти пока нет",
  "Track expenses to build history.": "Записывай расходы, чтобы создать историю.",
  "Once you add expenses, this archive will group them by category, purchase count, average price and leak pattern.": "Когда ты добавишь расходы, архив сгруппирует их по категории, количеству покупок, средней цене и паттерну утечки.",
  "Leak value": "Значение утечки",
  "Repeated small leak": "Повторяющаяся маленькая утечка",
  "High-impact leak": "Сильная точечная утечка",
  "Silent recurring leak": "Тихая регулярная утечка",
  "Habit leak": "Утечка привычки",
  "Monthly pressure": "Месячное давление",
  "Leak recorded": "Утечка записана",
  "This expense is now part of your wallet history.": "Эта трата теперь часть истории твоего кошелька.",
  "Small actions are only small until they repeat.": "Маленькие действия маленькие только пока не повторяются.",
  "Needed expense recorded": "Нужный расход записан",
  "This is not a leak. This is life cost.": "Это не утечка. Это стоимость жизни.",
  "The goal is not to stop living. The goal is to stop leaking.": "Цель не перестать жить. Цель — перестать протекать.",
  "Maybe is the danger zone": "Maybe — опасная зона",
  "Not fully needed. Not fully useless. But the money is still gone.": "Не совсем нужно. Не совсем бесполезно. Но деньги всё равно ушли.",
  "Repeated maybes can quietly drain the month.": "Повторяющиеся maybe могут тихо слить месяц.",
  "Heavy hit recorded": "Сильный удар записан",
  "This one deserves a second look.": "Эта трата заслуживает второго взгляда.",
  "Small leak recorded": "Маленькая утечка записана",
  "Wallets usually bleed from repeated small leaks.": "Кошельки чаще кровоточат от повторяющихся мелких утечек.",
  "Not needed expense recorded": "Ненужная трата записана",
  "The first step is admitting where the wallet is leaking.": "Первый шаг — признать, где протекает кошелёк.",
  "This is no longer a single purchase. It is a habit signal.": "Это уже не одиночная покупка. Это сигнал привычки.",
  "Category total": "Всего в категории",
  "Check history": "Проверить историю",
  "Open Survival": "Открыть Survival",
  "Pattern Detector": "Детектор паттернов",
  "What the app sees behind your expenses.": "Что app видит за твоими расходами.",
  "Why this matters": "Почему это важно",
  "One fix": "Один фикс",
  "Count": "Количество",
  "Total": "Итого",
  "Average": "Среднее",
  "Detected patterns": "Найденные паттерны",
  "No pattern yet": "Паттерна пока нет",
  "Track more expenses to reveal behavior.": "Запиши больше расходов, чтобы увидеть поведение.",
  "The detector needs repeated records to see habits, triggers, weekend leaks and decision-zone spending.": "Детектору нужны повторяющиеся записи, чтобы увидеть привычки, триггеры, weekend leaks и decision-zone spending.",
  "Track more expenses": "Записать больше расходов",
  "Repeated habit": "Повторяющаяся привычка",
  "Weekend leak": "Утечка выходных",
  "Heavy hit": "Тяжёлый удар",
  "Decision leak": "Утечка решений",
  "Small repeated leak": "Маленькая повторяющаяся утечка",
  "This Week in $BROKE": "Эта неделя в $BROKE",
  "Weekly review, one fix, and share card.": "Недельный обзор, один фикс и share-карточка.",
  "Spent this week": "Потрачено за неделю",
  "Leaks this week": "Утечки за неделю",
  "Leak pressure": "Давление утечек",
  "Most repeated": "Чаще всего повторялось",
  "Best day": "Лучший день",
  "Worst day": "Худший день",
  "No weekly records yet.": "Недельных записей пока нет.",
  "$BROKE WEEKLY REVIEW": "$BROKE НЕДЕЛЬНЫЙ ОБЗОР",
  "One week shows the pattern. One fix changes next week.": "Одна неделя показывает паттерн. Один фикс меняет следующую неделю.",
  "Creating weekly review card...": "Создаём недельную карточку...",
  "Share weekly review card": "Поделиться недельной карточкой",
  "No repeat": "Нет повтора",
  "No data": "Нет данных",
  "One Fix Recommendation": "Рекомендация одного фикса",
  "One clear action. Not ten random tips.": "Одно чёткое действие. Не десять случайных советов.",
  "Difficulty": "Сложность",
  "Estimated save": "Оценочная экономия",
  "signal first": "сначала сигнал",
  "accepted": "принято",
  "ignored": "игнор",
  "ready": "готово",
  "Fix accepted.": "Фикс принят.",
  "Next step: track honestly and check whether the pattern changes.": "Следующий шаг: записывай честно и проверь, изменится ли паттерн.",
  "Ignored for now.": "Пока проигнорировано.",
  "No problem. The pattern stays visible in Chart when you want to return to it.": "Не проблема. Паттерн останется видимым в Chart, когда захочешь вернуться.",
  "Accept fix": "Принять фикс",
  "Make easier": "Сделать легче",
  "Make harder": "Сделать сложнее",
  "Track next": "Записать следующее",
  "Ignore": "Игнор",
  "Easy": "Легко",
  "Normal": "Нормально",
  "Hard": "Сложно",
  "Starter mode": "Стартовый режим",
  "Weekly review": "Недельный обзор",
  "Weekly repeat": "Недельный повтор",
  "Comeback Mode": "Режим возвращения",
  "Restart without shame.": "Вернись без стыда.",
  "Days away": "Дней отсутствия",
  "Estimated hidden leak": "Оценочная скрытая утечка",
  "Known pressure": "Известное давление",
  "Add missed leak": "Добавить пропущенную утечку",
  "Restart today": "Начать сегодня заново",
  "Show damage": "Показать урон",
  "Start with one honest record. Do not try to rebuild the whole missing period perfectly.": "Начни с одной честной записи. Не пытайся идеально восстановить весь пропущенный период.",
  "No shame. But the wallet did not pause while the app was closed.": "Без стыда. Но кошелёк не ставился на паузу, пока app был закрыт.",
  "No problem. Restart with one honest record.": "Не проблема. Начни заново с одной честной записи.",
  "No strong leak estimate yet. Add one missed leak to rebuild the signal.": "Сильной оценки утечки пока нет. Добавь одну пропущенную утечку, чтобы восстановить сигнал.",
  "Public Proof Mode": "Публичный proof-режим",
  "Hide sensitive numbers on public cards.": "Скрывает чувствительные числа на публичных карточках.",
  "When ON, share cards hide exact private numbers like real balance, payday date, safe budget and private savings estimates.": "Когда включено, share-карточки скрывают точные личные числа: реальный баланс, дату дохода, безопасный бюджет и личную экономию.",
  "Still visible": "Видно",
  "Status, HP, score, patterns": "Статус, HP, score, паттерны",
  "Balance, payday, exact private amounts": "Баланс, дата дохода, точные личные суммы",
  "Exact private numbers hidden by Public Proof Mode.": "Точные личные числа скрыты Public Proof Mode.",
  "Public Proof Mode is ON. Exact private numbers are hidden.": "Public Proof Mode включён. Точные личные числа скрыты.",
  "Public Proof Mode: exact private numbers hidden.": "Public Proof Mode: точные личные числа скрыты.",
  "hidden by Public Proof Mode": "скрыто Public Proof Mode",
  "hidden": "скрыто",
  "ON": "ВКЛ",
  "OFF": "ВЫКЛ",
  "Smart Category Names": "Умные названия категорий",
  "Rename categories without breaking history.": "Переименуй категории без поломки истории.",
  "Personal": "Лично",
  "Labels only": "Только названия",
  "This changes how categories look in the app. Old expenses stay connected to the same category key, so history and patterns do not break.": "Это меняет только отображение категорий. Старые расходы остаются привязаны к тому же ключу, поэтому история и паттерны не ломаются.",
  "Reset category names": "Сбросить названия категорий",
  "Leak Streaks": "Серии без утечек",
  "Clean days by category.": "Чистые дни по категориям.",
  "Best active streak": "Лучшая активная серия",
  "Streak signal": "Сигнал серии",
  "Last leak": "Последняя утечка",
  "Track next decision": "Записать следующее решение",
  "No history": "Нет истории",
  "Leak Pattern Lab": "Лаборатория паттернов утечек",
  "Patterns, streaks, and deeper wallet signals.": "Паттерны, серии и глубокие сигналы кошелька.",
  "More wallet insights": "Ещё инсайты кошелька",
  "History Archive": "Архив истории",
  "Weekly review and monthly spending memory.": "Недельный обзор и месячная память расходов.",
  "Share Reports": "Share-отчёты",
  "Generate clean public wallet cards.": "Создать чистые публичные карточки кошелька.",
  "Wallet Insights Lab": "Лаборатория инсайтов кошелька",
  "More signals from habits, timing, and pressure.": "Больше сигналов по привычкам, времени и давлению.",
  "Account / Sync": "Аккаунт / Синхронизация",
  "No signal today": "Сегодня пока нет сигнала",
  "Daily pace pressure": "Давление дневного темпа",
  "Category concentration": "Концентрация категории",
  "Maybe zone": "Зона Maybe",
  "Evening trigger": "Вечерний триггер",
  "Micro-leak tax": "Налог мелких утечек",
  "Subscription audit": "Аудит подписок",
  "Life cost is not the enemy": "Стоимость жизни — не враг",
  "Real Life Meaning": "Реальный смысл",
  "Examples, not promises": "Примеры, не обещания",
  "is not just a number.": "это не просто число.",
  "Custom Goal": "Личная цель",
  "What are you building toward?": "К чему ты реально идёшь?",
  "Common goals": "Готовые цели",
  "Custom goal": "Своя цель",
  "Goal name": "Название цели",
  "Target amount": "Целевая сумма",
  "Goal": "Цель",
  "Redirected/month": "Перенаправлено/месяц",
  "Rent buffer": "Буфер аренды",
  "Emergency fund": "Резерв",
  "Emergency savings": "Экстренные накопления",
  "School fees": "Учёба",
  "Phone upgrade": "Новый телефон",
  "Debt payment": "Платёж по долгу",
  "Business idea": "Бизнес-идея",
  "Family support": "Поддержка семьи",
  "Personal goal simulation only. No real funds, no custody, no staking, no guaranteed returns.": "Только симуляция личной цели. Нет реальных средств, хранения, стейкинга или гарантированной доходности.",
  "Insurance": "Страховка",
  "Mortgage / rent": "Ипотека / аренда",
  "1 month": "1 месяц",
  "12 months": "12 месяцев",
  "Manual targets": "Ручные цели",
  "Add the things you are actually working toward.": "Добавь то, к чему ты реально идёшь.",
  "New goal": "Новая цель",
  "Monthly insurance amount": "Месячная страховка",
  "Monthly mortgage or rent amount": "Месячная ипотека или аренда",
  "Set a target amount": "Укажи целевую сумму",
  "Set a monthly amount": "Укажи месячную сумму",
  "Your custom goal": "Твоя личная цель",
  "No manual targets yet.": "Ручных целей пока нет.",
  "Add your own target: school fees, phone upgrade, emergency fund, debt, rent, family support, or anything personal.": "Добавь свою цель: учёба, телефон, резерв, долг, аренда, поддержка семьи или что-то личное.",
  "Example: Buy a laptop": "Пример: купить ноутбук",
  "Example: 800": "Пример: 800",
  "Real Life Plan": "Реальный план",
  "One place for planned expenses and goals": "Одно место для плановых расходов и целей",
  "Planned expenses / goals": "Плановые расходы / цели",
  "Each row has its own 1 month / 12 months switch.": "У каждой строки свой переключатель 1 месяц / 12 месяцев.",
  "Real life goal name": "Название реальной цели",
  "Real life monthly amount": "Месячная сумма реальной цели",
  "Remove planned expense": "Удалить плановый расход",
  "Monthly amount": "Месячная сумма",
  "Real Life Planner": "Планировщик реальной жизни",
  "Costs first, goal second": "Сначала расходы, потом цель",
  "Planned costs": "Плановые расходы",
  "Saving goal": "Цель накопления",
  "Add bills or planned expenses. Use 1m for monthly costs and 12m for yearly costs.": "Добавь счета или плановые расходы. Используй 1m для месячных расходов и 12m для годовых.",
  "Cost name": "Название расхода",
  "Planned cost name": "Название планового расхода",
  "Planned cost amount": "Сумма планового расхода",
  "Remove planned cost": "Удалить плановый расход",
  "What are you saving for?": "На что ты копишь?",
  "Choose a name or type your own. The amount is always yours.": "Выбери название или введи своё. Сумму всегда вводишь сам.",
  "Buy a laptop": "Купить ноутбук",
  "+ Add custom target": "+ Добавить плановый расход",
  "Share goal card": "Поделиться карточкой цели",
  "Monthly leaks into a personal saving goal": "Месячные утечки в личную цель накопления",
  "Monthly Leak Plan": "Месячный план утечек",
  "Turn this month’s leaks into a real goal plan.": "Преврати утечки этого месяца в реальный план цели.",
  "Base saving + redirected leaks = real goal progress.": "Базовое накопление + перенаправленные утечки = реальный прогресс цели.",
  "Create leak plan": "Создать план утечек",
  "Plan name": "Название плана",
  "Redirected amount": "Перенаправленная сумма",
  "Planner": "Планировщик",
  "Total redirected": "Всего перенаправлено",
  "Projected total": "Прогнозируемая сумма",
  "Planning only": "Только планирование",
  "Redirected": "Перенаправлено",
  "Saved plans": "Сохранённые планы",
  "No investment assumptions here. This plan simply redirects monthly leaks toward costs or a saving goal.": "Здесь нет инвестиционных предположений. План просто перенаправляет месячные утечки в расходы или цель накопления.",
  "Base saving": "Базовое накопление",
  "Leak boost": "Буст от утечек",
  "Total/month": "Всего/месяц",
  "Base/month": "База/месяц",
  "Leak boost/month": "Буст утечек/месяц",
  "Growth Lab: Monthly Leak Plan": "Growth Lab: месячный план утечек",
  "Growth Lab uses Monthly leaks from the current month and turns them into a simple plan. It does not talk about investing. It does not hold money. It only shows what monthly leaks could cover or help you save toward.": "Growth Lab берёт утечки этого месяца и превращает их в простой план. Он не про инвестиции и не хранит деньги. Он показывает, что месячные утечки могли бы покрыть или к какой цели помочь двигаться.",
  "This is planning only: no deposits, no custody, no staking, no investments, no guaranteed returns, and no financial advice.": "Это только планирование: без депозитов, хранения средств, стейкинга, инвестиций, гарантированной доходности и финансового совета.",
  "1. Use Monthly leaks": "1. Используй месячные утечки",
  "Growth Lab reads the current month’s Not needed and Maybe expenses.": "Growth Lab читает расходы Not needed и Maybe за текущий месяц.",
  "Use detected leaks turns the monthly leak amount into a monthly redirected amount.": "Use detected leaks превращает сумму месячных утечек в месячную перенаправленную сумму.",
  "This keeps the plan connected to real tracked app data, not random numbers.": "Так план связан с реальными данными приложения, а не случайными цифрами.",
  "2. Planned costs": "2. Плановые расходы",
  "Planned costs are bills or future expenses the user wants to cover.": "Плановые расходы — это счета или будущие траты, которые пользователь хочет покрыть.",
  "Examples: insurance, rent, school fees, repairs, family support, or any planned cost.": "Примеры: страховка, аренда, учёба, ремонт, поддержка семьи или любой плановый расход.",
  "Use 1m for monthly costs and 12m for yearly costs.": "Используй 1m для месячных расходов и 12m для годовых.",
  "3. Saving goal": "3. Цель накопления",
  "Saving goal is the thing the user is actually building toward.": "Цель накопления — это то, к чему пользователь реально идёт.",
  "The user can choose a quick name or type their own goal.": "Пользователь может выбрать быстрое название или ввести свою цель.",
  "The target amount is always entered manually by the user.": "Целевая сумма всегда вводится пользователем вручную.",
  "The app shows how long it may take if monthly leaks are redirected into that goal.": "Приложение показывает, сколько времени может занять цель, если перенаправить месячные утечки.",
  "4. Share goal card": "4. Поделись карточкой цели",
  "The share card is only for the Saving goal.": "Share-карточка только для цели накопления.",
  "Planned costs stay inside the app for personal planning.": "Плановые расходы остаются внутри приложения для личного планирования.",
  "The card shows the goal, target, estimated time, and redirected monthly leak amount.": "Карточка показывает цель, сумму, примерный срок и месячную перенаправленную утечку.",
  "It does not show private income or full personal budget details.": "Она не показывает личный доход или полные детали бюджета.",
  "5. What Growth Lab is not": "5. Чем Growth Lab не является",
  "It is not investing.": "Это не инвестиции.",
  "It is not staking.": "Это не стейкинг.",
  "It is not custody.": "Это не хранение средств.",
  "It does not move real funds.": "Он не перемещает реальные деньги.",
  "It is a personal planner that shows what leaks could become if the user changes habits.": "Это личный планировщик, который показывает, чем могут стать утечки, если пользователь изменит привычки.",

  "Growth: Target Coverage": "Growth: покрытие целей",
  "Growth turns detected leaks into real-life targets. It shows what leaked money could cover: insurance, mortgage or rent, school fees, emergency fund, debt payment, family support, or a personal goal.": "Growth превращает найденные утечки в реальные цели. Он показывает, что могли бы покрыть слитые деньги: страховку, ипотеку или аренду, учёбу, резерв, выплату долга, поддержку семьи или личную цель.",
  "Growth rule": "Правило Growth",
  "1. Use detected leaks": "1. Используй найденные утечки",
  "Growth reads this month’s Not needed and Maybe expenses.": "Growth читает расходы Not needed и Maybe за текущий месяц.",
  "Use detected leaks turns leak pressure into a monthly redirected amount.": "Use detected leaks превращает давление утечек в месячную перенаправленную сумму.",
  "2. Target Coverage": "2. Target Coverage",
  "Target Coverage connects money leaks to real things the user cares about.": "Target Coverage связывает money leaks с реальными вещами, которые важны пользователю.",
  "Default lines include Insurance and Mortgage / rent.": "По умолчанию есть Insurance и Mortgage / rent.",
  "Custom targets can include school fees, phone upgrade, emergency fund, debt payment, family support, or anything personal.": "Свои цели могут включать учёбу, обновление телефона, резерв, выплату долга, поддержку семьи или что-то личное.",
  "Use 1m for monthly coverage and 12m for yearly coverage.": "Используй 1m для месячного покрытия и 12m для годового покрытия.",
  "3. Personal Goal": "3. Personal Goal",
  "Personal Goal is the thing the user is actually working toward.": "Personal Goal — это то, к чему пользователь реально идёт.",
  "The target name and amount are entered manually by the user.": "Название и сумма цели вводятся пользователем вручную.",
  "The app estimates how long it could take if monthly leaks are redirected into that goal.": "App оценивает, сколько времени это может занять, если перенаправить месячные утечки в эту цель.",
  "Currency metadata and USD reference help make the target easier to understand globally.": "Метаданные валюты и USD reference помогают сделать цель понятнее для глобальной аудитории.",
  "The share card is for the Personal Goal, not the full private budget.": "Share-карточка предназначена для Personal Goal, а не для полного личного бюджета.",
  "It can show the selected currency plus an approximate USD reference.": "Она может показывать выбранную валюту и примерный USD-ориентир.",
  "It does not show private income, full fixed costs, or Debt Radar details.": "Она не показывает личный доход, полные фиксированные расходы или детали Debt Radar.",
  "5. What Growth is not": "5. Чем Growth не является",
  "Rewards: Survival, Leak Cuts, and Silent Killers": "Rewards: выживание, сокращение утечек и silent killers",
  "Rewards is where the app turns spending pressure into survival decisions. It includes Survival Mode, Leak Cut Scenarios, Challenges, Public Leaderboard, and the private Debt & Bills Radar.": "Rewards превращает давление расходов в решения для выживания. Здесь есть Survival Mode, Leak Cut Scenarios, Challenges, Public Leaderboard и приватный Debt & Bills Radar.",
  "Use Rewards to understand pressure before payday, cut one realistic leak, and keep Debt & Bills Radar private-first.": "Используй Rewards, чтобы понять давление до зарплаты, сократить одну реалистичную утечку и оставить Debt & Bills Radar private-first.",
  "1. Read Survival Mode": "1. Читай Survival Mode",
  "Survival Mode compares time left, money left, current pace, and safe daily budget.": "Survival Mode сравнивает оставшееся время, оставшиеся деньги, текущий темп и безопасный дневной бюджет.",
  "It helps the user see whether the month is safe or starting to leak too fast.": "Он помогает понять, месяц ещё безопасный или уже начинает протекать слишком быстро.",
  "Public Proof Mode can hide exact sensitive numbers on share cards.": "Public Proof Mode может скрывать точные чувствительные числа на share-карточках.",
  "2. Use Leak Cut Scenarios": "2. Используй Leak Cut Scenarios",
  "Leak Cut Scenarios show what changes if a category is reduced by a realistic percentage.": "Leak Cut Scenarios показывают, что изменится, если сократить категорию на реалистичный процент.",
  "3. Track Debt & Bills Radar": "3. Веди Debt & Bills Radar",
  "Debt & Bills Radar is for silent monthly killers: debt, recurring bills, subscriptions, insurance, maintenance, rent, phone, and internet.": "Debt & Bills Radar нужен для тихих месячных убийц: долги, регулярные счета, подписки, страховка, обслуживание, аренда, телефон и интернет.",
  "Monthly hit should be filled first. Remaining debt is counted only for Debt items.": "Monthly hit нужно заполнять первым. Remaining debt считается только для Debt items.",
  "This block is private-first and should not expose debt details in public cards.": "Этот блок private-first и не должен раскрывать детали долгов в публичных карточках.",
  "4. Start challenges and public progress": "4. Запускай challenges и публичный прогресс",
  "Challenges turn leak control into a short mission.": "Challenges превращают контроль утечек в короткую миссию.",
  "Leaderboard and challenge progress are public-friendly when Public Proof Mode is respected.": "Leaderboard и прогресс challenges подходят для публичного показа, если соблюдается Public Proof Mode.",
  "5. Connect Rewards with Growth": "5. Свяжи Rewards с Growth",
  "Growth shows what that redirected leak could cover through Target Coverage or a Personal Goal.": "Growth показывает, что эта перенаправленная утечка могла бы покрыть через Target Coverage или Personal Goal.",
  "Together they create the full loop: find the leak, cut the leak, redirect the leak.": "Вместе они создают полный цикл: найти утечку, сократить утечку, перенаправить утечку.",
  "Settings: Currency, Privacy, and Sync": "Settings: валюта, приватность и sync",
  "Settings controls the app’s real-life assumptions: language, profile, income, fixed costs, currency mode, privacy, categories, sync, and data control.": "Settings управляет реальными предположениями приложения: язык, профиль, доход, фиксированные расходы, режим валюты, приватность, категории, sync и контроль данных.",
  "Keep profile numbers realistic, use Convert values only when you want real exchange-rate display, and keep Public Proof Mode on for public sharing.": "Держи числа профиля реалистичными, используй Convert values только когда нужен реальный пересчёт по курсу, и оставляй Public Proof Mode включённым для публичного шаринга.",
  "1. Life Profile and income": "1. Life Profile и доход",
  "Life Profile adapts the app to the user’s country, lifestyle, and income rhythm.": "Life Profile адаптирует app под страну, образ жизни и ритм дохода пользователя.",
  "Income should match the real situation: salary, side income, allowance, irregular income, or mixed income.": "Доход должен соответствовать реальности: зарплата, side income, allowance, irregular income или смешанный доход.",
  "New and edited income fields now remember the currency they were entered in.": "Новые и изменённые поля дохода теперь запоминают валюту, в которой они были введены.",
  "2. Fixed costs": "2. Fixed costs",
  "Fixed costs are required costs like rent, utilities, transport basics, food basics, phone, data, education, or family support.": "Fixed costs — обязательные расходы: аренда, коммунальные, базовый транспорт, базовая еда, телефон, интернет, образование или поддержка семьи.",
  "New and edited fixed-cost fields now remember their original currency for converted display.": "Новые и изменённые fixed-cost поля теперь запоминают исходную валюту для конвертированного отображения.",
  "3. Currency Mode": "3. Currency Mode",
  "Display only changes the symbol and keeps values visually close to old behavior.": "Display only меняет символ и сохраняет визуальное поведение близким к старому.",
  "Convert values uses exchange rates to show real converted display values.": "Convert values использует курсы валют, чтобы показывать реальные конвертированные значения.",
  "Approximate USD reference appears across the app and share cards so global users can understand the scale faster.": "Примерный USD reference появляется в app и share-карточках, чтобы глобальные пользователи быстрее понимали масштаб.",
  "Older numbers may need to be re-saved once if they were created before original-currency metadata existed.": "Старые числа может понадобиться один раз пересохранить, если они были созданы до появления original-currency metadata.",
  "4. Privacy and public sharing": "4. Приватность и публичный шаринг",
  "Public Proof Mode protects public cards from exposing sensitive income and balance details.": "Public Proof Mode защищает публичные карточки от раскрытия чувствительных деталей дохода и баланса.",
  "Share cards can show selected currency plus approximate USD reference.": "Share-карточки могут показывать выбранную валюту и примерный USD reference.",
  "Debt & Bills Radar stays private-first and should not be turned into a detailed debt share card.": "Debt & Bills Radar остаётся private-first и не должен превращаться в подробную карточку долгов.",
  "5. Sync and data control": "5. Sync и контроль данных",
  "Telegram and web sync keep expenses, settings, Growth state, and Debt Radar state connected when cloud sync is available.": "Telegram и web sync связывают расходы, настройки, Growth state и Debt Radar state, когда cloud sync доступен.",
  "Reset and delete actions should be used carefully because they can remove progress.": "Reset и delete нужно использовать осторожно, потому что они могут удалить прогресс.",
  // v58.6 translation polish: settings currency, chart pressure, Growth, and Debt Radar.
  "Use cached exchange rates for entries that remember their original currency.": "Использовать кэш курсов для записей, которые помнят исходную валюту.",
  "Convert mode": "Режим конвертации",
  "Display mode": "Режим отображения",
  "Loading rates": "Загружаем курсы",
  "Rates ready · repair old data": "Курсы готовы · исправь старые данные",
  "Rates ready": "Курсы готовы",
  "Some rates unavailable": "Некоторые курсы недоступны",
  "Rate unavailable": "Курс недоступен",
  "Waiting for entries": "Ждём записи",
  "No mixed currencies yet": "Смешанных валют пока нет",
  "New entries remember currency automatically. Old entries can be marked with Old Data Currency Repair if needed.": "Новые записи автоматически запоминают валюту. Старые записи при необходимости можно отметить через Old Data Currency Repair.",
  "Conversion on": "Конвертация включена",
  "Converted display is live across expenses, income, fixed costs, Growth targets, and Debt Radar. Non-USD views also show an approximate USD reference where available.": "Конвертированное отображение работает для расходов, дохода, фиксированных расходов, целей Growth и Debt Radar. Для не-USD режимов также показывается примерный USD-ориентир, где он доступен.",
  "Display-only keeps old behavior: app labels change, but stored numbers are not converted or rewritten.": "Display-only сохраняет старое поведение: подписи валюты меняются, но сохранённые числа не конвертируются и не переписываются.",
  "These are stored as original values.": "Это сохранено как исходные значения.",
  "Convert mode shows their display value, but it does not replace the": "Convert mode показывает их отображаемую стоимость, но не заменяет",
  "rent, food, transport, phone, data, or school numbers you entered.": "аренду, еду, транспорт, телефон, интернет или учебные суммы, которые ты ввёл.",
  "Display Currency": "Валюта отображения",
  "Old Data Currency Repair": "Восстановление валюты старых данных",
  "Mark older values with the currency they were originally entered in.": "Отметь старые значения валютой, в которой они были введены изначально.",
  "This does not convert amounts.": "Это не конвертирует суммы.",
  "Use it only if older expenses, income, fixed costs, Growth targets,": "Используй это только если старые расходы, доход, фиксированные расходы и цели Growth",
  "and Debt Radar values were originally entered in the selected currency.": "а также значения Debt Radar изначально были введены в выбранной валюте.",
  "Old data was entered in": "Старые данные были введены в",
  "Old expense rows": "Старые строки расходов",
  "Income fields": "Поля дохода",
  "Fixed cost fields": "Поля фиксированных расходов",
  "Repairing...": "Исправляем...",
  "New entries already remember their currency automatically. Missing-only fixes blank old rows. Force-all is only for old data that was already tagged as the wrong currency.": "Новые записи уже автоматически запоминают валюту. Missing-only исправляет старые строки без валюты. Force-all нужен только для старых данных, которые уже были помечены неверной валютой.",
  "Currency repair failed. Try again after the app syncs.": "Восстановление валюты не удалось. Попробуй снова после синхронизации приложения.",
  "Currency repair synced": "Валюта старых данных синхронизирована",
  "Currency repair cloud save failed": "Не удалось сохранить восстановление валюты в облако",
  "Repair scope": "Область исправления",
  "Use missing-only for blank old rows. Use force-all if old rows were already tagged as the wrong currency and still show as huge USD values.": "Используй Missing only для пустых старых строк. Используй Force all, если старые строки уже помечены неверной валютой и всё ещё выглядят как огромные USD-значения.",
  "Missing only": "Только без валюты",
  "Force all current data": "Принудительно все текущие данные",
  "Force mark all as": "Принудительно отметить всё как",
  "Missing-only fixes blank old rows. Force-all is only for old data that was already tagged as the wrong currency.": "Missing-only исправляет старые строки без валюты. Force-all нужен только для старых данных, которые уже были помечены неверной валютой.",
  "Wallet Pressure Chart tracks daily leak pressure.": "Wallet Pressure Chart отслеживает дневное давление утечек.",
  "Green means controlled. Red means": "Зелёный — контролируемо. Красный —",
  "Wallet HP danger.": "опасность для Wallet HP.",
  "Wallet Pressure Chart": "Wallet Pressure Chart",
  "Tap a candle to inspect the day": "Нажми на свечу, чтобы разобрать день",
  "No candle selected": "Свеча не выбрана",
  "Selected pressure candle": "Выбранная свеча давления",
  "Balance after": "Баланс после",
  "No activity on this candle": "На этой свече нет активности",
  "Controlled spending day": "День контролируемых расходов",
  "Wallet HP danger day": "Опасный день для Wallet HP",
  "Leak pressure warning": "Предупреждение по утечкам",
  "Minor leak pressure": "Небольшое давление утечек",
  "Tap another candle or add an expense to see what happened that day.": "Нажми другую свечу или добавь расход, чтобы увидеть, что случилось в этот день.",
  "This day had spending, but it was marked Needed, so it did not create leak pressure.": "В этот день были расходы, но они отмечены как Needed, поэтому не создали давление утечек.",
  "This candle has leak pressure, but no single category dominates it yet.": "У этой свечи есть давление утечек, но одна категория пока не доминирует.",
  "Biggest spending": "Главный расход",
  "No weighted leak": "Нет weighted leak",
  "No tracked spending": "Нет tracked spending",
  "Spending mix": "Состав расходов",
  "No pressure yet": "Давления пока нет",
  "One day becomes one candle. Expenses update today’s candle.": "Один день = одна свеча. Расходы обновляют сегодняшнюю свечу.",
  "Tracked spending": "Записанные расходы",
  "Money leaks": "Денежные утечки",
  "Top leak": "Главная утечка",
  "No marked leak": "Отмеченной утечки нет",
  "Avg spend/day": "Средний расход/день",
  "No wallet pressure yet.": "Давления на кошелёк пока нет.",
  "Track one expense to create today’s candle. Needed spending stays controlled;": "Запиши один расход, чтобы создать сегодняшнюю свечу. Needed-расходы остаются контролируемыми;",
  "Maybe and Not needed create leak pressure.": "Maybe и Not needed создают давление утечек.",
  "Quiet day": "Тихий день",
  "Danger leak day": "Опасный день утечек",
  "Warning leak day": "День-предупреждение",
  "Controlled day": "Контролируемый день",
  "No candle yet": "Свечи пока нет",
  "This cycle": "Этот цикл",
  "Leak Volume — Today": "Объём утечек — сегодня",
  "Leak Volume — Last 7 days": "Объём утечек — последние 7 дней",
  "Leak Volume — This cycle": "Объём утечек — этот цикл",
  "Tracked": "Записано",
  "Current candle:": "Текущая свеча:",
  "Payday is treated as a cycle marker. It does not create a fake green candle and history is not deleted.": "День дохода считается маркером цикла. Он не создаёт фейковую зелёную свечу, и история не удаляется.",
  "Cycle start / payday marker": "Старт цикла / маркер дохода",
  "Candle Story": "История свечи",
  "Main causes": "Главные причины",
  "Range context": "Контекст периода",
  "Pattern detected": "Обнаруженный паттерн",
  "Top events": "Главные события",
  "Takeaway": "Вывод",
  "No spending categories recorded yet.": "Категории расходов пока не записаны.",
  "No pattern yet. Add an expense or inspect another candle.": "Паттерна пока нет. Добавь расход или выбери другую свечу.",
  "Controlled basics: spending happened, but it did not create leak pressure.": "Контролируемая база: расходы были, но не создали давление утечек.",
  "Evening leak cluster detected. Most pressure happened later in the day.": "Обнаружен вечерний кластер утечек. Большая часть давления появилась ближе к вечеру.",
  "Not needed spending created most of the pressure.": "Большую часть давления создали Not needed расходы.",
  "Grey-zone Maybe spending created the pressure without one clear failure point.": "Давление создали серые Maybe расходы без одной явной причины.",
  "No strong pattern detected yet.": "Сильный паттерн пока не обнаружен.",
  "No range impact yet.": "Влияния на период пока нет.",
  "This candle added tracked spending, but 0% of the selected range leaks.": "Эта свеча добавила записанные расходы, но 0% утечек выбранного периода.",
  "This candle is empty. Track one expense to make the chart tell a real story.": "Эта свеча пустая. Запиши один расход, чтобы график начал рассказывать реальную историю.",
  "This candle stayed controlled because the spending was marked Needed.": "Эта свеча осталась контролируемой, потому что расходы были отмечены как Needed.",
  "This candle turned red because avoidable spending created enough pressure to hurt Wallet HP.": "Эта свеча стала красной, потому что избегаемые расходы создали давление на Wallet HP.",
  "This candle is a warning: the pressure is visible, but still easy to correct.": "Эта свеча — предупреждение: давление уже видно, но его ещё легко исправить.",
  "This candle had small leak pressure, but it stayed below the danger zone.": "У этой свечи было небольшое давление утечек, но она осталась ниже зоны опасности.",
  "Top leak: none": "Главная утечка: нет",
  "Cycle start": "Старт цикла",
  "Payday marker": "Маркер дохода",
  "Daily leak budget": "Дневной бюджет утечек",
  "daily leak pace": "дневной темп утечек",
  "daily leak budget": "дневной бюджет утечек",
  "weighted leaks": "взвешенные утечки",
  "Personal goal: add what you are building toward": "Личная цель: добавь то, к чему ты идёшь",
  "Saving goal simulation only. No real funds, no custody, no staking, no guaranteed returns.": "Это только симуляция цели накопления. Реальных средств, хранения, staking и гарантированной доходности нет.",
  "Find the leak. Redirect it into something real.": "Найди утечку. Перенаправь её во что-то реальное.",
  "Monthly leak plan into a personal saving goal": "Месячный план утечек в личную цель накопления",
  "Add your saving goal": "Добавь свою цель накопления",
  "Not investments. Just monthly leaks redirected toward a real goal.": "Не инвестиции. Просто месячные утечки, перенаправленные к реальной цели.",
  "Your saving goal": "Твоя цель накопления",
  "Add a target and redirected leak amount first.": "Сначала добавь цель и перенаправленную сумму утечки.",
  "Fill Monthly hit first. Remaining debt is counted only for Debt items. Convert mode displays remembered currencies through the exchange-rate cache.": "Сначала заполни Monthly hit. Remaining debt считается только для Debt-элементов. Convert mode показывает запомненные валюты через кэш курсов.",
  "Monthly hit": "Месячный удар",
  "Remaining debt": "Остаток долга",
  "Debt": "Долг",
  "Recurring bill": "Регулярный счёт",
  "Maintenance": "Обслуживание",
  "HP before daily leaks": "HP до дневных утечек",
  "Silent pressure": "Тихое давление",
};

// V54.1: mission result translation rules are included inside applyRussianDynamicRules.
function applyRussianDynamicRules(value: string) {
  let next = value;

  const weekdayMap: Record<string, string> = {
    Mon: "Пн",
    Tue: "Вт",
    Wed: "Ср",
    Thu: "Чт",
    Fri: "Пт",
    Sat: "Сб",
    Sun: "Вс",
  };

  Object.entries(weekdayMap).forEach(([en, ru]) => {
    next = next.replace(new RegExp(`\\b${en}\\b`, "g"), ru);
  });

  next = next
    .replace(/Current point:/g, "Текущая точка:")
    .replace(/\bspent\b/g, "потрачено")
    .replace(/Spending Volume — Last 7 (days|дней)/g, "Объём расходов — последние 7 дней")
    .replace(/Last 7 (days|дней)/g, "Последние 7 дней")
    .replace(/You watch crypto charts every (day|день)\./g, "Ты каждый день смотришь крипто-графики.")
    .replace(/You watch crypto-chartы every день\./g, "Ты каждый день смотришь крипто-графики.")
    .replace(/\bcrypto-chartы\b/g, "крипто-графики")
    .replace(/But do you watch your own \$BROKE (Chart|График)\?/g, "Но следишь ли ты за своим $BROKE Chart?")
    .replace(/Но смотришь ли ты свой \$BROKE Chart\?/g, "Но следишь ли ты за своим $BROKE Chart?")
    .replace(/You spent (\$[\d,.]+|C\$[\d,.]+) on custom (today|сегодня)\./g, "Сегодня ты потратил $1 на другое.")
    .replace(/That becomes (\$[\d,.]+|C\$[\d,.]+)\/мес if this rhythm repeats\./g, "Если так продолжится, это станет $1/мес.")
    .replace(/That becomes (\$[\d,.]+|C\$[\d,.]+)\/mo if this rhythm repeats\./g, "Если так продолжится, это станет $1/мес.")
    .replace(/(\$[\d,.]+|C\$[\d,.]+) was marked as (Не нужно|Not needed) \/ (Возможно|Maybe) in the last 7 (days|дней)\./g, "$1 отмечено как Не нужно / Возможно за последние 7 дней.")
    .replace(/At this pace, leaks could reach (\$[\d,.]+|C\$[\d,.]+) за месяц\./g, "В таком темпе утечки могут достичь $1 в месяц.")
    .replace(/At this pace, leaks could reach (\$[\d,.]+|C\$[\d,.]+) per month\./g, "В таком темпе утечки могут достичь $1 в месяц.")
    .replace(/Wallet HP is (\d+\/100) and (реальный баланс|real balance) is still positive\./g, "Wallet HP $1, и реальный баланс всё ещё положительный.")
    .replace(/(\d+) дня без takeout/g, "$1 дня без еду на заказ")
    .replace(/Держи расходы на takeout ниже лимита (\d+) дня\./g, "Держи расходы на еду на заказ ниже лимита $1 дня.")
    .replace(/(\d+)\s+days\b/g, "$1 дня")
    .replace(/(\d+)\/(\d+)\s+done\b/g, "$1/$2 выполнено")
    .replace(/(\d+)\/(\d+)\s+unlocked\b/g, "$1/$2 открыто")
    .replace(/(\d+)\s+latest\b/g, "$1 последних")
    .replace(/#(\d+)\s+Daily\b/g, "#$1 за день")
    .replace(/Hours lost:\s*([\d.]+)h/g, "Потеряно часов: $1ч")
    .replace(/Leak:\s*([A-Za-zА-Яа-яёЁ _-]+)/g, "Утечка: $1")
    .replace(/(\$[\d,.]+)\s+this week\b/g, "$1 на этой неделе")
    .replace(/(\$[\d,.]+)\/year\b/g, "$1/год")
    .replace(/(\$[\d,.]+)\/month\b/g, "$1/мес")
    .replace(/\bSpending Volume — Последние 7 дней\b/g, "Объём расходов — последние 7 дней")
    .replace(/\bSpending Volume — Last 7 days\b/g, "Объём расходов — последние 7 дней")
    .replace(/\bLast 7 days\b/g, "Последние 7 дней")
    .replace(/\b4 latest\b/g, "4 последних")
    .replace(/Trust L(\d+)\s*·\s*(\d+)d streak\s*·\s*(\d+) badges/g, "Доверие L$1 · серия $2д · $3 бейджей")
    .replace(/L(\d+)\s*·\s*(\d+)d streak\s*·\s*(\d+) badges\s*·\s*(\d+) challenges/g, "L$1 · серия $2д · $3 бейджей · $4 челленджей")
    .replace(/(\d+)d streak/g, "серия $1д")
    .replace(/(\d+) badges/g, "$1 бейджей")
    .replace(/(\d+) challenges/g, "$1 челленджей")
    .replace(/\bAll\b/g, "Все")
    .replace(/\bsurvival\b/g, "выживание")
    .replace(/\bChallenge\b/g, "Челлендж")
    .replace(/\bCould go alone\b/g, "Можно было без этого")
    .replace(/\bCut Custom\b/g, "Сократить другое")
    .replace(/\bCut custom\b/g, "Сократить другое")
    .replace(/\bCut Такси\b/g, "Сократить такси")
    .replace(/\bReduce Курение\b/g, "Сократить курение")
    .replace(/\bCut Кофе\b/g, "Сократить кофе")
    .replace(/\bidentity app\./g, "приложение против утечек кошелька.")
    .replace(/Анти-думспендинг identity app\./g, "Приложение против утечек кошелька.")
    .replace(/Твой score/g, "Твой счёт")
    .replace(/\bcustom\b/g, "другое")
    .replace(/\btakeout\b/g, "еда на заказ")
    .replace(/Avoid biggest leak:\s*([A-Za-zА-Яа-яёЁ _/-]+)/g, "Избегай главной утечки: $1")
    .replace(/(\d+)\/3 active/g, "$1/3 активно")
    .replace(/(Coffee|Taxi|Smoking|Takeout|Custom) tracked\./g, "$1 записано.")
    .replace(/(\$[\d,.]+) looks small once\. Repeated daily, it becomes a real wallet leak\./g, "$1 один раз выглядит мелочью. Каждый день — это уже реальная утечка кошелька.")
    .replace(/Anti-([A-Za-zА-Яа-яёЁ _/-]+) mission/g, "Анти-$1 миссия")
    .replace(/Start anti-([A-Za-zА-Яа-яёЁ _/-]+) mission/g, "Начать анти-$1 миссию")
    .replace(/Stay under (\$[\d,.]+|C\$[\d,.]+) for 3 days\./g, "Удержись ниже $1 за 3 дня.")
    .replace(/(\$[\d,.]+|C\$[\d,.]+) drained this week\. Cut it before it becomes normal\./g, "$1 слилось на этой неделе. Сократи это, пока не стало нормой.")
    .replace(/Track one Not needed or Maybe expense first\. Then the app will build a mission around it\./g, "Сначала добавь расход Не нужно или Возможно. Потом app построит миссию вокруг него.")
    .replace(/(\d+)d left/g, "$1д осталось")
    .replace(/(\$[\d,.]+|C\$[\d,.]+) max/g, "макс. $1")
    .replace(/Possible save:\s*(\$[\d,.]+|C\$[\d,.]+)/g, "Можно сохранить: $1")
    .replace(/3-day anti-([A-Za-zА-Яа-яёЁ _/-]+) challenge/g, "3-дневный анти-$1 челлендж")
    .replace(/Leak: ([A-Za-zА-Яа-яёЁ _/-]+)/g, "Утечка: $1")
    .replace(/Days: 3/g, "Дней: 3")
    .replace(/Limit: (\$[\d,.]+|C\$[\d,.]+)/g, "Лимит: $1")
    .replace(/Spent: (\$[\d,.]+|C\$[\d,.]+)/g, "Потрачено: $1")
    .replace(/Saved: (\$[\d,.]+|C\$[\d,.]+)/g, "Сохранено: $1")
    .replace(/Over limit: (\$[\d,.]+|C\$[\d,.]+)/g, "Сверх лимита: $1")
    .replace(/Find the leak before it becomes your lifestyle\./g, "Найди утечку, пока она не стала образом жизни.")
    .replace(/Smoke is broke\./g, "Smoke is broke.")
    .replace(/(\$[\d,.]+|C\$[\d,.]+) tracked/g, "$1 записано")
    .replace(/(\d+) records · (\d+)% leak pressure/g, "$1 записей · $2% давление утечек")
    .replace(/(\d+)% pressure/g, "$1% давление")
    .replace(/^Avoid ([A-Za-zА-Яа-яёЁ _/-]+) today$/g, "Избегай $1 сегодня")
    .replace(/^Control ([A-Za-zА-Яа-яёЁ _/-]+)$/g, "Контролируй $1")
    .replace(/Status: ([A-Za-zА-Яа-яёЁ _/-]+)/g, "Статус: $1")
    .replace(/Wallet HP: (\d+\/100)/g, "Wallet HP: $1")
    .replace(/Spent today: (\$[\d,.]+|C\$[\d,.]+)/g, "Потрачено сегодня: $1")
    .replace(/Leaks today: (\$[\d,.]+|C\$[\d,.]+)/g, "Утечки сегодня: $1")
    .replace(/Top category: ([A-Za-zА-Яа-яёЁ _/-]+)/g, "Главная категория: $1")
    .replace(/Daily score: (\d+\/100)/g, "Дневной счёт: $1")
    .replace(/Survival Score: (\d+\/100)/g, "Счёт выживания: $1")
    .replace(/Weekly leaks: (\$[\d,.]+|C\$[\d,.]+)/g, "Недельные утечки: $1")
    .replace(/Biggest leak: ([A-Za-zА-Яа-яёЁ _/()$,.+-]+)/g, "Главная утечка: $1")
    .replace(/Life hours lost: ([\d.]+h)/g, "Потерянные часы жизни: $1")
    .replace(/([A-Za-zА-Яа-яёЁ _/-]+) is the main movement today\./g, "$1 — главное движение сегодня.")
    .replace(/([A-Za-zА-Яа-яёЁ _/-]+) is the biggest category this week\./g, "$1 — главная категория этой недели.");

  next = next
    .replace(/C\$([\d,.]+)\s+this week\b/g, (_match, amount) => `C$${amount} на этой неделе`)
    .replace(/C\$([\d,.]+)\/year\b/g, (_match, amount) => `C$${amount}/год`)
    .replace(/C\$([\d,.]+)\/год\b/g, (_match, amount) => `C$${amount}/год`)
    .replace(/C\$([\d,.]+)\/month\b/g, (_match, amount) => `C$${amount}/мес`)
    .replace(/C\$([\d,.]+)\/мес\b/g, (_match, amount) => `C$${amount}/мес`)
    .replace(/C\$([\d,.]+) looks small once\. Repeated daily, it becomes a real wallet leak\./g, (_match, amount) => `C$${amount} один раз выглядит мелочью. Каждый день — это уже реальная утечка кошелька.`);

  next = next
    .replace(/Biggest leak: /g, "Главная утечка: ")
    .replace(/Final:/g, "Итог:")
    .replace(/Gain:/g, "Прибыль:");


  next = next
    .replace(/Stored as ([^.]*)\. Display-only mode changes the app label, not the saved number\./g, "Сохранено как $1. Режим Display-only меняет подпись валюты, но не сохранённое число.")
    .replace(/Stored as ([^.]*)\. Rate to ([A-Z]{3}) is not ready yet\./g, "Сохранено как $1. Курс к $2 пока не готов.")
    .replace(/Stored as ([^.]*)\. Same as display currency\./g, "Сохранено как $1. Это та же валюта отображения.")
    .replace(/Stored as ([^·]*) · Displayed as ([^.]*)/g, "Сохранено как $1 · Отображается как $2")
    .replace(/Personal goal is displayed as ([^.]+)\. Original: ([^.]+)\./g, "Личная цель отображается как $1. Исходно: $2.")
    .replace(/Mark older numbers as ([A-Z]{3})\? This does not convert or rewrite amounts\. It only tags old data with the currency it was originally entered in\./g, "Отметить старые числа как $1? Это не конвертирует и не переписывает суммы. Это только помечает старые данные валютой, в которой они были введены изначально.")
    .replace(/Force-mark ALL current money records as ([A-Z]{3})\? This does not convert or rewrite amounts\. Use this only if the visible old numbers were originally entered in ([A-Z]{3})\./g, "Принудительно отметить ВСЕ текущие денежные записи как $1? Это не конвертирует и не переписывает суммы. Используй только если видимые старые числа были изначально введены в $2.")
    .replace(/Force mark all as ([A-Z]{3})/g, "Принудительно отметить всё как $1")
    .replace(/Mark old data as ([A-Z]{3})/g, "Отметить старые данные как $1")
    .replace(/Marked (\d+) money fields as ([A-Z]{3})\. Original amounts stayed unchanged\. Refresh or reopen Telegram if old cloud rows were already loaded\./g, "Отмечено $1 денежных полей как $2. Исходные суммы не изменились. Обнови или переоткрой Telegram, если старые cloud-строки уже были загружены.")
    .replace(/No missing currency fields found\. ([A-Z]{3}) is still ready for new entries\./g, "Полей без валюты не найдено. $1 всё равно готова для новых записей.")
    .replace(/(\d+) old expense row(s?) do not remember original currency yet\. Use Old Data Currency Repair before judging converted totals\./g, "$1 старых строк расходов ещё не помнят исходную валюту. Используй восстановление валюты старых данных перед оценкой конвертированных итогов.")
    .replace(/(\d+) old records/g, "$1 старых записей")
    .replace(/(\d+) total · (\d+) this month/g, "$1 всего · $2 за месяц")
    .replace(/(\d+) month/g, "$1 за месяц")
    .replace(/(\d+) records · ([^·]+) weighted leaks/g, "$1 записей · $2 взвешенных утечек")
    .replace(/([\p{Sc}]?[A-Z]{0,3}\s?[-\d,.]+|[A-Z]{1,4}\$[-\d,.]+|L[-\d,.]+|Rs[-\d,.]+|KSh[-\d,.]+|USh[-\d,.]+|TSh[-\d,.]+|FCFA[-\d,.]+|CFA[-\d,.]+|AED[-\d,.]+|SAR[-\d,.]+|MAD[-\d,.]+|RON[-\d,.]+) daily leak pace/gu, "$1 дневной темп утечек")
    .replace(/([\p{Sc}]?[A-Z]{0,3}\s?[-\d,.]+|[A-Z]{1,4}\$[-\d,.]+|L[-\d,.]+|Rs[-\d,.]+|KSh[-\d,.]+|USh[-\d,.]+|TSh[-\d,.]+|FCFA[-\d,.]+|CFA[-\d,.]+|AED[-\d,.]+|SAR[-\d,.]+|MAD[-\d,.]+|RON[-\d,.]+) daily leak budget/gu, "$1 дневной бюджет утечек")
    .replace(/Current candle: ([^·]+) · Quiet day · ([^·]+) leaks · (\d+)% pressure/g, "Текущая свеча: $1 · Тихий день · $2 утечек · $3% давление")
    .replace(/Current candle: ([^·]+) · Controlled day · ([^·]+) leaks · (\d+)% pressure/g, "Текущая свеча: $1 · Контролируемый день · $2 утечек · $3% давление")
    .replace(/Current candle: ([^·]+) · Warning leak day · ([^·]+) leaks · (\d+)% pressure/g, "Текущая свеча: $1 · День-предупреждение · $2 утечек · $3% давление")
    .replace(/Current candle: ([^·]+) · Danger leak day · ([^·]+) leaks · (\d+)% pressure/g, "Текущая свеча: $1 · Опасный день утечек · $2 утечек · $3% давление")
    .replace(/([A-Za-zА-Яа-яёЁ]+): Quiet day · (\d+)% pressure/g, "$1: тихий день · $2% давление")
    .replace(/([A-Za-zА-Яа-яёЁ]+): Controlled day · (\d+)% pressure/g, "$1: контролируемый день · $2% давление")
    .replace(/([A-Za-zА-Яа-яёЁ]+): Warning leak day · (\d+)% pressure/g, "$1: день-предупреждение · $2% давление")
    .replace(/([A-Za-zА-Яа-яёЁ]+): Danger leak day · (\d+)% pressure/g, "$1: опасный день утечек · $2% давление")
    .replace(/Tracked: ([^·]+)/g, "Записано: $1")
    .replace(/Leaks: ([^·]+)/g, "Утечки: $1")
    .replace(/Pressure: (\d+)%/g, "Давление: $1%")
    .replace(/Top leak: none/g, "Главная утечка: нет")
    .replace(/Top leak: ([A-Za-zА-Яа-яёЁ _/()$,.+-]+)/g, "Главная утечка: $1")
    .replace(/Remaining ([^()·]+)/g, "Осталось $1")
    .replace(/\bConvert mode\b/g, "режим конвертации")
    .replace(/\bDisplay mode\b/g, "режим отображения")
    .replace(/\bweighted leaks\b/g, "взвешенные утечки");

  return next;
}

function translateTextValue(value: string, language: Language) {
  if (language === "en") return value;

  const trimmed = value.trim();

  if (!trimmed) return value;

  const exact = ruText[trimmed];
  const translated = exact ?? applyRussianDynamicRules(trimmed);

  if (translated === trimmed) return value;

  return value.replace(trimmed, translated);
}

const ruReverseText: Record<string, string> = Object.entries(ruText).reduce(
  (acc, [en, ru]) => {
    acc[ru] = en;
    return acc;
  },
  {} as Record<string, string>
);

function translateDomTextValue(value: string, language: Language) {
  const trimmed = value.trim();

  if (!trimmed) return value;

  if (language === "en") {
    const original = ruReverseText[trimmed];

    if (!original) return value;

    return value.replace(trimmed, original);
  }

  return translateTextValue(value, language);
}

function translateDomTree(language: Language) {
  if (typeof document === "undefined") return;

  document.documentElement.lang = language;
  document.documentElement.dir = "ltr";

  const root = document.querySelector(".phone") || document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;

    if (!parent) continue;

    const tag = parent.tagName.toLowerCase();

    if (["script", "style", "textarea", "code", "pre"].includes(tag)) continue;

    nodes.push(node);
  }

  nodes.forEach((node) => {
    const current = node.nodeValue || "";
    const next = translateDomTextValue(current, language);

    if (next !== current) {
      node.nodeValue = next;
    }
  });

  root
    .querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]")
    .forEach((element) => {
      ["placeholder", "aria-label", "title"].forEach((attribute) => {
        const current = element.getAttribute(attribute);

        if (!current) return;

        const next = translateDomTextValue(current, language);

        if (next !== current) {
          element.setAttribute(attribute, next);
        }
      });
    });
}

function LanguageRuntime({ language }: { language: Language }) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    let frame = 0;

    const apply = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => translateDomTree(language));
    };

    apply();

    const timers = [
      window.setTimeout(apply, 80),
      window.setTimeout(apply, 250),
      window.setTimeout(apply, 700),
    ];

    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"],
    });

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      observer.disconnect();
    };
  }, [language]);

  return null;
}



function normalizeHolderTier(input?: Partial<HolderTier> | null): HolderTier {
  const id = String(input?.id || defaultHolderTier.id) as HolderTierId;
  const allowed: HolderTierId[] = ["none", "tadpole", "frog", "strong", "shark", "whale", "leviathan"];
  return {
    ...defaultHolderTier,
    ...(input || {}),
    id: allowed.includes(id) ? id : defaultHolderTier.id,
    label: String(input?.label || defaultHolderTier.label),
    range: String(input?.range || defaultHolderTier.range),
    description: String(input?.description || defaultHolderTier.description),
  };
}

function normalizeWalletLinkSettings(input?: Partial<WalletLinkSettings> | null): WalletLinkSettings {
  return {
    ...defaultWalletLinkSettings,
    ...(input || {}),
    walletAddress: String(input?.walletAddress || "").trim(),
    isVerified: Boolean(input?.isVerified),
    provider: input?.provider === "verified" ? "verified" : "watch",
    brokeBalance: Math.max(0, safeNumber(String(input?.brokeBalance ?? 0))),
    percentOfSupply: Math.max(0, safeNumber(String(input?.percentOfSupply ?? 0))),
    holderTier: normalizeHolderTier(input?.holderTier),
    lastCheckedAt: String(input?.lastCheckedAt || ""),
    verifiedAt: String(input?.verifiedAt || ""),
    showHolderStatus: input?.showHolderStatus !== false,
    showTokenBalance: Boolean(input?.showTokenBalance),
  };
}

function isLikelySolanaWalletAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

function compactWalletAddress(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 12) return trimmed || "Not linked";
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

function getAdminAccessState(telegram: TelegramState, webAuth: WebAuthState, settings: Settings): AdminAccessState {
  const telegramUser = telegram.user || webAuth.user;
  const telegramId = telegramUser?.id ? String(telegramUser.id) : "";
  const telegramAllowed = Boolean(telegramId && ADMIN_TELEGRAM_IDS.includes(telegramId));
  const connectedWallet = settings.wallet.isVerified ? settings.wallet.walletAddress.trim() : "";
  const walletAllowed = Boolean(
    connectedWallet && ADMIN_WALLET_ADDRESSES.some((address) => walletAddressEquals(address, connectedWallet))
  );
  const treasuryMatched = Boolean(
    connectedWallet && TREASURY_WALLET_ADDRESS && walletAddressEquals(TREASURY_WALLET_ADDRESS, connectedWallet)
  );
  const canSeePanel = telegramAllowed || walletAllowed || treasuryMatched;
  const sourceLabel = telegramAllowed
    ? "Telegram admin"
    : treasuryMatched
      ? "Treasury wallet"
      : walletAllowed
        ? "Admin wallet"
        : "Hidden";

  return {
    canSeePanel,
    sourceLabel,
    telegramId,
    connectedWallet,
    treasuryWallet: TREASURY_WALLET_ADDRESS,
    walletAllowed,
    treasuryMatched,
    telegramAllowed,
    treasuryConfigured: Boolean(TREASURY_WALLET_ADDRESS),
    walletConfigured: ADMIN_WALLET_ADDRESSES.length > 0,
  };
}

function formatTokenAmount(value: number, mode: "compact" | "full" = "compact") {
  if (!Number.isFinite(value) || value <= 0) return "0 BROKE";

  if (mode === "full") {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} BROKE`;
  }

  const formatScaled = (scaled: number, suffix: string) => {
    const maximumFractionDigits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 1;
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits,
      minimumFractionDigits: 0,
    }).format(scaled);
    return `${formatted}${suffix} BROKE`;
  };

  if (value >= 1_000_000_000) return formatScaled(value / 1_000_000_000, "B");
  if (value >= 1_000_000) return formatScaled(value / 1_000_000, "M");
  if (value >= 1_000) return formatScaled(value / 1_000, "K");

  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: value >= 1 ? 0 : 4 }).format(value)} BROKE`;
}

function formatHolderPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  if (value < 0.0001) return "<0.0001%";
  return `${value.toFixed(value >= 1 ? 2 : 4)}%`;
}

function formatRewardTokenAmount(value: number, token: string) {
  if (!Number.isFinite(value) || value <= 0) return `0 ${token}`;
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 2 : value >= 1 ? 4 : 6,
    minimumFractionDigits: 0,
  }).format(value)} ${token}`;
}

function formatAdminDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().slice(0, 10);
}


type HolderTierMilestone = {
  id: HolderTierId;
  label: string;
  minPercent: number;
};

const holderTierMilestones: HolderTierMilestone[] = [
  { id: "tadpole", label: "Tadpole", minPercent: 0.0001 },
  { id: "frog", label: "Frog", minPercent: 0.05 },
  { id: "strong", label: "Strong Frog", minPercent: 0.25 },
  { id: "shark", label: "Shark Frog", minPercent: 0.75 },
  { id: "whale", label: "Whale Frog", minPercent: 2 },
  { id: "leviathan", label: "Leviathan Frog", minPercent: 5 },
];

function getNextHolderTierProgress(wallet: WalletLinkSettings) {
  const currentPercent = Math.max(0, wallet.percentOfSupply || 0);
  const currentIndex = holderTierMilestones.findIndex((tier) => tier.id === wallet.holderTier.id);
  const nextTier = holderTierMilestones.find((tier) => tier.minPercent > currentPercent);

  if (!nextTier) {
    return {
      label: "Top holder tier reached",
      detail: "Leviathan proof is already unlocked.",
      progress: 100,
      nextLabel: "Max tier",
    };
  }

  const previousTier = currentIndex >= 0 ? holderTierMilestones[currentIndex] : { minPercent: 0 };
  const basePercent = Math.max(0, previousTier.minPercent || 0);
  const span = Math.max(nextTier.minPercent - basePercent, 0.0001);
  const progress = Math.max(0, Math.min(100, Math.round(((currentPercent - basePercent) / span) * 100)));

  return {
    label: `Next tier: ${nextTier.label}`,
    detail: `Reach ${formatHolderPercent(nextTier.minPercent)} of supply to unlock the next holder tier.`,
    progress,
    nextLabel: nextTier.label,
  };
}

function getHolderProofLabel(wallet: WalletLinkSettings) {
  if (!wallet.walletAddress) return "No wallet linked";
  if (wallet.isVerified) return "Verified holder proof";
  return "Watch-only wallet";
}

function normalizeProfileShareSettings(input?: Partial<ProfileShareSettings> | null): ProfileShareSettings {
  const enabledItems = Array.isArray(input?.enabledItems)
    ? input.enabledItems
        .map((item) => String(item))
        .filter((item): item is ProfileShareItemId =>
          profileShareItemIds.includes(item as ProfileShareItemId)
        )
    : defaultProfileShareSettings.enabledItems;

  const uniqueItems = Array.from(new Set(enabledItems));

  return {
    enabledItems: uniqueItems.length > 0 ? uniqueItems.slice(0, 8) : defaultProfileShareSettings.enabledItems,
  };
}

function normalizeSettings(input?: Partial<Settings> | null): Settings {
  return {
    ...defaultSettings,
    ...(input || {}),
    currency: normalizeCurrency(input?.currency, defaultSettings.currency),
    currencyMode: normalizeCurrencyMode(input?.currencyMode),
    profile: {
      ...defaultSettings.profile,
      ...(input?.profile || {}),
    },
    income: {
      ...defaultSettings.income,
      ...(input?.income || {}),
    },
    incomeCurrencies: normalizeCurrencyRecord(
      input?.incomeCurrencies,
      incomeKeys,
      normalizeCurrency(input?.currency, defaultSettings.currency)
    ),
    fixedCosts: {
      ...defaultSettings.fixedCosts,
      ...(input?.fixedCosts || {}),
    },
    fixedCostCurrencies: normalizeCurrencyRecord(
      input?.fixedCostCurrencies,
      fixedCostKeys,
      normalizeCurrency(input?.currency, defaultSettings.currency)
    ),
    survival: {
      ...defaultSettings.survival,
      ...(input?.survival || {}),
    },
    privacy: {
      ...defaultSettings.privacy,
      ...(input?.privacy || {}),
    },
    identity: {
      ...defaultSettings.identity,
      ...(input?.identity || {}),
    },
    shareProfile: normalizeProfileShareSettings(input?.shareProfile),
    wallet: normalizeWalletLinkSettings(input?.wallet),
    categoryNames: {
      ...defaultCategoryNames,
      ...(input?.categoryNames || {}),
    },
  };
}

function getProfileAvatarImage(preset: Settings["identity"]["avatarPreset"]) {
  switch (preset) {
    case "wallet":
      return A.walletMascot;
    case "survivor":
      return A.streakFrog;
    case "degen":
      return A.homeMascot;
    case "stealth":
      return A.walletHp;
    default:
      return A.appFrog;
  }
}

function getPublicProfileAvatarImage(settings: Settings) {
  return settings.identity.customAvatarUrl || getProfileAvatarImage(settings.identity.avatarPreset);
}

function getIdentityStyleMeta(style: Settings["identity"]["identityStyle"]) {
  switch (style) {
    case "clean":
      return { label: "Clean profile", badge: "Low noise" };
    case "proof":
      return { label: "Proof mode", badge: "Progress" };
    case "stealth":
      return { label: "Private mode", badge: "Quiet" };
    case "builder":
      return { label: "Builder mode", badge: "Fixing leaks" };
    default:
      return { label: "Classic BROKE", badge: "Self-aware" };
  }
}

type HolderProfileReward = {
  id: string;
  label: string;
  detail: string;
  minBalance: number;
  kind: "slot" | "cosmetic" | "proof";
};

const holderProfileRewards: HolderProfileReward[] = [
  {
    id: "custom-avatar",
    label: "Custom avatar",
    detail: "Upload your own avatar when a verified wallet holds 500K+ BROKE.",
    minBalance: 500_000,
    kind: "cosmetic",
  },
  {
    id: "bonus-slot-1",
    label: "+1 public display slot",
    detail: "Show one extra Profile / Share Studio item on public cards.",
    minBalance: 500_000,
    kind: "slot",
  },
  {
    id: "proof-glow",
    label: "Holder proof frame",
    detail: "Adds a stronger verified-holder identity treatment in Profile.",
    minBalance: 1_000_000,
    kind: "proof",
  },
  {
    id: "bonus-slot-2",
    label: "+2 public display slots",
    detail: "Unlocks more room for badges, streak, holder tier, and Survival Score.",
    minBalance: 1_000_000,
    kind: "slot",
  },
  {
    id: "elite-holder-style",
    label: "Elite holder profile style",
    detail: "A premium profile/cosmetic lane for verified 5M+ BROKE holders.",
    minBalance: 5_000_000,
    kind: "cosmetic",
  },
  {
    id: "bonus-slot-3",
    label: "+3 public display slots",
    detail: "Maximum public display flexibility for verified high-conviction holders.",
    minBalance: 5_000_000,
    kind: "slot",
  },
];

function getVerifiedHolderSlotBonus(wallet?: WalletLinkSettings | null) {
  if (!wallet?.isVerified) return 0;
  if (wallet.brokeBalance >= 5_000_000) return 3;
  if (wallet.brokeBalance >= 1_000_000) return 2;
  if (wallet.brokeBalance >= CUSTOM_AVATAR_UNLOCK_BALANCE) return 1;
  return 0;
}

function getProfileShareSlotLimit(walletHp: number, wallet?: WalletLinkSettings | null) {
  const base = walletHp >= 90 ? 5 : walletHp >= 75 ? 4 : walletHp >= 55 ? 3 : 2;
  return Math.min(profileShareItemIds.length, base + getVerifiedHolderSlotBonus(wallet));
}

function getHolderProfileRewardState(wallet: WalletLinkSettings) {
  const unlocked = holderProfileRewards.filter(
    (reward) => wallet.isVerified && wallet.brokeBalance >= reward.minBalance
  );
  const next = holderProfileRewards.find(
    (reward) => !wallet.isVerified || wallet.brokeBalance < reward.minBalance
  );

  return {
    unlocked,
    next,
    unlockedCount: unlocked.length,
    totalCount: holderProfileRewards.length,
    slotBonus: getVerifiedHolderSlotBonus(wallet),
  };
}

function getProfileShareItemMeta(id: ProfileShareItemId) {
  switch (id) {
    case "survival":
      return { label: "Survival Score", detail: "Best all-in public signal." };
    case "walletHp":
      return { label: "Wallet HP", detail: "Current wallet pressure." };
    case "streak":
      return { label: "Streak", detail: "Discipline display." };
    case "badges":
      return { label: "Badges", detail: "Trophy display." };
    case "rank":
      return { label: "Leaderboard", detail: "Public rank if enabled." };
    case "biggestLeak":
      return { label: "Biggest leak", detail: "Category only in Proof Mode." };
    case "lifeHours":
      return { label: "Life hours", detail: "Time cost of leaks." };
    case "status":
      return { label: "Status", detail: "Stable / pressure state." };
    case "holder":
      return { label: "Holder tier", detail: "Verified $BROKE holder proof." };
  }
}

function getEnabledProfileShareItems(settings: Settings, walletHp: number) {
  const limit = getProfileShareSlotLimit(walletHp, settings.wallet);
  const selected = normalizeProfileShareSettings(settings.shareProfile).enabledItems;
  return selected.slice(0, limit);
}

function buildProfileShareMetric({
  id,
  settings,
  walletHp,
  identityStats,
  leaderboard,
  badgeCount,
}: {
  id: ProfileShareItemId;
  settings: Settings;
  walletHp: number;
  identityStats: V2IdentityStats;
  leaderboard: LeaderboardState | null;
  badgeCount?: number;
}): ProfileShareMetric {
  const shareStats = getShareLeaderboardStats(leaderboard);

  switch (id) {
    case "survival":
      return { label: "Survival", value: `${identityStats.weeklySurvivalScore}/100` };
    case "walletHp":
      return { label: "Wallet HP", value: `${walletHp}/100` };
    case "streak":
      return { label: "Streak", value: `${shareStats.currentStreak || 0}d` };
    case "badges":
      return { label: "Badges", value: `${badgeCount ?? shareStats.badgeCount}` };
    case "rank":
      return { label: "Top", value: shareStats.rankLabel };
    case "biggestLeak":
      return {
        label: "Biggest leak",
        value: identityStats.biggestLeakAmount > 0
          ? categoryDisplayLabel(settings, identityStats.biggestLeakCategory)
          : "none",
      };
    case "lifeHours":
      return { label: "Hours lost", value: `${identityStats.lifeHoursLost}h` };
    case "status":
      return { label: "Status", value: identityStats.status };
    case "holder":
      if (!settings.wallet.showHolderStatus || !settings.wallet.walletAddress) {
        return { label: "Holder tier", value: "private" };
      }
      if (!settings.wallet.isVerified) {
        return { label: "Holder tier", value: "verify first", detail: "Watch-only wallet" };
      }
      return {
        label: "Holder tier",
        value: settings.wallet.holderTier.label,
        detail: settings.wallet.showTokenBalance
          ? formatTokenAmount(settings.wallet.brokeBalance)
          : "Verified holder",
      };
  }
}

function getPublicIdentityName(settings: Settings, fallback = "Broke survivor") {
  const name = settings.identity.nickname.trim();
  return name || fallback;
}

function getPublicIdentityStatus(settings: Settings) {
  return settings.identity.statusText.trim() || "Broke, but self-aware";
}

function getSharePrivacyLine(settings: Settings) {
  return settings.privacy.publicProofMode
    ? "Private cash numbers hidden by Public Proof Mode. Wallet display follows your holder privacy toggles."
    : "Exact progress is allowed by your current privacy settings. Wallet display follows your holder privacy toggles.";
}

function applyRegionPreset(settings: Settings, region: RegionPreset): Settings {
  const preset = regionPresets[region];

  if (region === "Custom") {
    return {
      ...settings,
      profile: {
        ...settings.profile,
        region,
        country:
          settings.profile.country && settings.profile.country !== "Global"
            ? settings.profile.country
            : "",
      },
    };
  }

  const hasRent = settings.profile.hasRent && preset.fixedCosts.rent > 0;

  return {
    ...settings,
    currency: normalizeCurrency(preset.currency, settings.currency),
    profile: {
      ...settings.profile,
      region,
      country: preset.country,
      hasRent,
      workHoursPerMonth: preset.workHoursPerMonth,
    },
    fixedCosts: {
      ...preset.fixedCosts,
      rent: hasRent ? preset.fixedCosts.rent : 0,
    },
    fixedCostCurrencies: currencyMapForKeys(fixedCostKeys, normalizeCurrency(preset.currency, settings.currency)),
  };
}

function applyLifeMode(settings: Settings, lifeMode: LifeMode): Settings {
  const studentLike = lifeMode === "Student" || lifeMode === "Living with family" || lifeMode === "No stable income";
  const nextIncomeStyle: IncomeStyle =
    lifeMode === "Student"
      ? "Allowance"
      : lifeMode === "Freelancer" || lifeMode === "No stable income"
        ? "Irregular"
        : settings.profile.incomeStyle;

  return {
    ...settings,
    profile: {
      ...settings.profile,
      lifeMode,
      incomeStyle: nextIncomeStyle,
      hasRent: studentLike ? false : settings.profile.hasRent,
      workHoursPerMonth: lifeMode === "Student" ? 80 : settings.profile.workHoursPerMonth,
    },
    fixedCosts: {
      ...settings.fixedCosts,
      rent: studentLike ? 0 : settings.fixedCosts.rent,
    },
    fixedCostCurrencies: {
      ...settings.fixedCostCurrencies,
      rent: studentLike ? settings.currency : settings.fixedCostCurrencies.rent,
    },
  };
}

const categories = [
  { name: "Coffee", icon: A.coffee },
  { name: "Smoking", icon: A.smoking },
  { name: "Takeouts", icon: A.takeouts },
  { name: "Shopping", icon: A.shopping },
  { name: "Subscriptions", icon: A.subscriptions },
  { name: "Taxi", icon: A.taxi },
  { name: "Data", icon: A.reminder },
  { name: "School", icon: A.calendar },
  { name: "Snacks", icon: A.takeouts },
  { name: "Gaming", icon: A.challengeTrophy },
  { name: "Family", icon: A.walletMascot },
  { name: "Custom", icon: A.custom },
];

const firstLeakPresets = [
  { category: "Coffee", amount: 2, icon: A.coffee, label: "Coffee leak" },
  { category: "Smoking", amount: 5, icon: A.smoking, label: "Smoking leak" },
  { category: "Takeouts", amount: 15, icon: A.takeouts, label: "Takeout leak" },
  { category: "Shopping", amount: 20, icon: A.shopping, label: "Random buy" },
];

const quickAddPresets = [
  { category: "Coffee", amount: 2, icon: A.coffee, label: "Coffee" },
  { category: "Taxi", amount: 10, icon: A.taxi, label: "Taxi" },
  { category: "Smoking", amount: 5, icon: A.smoking, label: "Smoking" },
  { category: "Takeouts", amount: 15, icon: A.takeouts, label: "Takeout" },
  { category: "Custom", amount: 10, icon: A.custom, label: "Custom" },
];

const NEED_TYPE_HELP: Record<NeedType, string> = {
  Needed: "Survival cost = necessary. It protects accuracy and does not count as a leak.",
  Maybe: "Grey zone = questionable. $BROKE counts half of it as leak pressure.",
  "Not needed": "Full leak = avoidable. It lowers Wallet HP and powers Rewards/Growth insights.",
};

const NEED_TYPE_LABELS: Record<NeedType, { title: string; subtitle: string }> = {
  Needed: { title: "Survival cost", subtitle: "necessary" },
  Maybe: { title: "Grey zone", subtitle: "questionable" },
  "Not needed": { title: "Full leak", subtitle: "avoidable" },
};

const LEAK_TRIGGER_CHIPS = [
  { id: "stress", label: "Stress", tag: "#stress", hint: "pressure buy" },
  { id: "boredom", label: "Boredom", tag: "#boredom", hint: "nothing to do" },
  { id: "impulse", label: "Impulse", tag: "#impulse", hint: "fast decision" },
  { id: "after-payday", label: "After payday", tag: "#after-payday", hint: "money just landed" },
  { id: "late-night", label: "Late night", tag: "#late-night", hint: "low discipline" },
  { id: "social-pressure", label: "Social pressure", tag: "#social-pressure", hint: "others pushed it" },
  { id: "weekend", label: "Weekend", tag: "#weekend", hint: "weekend mode" },
  { id: "habit", label: "Habit", tag: "#habit", hint: "repeat loop" },
] as const;

type LeakTriggerId = (typeof LEAK_TRIGGER_CHIPS)[number]["id"];

const LEAK_TRIGGER_TAGS = LEAK_TRIGGER_CHIPS.map((trigger) => trigger.tag);
const LEAK_TRIGGER_IDS = LEAK_TRIGGER_CHIPS.map((trigger) => trigger.id);

function normalizeLeakTriggerTags(input?: unknown, fallbackNote = ""): LeakTriggerId[] {
  const rawTags = Array.isArray(input) ? input : [];
  const fromStructured = rawTags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter((tag): tag is LeakTriggerId => LEAK_TRIGGER_IDS.includes(tag as LeakTriggerId));

  const note = fallbackNote.toLowerCase();
  const fromNote = LEAK_TRIGGER_CHIPS
    .filter((trigger) => note.includes(trigger.tag.toLowerCase()))
    .map((trigger) => trigger.id);

  return Array.from(new Set([...fromStructured, ...fromNote]));
}

function buildNoteWithLeakTriggers(note: string, selectedTriggers: LeakTriggerId[]) {
  const trimmedNote = note.trim();
  const selectedTags = LEAK_TRIGGER_CHIPS
    .filter((trigger) => selectedTriggers.includes(trigger.id))
    .map((trigger) => trigger.tag);

  const cleanedNote = LEAK_TRIGGER_TAGS.reduce((nextNote, tag) => {
    return nextNote.replace(new RegExp(`\\s*${tag.replace("#", "#")}(?=\\s|$)`, "gi"), "");
  }, trimmedNote).trim();

  return [cleanedNote, ...selectedTags].filter(Boolean).join(" ").trim();
}

const defaultChallengeTemplates: ChallengeTemplate[] = [
  {
    id: "no_takeout_3",
    title: "No Takeout 3 Days",
    description: "Keep takeout spending under the limit for 3 days.",
    category: "Takeouts",
    durationDays: 3,
    maxSpend: 30,
    rewardHp: 10,
    icon: A.challengeTakeout,
  },
  {
    id: "coffee_control_7",
    title: "Coffee Control",
    description: "Keep coffee leaks under control for one week.",
    category: "Coffee",
    durationDays: 7,
    maxSpend: 25,
    rewardHp: 8,
    icon: A.challengeCoffee,
  },
  {
    id: "smoking_cut_7",
    title: "Smoking Cut 7 Days",
    description: "Reduce smoking spend for one week.",
    category: "Smoking",
    durationDays: 7,
    maxSpend: 60,
    rewardHp: 12,
    icon: A.challengeSmoking,
  },
  {
    id: "shopping_freeze_7",
    title: "Shopping Freeze",
    description: "Avoid random shopping leaks for 7 days.",
    category: "Shopping",
    durationDays: 7,
    maxSpend: 40,
    rewardHp: 12,
    icon: A.challengeShopping,
  },
  {
    id: "subscription_killer",
    title: "Subscription Killer",
    description: "Control subscriptions and recurring costs.",
    category: "Subscriptions",
    durationDays: 7,
    maxSpend: 20,
    rewardHp: 10,
    icon: A.challengeSubscriptions,
  },
  {
    id: "wallet_recovery_7",
    title: "Wallet HP Recovery",
    description: "Keep total leaks low and rebuild Wallet HP.",
    category: "All",
    durationDays: 7,
    maxSpend: 120,
    rewardHp: 15,
    icon: A.challengeWalletRecovery,
  },
];

const defaultBadges: BadgeItem[] = [
  {
    id: "stable_wallet",
    title: "Stable Wallet",
    description: "Keep Wallet HP high and leaks low.",
    icon: A.badgeStableWallet,
    earned: false,
    earnedAt: null,
  },
  {
    id: "small_leak",
    title: "Small Leak",
    description: "Track a month with only small leaks.",
    icon: A.badgeSmallLeak,
    earned: false,
    earnedAt: null,
  },
  {
    id: "pressure_mode",
    title: "Pressure Mode",
    description: "Leaks are starting to pressure the wallet.",
    icon: A.badgePressureMode,
    earned: false,
    earnedAt: null,
  },
  {
    id: "heavy_leak",
    title: "Heavy Leak",
    description: "A large share of your free money is leaking away.",
    icon: A.badgeHeavyLeak,
    earned: false,
    earnedAt: null,
  },
  {
    id: "full_broke_mode",
    title: "Full $BROKE Mode",
    description: "Real balance dropped to danger zone.",
    icon: A.badgeFullBrokeMode,
    earned: false,
    earnedAt: null,
  },
  {
    id: "saving_mode",
    title: "Saving Mode",
    description: "You kept leaks tight and protected your balance.",
    icon: A.badgeSavingMode,
    earned: false,
    earnedAt: null,
  },
  {
    id: "good_month",
    title: "Good Month",
    description: "A strong month with healthy balance and discipline.",
    icon: A.badgeGoodMonth,
    earned: false,
    earnedAt: null,
  },
  {
    id: "overspending",
    title: "Overspending",
    description: "You spent more than your post-life-cost budget.",
    icon: A.badgeOverspending,
    earned: false,
    earnedAt: null,
  },
  {
    id: "recovery_mode",
    title: "Recovery Mode",
    description: "A streak and better habits pushed the wallet back up.",
    icon: A.badgeRecoveryMode,
    earned: false,
    earnedAt: null,
  },
  {
    id: "streak",
    title: "Streak",
    description: "Reach a 7-day tracking streak.",
    icon: A.badgeStreak,
    earned: false,
    earnedAt: null,
  },
  {
    id: "first_expense",
    title: "First Expense",
    description: "Track your first expense.",
    icon: A.badgeFirstExpense,
    earned: false,
    earnedAt: null,
  },
  {
    id: "10_expenses",
    title: "10 Logs",
    description: "Track 10 expenses.",
    icon: A.badge10Expenses,
    earned: false,
    earnedAt: null,
  },
  {
    id: "50_expenses",
    title: "50 Logs",
    description: "Track 50 expenses.",
    icon: A.badge50Expenses,
    earned: false,
    earnedAt: null,
  },
  {
    id: "100_expenses",
    title: "100 Logs",
    description: "Track 100 expenses.",
    icon: A.badge100Expenses,
    earned: false,
    earnedAt: null,
  },
  {
    id: "daily_tracker",
    title: "Daily Tracker",
    description: "Track at least one expense today.",
    icon: A.badgeDailyTracker,
    earned: false,
    earnedAt: null,
  },
  {
    id: "3_day_streak",
    title: "3 Day Streak",
    description: "Reach a 3-day tracking streak.",
    icon: A.badge3DayStreak,
    earned: false,
    earnedAt: null,
  },
  {
    id: "7_day_streak",
    title: "7 Day Streak",
    description: "Reach a 7-day tracking streak.",
    icon: A.badge7DayStreak,
    earned: false,
    earnedAt: null,
  },
  {
    id: "14_day_streak",
    title: "14 Day Streak",
    description: "Reach a 14-day tracking streak.",
    icon: A.badge14DayStreak,
    earned: false,
    earnedAt: null,
  },
  {
    id: "30_day_streak",
    title: "30 Day Streak",
    description: "Reach a 30-day tracking streak.",
    icon: A.badge30DayStreak,
    earned: false,
    earnedAt: null,
  },
  {
    id: "streak_saver",
    title: "Streak Saver",
    description: "Keep a streak alive after building momentum.",
    icon: A.badgeStreakSaver,
    earned: false,
    earnedAt: null,
  },
  {
    id: "first_challenge",
    title: "First Challenge",
    description: "Start your first leak challenge.",
    icon: A.badgeFirstChallenge,
    earned: false,
    earnedAt: null,
  },
  {
    id: "challenge_complete",
    title: "Challenge Complete",
    description: "Complete your first challenge.",
    icon: A.badgeChallengeComplete,
    earned: false,
    earnedAt: null,
  },
  {
    id: "3_challenges",
    title: "3 Challenges",
    description: "Complete 3 challenges.",
    icon: A.badge3Challenges,
    earned: false,
    earnedAt: null,
  },
  {
    id: "5_challenges",
    title: "5 Challenges",
    description: "Complete 5 challenges.",
    icon: A.badge5Challenges,
    earned: false,
    earnedAt: null,
  },
  {
    id: "challenge_master",
    title: "Challenge Master",
    description: "Complete 10 challenges.",
    icon: A.badgeChallengeMaster,
    earned: false,
    earnedAt: null,
  },
  {
    id: "first_100_xp",
    title: "100 XP",
    description: "Earn your first 100 XP.",
    icon: A.badgeFirst100Xp,
    earned: false,
    earnedAt: null,
  },
  {
    id: "1000_xp",
    title: "1000 XP",
    description: "Earn 1000 total XP.",
    icon: A.badge1000Xp,
    earned: false,
    earnedAt: null,
  },
  {
    id: "top_10_daily",
    title: "Daily Top 10",
    description: "Reach top 10 in Daily Movers.",
    icon: A.badgeTop10Daily,
    earned: false,
    earnedAt: null,
  },
  {
    id: "top_10_weekly",
    title: "Weekly Top 10",
    description: "Reach top 10 in Weekly Discipline.",
    icon: A.badgeTop10Weekly,
    earned: false,
    earnedAt: null,
  },
  {
    id: "trust_level_3",
    title: "Trust Level 3",
    description: "Reach Trust Level 3.",
    icon: A.badgeTrustLevel3,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_early_supporter",
    title: "Premium Early Supporter",
    description: "Rare early premium badge for active public-test users.",
    icon: A.premiumBadgeEarlySupporter,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_founder",
    title: "Premium Founder",
    description: "Build trust, XP, and challenge activity early.",
    icon: A.premiumBadgeFounder,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_og_tracker",
    title: "Premium OG Tracker",
    description: "Track a serious number of expenses over time.",
    icon: A.premiumBadgeOgTracker,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_wallet_king",
    title: "Premium Wallet King",
    description: "Keep Wallet HP elite while actively tracking.",
    icon: A.premiumBadgeWalletKing,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_diamond_hands",
    title: "Premium Diamond Hands",
    description: "Hold long-term discipline without breaking momentum.",
    icon: A.premiumBadgeDiamondHands,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_leak_destroyer",
    title: "Premium Leak Destroyer",
    description: "Destroy leaks through completed challenges.",
    icon: A.premiumBadgeLeakDestroyer,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_challenge_elite",
    title: "Premium Challenge Elite",
    description: "Complete 10 challenges.",
    icon: A.premiumBadgeChallengeElite,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_streak_legend",
    title: "Premium Streak Legend",
    description: "Reach a 60-day tracking streak.",
    icon: A.premiumBadgeStreakLegend,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_top_1_daily",
    title: "Premium Top 1 Daily",
    description: "Reach #1 in Daily Movers.",
    icon: A.premiumBadgeTop1Daily,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_top_1_weekly",
    title: "Premium Top 1 Weekly",
    description: "Reach #1 in Weekly Discipline.",
    icon: A.premiumBadgeTop1Weekly,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_top_3_daily",
    title: "Premium Top 3 Daily",
    description: "Reach top 3 in Daily Movers.",
    icon: A.premiumBadgeTop3Daily,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_top_3_weekly",
    title: "Premium Top 3 Weekly",
    description: "Reach top 3 in Weekly Discipline.",
    icon: A.premiumBadgeTop3Weekly,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_5000_xp",
    title: "Premium 5000 XP",
    description: "Earn 5000 total XP.",
    icon: A.premiumBadge5000Xp,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_10000_xp",
    title: "Premium 10000 XP",
    description: "Earn 10000 total XP.",
    icon: A.premiumBadge10000Xp,
    earned: false,
    earnedAt: null,
  },
  {
    id: "premium_trust_legend",
    title: "Premium Trust Legend",
    description: "Reach Trust Level 3 with strong total XP.",
    icon: A.premiumBadgeTrustLegend,
    earned: false,
    earnedAt: null,
  },
];

const navItems: {
  id: Tab;
  label: string;
  icon: string;
  proOnly?: boolean;
}[] = [
  { id: "home", label: "Home", icon: "/nav-home.png" },
  { id: "add", label: "Add", icon: "/nav-add.png" },
  { id: "chart", label: "Chart", icon: "/nav-chart.png" },
  { id: "growth", label: "Growth", icon: "/nav-growth.png", proOnly: true },
  { id: "leakscore", label: "Leak", icon: "/nav-chart.png", proOnly: true },
  { id: "whatif", label: "Rewards", icon: "/nav-save.png", proOnly: true },
  { id: "settings", label: "Profile", icon: "/nav-settings.png" },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}


const DAILY_ROUTINE_ACTIONS_KEY = "broke-daily-routine-actions-v1";

function getDefaultDailyRoutineActions(date: string): DailyRoutineActions {
  return {
    date,
    openedApp: false,
    reviewedWallet: false,
    reviewedDay: false,
    lockedNextMove: false,
    checkedChart: false,
    checkedSave: false,
    sharedProgress: false,
  };
}

function readDailyRoutineActions(date = dayKey(new Date())): DailyRoutineActions {
  if (typeof window === "undefined") {
    return getDefaultDailyRoutineActions(date);
  }

  try {
    const raw = window.localStorage.getItem(DAILY_ROUTINE_ACTIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<DailyRoutineActions>) : null;

    if (parsed?.date !== date) {
      return getDefaultDailyRoutineActions(date);
    }

    return {
      ...getDefaultDailyRoutineActions(date),
      ...parsed,
      date,
    };
  } catch {
    return getDefaultDailyRoutineActions(date);
  }
}

function writeDailyRoutineActions(actions: DailyRoutineActions, notifyChange = true) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DAILY_ROUTINE_ACTIONS_KEY, JSON.stringify(actions));
    if (notifyChange) window.dispatchEvent(new Event(LOCAL_APP_STATE_CHANGE_EVENT));
  } catch {
    // Daily routine is optional. Ignore storage errors.
  }
}

function markDailyRoutineAction(action: DailyRoutineActionKey) {
  const date = dayKey(new Date());
  const actions = readDailyRoutineActions(date);

  if (actions[action]) return;

  writeDailyRoutineActions({
    ...actions,
    date,
    [action]: true,
  });
}

const RETURN_HOOK_KEY = "broke-return-hook-goal-v1";

function getTomorrowDayKey() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return dayKey(date);
}

function readReturnHookGoal(): ReturnHookGoal | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(RETURN_HOOK_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ReturnHookGoal>;

    if (!parsed.targetDate || !parsed.action || !parsed.title || !parsed.detail) {
      return null;
    }

    return parsed as ReturnHookGoal;
  } catch {
    return null;
  }
}

function writeReturnHookGoal(goal: ReturnHookGoal | null) {
  if (typeof window === "undefined") return;

  try {
    if (!goal) {
      window.localStorage.removeItem(RETURN_HOOK_KEY);
      return;
    }

    window.localStorage.setItem(RETURN_HOOK_KEY, JSON.stringify(goal));
  } catch {
    // Return hook is optional. Ignore storage errors.
  }
}

const DAILY_ROUTINE_REWARD_KEY = "broke-daily-routine-reward-v1";

function readDailyRoutineReward(date = dayKey(new Date())) {
  if (typeof window === "undefined") {
    return {
      date,
      claimed: false,
    };
  }

  try {
    const raw = window.localStorage.getItem(DAILY_ROUTINE_REWARD_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as { date?: string; claimed?: boolean })
      : null;

    if (parsed?.date !== date) {
      return {
        date,
        claimed: false,
      };
    }

    return {
      date,
      claimed: Boolean(parsed.claimed),
    };
  } catch {
    return {
      date,
      claimed: false,
    };
  }
}

function writeDailyRoutineReward(date = dayKey(new Date()), claimed = true, notifyChange = true) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      DAILY_ROUTINE_REWARD_KEY,
      JSON.stringify({
        date,
        claimed,
      })
    );
    if (notifyChange) window.dispatchEvent(new Event(LOCAL_APP_STATE_CHANGE_EVENT));
  } catch {
    // XP reward marker is optional. Ignore storage errors.
  }
}

const ACTIVE_STREAK_PROOF_KEY = "broke-active-streak-proof-v1";
const ACTIVE_STREAK_ELIGIBILITY_DAYS = 7;
const FUTURE_HOLDER_REWARD_MIN_BALANCE = 100_000;
const ACTIVE_STREAK_RECOVERY_ACTIONS = 1;
const ACTIVE_STREAK_RECOVERY_COOLDOWN_DAYS = 7;
const activeStreakProofActions: ActiveStreakProofAction[] = ["daily_routine"];

function getPreviousDayKey(dateKey: string, daysBack = 1) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() - daysBack);
  return dayKey(date);
}

function getDayDistance(fromKey: string, toKey: string) {
  const from = new Date(`${fromKey}T00:00:00`).getTime();
  const to = new Date(`${toKey}T00:00:00`).getTime();

  if (!Number.isFinite(from) || !Number.isFinite(to)) return 999;

  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

function normalizeActiveStreakProofAction(value: unknown): ActiveStreakProofAction | null {
  return activeStreakProofActions.includes(value as ActiveStreakProofAction)
    ? (value as ActiveStreakProofAction)
    : null;
}

function emptyActiveStreakProofState(): ActiveStreakProofState {
  return {
    logs: [],
    recoveredMissedDates: [],
    recoveryUsedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeActiveStreakProofState(input?: Partial<ActiveStreakProofState> | null): ActiveStreakProofState {
  const logs = Array.isArray(input?.logs)
    ? input.logs
        .map((log) => {
          const date = String(log?.date || "");
          const actions = Array.isArray(log?.actions)
            ? Array.from(
                new Set(
                  log.actions
                    .map(normalizeActiveStreakProofAction)
                    .filter((action): action is ActiveStreakProofAction => Boolean(action))
                )
              )
            : [];

          if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || actions.length === 0) return null;

          return {
            date,
            actions,
          };
        })
        .filter((log): log is ActiveStreakProofLog => Boolean(log))
    : [];

  const recoveredMissedDates = Array.isArray(input?.recoveredMissedDates)
    ? Array.from(
        new Set(
          input.recoveredMissedDates
            .map((date) => String(date || ""))
            .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
        )
      )
    : [];

  const recoveryUsedAt = input?.recoveryUsedAt && /^\d{4}-\d{2}-\d{2}$/.test(String(input.recoveryUsedAt))
    ? String(input.recoveryUsedAt)
    : null;

  return {
    logs: logs
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-90),
    recoveredMissedDates: recoveredMissedDates.sort().slice(-12),
    recoveryUsedAt,
    updatedAt: input?.updatedAt || new Date().toISOString(),
  };
}

function mergeActiveStreakProofStates(
  base?: Partial<ActiveStreakProofState> | null,
  incoming?: Partial<ActiveStreakProofState> | null
): ActiveStreakProofState {
  const normalizedBase = normalizeActiveStreakProofState(base);
  const normalizedIncoming = normalizeActiveStreakProofState(incoming);
  const logsByDate = new Map<string, ActiveStreakProofLog>();

  [...normalizedBase.logs, ...normalizedIncoming.logs].forEach((log) => {
    const current = logsByDate.get(log.date);
    logsByDate.set(log.date, {
      date: log.date,
      actions: Array.from(new Set([...(current?.actions || []), ...log.actions])),
    });
  });

  const recoveredMissedDates = Array.from(
    new Set([
      ...normalizedBase.recoveredMissedDates,
      ...normalizedIncoming.recoveredMissedDates,
    ])
  ).sort().slice(-12);
  const recoveryUsedAt = [normalizedBase.recoveryUsedAt, normalizedIncoming.recoveryUsedAt]
    .filter((date): date is string => Boolean(date))
    .sort()
    .pop() || null;
  const updatedAt = [normalizedBase.updatedAt, normalizedIncoming.updatedAt]
    .filter((date): date is string => Boolean(date))
    .sort()
    .pop() || new Date().toISOString();

  return normalizeActiveStreakProofState({
    logs: Array.from(logsByDate.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-90),
    recoveredMissedDates,
    recoveryUsedAt,
    updatedAt,
  });
}

function readActiveStreakProofState(): ActiveStreakProofState {
  if (typeof window === "undefined") return emptyActiveStreakProofState();

  try {
    const raw = window.localStorage.getItem(ACTIVE_STREAK_PROOF_KEY);
    return normalizeActiveStreakProofState(raw ? (JSON.parse(raw) as Partial<ActiveStreakProofState>) : null);
  } catch {
    return emptyActiveStreakProofState();
  }
}

function writeActiveStreakProofState(state: ActiveStreakProofState, notifyChange = true) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      ACTIVE_STREAK_PROOF_KEY,
      JSON.stringify(normalizeActiveStreakProofState(state))
    );
    if (notifyChange) window.dispatchEvent(new Event(LOCAL_APP_STATE_CHANGE_EVENT));
  } catch {
    // Active streak proof is a retention mechanic. It must not block tracking.
  }
}

function getActiveStreakProofDateSet(state: ActiveStreakProofState) {
  const normalized = normalizeActiveStreakProofState(state);
  return new Set([
    ...normalized.logs.map((log) => log.date),
    ...normalized.recoveredMissedDates,
  ]);
}

function calculateActiveProofStreakFromDateSet(dateSet: Set<string>) {
  const dates = Array.from(dateSet).sort();

  if (dates.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastProofDate: null as string | null,
    };
  }

  let bestStreak = 0;
  let rollingStreak = 0;
  let previousDate = "";

  for (const date of dates) {
    if (previousDate && getDayDistance(previousDate, date) === 1) {
      rollingStreak += 1;
    } else {
      rollingStreak = 1;
    }

    bestStreak = Math.max(bestStreak, rollingStreak);
    previousDate = date;
  }

  const today = dayKey(new Date());
  const yesterday = getPreviousDayKey(today);
  let currentStreak = 0;

  if (dateSet.has(today) || dateSet.has(yesterday)) {
    const startKey = dateSet.has(today) ? today : yesterday;
    const cursor = new Date(`${startKey}T00:00:00`);

    while (dateSet.has(dayKey(cursor))) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return {
    currentStreak,
    bestStreak,
    lastProofDate: dates[dates.length - 1] || null,
  };
}

function buildActiveStreakProofStatus(state: ActiveStreakProofState): ActiveStreakProofStatus {
  const normalized = normalizeActiveStreakProofState(state);
  const today = dayKey(new Date());
  const yesterday = getPreviousDayKey(today);
  const dayBeforeYesterday = getPreviousDayKey(today, 2);
  const todayActions = normalized.logs.find((log) => log.date === today)?.actions || [];
  const dateSet = getActiveStreakProofDateSet(normalized);
  const streakMetrics = calculateActiveProofStreakFromDateSet(dateSet);
  const recoveryUsedRecently = normalized.recoveryUsedAt
    ? getDayDistance(normalized.recoveryUsedAt, today) < ACTIVE_STREAK_RECOVERY_COOLDOWN_DAYS
    : false;
  const recoveryMissedDate = !dateSet.has(yesterday) && dateSet.has(dayBeforeYesterday) ? yesterday : null;
  const recoveryMode = Boolean(recoveryMissedDate && !dateSet.has(today));
  const recoveryAvailable = Boolean(recoveryMissedDate && !recoveryUsedRecently);
  const recoveryActionsNeeded = recoveryAvailable
    ? Math.max(0, ACTIVE_STREAK_RECOVERY_ACTIONS - todayActions.length)
    : 0;
  const progressDays = Math.min(streakMetrics.currentStreak, ACTIVE_STREAK_ELIGIBILITY_DAYS);
  const eligible = streakMetrics.currentStreak >= ACTIVE_STREAK_ELIGIBILITY_DAYS;
  const activeToday = dateSet.has(today);

  let label = `${progressDays}/${ACTIVE_STREAK_ELIGIBILITY_DAYS}`;
  let detail = `Keep a ${ACTIVE_STREAK_ELIGIBILITY_DAYS}+ day Daily Routine streak to stay eligible for future Holder Rewards.`;

  if (eligible) {
    label = "Eligible";
    detail = "7+ day active streak is live. Complete Daily Routine daily to stay eligible.";
  } else if (recoveryMode || (recoveryAvailable && todayActions.length > 0)) {
    label = "Recovery";
    detail = recoveryAvailable
      ? "Missed yesterday. Complete today’s full Daily Routine to restore the streak."
      : "Recovery was already used this week. Build a new clean streak if it resets.";
  } else if (activeToday) {
    detail = "Today is protected by completed Daily Routine. Keep going until the 7-day holder line.";
  }

  return {
    currentStreak: streakMetrics.currentStreak,
    bestStreak: streakMetrics.bestStreak,
    progressDays,
    eligible,
    activeToday,
    todayActions,
    recoveryMode,
    recoveryAvailable,
    recoveryUsedRecently,
    recoveryActionsNeeded,
    recoveryMissedDate,
    lastProofDate: streakMetrics.lastProofDate,
    label,
    detail,
  };
}

function markActiveStreakProofAction(action: ActiveStreakProofAction): ActiveStreakProofState {
  const today = dayKey(new Date());
  const state = normalizeActiveStreakProofState(readActiveStreakProofState());
  const logs = state.logs.filter((log) => log.date !== today);
  const todayLog = state.logs.find((log) => log.date === today) || { date: today, actions: [] };
  const actions = Array.from(new Set([...todayLog.actions, action]));
  const next: ActiveStreakProofState = normalizeActiveStreakProofState({
    ...state,
    logs: [...logs, { date: today, actions }],
    updatedAt: new Date().toISOString(),
  });
  const status = buildActiveStreakProofStatus(next);

  if (
    status.recoveryMissedDate &&
    status.recoveryAvailable &&
    actions.length >= ACTIVE_STREAK_RECOVERY_ACTIONS &&
    !next.recoveredMissedDates.includes(status.recoveryMissedDate)
  ) {
    next.recoveredMissedDates = [...next.recoveredMissedDates, status.recoveryMissedDate];
    next.recoveryUsedAt = today;
    next.updatedAt = new Date().toISOString();
  }

  writeActiveStreakProofState(next);
  return normalizeActiveStreakProofState(next);
}

function activeStreakProofActionLabel(action: ActiveStreakProofAction) {
  if (action === "track_leak") return "Tracked leak";
  if (action === "clean_day") return "Clean day";
  if (action === "one_fix") return "One Fix";
  if (action === "daily_challenge") return "Daily challenge";
  return "Daily Routine";
}

function activeStreakProofActionShortLabel(action: ActiveStreakProofAction) {
  if (action === "track_leak") return "Track Leak";
  if (action === "clean_day") return "Clean Day";
  if (action === "one_fix") return "One Fix";
  if (action === "daily_challenge") return "Daily Challenge";
  return "Daily Routine";
}

function buildActiveStreakProofTimeline(
  state: ActiveStreakProofState,
  days = ACTIVE_STREAK_ELIGIBILITY_DAYS
): ActiveStreakProofTimelineDay[] {
  const normalized = normalizeActiveStreakProofState(state);
  const today = dayKey(new Date());
  const yesterday = getPreviousDayKey(today);
  const recoveredSet = new Set(normalized.recoveredMissedDates);
  const logsByDate = new Map(normalized.logs.map((log) => [log.date, log]));
  const timeline: ActiveStreakProofTimelineDay[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = getPreviousDayKey(today, index);
    const parsedDate = new Date(`${date}T00:00:00`);
    const log = logsByDate.get(date);
    const recovered = recoveredSet.has(date);
    const actions = log?.actions || [];

    timeline.push({
      date,
      label: parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dayName: parsedDate.toLocaleDateString("en-US", { weekday: "short" }),
      protected: actions.length > 0 || recovered,
      recovered,
      isToday: date === today,
      isYesterday: date === yesterday,
      actions,
    });
  }

  return timeline;
}

function getActiveStreakTimelineSummary(status: ActiveStreakProofStatus) {
  if (status.activeToday) {
    const proof = status.todayActions.length
      ? status.todayActions.map(activeStreakProofActionShortLabel).join(" · ")
      : "Protected";

    return {
      title: "Today protected",
      detail: `Proof: ${proof}.`,
      tone: "protected" as const,
    };
  }

  if (status.recoveryAvailable) {
    return {
      title: "Recovery available",
      detail: "Complete today’s full Daily Routine to restore the missed day.",
      tone: "recovery" as const,
    };
  }

  if (status.currentStreak > 0 && status.lastProofDate) {
    return {
      title: "Today needs proof",
      detail: `Last protected day: ${status.lastProofDate}. Complete today’s full Daily Routine before the day ends.`,
      tone: "warning" as const,
    };
  }

  return {
    title: "No active proof yet",
    detail: "Complete the full Daily Routine to protect today.",
    tone: "empty" as const,
  };
}

function getActiveStreakTimelineDayLabel(day: ActiveStreakProofTimelineDay) {
  if (day.recovered) return "Recovered";
  if (day.actions.length > 0) return day.actions.map(activeStreakProofActionShortLabel).join(" · ");
  if (day.isToday) return "Needs proof";
  return "No proof";
}

function getActiveStreakRewardReadinessLabel(status: ActiveStreakProofStatus, settings: Settings) {
  const verified = Boolean(settings.wallet.isVerified);
  const meetsMinHold = settings.wallet.brokeBalance >= FUTURE_HOLDER_REWARD_MIN_BALANCE;

  if (verified && meetsMinHold && status.eligible) return "Reward-ready foundation";
  if (!verified) return "Verify wallet next";
  if (!meetsMinHold) return "Hold 100K+ $BROKE next";
  if (status.recoveryMode || status.recoveryAvailable) return "Recovery active";
  if (status.activeToday) return "Daily Routine protected today";

  return "Daily Routine needed today";
}

function buildActiveStreakProofShareText(settings: Settings, status: ActiveStreakProofStatus) {
  const identityName = getPublicIdentityName(settings);
  const identityStatus = getPublicIdentityStatus(settings);
  const verifiedWallet = Boolean(settings.wallet.isVerified);
  const verifiedHolderBalance = verifiedWallet ? settings.wallet.brokeBalance : 0;
  const holderTier = verifiedHolderBalance > 0
    ? settings.wallet.holderTier.label
    : verifiedWallet
      ? "Building holder balance"
      : "Verify first";
  const verified = verifiedWallet ? "Verified wallet" : "Wallet not verified yet";
  const balanceLine = verifiedHolderBalance > 0
    ? `${formatTokenAmount(verifiedHolderBalance)} BROKE`
    : verifiedWallet
      ? "Building holder balance"
      : "Wallet not verified yet";
  const todayLine = status.activeToday
    ? "Today protected"
    : status.recoveryAvailable
      ? "Recovery mode: Daily Routine needed"
      : "Today needs Daily Routine";

  return [
    `${identityName} on $BROKE`,
    identityStatus,
    "",
    "BROKE Active Streak proof:",
    `Active streak: ${status.currentStreak}/${ACTIVE_STREAK_ELIGIBILITY_DAYS}+ days`,
    `Today: ${todayLine}`,
    `Status: ${status.eligible ? "Eligible streak live" : "Building eligibility"}`,
    `Holder tier: ${holderTier}`,
    `Wallet: ${verified}`,
    `Balance proof: ${balanceLine}`,
    "",
    "Keep a 7+ day Daily Routine streak to stay eligible for future Holder Rewards.",
    "Built in $BROKE Life Tracker.",
  ].filter(Boolean).join("\n");
}

const REWARD_NOTIFICATION_PREFS_KEY = "broke-reward-notification-prefs-v1";
const REWARD_NOTIFICATION_TIME_OPTIONS = ["09:00", "18:00", "21:00"];

function getDefaultRewardNotificationPrefs(): RewardNotificationPrefs {
  return {
    dailyProofReminder: true,
    recoveryReminder: true,
    milestoneReminder: true,
    reminderTime: "18:00",
    updatedAt: new Date().toISOString(),
  };
}

function normalizeRewardNotificationPrefs(input?: Partial<RewardNotificationPrefs> | null): RewardNotificationPrefs {
  const fallback = getDefaultRewardNotificationPrefs();
  const reminderTime = typeof input?.reminderTime === "string" && /^\d{2}:\d{2}$/.test(input.reminderTime)
    ? input.reminderTime
    : fallback.reminderTime;

  return {
    dailyProofReminder: typeof input?.dailyProofReminder === "boolean" ? input.dailyProofReminder : fallback.dailyProofReminder,
    recoveryReminder: typeof input?.recoveryReminder === "boolean" ? input.recoveryReminder : fallback.recoveryReminder,
    milestoneReminder: typeof input?.milestoneReminder === "boolean" ? input.milestoneReminder : fallback.milestoneReminder,
    reminderTime,
    updatedAt: input?.updatedAt || new Date().toISOString(),
  };
}

function readRewardNotificationPrefs(): RewardNotificationPrefs {
  if (typeof window === "undefined") return getDefaultRewardNotificationPrefs();

  try {
    const raw = window.localStorage.getItem(REWARD_NOTIFICATION_PREFS_KEY);
    return normalizeRewardNotificationPrefs(raw ? (JSON.parse(raw) as Partial<RewardNotificationPrefs>) : null);
  } catch {
    return getDefaultRewardNotificationPrefs();
  }
}

function writeRewardNotificationPrefs(input: RewardNotificationPrefs, notifyChange = true) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      REWARD_NOTIFICATION_PREFS_KEY,
      JSON.stringify(normalizeRewardNotificationPrefs(input))
    );
    if (notifyChange) window.dispatchEvent(new Event(LOCAL_APP_STATE_CHANGE_EVENT));
  } catch {
    // Notification preferences are local-first and must not block the app.
  }
}

function buildRewardReminderCopy(status: ActiveStreakProofStatus, prefs: RewardNotificationPrefs) {
  const todayLine = status.activeToday
    ? "today is already protected"
    : status.recoveryAvailable
      ? "Daily Routine needed today for recovery"
      : "Daily Routine needed today";

  return [
    "$BROKE Active Streak reminder",
    `Preferred time: ${prefs.reminderTime}`,
    `Status: ${todayLine}`,
    prefs.dailyProofReminder ? "Daily proof reminder: on" : "Daily proof reminder: off",
    prefs.recoveryReminder ? "Recovery alert: on" : "Recovery alert: off",
    prefs.milestoneReminder ? "7-day milestone alert: on" : "7-day milestone alert: off",
    "",
    "Future Holder Rewards will use live 7+ day Daily Routine proof.",
  ].join("\n");
}


function normalizeCurrencyMode(value: unknown): CurrencyMode {
  return value === "convert" ? "convert" : "display";
}

function normalizeCurrency(value: unknown, fallback: Currency = defaultCurrency): Currency {
  const candidate = String(value || "").trim().toUpperCase();

  return supportedCurrencies.includes(candidate as Currency) ? (candidate as Currency) : fallback;
}

function normalizeOptionalCurrency(value: unknown): Currency | undefined {
  if (!value) return undefined;

  const candidate = String(value).trim().toUpperCase();

  return supportedCurrencies.includes(candidate as Currency) ? (candidate as Currency) : undefined;
}

function normalizeCurrencyRecord<T extends readonly string[]>(
  input: unknown,
  keys: T,
  fallbackCurrency: Currency
) {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return keys.reduce((acc, key) => {
    acc[key as T[number]] = normalizeCurrency(source[key], fallbackCurrency);
    return acc;
  }, {} as Record<T[number], Currency>);
}

function getSettingsMoneySources(settings: Settings) {
  return [
    ...incomeKeys.map((key) => settings.incomeCurrencies[key]),
    ...fixedCostKeys.map((key) => settings.fixedCostCurrencies[key]),
  ];
}

function displaySettingsForMoney(settings: Settings, rates: ExchangeRateMap): Settings {
  if (settings.currencyMode !== "convert") return settings;

  const income = incomeKeys.reduce((acc, key) => {
    const display = getDisplayAmount(settings.income[key], settings.incomeCurrencies[key], settings, rates);
    acc[key] = display.amount;
    return acc;
  }, {} as Settings["income"]);

  const fixedCosts = fixedCostKeys.reduce((acc, key) => {
    const display = getDisplayAmount(settings.fixedCosts[key], settings.fixedCostCurrencies[key], settings, rates);
    acc[key] = display.amount;
    return acc;
  }, {} as Settings["fixedCosts"]);

  return {
    ...settings,
    income,
    incomeCurrencies: currencyMapForKeys(incomeKeys, settings.currency),
    fixedCosts,
    fixedCostCurrencies: currencyMapForKeys(fixedCostKeys, settings.currency),
  };
}

function getCurrencySymbol(currencyInput: Currency | string | undefined) {
  const currency = normalizeCurrency(currencyInput);
  const symbols: Record<Currency, string> = {
    USD: "$",
    EUR: "€",
    MDL: "L",
    NGN: "₦",
    PKR: "Rs",
    GBP: "£",
    INR: "₹",
    CAD: "C$",
    AUD: "A$",
    NZD: "NZ$",
    ZAR: "R",
    GHS: "₵",
    KES: "KSh",
    UGX: "USh",
    TZS: "TSh",
    XAF: "FCFA",
    XOF: "CFA",
    EGP: "E£",
    MAD: "MAD",
    TRY: "₺",
    AED: "AED",
    SAR: "SAR",
    PHP: "₱",
    IDR: "Rp",
    VND: "₫",
    THB: "฿",
    MYR: "RM",
    SGD: "S$",
    BDT: "৳",
    LKR: "Rs",
    NPR: "Rs",
    BRL: "R$",
    MXN: "$",
    UAH: "₴",
    PLN: "zł",
    RON: "RON",
    GEL: "₾",
    KZT: "₸",
  };

  return symbols[currency] || currency;
}

function currencySymbol(currency: Currency) {
  return getCurrencySymbol(currency);
}

function formatMoney(value: number, currencyInput: Currency | string | undefined, options: MoneyFormatOptions = {}) {
  const currency = normalizeCurrency(currencyInput);
  const symbol = getCurrencySymbol(currency);
  const safeValue = Number.isFinite(value) ? value : 0;
  const absoluteValue = Math.abs(safeValue);
  const precision = options.precision || "whole";
  const minimumFractionDigits = precision === "auto" && absoluteValue > 0 && absoluteValue < 10 ? 2 : 0;
  const maximumFractionDigits = precision === "auto" && absoluteValue > 0 && absoluteValue < 100 ? 2 : 0;
  const displayValue = absoluteValue.toLocaleString("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  });
  const prefix = safeValue < 0 && absoluteValue > 0 ? "-" : "";
  const suffix = options.includeCode ? ` ${currency}` : "";

  return `${prefix}${symbol}${displayValue}${suffix}`;
}

function money(value: number, currency: Currency) {
  return formatMoney(value, currency);
}

function exchangeRateKey(baseCurrency: Currency, quoteCurrency: Currency) {
  return `${baseCurrency}:${quoteCurrency}`;
}

function getUniqueCurrencies(values: Array<Currency | undefined>, fallback: Currency) {
  return Array.from(
    new Set(values.map((value) => normalizeCurrency(value, fallback)))
  ).filter((currency) => supportedCurrencies.includes(currency));
}

type ExchangeRatePair = {
  baseCurrency: Currency;
  quoteCurrency: Currency;
};

function getExchangeRatePairs(settings: Settings, sourceCurrencies: Array<Currency | undefined>) {
  if (settings.currencyMode !== "convert") return [] as ExchangeRatePair[];

  const sources = getUniqueCurrencies([...sourceCurrencies, settings.currency], settings.currency);
  const pairs = new Map<string, ExchangeRatePair>();

  function addPair(baseCurrency: Currency, quoteCurrency: Currency) {
    if (baseCurrency === quoteCurrency) return;
    pairs.set(exchangeRateKey(baseCurrency, quoteCurrency), { baseCurrency, quoteCurrency });
  }

  sources.forEach((sourceCurrency) => {
    addPair(sourceCurrency, settings.currency);
    addPair(sourceCurrency, usdReferenceCurrency);
  });

  addPair(settings.currency, usdReferenceCurrency);

  return Array.from(pairs.values()).sort((a, b) =>
    exchangeRateKey(a.baseCurrency, a.quoteCurrency).localeCompare(exchangeRateKey(b.baseCurrency, b.quoteCurrency))
  );
}

function getRateSnapshot(
  rates: ExchangeRateMap,
  baseCurrency: Currency,
  quoteCurrency: Currency
) {
  if (baseCurrency === quoteCurrency) {
    return {
      baseCurrency,
      quoteCurrency,
      rate: 1,
      source: "identity",
    } satisfies ExchangeRateSnapshot;
  }

  const direct = rates[exchangeRateKey(baseCurrency, quoteCurrency)];
  if (direct && Number.isFinite(direct.rate) && direct.rate > 0) return direct;

  return null;
}

function convertAmountWithRates(
  value: number,
  baseCurrency: Currency,
  quoteCurrency: Currency,
  rates: ExchangeRateMap
) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const rate = getRateSnapshot(rates, baseCurrency, quoteCurrency);

  if (!rate) return null;

  return safeValue * rate.rate;
}

function getDisplayAmount(
  value: number,
  sourceCurrency: Currency | undefined,
  settings: Settings,
  rates: ExchangeRateMap
) {
  const fromCurrency = normalizeCurrency(sourceCurrency, settings.currency);

  if (settings.currencyMode !== "convert" || fromCurrency === settings.currency) {
    return {
      amount: value,
      currency: fromCurrency,
      originalAmount: value,
      originalCurrency: fromCurrency,
      converted: false,
      ready: true,
    };
  }

  const convertedAmount = convertAmountWithRates(value, fromCurrency, settings.currency, rates);

  if (convertedAmount === null) {
    return {
      amount: value,
      currency: fromCurrency,
      originalAmount: value,
      originalCurrency: fromCurrency,
      converted: false,
      ready: false,
    };
  }

  return {
    amount: convertedAmount,
    currency: settings.currency,
    originalAmount: value,
    originalCurrency: fromCurrency,
    converted: true,
    ready: true,
  };
}

function displayMoney(
  value: number,
  sourceCurrency: Currency | undefined,
  settings: Settings,
  rates: ExchangeRateMap,
  options: MoneyFormatOptions = {}
) {
  const display = getDisplayAmount(value, sourceCurrency, settings, rates);
  return formatMoney(display.amount, display.currency, options);
}

function originalMoneyNote(display: ReturnType<typeof getDisplayAmount>) {
  if (!display.converted) return "";
  return `≈ ${formatMoney(display.originalAmount, display.originalCurrency, { includeCode: true })}`;
}

function settingsMoneyClarityNote(
  value: number,
  sourceCurrency: Currency | undefined,
  settings: Settings,
  rates: ExchangeRateMap
) {
  const storedCurrency = normalizeCurrency(sourceCurrency, settings.currency);
  const storedLabel = formatMoney(value, storedCurrency, { includeCode: true, precision: "auto" });

  if (settings.currencyMode !== "convert") {
    return `Stored as ${storedLabel}. Display-only mode changes the app label, not the saved number.`;
  }

  const display = getDisplayAmount(value, storedCurrency, settings, rates);

  if (!display.ready) {
    return `Stored as ${storedLabel}. Rate to ${settings.currency} is not ready yet.`;
  }

  if (!display.converted) {
    return `Stored as ${storedLabel}. Same as display currency.`;
  }

  return `Stored as ${storedLabel} · Displayed as ${formatMoney(display.amount, display.currency, {
    includeCode: true,
    precision: "auto",
  })}`;
}

function getUsdReferenceAmount(
  value: number,
  sourceCurrency: Currency | undefined,
  settings: Settings,
  rates: ExchangeRateMap
) {
  if (settings.currencyMode !== "convert") return null;

  const fromCurrency = normalizeCurrency(sourceCurrency, settings.currency);

  if (fromCurrency === usdReferenceCurrency) {
    return {
      amount: Number.isFinite(value) ? value : 0,
      currency: usdReferenceCurrency,
      ready: true,
    };
  }

  const convertedAmount = convertAmountWithRates(value, fromCurrency, usdReferenceCurrency, rates);

  if (convertedAmount === null) return null;

  return {
    amount: convertedAmount,
    currency: usdReferenceCurrency,
    ready: true,
  };
}

function usdReferenceNote(
  value: number,
  sourceCurrency: Currency | undefined,
  settings: Settings,
  rates: ExchangeRateMap
) {
  const reference = getUsdReferenceAmount(value, sourceCurrency, settings, rates);

  if (!reference || sourceCurrency === usdReferenceCurrency) return "";

  return `≈ ${formatMoney(reference.amount, usdReferenceCurrency, { includeCode: true, precision: "auto" })}`;
}

function usdReferenceNoteFromDisplay(
  display: ReturnType<typeof getDisplayAmount>,
  settings: Settings,
  rates: ExchangeRateMap
) {
  if (display.currency === usdReferenceCurrency) return "";

  return usdReferenceNote(display.originalAmount, display.originalCurrency, settings, rates);
}

function expenseToDisplayExpense(expense: Expense, settings: Settings, rates: ExchangeRateMap): Expense {
  const display = getDisplayAmount(expense.amount, expense.currency, settings, rates);
  const necessaryDisplay = Number.isFinite(expense.necessaryAmount)
    ? getDisplayAmount(Number(expense.necessaryAmount), expense.currency, settings, rates)
    : null;
  const avoidableDisplay = Number.isFinite(expense.avoidableLeakAmount)
    ? getDisplayAmount(Number(expense.avoidableLeakAmount), expense.currency, settings, rates)
    : null;
  const usdReference = getUsdReferenceAmount(display.originalAmount, display.originalCurrency, settings, rates);
  const shouldAttachUsdReference = Boolean(
    usdReference &&
      display.currency !== usdReferenceCurrency &&
      Number.isFinite(usdReference.amount)
  );

  if (!display.converted && !shouldAttachUsdReference) return expense;

  return {
    ...expense,
    amount: display.amount,
    ...(necessaryDisplay ? { necessaryAmount: necessaryDisplay.amount } : {}),
    ...(avoidableDisplay ? { avoidableLeakAmount: avoidableDisplay.amount } : {}),
    currency: display.currency,
    originalAmount: display.originalAmount,
    originalCurrency: display.originalCurrency,
    convertedForDisplay: display.converted,
    ...(shouldAttachUsdReference
      ? { usdReferenceAmount: usdReference?.amount, usdReferenceCurrency }
      : {}),
  };
}

function useExchangeRates(settings: Settings, sourceCurrencies: Array<Currency | undefined>) {
  const [rateState, setRateState] = useState<ExchangeRateState>({
    rates: {},
    status: "idle",
    error: "",
  });

  const ratePairs = getExchangeRatePairs(settings, sourceCurrencies);
  const rateRequestKey = ratePairs
    .map((pair) => exchangeRateKey(pair.baseCurrency, pair.quoteCurrency))
    .join("|");

  useEffect(() => {
    if (settings.currencyMode !== "convert" || !rateRequestKey) {
      const idleTimer = window.setTimeout(() => {
        setRateState((prev) => ({ ...prev, status: "idle", error: "" }));
      }, 0);

      return () => window.clearTimeout(idleTimer);
    }

    let cancelled = false;
    const requestedPairs = rateRequestKey.split("|").map((pairKey) => {
      const [baseCurrency, quoteCurrency] = pairKey.split(":");
      return {
        baseCurrency: normalizeCurrency(baseCurrency, settings.currency),
        quoteCurrency: normalizeCurrency(quoteCurrency, settings.currency),
      };
    });
    const missing = requestedPairs.filter((pair) => !rateState.rates[exchangeRateKey(pair.baseCurrency, pair.quoteCurrency)]);

    if (missing.length === 0) {
      const readyTimer = window.setTimeout(() => {
        setRateState((prev) => ({ ...prev, status: "ready", error: "" }));
      }, 0);

      return () => window.clearTimeout(readyTimer);
    }

    async function loadRates() {
      setRateState((prev) => ({ ...prev, status: "loading", error: "" }));

      const results = await Promise.allSettled(
        missing.map(async (pair) => {
          const response = await fetch(
            `/api/exchange-rates?base=${encodeURIComponent(pair.baseCurrency)}&quote=${encodeURIComponent(pair.quoteCurrency)}`,
            { cache: "no-store" }
          );

          const data = await response.json();

          if (!response.ok || !data?.ok || !Number.isFinite(Number(data.rate))) {
            throw new Error(data?.error || `Rate ${pair.baseCurrency}/${pair.quoteCurrency} failed`);
          }

          return {
            baseCurrency: normalizeCurrency(data.baseCurrency, pair.baseCurrency),
            quoteCurrency: normalizeCurrency(data.quoteCurrency, pair.quoteCurrency),
            rate: Number(data.rate),
            rateDate: data.rateDate ? String(data.rateDate) : undefined,
            source: data.source ? String(data.source) : "frankfurter",
            fetchedAt: data.fetchedAt ? String(data.fetchedAt) : undefined,
            cached: Boolean(data.cached),
            cacheStatus: data.cacheStatus ? String(data.cacheStatus) : undefined,
          } satisfies ExchangeRateSnapshot;
        })
      );

      if (cancelled) return;

      const nextRates: ExchangeRateMap = {};
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          nextRates[exchangeRateKey(result.value.baseCurrency, result.value.quoteCurrency)] = result.value;
        } else {
          const pair = missing[index];
          errors.push(`${pair.baseCurrency}→${pair.quoteCurrency}`);
        }
      });

      setRateState((prev) => ({
        rates: {
          ...prev.rates,
          ...nextRates,
        },
        status: errors.length > 0 ? (Object.keys(nextRates).length > 0 ? "partial" : "error") : "ready",
        error: errors.length > 0 ? `Could not load rates: ${errors.join(", ")}` : "",
      }));
    }

    void loadRates();

    return () => {
      cancelled = true;
    };
  }, [settings.currencyMode, rateRequestKey]);

  return rateState;
}

function publicProofValue(settings: Settings, value: string) {
  return settings.privacy.publicProofMode ? "hidden" : value;
}

function publicProofMoney(settings: Settings, value: number) {
  return publicProofValue(settings, money(value, settings.currency));
}

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeExpense(input: Partial<Expense>): Expense {
  const currency = normalizeOptionalCurrency(input.currency);
  const necessaryAmount = Number(input.necessaryAmount);
  const avoidableLeakAmount = Number(input.avoidableLeakAmount);

  return {
    id: String(input.id || uid()),
    amount: Number.isFinite(Number(input.amount)) ? Number(input.amount) : 0,
    category: String(input.category || "Custom"),
    needType:
      input.needType === "Needed" || input.needType === "Not needed" || input.needType === "Maybe"
        ? input.needType
        : "Needed",
    note: String(input.note || ""),
    createdAt: String(input.createdAt || new Date().toISOString()),
    triggerTags: normalizeLeakTriggerTags(input.triggerTags, String(input.note || "")),
    ...(Number.isFinite(necessaryAmount) ? { necessaryAmount } : {}),
    ...(Number.isFinite(avoidableLeakAmount) ? { avoidableLeakAmount } : {}),
    ...(currency ? { currency } : {}),
  };
}

function expenseSyncKey(expense: Expense) {
  const created = new Date(expense.createdAt);
  const createdKey = Number.isNaN(created.getTime())
    ? String(expense.createdAt || "")
    : created.toISOString().slice(0, 19);
  const amountKey = Number(expense.amount || 0).toFixed(2);
  const categoryKey = String(expense.category || "Custom").trim().toLocaleLowerCase();
  const needKey = String(expense.needType || "Needed").trim().toLocaleLowerCase();
  const noteKey = String(expense.note || "").replace(/\s+/g, " ").trim().slice(0, 160);
  const currencyKey = normalizeOptionalCurrency(expense.currency) || "";
  const necessaryKey = Number.isFinite(expense.necessaryAmount) ? Number(expense.necessaryAmount).toFixed(2) : "";
  const avoidableKey = Number.isFinite(expense.avoidableLeakAmount) ? Number(expense.avoidableLeakAmount).toFixed(2) : "";

  return [createdKey, amountKey, categoryKey, needKey, noteKey, currencyKey, necessaryKey, avoidableKey].join("|");
}

function mergeExpensesForSync(localExpenses: Expense[], cloudExpenses: Expense[]) {
  const merged = new Map<string, Expense>();

  cloudExpenses.forEach((expense) => {
    merged.set(expenseSyncKey(expense), expense);
  });

  localExpenses.forEach((expense) => {
    const normalized = normalizeExpense(expense);
    const key = expenseSyncKey(normalized);

    if (!merged.has(key)) {
      merged.set(key, normalized);
    }
  });

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function mergeStreaksForDisplay(cloudStreak: Streak, localStreak: Streak): Streak {
  const bestStreak = Math.max(cloudStreak.bestStreak || 0, localStreak.bestStreak || 0);
  const localCurrent = localStreak.currentStreak || 0;
  const cloudCurrent = cloudStreak.currentStreak || 0;
  const source = localCurrent >= cloudCurrent ? localStreak : cloudStreak;

  return {
    ...source,
    currentStreak: Math.max(localCurrent, cloudCurrent),
    bestStreak,
    lastActiveDate: source.lastActiveDate ?? localStreak.lastActiveDate ?? cloudStreak.lastActiveDate ?? null,
    updatedAt: source.updatedAt ?? localStreak.updatedAt ?? cloudStreak.updatedAt ?? null,
  };
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function getIncomeMultiplier(settings: Settings) {
  if (settings.profile.incomeStyle === "Weekly") return 4.35;
  if (settings.profile.incomeStyle === "Daily") return 30;
  return 1;
}

function getIncomePeriodLabel(settings: Settings) {
  if (settings.profile.incomeStyle === "Allowance") return "Allowance";
  if (settings.profile.incomeStyle === "Irregular") return "Estimated monthly";
  return `${settings.profile.incomeStyle} income`;
}

function getPrimaryIncomeLabel(settings: Settings) {
  if (settings.profile.lifeMode === "Student") return "Allowance / support";
  if (settings.profile.lifeMode === "Freelancer") return "Freelance income";
  if (settings.profile.lifeMode === "No stable income") return "Expected income";
  return "Salary";
}

function getTotalIncome(settings: Settings) {
  const baseIncome = sum([
    settings.income.salary,
    settings.income.side,
    settings.income.other,
  ]);

  return Math.round(baseIncome * getIncomeMultiplier(settings));
}

function getFixedCosts(settings: Settings) {
  return sum([
    settings.profile.hasRent ? settings.fixedCosts.rent : 0,
    settings.fixedCosts.utilities,
    settings.fixedCosts.food,
    settings.fixedCosts.transport,
    settings.fixedCosts.phone,
    settings.fixedCosts.data,
    settings.fixedCosts.education,
  ]);
}

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateInputValue(value: string) {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function getFallbackNextPaydayDate(settings: Settings) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (settings.profile.incomeStyle === "Daily") {
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    return toDateInputValue(next);
  }

  if (settings.profile.incomeStyle === "Weekly") {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    return toDateInputValue(next);
  }

  if (settings.profile.incomeStyle === "Irregular") {
    const next = new Date(now);
    next.setDate(next.getDate() + 14);
    return toDateInputValue(next);
  }

  const firstNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return toDateInputValue(firstNextMonth);
}

function getNextPaydayDate(settings: Settings) {
  const raw = settings.survival?.nextPaydayDate || "";
  const parsed = parseDateInputValue(raw);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsed && parsed >= today) {
    return raw;
  }

  return getFallbackNextPaydayDate(settings);
}

function getDaysUntilIncome(settings: Settings) {
  const payday = parseDateInputValue(getNextPaydayDate(settings));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!payday) return 1;

  const diff = Math.ceil((payday.getTime() - today.getTime()) / 86400000);
  return Math.max(diff, 1);
}

function getElapsedMonthDays() {
  return Math.max(new Date().getDate(), 1);
}

function buildSurvivalForecast(settings: Settings, expenses: Expense[]): SurvivalForecast {
  const totalIncome = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);
  const spentThisMonth = sumTrackedExpenses(expenses);
  const realBalance = totalIncome - fixedCosts - spentThisMonth;
  const daysUntilIncome = getDaysUntilIncome(settings);
  const nextPaydayDate = getNextPaydayDate(settings);
  const safeDailyBudget = Math.max(realBalance, 0) / Math.max(daysUntilIncome, 1);
  const elapsedDays = getElapsedMonthDays();
  const currentDailyPace = spentThisMonth > 0 ? spentThisMonth / elapsedDays : 0;
  const leakDailyPace = sumLeakExpenses(expenses) / elapsedDays;

  const surviveDays =
    realBalance <= 0
      ? 0
      : currentDailyPace <= 0
        ? daysUntilIncome
        : Math.floor(realBalance / Math.max(currentDailyPace, 1));

  const diesBeforePaydayBy =
    currentDailyPace <= safeDailyBudget || currentDailyPace <= 0
      ? 0
      : Math.max(daysUntilIncome - surviveDays, 0);

  const pacePressure =
    safeDailyBudget <= 0
      ? 100
      : Math.round((Math.max(currentDailyPace - safeDailyBudget, 0) / Math.max(safeDailyBudget, 1)) * 100);

  const walletHpForecast = clamp(100 - pacePressure, 5, 100);
  const status =
    realBalance <= 0 || diesBeforePaydayBy >= Math.ceil(daysUntilIncome / 2)
      ? "critical"
      : diesBeforePaydayBy > 0
        ? "danger"
        : "surviving";

  const statusLabel =
    status === "surviving"
      ? "Surviving until payday"
      : status === "danger"
        ? "Danger before payday"
        : "Critical wallet pressure";

  const dangerLabel =
    diesBeforePaydayBy > 0
      ? `Wallet dies ${diesBeforePaydayBy} day${diesBeforePaydayBy === 1 ? "" : "s"} before payday`
      : currentDailyPace <= 0
        ? "No spending pace detected yet"
        : "You survive at the current pace";

  return {
    totalIncome,
    fixedCosts,
    spentThisMonth,
    realBalance,
    daysUntilIncome,
    nextPaydayDate,
    safeDailyBudget,
    currentDailyPace,
    leakDailyPace,
    surviveDays,
    diesBeforePaydayBy,
    walletHpForecast,
    status,
    statusLabel,
    dangerLabel,
  };
}

function getCategoryIcon(category: string) {
  return categories.find((item) => item.name === category)?.icon || A.custom;
}

function getCurrentMonthExpenses(expenses: Expense[]) {
  const current = monthKey(new Date());

  return expenses.filter((expense) => {
    return monthKey(new Date(expense.createdAt)) === current;
  });
}

function getExpenseTrackedValue(expense: Expense) {
  return Math.max(0, Number.isFinite(expense.amount) ? expense.amount : 0);
}

function getExpenseNecessaryValue(expense: Expense) {
  const tracked = getExpenseTrackedValue(expense);
  const necessary = Number(expense.necessaryAmount);

  if (!Number.isFinite(necessary)) return null;

  return clamp(necessary, 0, tracked);
}

function getExpenseAvoidableLeakValue(expense: Expense) {
  const tracked = getExpenseTrackedValue(expense);
  const cachedAvoidable = Number(expense.avoidableLeakAmount);

  if (Number.isFinite(cachedAvoidable)) {
    return clamp(cachedAvoidable, 0, tracked);
  }

  const necessary = getExpenseNecessaryValue(expense);

  if (necessary === null) return null;

  return clamp(tracked - necessary, 0, tracked);
}

function getExpenseLeakMultiplier(expense: Expense) {
  if (expense.needType === "Needed") return 0;
  if (expense.needType === "Maybe") return 0.5;
  return 1;
}

function getExpenseLeakValue(expense: Expense) {
  const avoidableLeak = getExpenseAvoidableLeakValue(expense);

  if (expense.needType !== "Needed" && avoidableLeak !== null) return avoidableLeak;

  return getExpenseTrackedValue(expense) * getExpenseLeakMultiplier(expense);
}

function sumTrackedExpenses(expenses: Expense[]) {
  return sum(expenses.map(getExpenseTrackedValue));
}

function sumLeakExpenses(expenses: Expense[]) {
  return sum(expenses.map(getExpenseLeakValue));
}

function buildWalletSummary(settings: Settings, expenses: Expense[]) {
  const currentMonthExpenses = getCurrentMonthExpenses(expenses);
  const totalIncome = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);
  const spentThisMonth = sumTrackedExpenses(currentMonthExpenses);
  const totalLeaks = sumLeakExpenses(currentMonthExpenses);
  const realBalance = totalIncome - fixedCosts - spentThisMonth;
  const availableAfterLifeCost = Math.max(totalIncome - fixedCosts, 1);
  const walletHp = clamp(
    100 - Math.round((totalLeaks / availableAfterLifeCost) * 100),
    5,
    100
  );

  return {
    currentMonthExpenses,
    totalIncome,
    fixedCosts,
    spentThisMonth,
    totalLeaks,
    realBalance,
    availableAfterLifeCost,
    walletHp,
  };
}

function getCategorySummaries(expenses: Expense[]): CategorySummary[] {
  const map = new Map<string, { trackedAmount: number; leakAmount: number; count: number }>();

  for (const expense of expenses) {
    const current = map.get(expense.category) || { trackedAmount: 0, leakAmount: 0, count: 0 };

    map.set(expense.category, {
      trackedAmount: current.trackedAmount + getExpenseTrackedValue(expense),
      leakAmount: current.leakAmount + getExpenseLeakValue(expense),
      count: current.count + 1,
    });
  }

  return Array.from(map.entries())
    .map(([category, value]) => ({
      category,
      amount: value.trackedAmount,
      trackedAmount: value.trackedAmount,
      leakAmount: value.leakAmount,
      count: value.count,
      icon: getCategoryIcon(category),
    }))
    .sort((a, b) => b.amount - a.amount);
}

function getCategoryLeakSummaries(expenses: Expense[]): CategorySummary[] {
  return getCategorySummaries(expenses)
    .map((item) => ({
      ...item,
      amount: item.leakAmount ?? 0,
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount || b.count - a.count);
}

function getCategoryTrackedSummaries(expenses: Expense[]): CategorySummary[] {
  return getCategorySummaries(expenses)
    .map((item) => ({
      ...item,
      amount: item.trackedAmount ?? item.amount,
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount || b.count - a.count);
}

function formatMonthTitle(key: string) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);

  return date.toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });
}

function getMonthlyHistoryOptions(expenses: Expense[]) {
  const keys = Array.from(
    new Set([
      monthKey(new Date()),
      ...expenses.map((expense) => monthKey(new Date(expense.createdAt))),
    ])
  );

  return keys.sort((a, b) => b.localeCompare(a));
}

function getExpensesForMonthKey(expenses: Expense[], key: string) {
  return expenses.filter((expense) => monthKey(new Date(expense.createdAt)) === key);
}


const APP_MODE_LABELS: Record<AppMode, { label: string; detail: string }> = {
  standard: {
    label: "Standard",
    detail: "Clean mode: leaks, routine, streak, wallet status, and simple reports.",
  },
  pro: {
    label: "Pro",
    detail: "Full mode: advanced reports, rewards, share cards, challenges, and deeper stats.",
  },
};

const STANDARD_MODE_ALLOWED_TABS: Tab[] = ["home", "add", "chart", "settings"];

function normalizeAppMode(input?: unknown): AppMode {
  return input === "pro" ? "pro" : "standard";
}

function readAppMode(): AppMode {
  if (typeof window === "undefined") return "standard";

  try {
    return normalizeAppMode(localStorage.getItem(APP_MODE_KEY));
  } catch {
    return "standard";
  }
}

function writeAppMode(mode: AppMode, notifyChange = true) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(APP_MODE_KEY, mode);
    if (notifyChange) window.dispatchEvent(new Event(LOCAL_APP_STATE_CHANGE_EVENT));
  } catch {
    // Mode preference is local-first. Ignore storage errors.
  }
}

function isStandardModeTab(tab: Tab) {
  return STANDARD_MODE_ALLOWED_TABS.includes(tab);
}

const LEAK_REFLECTION_QUESTIONS: Array<{ question: string; example: string }> = [
  {
    question: "What part of this spending was just extra comfort?",
    example: "Example: $3",
  },
  {
    question: "How much cheaper could this realistically have been?",
    example: "Example: could’ve been $2 instead of $5",
  },
  {
    question: "What amount here was convenience tax?",
    example: "Example: +$4 for delivery",
  },
  {
    question: "If you made the smarter version of this choice, what would it cost?",
    example: "Example: probably $6 instead of $11",
  },
  {
    question: "How much of this purchase was actually optional?",
    example: "Example: about half of it",
  },
  {
    question: "What part of this spending came from impulse instead of necessity?",
    example: "Example: $8",
  },
  {
    question: "If you repeated this 20 times, what part would become the real leak?",
    example: "Example: the extra $2 every time",
  },
  {
    question: "How much did speed, laziness, or convenience add to the cost?",
    example: "Example: +$5",
  },
  {
    question: "What was the “I didn’t really need this part” amount?",
    example: "Example: $3–4",
  },
  {
    question: "What would the disciplined version of this purchase cost?",
    example: "Example: probably 30% less",
  },
];

function pickLeakReflectionQuestion(expense: Expense) {
  const source = `${expense.id}-${expense.createdAt}-${expense.amount}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return LEAK_REFLECTION_QUESTIONS[hash % LEAK_REFLECTION_QUESTIONS.length];
}

function buildLeakReflection(
  expense: Expense,
  allExpenses: Expense[],
  settings: Settings
): LeakReflection {
  const thisMonth = getCurrentMonthExpenses(allExpenses);
  const categoryExpenses = thisMonth.filter((item) => item.category === expense.category);
  const categoryTotal = sum(categoryExpenses.map((item) => item.amount));
  const categoryCount = categoryExpenses.length;
  const average = categoryCount > 0 ? categoryTotal / categoryCount : expense.amount;
  const amountLabel = money(expense.amount, settings.currency);
  const necessaryValue = getExpenseNecessaryValue(expense);
  const avoidableLeakValue = getExpenseLeakValue(expense);
  const necessaryAmountLabel = necessaryValue !== null ? money(necessaryValue, settings.currency) : undefined;
  const leakAmountLabel = money(avoidableLeakValue, settings.currency);
  const categoryText = sentenceCase(categoryLabel(expense.category));
  const tenTimes = money(expense.amount * 10, settings.currency);
  const monthlyPace = money(categoryTotal, settings.currency);
  const icon = getCategoryIcon(expense.category);
  const reflectionQuestion = pickLeakReflectionQuestion(expense);

  let tone: LeakReflectionTone = "leak";
  let title = "Leak recorded";
  let body = "This expense is now part of your wallet history.";
  let insight = "Small actions are only small until they repeat.";

  if (expense.needType !== "Needed" && necessaryValue !== null) {
    tone = avoidableLeakValue <= 0 ? "needed" : expense.needType === "Maybe" ? "maybe" : "leak";
    title = avoidableLeakValue <= 0 ? "No excess leak counted" : "Only the excess counted as leak";
    body = `${amountLabel} tracked. Smarter baseline: ${necessaryAmountLabel}. Leak counted: ${leakAmountLabel}.`;
    insight = "This is the realistic leak rule: spending can be partly necessary and partly avoidable.";
  } else if (expense.needType === "Needed") {
    tone = "needed";
    title = "Needed expense recorded";
    body = "This is not a leak. This is life cost.";
    insight = "The goal is not to stop living. The goal is to stop leaking.";
  } else if (expense.needType === "Maybe") {
    tone = "maybe";
    title = "Maybe is the danger zone";
    body = "Not fully needed. Not fully useless. But the money is still gone.";
    insight = "Repeated maybes can quietly drain the month.";
  } else if (categoryCount >= 3) {
    tone = "pattern";
    title = `${categoryText} is becoming a pattern`;
    body = `${categoryText} appeared ${categoryCount} times this month.`;
    insight = `The problem is not one ${amountLabel} purchase. The problem is repetition.`;
  } else if (expense.amount >= Math.max(average * 1.8, 25)) {
    tone = "heavy";
    title = "Heavy hit recorded";
    body = `${amountLabel} moved the chart.`;
    insight = "This one deserves a second look.";
  } else if (expense.amount <= 5) {
    tone = "leak";
    title = "Small leak recorded";
    body = `That was only ${amountLabel}, but 10 repeats become ${tenTimes}.`;
    insight = "Wallets usually bleed from repeated small leaks.";
  } else {
    tone = "leak";
    title = "Not needed expense recorded";
    body = `You marked ${categoryText} as Not needed.`;
    insight = "The first step is admitting where the wallet is leaking.";
  }

  if (categoryCount >= 5 && expense.needType !== "Needed") {
    tone = "pattern";
    title = `${categoryText} again`;
    body = `${categoryCount} ${categoryText} records this month. Total: ${monthlyPace}.`;
    insight = "This is no longer a single purchase. It is a habit signal.";
  }

  return {
    id: Date.now(),
    title,
    body,
    insight,
    amountLabel,
    necessaryAmountLabel,
    categoryLabel: categoryText,
    needType: expense.needType,
    categoryCount,
    categoryTotalLabel: monthlyPace,
    question: reflectionQuestion.question,
    exampleAnswer: reflectionQuestion.example,
    icon,
    tone,
  };
}

function buildMonthlyCategoryComment(category: string, total: number, count: number, average: number) {
  const label = categoryLabel(category);

  if (count >= 10 && average <= Math.max(total / count, 1) * 1.25) {
    return {
      title: "Repeated small leak",
      body: `${count} small ${label} purchases became one real monthly leak. This is not one big hit — it is a repeated habit.`,
    };
  }

  if (count <= 3 && total > 0) {
    return {
      title: "High-impact leak",
      body: `${label} did not happen often, but each hit was heavy. Cutting even one purchase next month can change the result.`,
    };
  }

  if (category === "Subscriptions") {
    return {
      title: "Silent recurring leak",
      body: "This kind of cost is easy to ignore because it repeats quietly. Review it before it becomes part of the lifestyle.",
    };
  }

  if (category === "Takeouts" || category === "Coffee" || category === "Smoking") {
    return {
      title: "Habit leak",
      body: `${label} looks normal per purchase, but the monthly total shows the real pressure. Reduce the number of repeats first.`,
    };
  }

  return {
    title: "Monthly pressure",
    body: `${label} added visible pressure this month. The next step is not perfection — reduce the repeated damage.`,
  };
}

function buildMonthlyLeakArchive(expenses: Expense[], selectedMonthKey: string): MonthlyLeakArchive {
  const totalSpent = sumTrackedExpenses(expenses);
  const totalLeaks = sum(expenses.map(getExpenseLeakValue));
  const totalCount = expenses.length;
  const map = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const list = map.get(expense.category) || [];
    list.push(expense);
    map.set(expense.category, list);
  }

  const categories = Array.from(map.entries())
    .map(([category, purchases]) => {
      const total = sum(purchases.map((expense) => expense.amount));
      const count = purchases.length;
      const average = count > 0 ? total / count : 0;
      const neededTotal = sum(
        purchases.filter((expense) => expense.needType === "Needed").map((expense) => expense.amount)
      );
      const maybeTotal = sum(
        purchases.filter((expense) => expense.needType === "Maybe").map((expense) => expense.amount)
      );
      const notNeededTotal = sum(
        purchases.filter((expense) => expense.needType === "Not needed").map((expense) => expense.amount)
      );
      const leakTotal = sum(purchases.map(getExpenseLeakValue));
      const comment = buildMonthlyCategoryComment(category, total, count, average);

      return {
        category,
        icon: getCategoryIcon(category),
        total,
        count,
        average,
        neededTotal,
        maybeTotal,
        notNeededTotal,
        leakTotal,
        sharePercent: totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0,
        commentTitle: comment.title,
        commentBody: comment.body,
        purchases: purchases.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      };
    })
    .sort((a, b) => b.total - a.total);

  const topCategory = categories[0] || null;
  const repeatedCategory =
    [...categories].sort((a, b) => b.count - a.count || b.total - a.total)[0] || null;
  const biggestExpense =
    [...expenses].sort((a, b) => b.amount - a.amount)[0] || null;

  const summaryComment =
    totalCount <= 0
      ? "No spending memory for this month yet. Add expenses and the archive will turn them into patterns."
      : repeatedCategory && repeatedCategory.count >= 5
        ? `${repeatedCategory.count} ${categoryLabel(repeatedCategory.category)} purchases became ${Math.round(
            (repeatedCategory.total / Math.max(totalSpent, 1)) * 100
          )}% of this month’s tracked spending. This is a pattern, not a random expense.`
        : topCategory
          ? `${categoryLabel(topCategory.category)} created the biggest pressure this month. Start by reducing this category first.`
          : "This month has movement, but no clear leak pattern yet.";

  return {
    monthKey: selectedMonthKey,
    monthLabel: formatMonthTitle(selectedMonthKey),
    totalSpent,
    totalLeaks,
    totalCount,
    topCategory,
    repeatedCategory,
    biggestExpense,
    categories,
    summaryComment,
  };
}


function isWeekendDate(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getDayPart(date: Date) {
  const hour = date.getHours();

  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getDominantDayPart(expenses: Expense[]) {
  const parts = new Map<string, number>();

  for (const expense of expenses) {
    const part = getDayPart(new Date(expense.createdAt));
    parts.set(part, (parts.get(part) || 0) + 1);
  }

  return Array.from(parts.entries()).sort((a, b) => b[1] - a[1])[0] || ["unknown", 0];
}

const EMOTIONAL_LEAK_KEYWORDS = [
  "stress",
  "stressed",
  "bored",
  "boredom",
  "sad",
  "angry",
  "anxious",
  "anxiety",
  "lonely",
  "tired",
  "doom",
  "impulse",
  "emotional",
  "emotion",
  "reward",
  "social pressure",
  "social-pressure",
  "habit",
  "after-payday",
  "late-night",
  "weekend",
  "нерв",
  "нервы",
  "стресс",
  "скука",
  "скучно",
  "устал",
  "устала",
  "злость",
  "грусть",
  "тревога",
  "одиноко",
  "импульс",
];

function isLateNightExpense(expense: Expense) {
  const hour = new Date(expense.createdAt).getHours();
  return hour >= 22 || hour < 6;
}

function getLeakNoteTrigger(expense: Expense) {
  const note = expense.note.trim().toLowerCase();

  if (!note) return "";

  return EMOTIONAL_LEAK_KEYWORDS.find((keyword) => note.includes(keyword)) || "";
}

function expenseHasLeakTriggerTag(expense: Expense, triggerId: LeakTriggerId) {
  const structuredTags = normalizeLeakTriggerTags(expense.triggerTags, expense.note);

  return structuredTags.includes(triggerId);
}

function getLeakTriggerLabelsFromNote(expense: Expense) {
  const structuredTags = normalizeLeakTriggerTags(expense.triggerTags, expense.note);

  return LEAK_TRIGGER_CHIPS
    .filter((trigger) => structuredTags.includes(trigger.id))
    .map((trigger) => trigger.label);
}

function getAfterPaydayDayIndex(date: Date, settings: Settings) {
  const cycleStartKey = getCycleStartKey(settings);
  const cycleStart = new Date(`${cycleStartKey}T00:00:00`);
  const current = new Date(date);
  cycleStart.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  const diff = Math.floor((current.getTime() - cycleStart.getTime()) / 86400000);

  return diff >= 0 && diff <= 3 ? diff + 1 : 0;
}

function buildLeakPatternSignals(expenses: Expense[], settings: Settings): LeakPatternSignal[] {
  const monthLeakExpenses = getCurrentMonthExpenses(expenses).filter((expense) => getExpenseLeakValue(expense) > 0);
  const totalLeaks = sumLeakExpenses(monthLeakExpenses);
  const signals: LeakPatternSignal[] = [];

  if (monthLeakExpenses.length === 0 || totalLeaks <= 0) return signals;

  const makeSignal = (
    id: string,
    label: string,
    title: string,
    expensesForSignal: Expense[],
    body: string,
    severity: LeakPatternSignal["severity"]
  ) => {
    const total = sumLeakExpenses(expensesForSignal);

    if (expensesForSignal.length <= 0 || total <= 0) return;

    signals.push({
      id,
      label,
      title,
      body,
      count: expensesForSignal.length,
      total,
      severity,
    });
  };

  const lateNightExpenses = monthLeakExpenses.filter(
    (expense) => isLateNightExpense(expense) || expenseHasLeakTriggerTag(expense, "late-night")
  );
  const weekendExpenses = monthLeakExpenses.filter(
    (expense) => isWeekendDate(new Date(expense.createdAt)) || expenseHasLeakTriggerTag(expense, "weekend")
  );
  const afterPaydayExpenses = monthLeakExpenses.filter(
    (expense) => getAfterPaydayDayIndex(new Date(expense.createdAt), settings) > 0 || expenseHasLeakTriggerTag(expense, "after-payday")
  );
  const emotionalTriggerIds: LeakTriggerId[] = ["stress", "boredom", "impulse", "social-pressure", "habit"];
  const emotionalExpenses = monthLeakExpenses.filter(
    (expense) =>
      Boolean(getLeakNoteTrigger(expense)) ||
      emotionalTriggerIds.some((triggerId) => expenseHasLeakTriggerTag(expense, triggerId))
  );

  if (lateNightExpenses.length >= 2 || sumLeakExpenses(lateNightExpenses) >= totalLeaks * 0.25) {
    makeSignal(
      "late-night",
      "Late-night",
      "Late-night leak window",
      lateNightExpenses,
      `${lateNightExpenses.length} leak record${lateNightExpenses.length === 1 ? "" : "s"} happened after 22:00 or before 06:00. This is often tiredness, scrolling, or impulse pressure.`,
      lateNightExpenses.length >= 4 || sumLeakExpenses(lateNightExpenses) >= totalLeaks * 0.35 ? "high" : "medium"
    );
  }

  if (weekendExpenses.length >= 2 || sumLeakExpenses(weekendExpenses) >= totalLeaks * 0.3) {
    makeSignal(
      "weekend",
      "Weekend",
      "Weekend discipline drop",
      weekendExpenses,
      `${weekendExpenses.length} leak record${weekendExpenses.length === 1 ? "" : "s"} landed on Saturday or Sunday. The leak may appear when the week ends, not every day.`,
      weekendExpenses.length >= 4 || sumLeakExpenses(weekendExpenses) >= totalLeaks * 0.4 ? "high" : "medium"
    );
  }

  if (afterPaydayExpenses.length >= 2 || sumLeakExpenses(afterPaydayExpenses) >= totalLeaks * 0.25) {
    makeSignal(
      "after-payday",
      "After payday",
      "After-payday spike",
      afterPaydayExpenses,
      `${afterPaydayExpenses.length} leak record${afterPaydayExpenses.length === 1 ? "" : "s"} happened in the first 4 days of the income cycle. Fresh money may be lowering resistance.`,
      afterPaydayExpenses.length >= 4 || sumLeakExpenses(afterPaydayExpenses) >= totalLeaks * 0.35 ? "high" : "medium"
    );
  }

  if (emotionalExpenses.length >= 1) {
    const triggerNames = Array.from(
      new Set(
        emotionalExpenses
          .flatMap((expense) => [getLeakNoteTrigger(expense), ...getLeakTriggerLabelsFromNote(expense)])
          .filter(Boolean)
      )
    ).slice(0, 3);

    makeSignal(
      "emotional",
      "Emotion",
      "Emotional spending clue",
      emotionalExpenses,
      `${emotionalExpenses.length} leak note${emotionalExpenses.length === 1 ? "" : "s"} mentioned ${triggerNames.join(", ") || "stress / boredom"}. The app is seeing context, not only amounts.`,
      emotionalExpenses.length >= 3 || sumLeakExpenses(emotionalExpenses) >= totalLeaks * 0.25 ? "high" : "medium"
    );
  }

  return signals.sort((a, b) => {
    const severityScore = { high: 3, medium: 2, low: 1 };
    return severityScore[b.severity] - severityScore[a.severity] || b.total - a.total || b.count - a.count;
  });
}

function buildLeakPatternLabSummary(
  expenses: Expense[],
  settings: Settings,
  patterns: LeakPattern[]
): LeakPatternLabSummary {
  const monthExpenses = getCurrentMonthExpenses(expenses);
  const monthLeakExpenses = monthExpenses.filter((expense) => getExpenseLeakValue(expense) > 0);
  const totalLeaks = sumLeakExpenses(monthLeakExpenses);
  const signals = buildLeakPatternSignals(expenses, settings);
  const highRiskCount = signals.filter((signal) => signal.severity === "high").length + patterns.filter((pattern) => pattern.severity === "high").length;
  const signalPressure = totalLeaks > 0 ? clamp(Math.round((sum(signals.map((signal) => signal.total)) / totalLeaks) * 100), 0, 100) : 0;
  const confidence: LeakPatternLabSummary["confidence"] =
    monthLeakExpenses.length <= 0
      ? "Waiting"
      : monthLeakExpenses.length < 5
        ? "Learning"
        : "Clear";
  const riskLevel: LeakPatternLabSummary["riskLevel"] =
    highRiskCount > 0 || signalPressure >= 70
      ? "danger"
      : signals.length > 0 || patterns.length > 0
        ? "watch"
        : "quiet";
  const dominantTrigger = signals[0]?.label || patterns[0]?.tag || "No trigger yet";
  const headline =
    confidence === "Waiting"
      ? "Leak Pattern Lab is waiting for data"
      : riskLevel === "danger"
        ? "Strong behavior pattern detected"
        : riskLevel === "watch"
          ? "Early leak pattern detected"
          : "No strong behavior pattern yet";
  const detail =
    confidence === "Waiting"
      ? "Add a few Maybe or Not needed records. The lab will look for timing, payday, weekend, and emotional triggers."
      : signals[0]
        ? `${signals[0].title}. ${money(signals[0].total, settings.currency)} of this month’s leak pressure is connected to this behavior signal.`
        : patterns[0]
          ? `${patterns[0].tag}. ${money(patterns[0].total, settings.currency)} of leak pressure points to a repeated habit, not one random purchase.`
          : "The month has leak data, but no trigger has repeated enough to call it a behavior pattern yet.";

  return {
    headline,
    detail,
    dominantTrigger,
    confidence,
    riskLevel,
    patternPressure: signalPressure,
    highRiskCount,
    signals,
  };
}


function buildWeeklyPatternSummary(expenses: Expense[], settings: Settings): WeeklyPatternSummary {
  const weekExpenses = getLastSevenDaysExpenses(expenses);
  const weekLeakExpenses = weekExpenses.filter((expense) => getExpenseLeakValue(expense) > 0);
  const totalSpent = sumTrackedExpenses(weekExpenses);
  const totalLeaks = sumLeakExpenses(weekLeakExpenses);
  const leakPressure = totalSpent > 0 ? Math.round((totalLeaks / totalSpent) * 100) : 0;
  const confidence: WeeklyPatternSummary["confidence"] =
    weekLeakExpenses.length <= 0
      ? "Waiting"
      : weekLeakExpenses.length < 4
        ? "Learning"
        : "Clear";

  const weekendExpenses = weekLeakExpenses.filter(
    (expense) => isWeekendDate(new Date(expense.createdAt)) || expenseHasLeakTriggerTag(expense, "weekend")
  );
  const lateNightExpenses = weekLeakExpenses.filter(
    (expense) => isLateNightExpense(expense) || expenseHasLeakTriggerTag(expense, "late-night")
  );
  const afterPaydayExpenses = weekLeakExpenses.filter(
    (expense) => getAfterPaydayDayIndex(new Date(expense.createdAt), settings) > 0 || expenseHasLeakTriggerTag(expense, "after-payday")
  );
  const emotionalTriggerIds: LeakTriggerId[] = ["stress", "boredom", "impulse", "social-pressure", "habit"];
  const emotionalExpenses = weekLeakExpenses.filter(
    (expense) =>
      Boolean(getLeakNoteTrigger(expense)) ||
      emotionalTriggerIds.some((triggerId) => expenseHasLeakTriggerTag(expense, triggerId))
  );
  const maybeExpenses = weekExpenses.filter((expense) => expense.needType === "Maybe");
  const notNeededExpenses = weekExpenses.filter((expense) => expense.needType === "Not needed");
  const maybeLeaks = sumLeakExpenses(maybeExpenses);
  const notNeededLeaks = sumLeakExpenses(notNeededExpenses);
  const weekendLeaks = sumLeakExpenses(weekendExpenses);
  const lateNightLeaks = sumLeakExpenses(lateNightExpenses);
  const afterPaydayLeaks = sumLeakExpenses(afterPaydayExpenses);
  const emotionalLeaks = sumLeakExpenses(emotionalExpenses);

  const dayMap = new Map<string, { leaks: number; count: number }>();
  for (const expense of weekLeakExpenses) {
    const key = dayKey(new Date(expense.createdAt));
    const current = dayMap.get(key) || { leaks: 0, count: 0 };
    dayMap.set(key, {
      leaks: current.leaks + getExpenseLeakValue(expense),
      count: current.count + 1,
    });
  }
  const worstDay = Array.from(dayMap.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.leaks - a.leaks || b.count - a.count)[0] || null;
  const worstDayShare = worstDay && totalLeaks > 0 ? Math.round((worstDay.leaks / totalLeaks) * 100) : 0;

  const categorySummaries = getCategoryLeakSummaries(weekExpenses);
  const topCategory = categorySummaries[0] || null;
  const topCategoryShare = topCategory && totalLeaks > 0 ? Math.round((topCategory.amount / totalLeaks) * 100) : 0;

  const cards: WeeklyPatternSummaryCard[] = [];
  const addCard = (
    id: string,
    label: string,
    title: string,
    body: string,
    value: string,
    severity: WeeklyPatternSummaryCard["severity"],
    include: boolean
  ) => {
    if (!include) return;
    cards.push({ id, label, title, body, value, severity });
  };

  addCard(
    "grey-zone",
    "Grey zone",
    "Questionable decisions carried the week.",
    "The danger is not always obvious bad spending. Sometimes it is repeated Maybe decisions that feel small in the moment.",
    `${totalLeaks > 0 ? Math.round((maybeLeaks / totalLeaks) * 100) : 0}%`,
    maybeLeaks >= totalLeaks * 0.5 ? "high" : "medium",
    maybeLeaks > 0 && maybeLeaks >= Math.max(notNeededLeaks, totalLeaks * 0.35)
  );

  addCard(
    "full-leak",
    "Full leak",
    "Avoidable spending was the loudest signal.",
    "This week was not only survival costs. The app sees spending you already marked as avoidable.",
    money(notNeededLeaks, settings.currency),
    notNeededLeaks >= totalLeaks * 0.55 ? "high" : "medium",
    notNeededLeaks > 0 && notNeededLeaks >= Math.max(maybeLeaks, totalLeaks * 0.35)
  );

  addCard(
    "weekend",
    "Weekend",
    "Weekend mode changed the wallet.",
    "The leak is attached to the structure of the week. Friday to Sunday needs a cap before the spending starts.",
    `${totalLeaks > 0 ? Math.round((weekendLeaks / totalLeaks) * 100) : 0}%`,
    weekendLeaks >= totalLeaks * 0.6 ? "high" : "medium",
    weekendExpenses.length >= 2 || (totalLeaks > 0 && weekendLeaks >= totalLeaks * 0.35)
  );

  addCard(
    "late-night",
    "Late night",
    "Low-discipline hours showed up.",
    "This is where tiredness, scrolling, boredom, or impulse can become a wallet leak.",
    `${lateNightExpenses.length}x`,
    lateNightLeaks >= totalLeaks * 0.45 ? "high" : "medium",
    lateNightExpenses.length >= 1 && (lateNightExpenses.length >= 2 || lateNightLeaks >= totalLeaks * 0.25)
  );

  addCard(
    "after-payday",
    "After payday",
    "Fresh money lowered resistance.",
    "The first days after income are risky because the wallet feels safe before fixed life costs fully hit.",
    `${afterPaydayExpenses.length}x`,
    afterPaydayLeaks >= totalLeaks * 0.45 ? "high" : "medium",
    afterPaydayExpenses.length >= 1 && (afterPaydayExpenses.length >= 2 || afterPaydayLeaks >= totalLeaks * 0.25)
  );

  addCard(
    "emotion",
    "Emotion",
    "The notes show a trigger, not only a category.",
    "Stress, boredom, impulse, habit, or social pressure can explain why the same leak keeps coming back.",
    `${emotionalExpenses.length}x`,
    emotionalLeaks >= totalLeaks * 0.35 ? "high" : "medium",
    emotionalExpenses.length >= 1
  );

  addCard(
    "one-day-spike",
    "Spike day",
    "One day carried too much of the damage.",
    "This week may not be broken every day. One dangerous candle may be doing most of the work.",
    `${worstDayShare}%`,
    worstDayShare >= 70 ? "high" : "medium",
    Boolean(worstDay && worstDayShare >= 45 && totalLeaks > 0)
  );

  addCard(
    "top-category",
    "Category",
    "One category is louder than the rest.",
    topCategory
      ? `${categoryDisplayLabel(settings, topCategory.category)} created the clearest weekly leak signal. Fixing one category is easier than fixing your whole life.`
      : "No category is loud enough yet.",
    `${topCategoryShare}%`,
    topCategoryShare >= 55 ? "high" : "medium",
    Boolean(topCategory && topCategoryShare >= 38 && totalLeaks > 0)
  );

  cards.sort((a, b) => {
    const score = { high: 3, medium: 2, low: 1 };
    return score[b.severity] - score[a.severity] || b.value.localeCompare(a.value);
  });

  const strongest = cards[0] || null;
  const tone: WeeklyPatternSummary["tone"] =
    confidence === "Waiting"
      ? "quiet"
      : cards.some((card) => card.severity === "high") || leakPressure >= 65
        ? "danger"
        : cards.length > 0 || leakPressure >= 25
          ? "watch"
          : "quiet";

  const headline =
    confidence === "Waiting"
      ? "Weekly Pattern is waiting for honest records"
      : strongest
        ? `This week’s strongest pattern: ${strongest.label}`
        : leakPressure > 0
          ? "Leaks exist, but the pattern is still forming"
          : "This week looks controlled so far";

  const body =
    confidence === "Waiting"
      ? "Track a few Grey zone or Full leak decisions. $BROKE needs context before it can call out behavior."
      : strongest
        ? strongest.body
        : leakPressure > 0
          ? "The week has leak pressure, but no trigger repeated enough to become a clear behavior signal yet."
          : "Tracked spending has not turned into visible leak pressure this week.";

  const nextMove =
    strongest?.id === "grey-zone"
      ? "Before the next Maybe purchase, label it as Survival cost or Full leak. Do not leave it blurry."
      : strongest?.id === "full-leak"
        ? "Cut one avoidable repeat this week. Start with the category that felt easiest to justify."
        : strongest?.id === "weekend"
          ? "Set the weekend cap before Friday. Do not decide while already spending."
          : strongest?.id === "late-night"
            ? "Create a no-spend rule after 22:00 and prepare a cheaper fallback."
            : strongest?.id === "after-payday"
              ? "Protect essentials first for the first 4 days after income, then allow optional spending."
              : strongest?.id === "emotion"
                ? "When a trigger appears, wait 10 minutes and write the feeling before buying."
                : strongest?.id === "one-day-spike"
                  ? "Find the one day that created the spike and block the same setup next week."
                  : strongest?.id === "top-category"
                    ? `Reduce ${topCategory ? categoryDisplayLabel(settings, topCategory.category) : "the top category"} once before fixing anything else.`
                    : "Track the next real decision with a trigger chip so the pattern gets sharper.";

  return {
    tone,
    headline,
    body,
    strongestPattern: strongest?.label || "No strong pattern yet",
    nextMove,
    totalLeaks,
    leakPressure,
    confidence,
    cards: cards.slice(0, 4),
  };
}

function buildPatternChallengeRecommendation(
  weeklyPatternSummary: WeeklyPatternSummary,
  templates: ChallengeTemplate[],
  categorySummaries: CategorySummary[]
): PatternChallengeRecommendation {
  const availableTemplates = templates.length ? templates : defaultChallengeTemplates;
  const findTemplate = (...ids: string[]) =>
    ids.map((id) => availableTemplates.find((template) => template.id === id)).find(Boolean) || null;
  const topCategory = categorySummaries[0] || null;
  const topCategoryName = (topCategory?.category || "").toLowerCase();
  const strongestCard = weeklyPatternSummary.cards[0] || null;

  let template = findTemplate("wallet_recovery_7");
  let title = "Pattern-based challenge";
  let reason = "The app needs a few more honest leaks before it can recommend a precise mission.";
  let focus = "Track 3–5 leaks with trigger chips.";
  let nextMove = "Track the next leak with context first. Challenge suggestion gets sharper after that.";
  let urgency: PatternChallengeRecommendation["urgency"] = "waiting";

  if (weeklyPatternSummary.confidence !== "Waiting") {
    urgency = weeklyPatternSummary.tone === "danger" ? "strong" : "soft";
    reason = weeklyPatternSummary.strongestPattern
      ? `This week is showing ${weeklyPatternSummary.strongestPattern.toLowerCase()}.`
      : weeklyPatternSummary.headline;
    focus = strongestCard?.label || topCategory?.category || "Wallet recovery";
    nextMove = weeklyPatternSummary.nextMove;
  }

  if (topCategoryName.includes("takeout")) {
    template = findTemplate("no_takeout_3", "wallet_recovery_7");
    title = "Takeout control mission";
    focus = "Takeouts";
  } else if (topCategoryName.includes("coffee")) {
    template = findTemplate("coffee_control_7", "wallet_recovery_7");
    title = "Coffee control mission";
    focus = "Coffee";
  } else if (topCategoryName.includes("smoking")) {
    template = findTemplate("smoking_cut_7", "wallet_recovery_7");
    title = "Smoking cut mission";
    focus = "Smoking";
  } else if (topCategoryName.includes("shopping")) {
    template = findTemplate("shopping_freeze_7", "wallet_recovery_7");
    title = "Shopping freeze mission";
    focus = "Shopping";
  } else if (topCategoryName.includes("subscription")) {
    template = findTemplate("subscription_killer", "wallet_recovery_7");
    title = "Subscription cleanup mission";
    focus = "Subscriptions";
  } else if (strongestCard?.id === "grey-zone") {
    template = findTemplate("wallet_recovery_7");
    title = "Grey-zone control mission";
    focus = "Maybe decisions";
  } else if (strongestCard?.id === "full-leak") {
    template = findTemplate("wallet_recovery_7");
    title = "Full-leak recovery mission";
    focus = "Avoidable leaks";
  } else if (strongestCard?.id === "weekend") {
    template = findTemplate("wallet_recovery_7");
    title = "Weekend leak guard";
    focus = "Weekend timing";
  } else if (strongestCard?.id === "late-night") {
    template = findTemplate("wallet_recovery_7");
    title = "Late-night leak guard";
    focus = "Late-night timing";
  } else if (strongestCard?.id === "after-payday") {
    template = findTemplate("wallet_recovery_7");
    title = "After-payday guard";
    focus = "First days after income";
  }

  if (!template) {
    template = availableTemplates[0] || null;
  }

  return {
    template,
    title,
    reason,
    focus,
    nextMove,
    urgency,
  };
}


function getIsoWeekPatternKey(date = new Date()) {
  const current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((current.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${current.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getIsoWeekPatternLabel(date = new Date()) {
  return `Week ${getIsoWeekPatternKey(date).split("-W")[1]} · ${date.getFullYear()}`;
}

function buildPatternHistoryRecord(summary: WeeklyPatternSummary, date = new Date()): PatternHistoryRecord {
  return {
    periodType: "weekly",
    periodKey: getIsoWeekPatternKey(date),
    periodLabel: getIsoWeekPatternLabel(date),
    tone: summary.tone,
    headline: summary.headline,
    body: summary.body,
    strongestPattern: summary.strongestPattern,
    nextMove: summary.nextMove,
    totalLeaks: summary.totalLeaks,
    leakPressure: summary.leakPressure,
    confidence: summary.confidence,
    cards: summary.cards,
  };
}

function shouldSavePatternHistory(record: PatternHistoryRecord) {
  return record.confidence !== "Waiting" || record.totalLeaks > 0 || record.cards.length > 0;
}

function patternHistorySignature(record: PatternHistoryRecord) {
  return JSON.stringify({
    periodKey: record.periodKey,
    tone: record.tone,
    headline: record.headline,
    strongestPattern: record.strongestPattern,
    totalLeaks: Math.round(record.totalLeaks * 100) / 100,
    leakPressure: record.leakPressure,
    confidence: record.confidence,
    cards: record.cards.map((card) => `${card.id}:${card.value}:${card.severity}`),
  });
}

type SelectedCandleDiagnosis = {
  tone: "empty" | "controlled" | "watch" | "danger";
  label: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  action: string;
};

function buildSelectedCandleDiagnosis(
  selectedPoint: ChartPoint | undefined,
  selectedDayExpenses: Expense[],
  selectedTopLeak: CategorySummary | null,
  selectedLeakShareOfRange: number,
  selectedLeakRank: number,
  settings: Settings,
  rangeTitle: string
): SelectedCandleDiagnosis {
  if (!selectedPoint || selectedPoint.count <= 0) {
    return {
      tone: "empty",
      label: "No signal yet",
      title: "This candle has no spending story.",
      body: "Add one honest record or tap another candle. The chart needs real behavior before it can diagnose a pattern.",
      primaryLabel: "Records",
      primaryValue: "0",
      secondaryLabel: "Leak pressure",
      secondaryValue: money(0, settings.currency),
      action: "Track the next real expense, even if it feels small.",
    };
  }

  if (selectedPoint.leakAmount <= 0) {
    return {
      tone: "controlled",
      label: "Controlled day",
      title: "Spending happened, but it did not become a leak.",
      body: "This candle stayed clean because the records were marked as Needed. That separation is the point: life costs are not the enemy.",
      primaryLabel: "Records",
      primaryValue: `${selectedPoint.count}x`,
      secondaryLabel: "Leak pressure",
      secondaryValue: money(0, settings.currency),
      action: "Keep separating real costs from optional pressure.",
    };
  }

  const leakExpenses = selectedDayExpenses.filter((expense) => getExpenseLeakValue(expense) > 0);
  const lateNightExpenses = leakExpenses.filter(isLateNightExpense);
  const weekend = isWeekendDate(new Date(`${selectedPoint.key}T00:00:00`));
  const afterPaydayDay = getAfterPaydayDayIndex(new Date(`${selectedPoint.key}T00:00:00`), settings);
  const emotionalExpenses = leakExpenses.filter((expense) => Boolean(getLeakNoteTrigger(expense)));
  const maybeLeakTotal = sumLeakExpenses(selectedDayExpenses.filter((expense) => expense.needType === "Maybe"));
  const notNeededLeakTotal = sumLeakExpenses(selectedDayExpenses.filter((expense) => expense.needType === "Not needed"));
  const lateNightLeakTotal = sumLeakExpenses(lateNightExpenses);
  const topLeakName = selectedTopLeak ? categoryDisplayLabel(settings, selectedTopLeak.category) : "one category";
  const rangeLabel = rangeTitle.toLowerCase();
  const rangeImpact = selectedLeakShareOfRange > 0
    ? `${selectedLeakShareOfRange}% of ${rangeLabel} leaks`
    : "range impact";
  const rankLabel = selectedLeakRank > 0 ? `#${selectedLeakRank}` : "active";

  if (lateNightExpenses.length >= 2 || lateNightLeakTotal >= selectedPoint.leakAmount * 0.45) {
    return {
      tone: selectedPoint.status === "danger" ? "danger" : "watch",
      label: "Timing pattern",
      title: "Late-night spending is doing damage.",
      body: "This looks less like a random category problem and more like a weak-resistance time window: tired, scrolling, bored, or buying too late.",
      primaryLabel: "Night leaks",
      primaryValue: `${lateNightExpenses.length}x`,
      secondaryLabel: "Range impact",
      secondaryValue: rangeImpact,
      action: "Set a no-spend rule after 22:00 or prepare a cheaper fallback before the night starts.",
    };
  }

  if (afterPaydayDay > 0) {
    return {
      tone: selectedPoint.status === "danger" ? "danger" : "watch",
      label: "Payday pattern",
      title: "Fresh money lowered resistance.",
      body: `This candle happened on day ${afterPaydayDay} of the income cycle. The risk is not income itself — it is spending too freely right after it lands.`,
      primaryLabel: "Cycle day",
      primaryValue: `Day ${afterPaydayDay}`,
      secondaryLabel: "Leak rank",
      secondaryValue: rankLabel,
      action: "Protect essentials first, then give optional spending a fixed cap for the first 4 days.",
    };
  }

  if (weekend) {
    return {
      tone: selectedPoint.status === "danger" ? "danger" : "watch",
      label: "Weekend pattern",
      title: "The week structure disappeared and spending pressure showed up.",
      body: "Weekend leaks are dangerous because they feel like reward time, not a financial decision. That makes them easy to repeat.",
      primaryLabel: "Day type",
      primaryValue: "Weekend",
      secondaryLabel: "Range impact",
      secondaryValue: rangeImpact,
      action: "Set the weekend cap before Friday. Do not negotiate with the wallet while already spending.",
    };
  }

  if (emotionalExpenses.length > 0) {
    const trigger = getLeakNoteTrigger(emotionalExpenses[0]);

    return {
      tone: selectedPoint.status === "danger" ? "danger" : "watch",
      label: "Emotion clue",
      title: "The note gives the leak context.",
      body: trigger
        ? `The app saw “${trigger}” in the note. That suggests the leak was connected to mood, stress, boredom, or impulse — not only the category.`
        : "The note suggests the leak had emotional context, not only a spending category.",
      primaryLabel: "Clues",
      primaryValue: `${emotionalExpenses.length}x`,
      secondaryLabel: "Leak pressure",
      secondaryValue: money(selectedPoint.leakAmount, settings.currency),
      action: "When the reason is emotional, wait 10 minutes before buying and write the feeling first.",
    };
  }

  if (maybeLeakTotal >= Math.max(notNeededLeakTotal, selectedPoint.leakAmount * 0.5)) {
    return {
      tone: selectedPoint.status === "danger" ? "danger" : "watch",
      label: "Grey-zone pattern",
      title: "This was not one obvious mistake.",
      body: "Most pressure came from Maybe decisions — the type of spending that feels acceptable in the moment but becomes expensive when repeated.",
      primaryLabel: "Maybe leaks",
      primaryValue: money(maybeLeakTotal, settings.currency),
      secondaryLabel: "Range impact",
      secondaryValue: rangeImpact,
      action: "Make one rule for Maybe spending: it needs a reason before it gets approved.",
    };
  }

  if (notNeededLeakTotal > 0) {
    return {
      tone: selectedPoint.status === "danger" ? "danger" : "watch",
      label: "Avoidable leak",
      title: "Optional spending created the pressure.",
      body: `${topLeakName} was the main visible cause, but the real pattern is simpler: the wallet got hit by Not needed spending.`,
      primaryLabel: "Not needed",
      primaryValue: money(notNeededLeakTotal, settings.currency),
      secondaryLabel: "Leak rank",
      secondaryValue: rankLabel,
      action: "Cut one repeat of the main category before trying to fix everything.",
    };
  }

  return {
    tone: selectedPoint.status === "danger" ? "danger" : "watch",
    label: "Pattern forming",
    title: "This candle is starting to show behavior pressure.",
    body: `${topLeakName} created the clearest pressure, but the app needs a few more records before calling it a repeat pattern.`,
    primaryLabel: "Leak pressure",
    primaryValue: money(selectedPoint.leakAmount, settings.currency),
    secondaryLabel: "Range impact",
    secondaryValue: rangeImpact,
    action: "Keep logging this category for a few more days. The repeat pattern will become clearer.",
  };
}

function describeSelectedCandlePattern(
  selectedPoint: ChartPoint | undefined,
  selectedDayExpenses: Expense[],
  selectedTopLeak: CategorySummary | null,
  settings: Settings
) {
  if (!selectedPoint || selectedPoint.count <= 0) {
    return "No pattern yet. Add an expense or inspect another candle.";
  }

  if (selectedPoint.leakAmount <= 0) {
    return "Controlled basics: spending happened, but it did not create leak pressure.";
  }

  const leakExpenses = selectedDayExpenses.filter((expense) => getExpenseLeakValue(expense) > 0);
  const lateNightExpenses = leakExpenses.filter(isLateNightExpense);
  const emotionalExpenses = leakExpenses.filter((expense) => Boolean(getLeakNoteTrigger(expense)));
  const afterPaydayDay = getAfterPaydayDayIndex(new Date(`${selectedPoint.key}T00:00:00`), settings);
  const maybeTotal = sumTrackedExpensesByNeedType(selectedDayExpenses, "Maybe");
  const notNeededTotal = sumTrackedExpensesByNeedType(selectedDayExpenses, "Not needed");
  const topLeakRepeatCount = selectedTopLeak
    ? selectedDayExpenses.filter((expense) => expense.category === selectedTopLeak.category).length
    : 0;

  if (lateNightExpenses.length >= 2 || sumLeakExpenses(lateNightExpenses) >= selectedPoint.leakAmount * 0.5) {
    return "Late-night leak detected. Most pressure happened after 22:00 or before 06:00.";
  }

  if (afterPaydayDay > 0 && selectedPoint.leakAmount > 0) {
    return `After-payday spike detected. This candle is day ${afterPaydayDay} of the income cycle.`;
  }

  if (isWeekendDate(new Date(`${selectedPoint.key}T00:00:00`)) && selectedPoint.leakAmount > 0) {
    return "Weekend leak detected. The pressure appeared when the normal week structure was gone.";
  }

  if (emotionalExpenses.length > 0) {
    const trigger = getLeakNoteTrigger(emotionalExpenses[0]);
    return `Emotional spending clue detected${trigger ? `: ${trigger}` : ""}. The note gives context behind the leak.`;
  }

  if (selectedTopLeak && topLeakRepeatCount >= 2) {
    return `${categoryDisplayLabel(settings, selectedTopLeak.category)} repeated ${topLeakRepeatCount} times on this candle.`;
  }

  if (notNeededTotal >= maybeTotal && notNeededTotal > 0) {
    return "Not needed spending created most of the pressure.";
  }

  if (maybeTotal > 0) {
    return "Grey-zone Maybe spending created the pressure without one clear failure point.";
  }

  return "No strong pattern detected yet.";
}

function buildLeakPatterns(expenses: Expense[], settings: Settings): LeakPattern[] {
  const monthExpenses = getCurrentMonthExpenses(expenses);
  const archive = buildMonthlyLeakArchive(monthExpenses, monthKey(new Date()));
  const patterns: LeakPattern[] = [];

  for (const item of archive.categories) {
    const label = sentenceCase(categoryLabel(item.category));
    const weekendCount = item.purchases.filter((expense) => isWeekendDate(new Date(expense.createdAt))).length;
    const notNeededCount = item.purchases.filter((expense) => expense.needType === "Not needed").length;
    const maybeCount = item.purchases.filter((expense) => expense.needType === "Maybe").length;
    const [dominantPart, dominantPartCount] = getDominantDayPart(item.purchases);
    if (item.leakTotal <= 0) continue;

    const leakAverage = item.count > 0 ? item.leakTotal / item.count : 0;
    const leakSharePercent = archive.totalLeaks > 0 ? Math.round((item.leakTotal / archive.totalLeaks) * 100) : 0;
    const amountLabel = money(item.leakTotal, settings.currency);
    const averageLabel = money(leakAverage, settings.currency);

    if (item.count >= 5) {
      patterns.push({
        id: `${item.category}-repeat`,
        category: item.category,
        icon: item.icon,
        title: `${label} repeats too often`,
        body: `${item.count} ${label} records this month became ${amountLabel}.`,
        why: "This does not look like one random purchase. It looks like a repeated behavior.",
        fix: `Cut only 2 ${label} repeats next week and watch the monthly total change.`,
        count: item.count,
        total: item.leakTotal,
        average: leakAverage,
        severity: item.count >= 10 || leakSharePercent >= 30 ? "high" : "medium",
        tag: "Repeated habit",
      });
    }

    if (dominantPart !== "unknown" && dominantPartCount >= 3 && dominantPartCount / Math.max(item.count, 1) >= 0.55) {
      patterns.push({
        id: `${item.category}-${dominantPart}`,
        category: item.category,
        icon: item.icon,
        title: `${label} appears mostly in the ${dominantPart}`,
        body: `${dominantPartCount} of ${item.count} ${label} records happened in the ${dominantPart}.`,
        why:
          dominantPart === "evening" || dominantPart === "night"
            ? "This may be a tiredness, stress, or routine leak."
            : "This may be connected to a daily routine or repeated trigger.",
        fix:
          dominantPart === "evening" || dominantPart === "night"
            ? `Prepare one cheaper backup before the ${dominantPart}.`
            : `Add one rule before the usual ${dominantPart} trigger.`,
        count: dominantPartCount,
        total: item.leakTotal,
        average: leakAverage,
        severity: "medium",
        tag: `${sentenceCase(dominantPart)} trigger`,
      });
    }

    if (weekendCount >= 2 && weekendCount / Math.max(item.count, 1) >= 0.5) {
      patterns.push({
        id: `${item.category}-weekend`,
        category: item.category,
        icon: item.icon,
        title: `${label} is a weekend leak`,
        body: `${weekendCount} of ${item.count} ${label} records happened on weekends.`,
        why: "The leak may not be daily. It may appear when the week ends and discipline drops.",
        fix: `Set a weekend limit before Friday. Do not decide while already spending.`,
        count: weekendCount,
        total: item.leakTotal,
        average: leakAverage,
        severity: "medium",
        tag: "Weekend leak",
      });
    }

    if (item.count <= 3 && item.leakTotal >= Math.max(archive.totalLeaks * 0.28, 1)) {
      patterns.push({
        id: `${item.category}-heavy`,
        category: item.category,
        icon: item.icon,
        title: `${label} is a heavy-hit leak`,
        body: `${item.count} purchase${item.count === 1 ? "" : "s"} created ${amountLabel} in pressure.`,
        why: "This is not frequent, but each hit is large enough to move the month.",
        fix: `Before the next ${label} purchase, wait 24 hours or set a hard cap.`,
        count: item.count,
        total: item.leakTotal,
        average: leakAverage,
        severity: "high",
        tag: "Heavy hit",
      });
    }

    if (maybeCount + notNeededCount >= 3 && (maybeCount + notNeededCount) / Math.max(item.count, 1) >= 0.6) {
      patterns.push({
        id: `${item.category}-decision`,
        category: item.category,
        icon: item.icon,
        title: `${label} lives in the decision zone`,
        body: `${maybeCount + notNeededCount} records were Maybe or Not needed.`,
        why: "This category is not clearly life cost. It is where small decisions leak money.",
        fix: `Make one rule: ${label} needs a reason before it gets tracked again.`,
        count: maybeCount + notNeededCount,
        total: item.leakTotal,
        average: leakAverage,
        severity: notNeededCount >= maybeCount ? "high" : "medium",
        tag: "Decision leak",
      });
    }

    if (item.count >= 4 && leakAverage <= Math.max(5, archive.totalLeaks * 0.04)) {
      patterns.push({
        id: `${item.category}-small`,
        category: item.category,
        icon: item.icon,
        title: `${label} is a small-leak pattern`,
        body: `${item.count} purchases with an average of ${averageLabel}.`,
        why: "The single purchase feels harmless. The pattern is what makes it expensive.",
        fix: `Reduce the number of repeats, not only the price.`,
        count: item.count,
        total: item.leakTotal,
        average: leakAverage,
        severity: item.count >= 8 ? "high" : "medium",
        tag: "Small repeated leak",
      });
    }
  }

  const unique = new Map<string, LeakPattern>();

  for (const pattern of patterns) {
    const existing = unique.get(pattern.id);

    if (!existing || existing.total < pattern.total) {
      unique.set(pattern.id, pattern);
    }
  }

  return Array.from(unique.values())
    .sort((a, b) => {
      const severityScore = { high: 3, medium: 2, low: 1 };
      return severityScore[b.severity] - severityScore[a.severity] || b.total - a.total;
    })
    .slice(0, 5);
}


function formatShortDayLabel(key: string) {
  const date = new Date(`${key}T00:00:00`);

  return date.toLocaleDateString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function buildWeeklyReview(expenses: Expense[], settings: Settings): WeeklyReview {
  const weekExpenses = getLastSevenDaysExpenses(expenses);
  const totalSpent = sumTrackedExpenses(weekExpenses);
  const totalLeaks = sum(weekExpenses.map(getExpenseLeakValue));
  const totalCount = weekExpenses.length;
  const leakPressure = totalSpent > 0 ? Math.round((totalLeaks / totalSpent) * 100) : 0;

  const categoryMap = new Map<string, { total: number; leaks: number; count: number }>();

  for (const expense of weekExpenses) {
    const current = categoryMap.get(expense.category) || { total: 0, leaks: 0, count: 0 };

    categoryMap.set(expense.category, {
      total: current.total + expense.amount,
      leaks: current.leaks + getExpenseLeakValue(expense),
      count: current.count + 1,
    });
  }

  const categories = Array.from(categoryMap.entries()).map(([category, value]) => ({
    category,
    ...value,
  }));

  const biggestLeak = [...categories].sort((a, b) => b.leaks - a.leaks || b.total - a.total)[0];
  const mostRepeated = [...categories].sort((a, b) => b.count - a.count || b.total - a.total)[0];

  const dayMap = new Map<string, { spent: number; leaks: number; count: number }>();

  for (const expense of weekExpenses) {
    const key = dayKey(new Date(expense.createdAt));
    const current = dayMap.get(key) || { spent: 0, leaks: 0, count: 0 };

    dayMap.set(key, {
      spent: current.spent + expense.amount,
      leaks: current.leaks + getExpenseLeakValue(expense),
      count: current.count + 1,
    });
  }

  const days: WeeklyReviewDay[] = Array.from(dayMap.entries())
    .map(([key, value]) => ({
      key,
      label: formatShortDayLabel(key),
      spent: value.spent,
      leaks: value.leaks,
      count: value.count,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const spendingDays = days.filter((day) => day.count > 0);
  const worstDay = [...spendingDays].sort((a, b) => b.spent - a.spent)[0] || null;
  const bestDay = [...spendingDays].sort((a, b) => a.leaks - b.leaks || a.spent - b.spent)[0] || null;

  const biggestLeakCategory = biggestLeak?.category || "none";
  const biggestLeakAmount = biggestLeak?.leaks || 0;
  const mostRepeatedCategory = mostRepeated?.category || "none";
  const mostRepeatedCount = mostRepeated?.count || 0;

  const oneFixTitle =
    biggestLeak && biggestLeak.leaks > 0
      ? `Reduce ${categoryLabel(biggestLeak.category)} next week`
      : mostRepeated
        ? `Watch ${categoryLabel(mostRepeated.category)} next week`
        : "Track one honest week";

  const oneFixBody =
    biggestLeak && biggestLeak.leaks > 0
      ? `Cut this leak by 30% next week. That would protect about ${money(biggestLeak.leaks * 0.3, settings.currency)}.`
      : totalCount > 0
        ? "You tracked movement, but the leak pattern is not strong yet. Keep logging for one more week."
        : "Add expenses for 7 days. The review becomes useful only when the app has real records.";

  const summary =
    totalCount <= 0
      ? "No weekly memory yet. Track one honest week and $BROKE will show what changed."
      : biggestLeak && biggestLeak.leaks > 0
        ? `${categoryLabel(biggestLeak.category)} created the strongest weekly leak. Start there before fixing everything else.`
        : "This week has spending, but low leak pressure. Keep the useful expenses separate from the leaks.";

  return {
    totalSpent,
    totalLeaks,
    totalCount,
    leakPressure,
    biggestLeakCategory,
    biggestLeakAmount,
    mostRepeatedCategory,
    mostRepeatedCount,
    bestDay,
    worstDay,
    oneFixTitle,
    oneFixBody,
    summary,
    days,
  };
}


function getDifficultyMultiplier(difficulty: OneFixDifficulty) {
  if (difficulty === "easy") return 0.15;
  if (difficulty === "hard") return 0.45;
  return 0.3;
}

function getDifficultyLabel(difficulty: OneFixDifficulty) {
  if (difficulty === "easy") return "Easy";
  if (difficulty === "hard") return "Hard";
  return "Normal";
}

function buildOneFixRecommendation(
  patterns: LeakPattern[],
  weeklyReview: WeeklyReview,
  settings: Settings,
  difficulty: OneFixDifficulty
): OneFixRecommendation {
  const multiplier = getDifficultyMultiplier(difficulty);
  const difficultyLabel = getDifficultyLabel(difficulty);
  const topPattern = patterns[0];

  if (topPattern) {
    const estimatedSave = Math.max(topPattern.total * multiplier, topPattern.average * multiplier);
    const label = sentenceCase(categoryLabel(topPattern.category));
    const cutRepeats =
      topPattern.count >= 6
        ? Math.max(1, Math.round(topPattern.count * multiplier))
        : Math.max(1, difficulty === "hard" ? 2 : 1);

    return {
      id: `${topPattern.id}-${difficulty}`,
      category: topPattern.category,
      icon: topPattern.icon,
      title: `${difficultyLabel} fix: reduce ${label}`,
      body: topPattern.fix,
      target:
        topPattern.count >= 3
          ? `Skip ${cutRepeats} ${label} repeat${cutRepeats === 1 ? "" : "s"} next week.`
          : `Pause before the next ${label} purchase.`,
      estimatedSave,
      difficulty,
      difficultyLabel,
      reason: topPattern.why,
      source: topPattern.tag,
    };
  }

  if (weeklyReview.biggestLeakAmount > 0 && weeklyReview.biggestLeakCategory !== "none") {
    const estimatedSave = weeklyReview.biggestLeakAmount * multiplier;
    const label = sentenceCase(categoryLabel(weeklyReview.biggestLeakCategory));

    return {
      id: `${weeklyReview.biggestLeakCategory}-${difficulty}`,
      category: weeklyReview.biggestLeakCategory,
      icon: getCategoryIcon(weeklyReview.biggestLeakCategory),
      title: `${difficultyLabel} fix: protect next week`,
      body: `Your biggest weekly leak was ${label}. Reduce this one category before trying to fix everything.`,
      target: `Cut ${label} by ${Math.round(multiplier * 100)}% next week.`,
      estimatedSave,
      difficulty,
      difficultyLabel,
      reason: "The biggest weekly leak usually gives the fastest visible improvement.",
      source: "Weekly review",
    };
  }

  if (weeklyReview.mostRepeatedCount > 0 && weeklyReview.mostRepeatedCategory !== "none") {
    const label = sentenceCase(categoryLabel(weeklyReview.mostRepeatedCategory));

    return {
      id: `${weeklyReview.mostRepeatedCategory}-repeat-${difficulty}`,
      category: weeklyReview.mostRepeatedCategory,
      icon: getCategoryIcon(weeklyReview.mostRepeatedCategory),
      title: `${difficultyLabel} fix: watch repetition`,
      body: `${label} repeated ${weeklyReview.mostRepeatedCount} times this week.`,
      target: `Reduce ${label} by one repeat next week.`,
      estimatedSave: 0,
      difficulty,
      difficultyLabel,
      reason: "The pattern is still forming. Start by reducing the repeat count.",
      source: "Weekly repeat",
    };
  }

  return {
    id: `starter-${difficulty}`,
    category: "Custom",
    icon: A.walletMascot,
    title: "Starter fix: create a real signal",
    body: "The app needs more honest records before it can recommend a precise fix.",
    target: "Track 3 real expenses over the next 24 hours.",
    estimatedSave: 0,
    difficulty,
    difficultyLabel,
    reason: "No data means no diagnosis. First build the signal.",
    source: "Starter mode",
  };
}


function getLastExpenseDate(expenses: Expense[]) {
  if (expenses.length === 0) return null;

  return expenses
    .map((expense) => new Date(expense.createdAt))
    .sort((a, b) => b.getTime() - a.getTime())[0];
}

function getDaysSinceLastExpense(expenses: Expense[]) {
  const last = getLastExpenseDate(expenses);
  if (!last) return 0;

  const today = getStartOfToday();
  const lastDay = new Date(last);
  lastDay.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((today.getTime() - lastDay.getTime()) / 86400000));
}

function buildComebackState(expenses: Expense[], settings: Settings): ComebackState | null {
  if (expenses.length === 0) return null;

  const daysAway = getDaysSinceLastExpense(expenses);
  if (daysAway < 2) return null;

  const lastDate = getLastExpenseDate(expenses);
  const monthExpenses = getCurrentMonthExpenses(expenses);
  const elapsedDays = Math.max(getCurrentDayOfMonth(), 1);
  const dailyLeakPace = sum(monthExpenses.map(getExpenseLeakValue)) / elapsedDays;
  const estimatedMissedLeaks = dailyLeakPace * daysAway;

  const leakCategories = getCategoryLeakSummaries(monthExpenses);
  const biggestLeak = leakCategories[0] || null;
  const biggestLeakCategory = biggestLeak?.category || "none";
  const biggestLeakAmount = biggestLeak?.amount || 0;
  const lastActiveLabel = lastDate
    ? lastDate.toLocaleDateString("en", { month: "short", day: "numeric" })
    : "-";

  const title =
    daysAway >= 7
      ? `You disappeared for ${daysAway} days`
      : `You were away for ${daysAway} days`;
  const body =
    daysAway >= 7
      ? "No shame. But the wallet did not pause while the app was closed."
      : "No problem. Restart with one honest record.";
  const insight =
    estimatedMissedLeaks > 0
      ? `Based on your recent leak pace, the hidden damage could be around ${money(estimatedMissedLeaks, settings.currency)}.`
      : "No strong leak estimate yet. Add one missed leak to rebuild the signal.";

  return {
    daysAway,
    lastActiveLabel,
    estimatedMissedLeaks,
    biggestLeakCategory,
    biggestLeakAmount,
    title,
    body,
    insight,
  };
}


function getDayDifferenceFromToday(date: Date) {
  const today = getStartOfToday();
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((today.getTime() - target.getTime()) / 86400000));
}

function formatLastLeakLabel(date: Date | null) {
  if (!date) return "never";

  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

function buildLeakStreaks(expenses: Expense[], settings: Settings): LeakStreakItem[] {
  const leakExpenses = expenses.filter((expense) => expense.needType !== "Needed");
  const monthExpenses = getCurrentMonthExpenses(leakExpenses);
  const rows: LeakStreakItem[] = [];

  for (const cat of categories) {
    const categoryLeaks = leakExpenses
      .filter((expense) => expense.category === cat.name)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const categoryMonthLeaks = monthExpenses.filter((expense) => expense.category === cat.name);
    const totalThisMonth = sum(categoryMonthLeaks.map(getExpenseLeakValue));
    const countThisMonth = categoryMonthLeaks.length;
    const latestLeak = categoryLeaks[0] || null;

    if (!latestLeak && countThisMonth <= 0) continue;

    const label = categoryDisplayName(settings, cat.name);
    const latestDate = latestLeak ? new Date(latestLeak.createdAt) : null;
    const daysClean = latestDate ? getDayDifferenceFromToday(latestDate) : 0;
    const status: LeakStreakItem["status"] = !latestLeak
      ? "no_history"
      : daysClean === 0
        ? "broken_today"
        : "clean";

    const tone: LeakStreakItem["tone"] =
      status === "broken_today"
        ? "red"
        : status === "no_history"
          ? "muted"
          : daysClean >= 3
            ? "green"
            : "orange";

    const title =
      status === "broken_today"
        ? `${label} streak broke today`
        : status === "no_history"
          ? `No ${label} history yet`
          : `No ${label} leak: ${daysClean} day${daysClean === 1 ? "" : "s"}`;

    const detail =
      status === "broken_today"
        ? `${label} appeared today. Restart the streak with the next 24 hours.`
        : status === "no_history"
          ? `No ${label} leak recorded yet. Keep it clean or track honestly if it happens.`
          : `Last ${label} leak was ${formatLastLeakLabel(latestDate)}. This is a real clean streak.`;

    const suggestion =
      status === "broken_today"
        ? `Do not chase perfection. Protect the next decision.`
        : daysClean >= 3
          ? `Keep the streak alive for one more day.`
          : `Push it to 3 days. Short streaks become identity when repeated.`;

    rows.push({
      id: cat.name,
      category: cat.name,
      label,
      icon: cat.icon,
      daysClean,
      countThisMonth,
      totalThisMonth,
      lastLeakLabel: formatLastLeakLabel(latestDate),
      status,
      title,
      detail,
      suggestion,
      tone,
    });
  }

  if (rows.length === 0) {
    return categories.slice(0, 3).map((cat) => {
      const label = categoryDisplayName(settings, cat.name);

      return {
        id: cat.name,
        category: cat.name,
        label,
        icon: cat.icon,
        daysClean: 0,
        countThisMonth: 0,
        totalThisMonth: 0,
        lastLeakLabel: "never",
        status: "no_history",
        title: `No ${label} leak history yet`,
        detail: `Track expenses honestly and $BROKE will start measuring category streaks.`,
        suggestion: `Start with one real record or keep this category clean.`,
        tone: "muted",
      };
    });
  }

  return rows.sort((a, b) => {
    const statusScore = { clean: 3, broken_today: 2, no_history: 1 };
    return (
      statusScore[b.status] - statusScore[a.status] ||
      b.daysClean - a.daysClean ||
      b.totalThisMonth - a.totalThisMonth
    );
  });
}


function getTelegramWebApp() {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

function triggerHaptic(type: "light" | "medium" | "success" | "error" = "light") {
  const haptic = getTelegramWebApp()?.HapticFeedback;

  try {
    if (type === "success" || type === "error") {
      haptic?.notificationOccurred?.(type);
      return;
    }

    haptic?.impactOccurred?.(type);
  } catch {
    // Telegram haptics are optional.
  }
}

function openExternalUrl(url: string) {
  const webApp = getTelegramWebApp();

  if (webApp?.openLink) {
    try {
      webApp.openLink(url, { try_instant_view: false });
      return;
    } catch {
      // Fall back to a normal browser navigation below.
    }
  }

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return;
  } catch {
    window.location.href = url;
  }
}

function isEmbeddedAppView() {
  if (typeof window === "undefined") return false;

  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function getStandaloneAppUrl() {
  if (typeof window === "undefined") return "";

  try {
    return window.location.href;
  } catch {
    return "";
  }
}

function openStandaloneAppUrl() {
  const url = getStandaloneAppUrl();
  if (!url) return false;

  openExternalUrl(url);
  return true;
}

function openTelegramUrl(url: string) {
  const webApp = getTelegramWebApp();

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function readTelegramState(): TelegramState {
  const webApp = getTelegramWebApp();

  if (!webApp) {
    return emptyTelegramState;
  }

  const user = webApp.initDataUnsafe?.user ?? null;
  const initData = webApp.initData ?? "";
  const isTelegram = Boolean(initData || user);

  return {
    isTelegram,
    user,
    platform: webApp.platform ?? "telegram",
    version: webApp.version ?? "-",
    colorScheme: webApp.colorScheme ?? "dark",
    startParam: webApp.initDataUnsafe?.start_param ?? "",
    initData,
  };
}


function calculateStreakFromExpenses(expenses: Expense[]): Streak {
  const dates = Array.from(
    new Set(expenses.map((expense) => dayKey(new Date(expense.createdAt))))
  ).sort();

  if (dates.length === 0) {
    return emptyStreak;
  }

  const dateSet = new Set(dates);
  const lastActiveDate = dates[dates.length - 1];

  let bestStreak = 0;
  let rollingStreak = 0;
  let previousTime = 0;

  for (const key of dates) {
    const time = new Date(`${key}T00:00:00`).getTime();

    if (previousTime && time - previousTime === 24 * 60 * 60 * 1000) {
      rollingStreak += 1;
    } else {
      rollingStreak = 1;
    }

    bestStreak = Math.max(bestStreak, rollingStreak);
    previousTime = time;
  }

  const today = dayKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dayKey(yesterdayDate);

  let currentStreak = 0;

  if (dateSet.has(today) || dateSet.has(yesterday)) {
    const cursor = new Date(`${dateSet.has(today) ? today : yesterday}T00:00:00`);

    while (dateSet.has(dayKey(cursor))) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return {
    currentStreak,
    bestStreak,
    lastActiveDate,
    updatedAt: new Date().toISOString(),
  };
}

function isStreakActiveToday(streak: Streak) {
  return streak.lastActiveDate === dayKey(new Date());
}

function getStreakLabel(streak: Streak) {
  if (streak.currentStreak <= 0) return "Start today";
  if (isStreakActiveToday(streak)) return "Alive today";
  return "Track today";
}


function sentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function categoryLabel(category: string) {
  return category === "Takeouts" ? "delivery / takeout" : category.toLowerCase();
}

function categoryDisplayName(settings: Settings, category: string) {
  const customName = settings.categoryNames?.[category]?.trim();

  if (customName) return customName;

  return sentenceCase(categoryLabel(category));
}

function categoryDisplayLabel(settings: Settings, category: string) {
  return categoryDisplayName(settings, category).toLowerCase();
}

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getLastSevenDaysExpenses(expenses: Expense[]) {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return expenses.filter((expense) => new Date(expense.createdAt) >= start);
}

function getTodayExpenses(expenses: Expense[]) {
  const today = dayKey(new Date());

  return expenses.filter((expense) => dayKey(new Date(expense.createdAt)) === today);
}

function readLocalLeakMission(): LocalLeakMission | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LEAK_MISSION_KEY);

    if (!raw) return null;

    const mission = JSON.parse(raw) as Partial<LocalLeakMission>;

    if (
      !mission.id ||
      !mission.category ||
      !mission.startedAt ||
      !mission.endsAt ||
      typeof mission.targetSpend !== "number"
    ) {
      return null;
    }

    return mission as LocalLeakMission;
  } catch {
    return null;
  }
}

function writeLocalLeakMission(mission: LocalLeakMission | null, notifyChange = true) {
  if (typeof window === "undefined") return;

  try {
    if (!mission) {
      window.localStorage.removeItem(LEAK_MISSION_KEY);
      if (notifyChange) window.dispatchEvent(new Event(LOCAL_APP_STATE_CHANGE_EVENT));
      return;
    }

    window.localStorage.setItem(LEAK_MISSION_KEY, JSON.stringify(mission));
    if (notifyChange) window.dispatchEvent(new Event(LOCAL_APP_STATE_CHANGE_EVENT));
  } catch {
    // Local mission is optional. Ignore storage errors.
  }
}

function createLocalLeakMission(category: string, baselineWeekly: number): LocalLeakMission {
  const started = new Date();
  const ends = new Date(started);
  ends.setDate(started.getDate() + 3);

  const targetSpend = Math.max(1, Math.round((baselineWeekly / 7) * 3 * 0.5));

  return {
    id: uid(),
    category,
    startedAt: started.toISOString(),
    endsAt: ends.toISOString(),
    baselineWeekly,
    targetSpend,
    createdAt: started.toISOString(),
  };
}

function getLocalLeakMissionProgress(mission: LocalLeakMission | null, expenses: Expense[]) {
  if (!mission) {
    return {
      spent: 0,
      percentUsed: 0,
      daysLeft: 0,
      completed: false,
      failed: false,
      active: false,
    };
  }

  const start = new Date(mission.startedAt);
  const end = new Date(mission.endsAt);
  const now = new Date();

  const spent = sumLeakExpenses(
    expenses.filter((expense) => {
      const created = new Date(expense.createdAt);
      return (
        created >= start &&
        created <= end &&
        expense.category === mission.category
      );
    })
  );

  const percentUsed =
    mission.targetSpend > 0 ? clamp(Math.round((spent / mission.targetSpend) * 100), 0, 150) : 0;
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
  const completed = now > end && spent <= mission.targetSpend;
  const failed = spent > mission.targetSpend;
  const active = !completed && !failed && now <= end;

  return {
    spent,
    percentUsed,
    daysLeft,
    completed,
    failed,
    active,
  };
}

function getDaysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function getCurrentDayOfMonth() {
  return Math.max(1, new Date().getDate());
}

function buildWalletInsights(
  expenses: Expense[],
  settings: Settings,
  context: SmartInsightContext = {}
): WalletInsight[] {
  const insights: WalletInsight[] = [];
  const todayExpenses = getTodayExpenses(expenses);
  const weekExpenses = getLastSevenDaysExpenses(expenses);
  const walletSummary = buildWalletSummary(settings, expenses);
  const monthExpenses = walletSummary.currentMonthExpenses;

  const todayTrackedCategories = getCategoryTrackedSummaries(todayExpenses);
  const todayLeakCategories = getCategoryLeakSummaries(todayExpenses);
  const weekTrackedCategories = getCategoryTrackedSummaries(weekExpenses);
  const monthTrackedCategories = getCategoryTrackedSummaries(monthExpenses);

  const totalIncome = walletSummary.totalIncome;
  const fixedCosts = walletSummary.fixedCosts;
  const availableAfterLifeCost = walletSummary.availableAfterLifeCost;
  const fixedCostRatio = totalIncome > 0 ? fixedCosts / totalIncome : 0;

  if (totalIncome > 0 && fixedCostRatio >= 0.5) {
    const fixedCostPercent = Math.round(fixedCostRatio * 100);

    insights.push({
      id: "fixed_cost_pressure",
      title: "Fixed cost pressure",
      body: `${fixedCostPercent}% of income is already claimed before daily leaks start.`,
      detail:
        fixedCostPercent >= 75
          ? "The wallet starts the month under pressure. Cutting one recurring cost may matter more than chasing tiny leaks."
          : "This is your baseline pressure. Daily leaks become more dangerous when fixed costs are already high.",
      icon: A.lifeCost,
      tone: fixedCostPercent >= 75 ? "red" : fixedCostPercent >= 62 ? "orange" : "gold",
    });
  }

  const weekLeaks = sumLeakExpenses(weekExpenses);
  const monthLeaks = sumLeakExpenses(monthExpenses);

  const debtRadarTotal = context.debtRadarTotals?.totalMonthly ?? 0;

  if (debtRadarTotal > 0) {
    const silentPressurePercent = Math.round((debtRadarTotal / availableAfterLifeCost) * 100);
    const comparisonDetail = monthLeaks > 0
      ? debtRadarTotal >= monthLeaks
        ? "Silent pressure is bigger than this month’s marked leaks. Recurring damage may be the real boss fight."
        : "Daily leaks are still louder than silent pressure. Fix the repeating habit first."
      : "Debt, bills, and maintenance are already waiting before optional spending begins.";

    insights.push({
      id: "silent_pressure_vs_leaks",
      title: "Silent pressure",
      body: `${money(debtRadarTotal, settings.currency)}/month is already waiting in Debt & Bills Radar.`,
      detail: `${silentPressurePercent}% of available money is under silent pressure. ${comparisonDetail}`,
      icon: A.walletHp,
      tone: silentPressurePercent >= 35 ? "red" : silentPressurePercent >= 18 ? "orange" : "gold",
    });
  }

  const plannerTargets = context.growthPlanner?.realLifeTargets ?? [];
  const firstRealTarget = plannerTargets.find((target) => safeNumber(target.amount) > 0);
  const personalGoalAmount = safeNumber(context.growthPlanner?.savingGoalAmount || "0");
  const targetName = firstRealTarget?.name?.trim() || context.growthPlanner?.savingGoalName?.trim() || "your next target";
  const targetDisplay = firstRealTarget
    ? getDisplayAmount(
        safeNumber(firstRealTarget.amount),
        firstRealTarget.currency || settings.currency,
        settings,
        context.exchangeRates || {}
      )
    : getDisplayAmount(
        personalGoalAmount,
        context.growthPlanner?.savingGoalCurrency || settings.currency,
        settings,
        context.exchangeRates || {}
      );
  const targetAmount = Math.max(0, targetDisplay.amount * (firstRealTarget?.period === "year" ? 12 : 1));

  if (monthLeaks > 0 && targetAmount > 0) {
    const targetCoveragePercent = Math.round((monthLeaks / targetAmount) * 100);

    insights.push({
      id: "leaks_to_target",
      title: "Leak-to-target signal",
      body: `${money(monthLeaks, settings.currency)} in this month’s leaks could cover ${targetCoveragePercent}% of ${targetName}.`,
      detail:
        targetCoveragePercent >= 100
          ? `The target is not far away. The leak is already large enough to cover ${targetName}.`
          : "This is why Target Coverage matters: the leak becomes a real-life tradeoff, not just a number.",
      icon: A.navWhatIf,
      tone: targetCoveragePercent >= 100 ? "red" : targetCoveragePercent >= 40 ? "orange" : "gold",
    });
  }

  if (settings.currencyMode === "convert" && (context.oldExpenseCurrencyMissingCount ?? 0) > 0) {
    const missingCount = context.oldExpenseCurrencyMissingCount ?? 0;

    insights.push({
      id: "currency_repair_signal",
      title: "Currency repair signal",
      body: `${missingCount} old expense${missingCount === 1 ? "" : "s"} may still miss original currency metadata.`,
      detail: "Use Old Data Currency Repair before judging converted totals or USD references.",
      icon: A.navSettings,
      tone: "gold",
    });
  }

  const monthSpent = walletSummary.spentThisMonth;
  const realBalance = walletSummary.realBalance;
  const walletHp = walletSummary.walletHp;

  const todayLeakTop = todayLeakCategories[0];
  const todayTrackedTop = todayTrackedCategories[0];

  if (todayLeakTop) {
    insights.push({
      id: "daily_projection",
      title: "Today’s leak",
      body: `${money(todayLeakTop.amount, settings.currency)} leaked through ${categoryLabel(todayLeakTop.category)} today.`,
      detail: `If this leak rhythm repeats, it becomes ${money(todayLeakTop.amount * 30, settings.currency)}/month.`,
      icon: getCategoryIcon(todayLeakTop.category),
      tone: todayLeakTop.amount >= availableAfterLifeCost * 0.06 ? "red" : "orange",
    });
  } else if (todayTrackedTop) {
    insights.push({
      id: "daily_spending",
      title: "Today’s spending",
      body: `You tracked ${money(todayTrackedTop.amount, settings.currency)} on ${categoryLabel(todayTrackedTop.category)} today.`,
      detail: "It is not counted as a leak unless it is marked Maybe or Not needed.",
      icon: getCategoryIcon(todayTrackedTop.category),
      tone: "green",
    });
  }

  const weekTop = weekTrackedCategories[0];

  if (weekTop && settings.fixedCosts.rent > 0) {
    const rentPercent = Math.round((weekTop.amount / settings.fixedCosts.rent) * 100);

    if (rentPercent >= 5) {
      insights.push({
        id: "rent_comparison",
        title: "Rent comparison",
        body: `${sentenceCase(categoryLabel(weekTop.category))} is already ${rentPercent}% of your rent in the last 7 days.`,
        detail: rentPercent >= 20
          ? "That is no longer a small purchase. That is a pattern."
          : "It looks small until you compare it to a real bill.",
        icon: A.lifeCost,
        tone: rentPercent >= 20 ? "red" : "orange",
      });
    }
  }

  if (weekLeaks > 0) {
    insights.push({
      id: "not_needed_week",
      title: "Marked leaks",
      body: `${money(weekLeaks, settings.currency)} was marked as Not needed / Maybe in the last 7 days.`,
      detail: "This is where the wallet starts leaking quietly.",
      icon: A.leaks,
      tone: weekLeaks >= availableAfterLifeCost * 0.15 ? "red" : "orange",
    });
  }

  if (settings.fixedCosts.phone > 0 && weekLeaks >= settings.fixedCosts.phone) {
    insights.push({
      id: "phone_bill_comparison",
      title: "Hidden bill",
      body: `Small leaks this week are already bigger than your phone bill.`,
      detail: `${money(weekLeaks, settings.currency)} in leaks vs ${money(settings.fixedCosts.phone, settings.currency)} phone cost.`,
      icon: A.lifeCost,
      tone: "red",
    });
  }

  const repeating = weekTrackedCategories.find((item) => item.count >= 3);

  if (repeating) {
    insights.push({
      id: "repeating_category",
      title: "Repeating pattern",
      body: `${sentenceCase(categoryLabel(repeating.category))} appeared ${repeating.count} times in the last 7 days.`,
      detail: "One time is a purchase. Repeating is a habit.",
      icon: getCategoryIcon(repeating.category),
      tone: repeating.count >= 5 ? "red" : "orange",
    });
  }

  if (monthLeaks > 0) {
    const projectedLeaks = (monthLeaks / getCurrentDayOfMonth()) * getDaysInCurrentMonth();

    insights.push({
      id: "monthly_projection",
      title: "Monthly projection",
      body: `At this pace, leaks could reach ${money(projectedLeaks, settings.currency)} this month.`,
      detail: "That is not one mistake. That is the monthly rhythm.",
      icon: A.navChart,
      tone: projectedLeaks >= availableAfterLifeCost * 0.25 ? "red" : "gold",
    });
  }

  if (walletHp < 65) {
    insights.push({
      id: "wallet_hp_warning",
      title: "Wallet HP warning",
      body: `Wallet HP is down to ${walletHp}/100.`,
      detail: "The wallet is not broken. It is bleeding through repeated decisions.",
      icon: A.walletHp,
      tone: walletHp < 35 ? "red" : "orange",
    });
  } else if (monthExpenses.length >= 3 && realBalance > 0) {
    insights.push({
      id: "wallet_hp_stable",
      title: "Wallet still breathing",
      body: `Wallet HP is ${walletHp}/100 and real balance is still positive.`,
      detail: "Good. Now keep the leaks from turning into a monthly bill.",
      icon: A.walletHp,
      tone: "green",
    });
  }

  const todayHasRecords = todayExpenses.length > 0;
  const monthTop = monthTrackedCategories[0];
  const currentDay = Math.max(getCurrentDayOfMonth(), 1);
  const daysLeftInMonth = Math.max(getDaysInCurrentMonth() - currentDay + 1, 1);
  const remainingAfterTrackedMonth = Math.max(totalIncome - fixedCosts - monthSpent, 0);
  const safeDailyPace = remainingAfterTrackedMonth / daysLeftInMonth;
  const currentDailyPace = monthSpent / currentDay;

  if (!todayHasRecords && monthExpenses.length > 0) {
    insights.push({
      id: "no_record_today",
      title: "No signal today",
      body: "No expense has been tracked today yet.",
      detail: "The app gets smarter after one honest record. Add the first movement before the day disappears.",
      icon: A.dailyCheck,
      tone: "green",
    });
  }

  if (monthExpenses.length >= 3 && currentDailyPace > safeDailyPace * 1.25 && safeDailyPace > 0) {
    insights.push({
      id: "daily_pace_pressure",
      title: "Daily pace pressure",
      body: `Current pace is ${money(currentDailyPace, settings.currency)}/day.`,
      detail: `Safe pace is closer to ${money(safeDailyPace, settings.currency)}/day. This is where Survival Mode becomes important.`,
      icon: PREMIUM_VISUAL_PACK.survivalMascot,
      tone: currentDailyPace > safeDailyPace * 1.8 ? "red" : "orange",
    });
  }

  if (monthTop && monthSpent > 0) {
    const topShare = Math.round((monthTop.amount / monthSpent) * 100);

    if (topShare >= 42) {
      insights.push({
        id: "category_concentration",
        title: "Category concentration",
        body: `${sentenceCase(categoryDisplayLabel(settings, monthTop.category))} is ${topShare}% of this month’s tracked spending.`,
        detail: "When one category dominates the month, fixing everything is not needed. Start with the loudest category.",
        icon: getCategoryIcon(monthTop.category),
        tone: topShare >= 60 ? "red" : "orange",
      });
    }
  }

  const maybeCountWeek = weekExpenses.filter((item) => item.needType === "Maybe").length;

  if (maybeCountWeek >= 3) {
    insights.push({
      id: "maybe_zone",
      title: "Maybe zone",
      body: `${maybeCountWeek} expenses were marked Maybe in the last 7 days.`,
      detail: "Maybe is where discipline gets blurry. Decide if this category is life cost or a leak.",
      icon: A.help,
      tone: maybeCountWeek >= 5 ? "red" : "orange",
    });
  }

  const weekendExpenses = weekExpenses.filter((expense) => {
    const day = new Date(expense.createdAt).getDay();
    return day === 0 || day === 6;
  });
  const weekendLeaks = sum(weekendExpenses.map(getExpenseLeakValue));

  if (weekendLeaks > 0 && weekLeaks > 0 && weekendLeaks >= weekLeaks * 0.45) {
    insights.push({
      id: "weekend_leak",
      title: "Weekend leak",
      body: `${money(weekendLeaks, settings.currency)} of weekly leaks happened on the weekend.`,
      detail: "The leak may not be daily. It may appear when structure drops.",
      icon: A.calendar,
      tone: weekendLeaks >= weekLeaks * 0.7 ? "red" : "orange",
    });
  }

  const eveningExpenses = weekExpenses.filter((expense) => new Date(expense.createdAt).getHours() >= 18);
  const eveningLeaks = sum(eveningExpenses.map(getExpenseLeakValue));

  if (eveningLeaks > 0 && weekLeaks > 0 && eveningLeaks >= weekLeaks * 0.5) {
    insights.push({
      id: "evening_trigger",
      title: "Evening trigger",
      body: `${money(eveningLeaks, settings.currency)} of weekly leaks happened after 18:00.`,
      detail: "This can be tiredness spending. Prepare a cheaper fallback before the evening starts.",
      icon: A.progressFlame,
      tone: eveningLeaks >= weekLeaks * 0.75 ? "red" : "orange",
    });
  }

  const smallLeakLimit = Math.max(5, availableAfterLifeCost * 0.01);
  const smallLeaks = monthExpenses.filter((expense) => {
    const leakValue = getExpenseLeakValue(expense);
    return leakValue > 0 && leakValue <= smallLeakLimit;
  });

  if (smallLeaks.length >= 5) {
    const smallLeakTotal = sum(smallLeaks.map(getExpenseLeakValue));

    insights.push({
      id: "micro_leak_tax",
      title: "Micro-leak tax",
      body: `${smallLeaks.length} small leaks became ${money(smallLeakTotal, settings.currency)} this month.`,
      detail: "The single purchase does not look dangerous. The repeat count is the danger.",
      icon: A.leaks,
      tone: smallLeaks.length >= 10 ? "red" : "orange",
    });
  }

  const subscriptionMonth = monthExpenses.filter((expense) => expense.category === "Subscriptions");
  const subscriptionTotal = sum(subscriptionMonth.map(getExpenseLeakValue));

  if (subscriptionTotal > 0) {
    insights.push({
      id: "subscription_audit",
      title: "Subscription audit",
      body: `Subscriptions added ${money(subscriptionTotal, settings.currency)} in tracked pressure this month.`,
      detail: "Quiet recurring costs are easy to normalize. Review them before they become invisible.",
      icon: A.subscriptions,
      tone: subscriptionTotal >= availableAfterLifeCost * 0.08 ? "red" : "gold",
    });
  }

  const neededWeek = sumTrackedExpenses(weekExpenses.filter((item) => item.needType === "Needed"));

  if (neededWeek > 0 && neededWeek >= weekLeaks * 2 && weekLeaks > 0) {
    insights.push({
      id: "needed_vs_leak_balance",
      title: "Life cost is not the enemy",
      body: `Needed spending is bigger than leaks this week.`,
      detail: "Good. Keep separating real life cost from optional damage. That makes the app accurate.",
      icon: A.lifeCost,
      tone: "green",
    });
  }


  const challengeCategory = weekTrackedCategories.find((item) =>
    ["Coffee", "Smoking", "Takeouts", "Shopping", "Subscriptions"].includes(item.category)
  );

  if (challengeCategory && challengeCategory.count >= 2) {
    insights.push({
      id: "challenge_suggestion",
      title: "Challenge signal",
      body: `${sentenceCase(categoryLabel(challengeCategory.category))} is repeating this week.`,
      detail: `This is a good moment to start a ${challengeCategory.category} control challenge.`,
      icon: A.challengeTrophy,
      tone: "gold",
    });
  }

  if (!insights.length) {
    return [
      {
        id: "empty_state",
        title: "No clear leak yet",
        body: "Track a few expenses and $BROKE will show what your wallet is trying to tell you.",
        detail: "The app needs real patterns before it can make the uncomfortable part visible.",
        icon: A.help,
        tone: "green",
      },
    ];
  }

  return insights.slice(0, 10);
}


function buildV2IdentityStats(
  expenses: Expense[],
  settings: Settings,
  walletHp: number
): V2IdentityStats {
  const weekExpenses = getLastSevenDaysExpenses(expenses);
  const monthExpenses = getCurrentMonthExpenses(expenses);
  const weeklyLeaks = sumLeakExpenses(weekExpenses);
  const monthlyLeaks = sumLeakExpenses(monthExpenses);

  const weeklyAvailable = Math.max((getTotalIncome(settings) - getFixedCosts(settings)) / 4.35, 1);
  const weeklySurvivalScore = clamp(
    100 - Math.round((weeklyLeaks / weeklyAvailable) * 100),
    0,
    100
  );

  const hourlyValue = Math.max(
    getTotalIncome(settings) / Math.max(settings.profile.workHoursPerMonth, 1),
    1
  );
  const lifeHoursLost = weeklyLeaks > 0 ? Math.round((weeklyLeaks / hourlyValue) * 10) / 10 : 0;

  const biggestLeak = getCategoryLeakSummaries(weekExpenses)[0];

  const biggestLeakCategory = biggestLeak?.category ?? "No leak";
  const biggestLeakAmount = biggestLeak?.amount ?? 0;

  const status =
    weeklySurvivalScore >= 90
      ? "Leak Survivor"
      : weeklySurvivalScore >= 75
        ? "Stable Wallet"
        : weeklySurvivalScore >= 55
          ? "Leak Pressure"
          : weeklySurvivalScore >= 35
            ? "Doomspending Alert"
            : "Full $BROKE Mode";

  const statusDetail =
    weeklySurvivalScore >= 90
      ? "You kept the wallet clean this week."
      : weeklySurvivalScore >= 75
        ? "Small leaks exist, but the wallet is holding."
        : weeklySurvivalScore >= 55
          ? "The leaks are visible now. Fix the pattern."
          : weeklySurvivalScore >= 35
            ? "Random spending is starting to become a lifestyle."
            : "The wallet is under pressure. Stop the bleeding.";

  const doomAlertTitle =
    weeklyLeaks <= 0
      ? "No doomspending detected"
      : weeklySurvivalScore < 55
        ? "Doomspending Alert"
        : "Leak detected";

  const doomAlertBody =
    weeklyLeaks <= 0
      ? "No Not needed / Maybe spending was marked this week."
      : biggestLeakAmount > 0
        ? `${categoryLabel(biggestLeakCategory)} drained ${money(
            biggestLeakAmount,
            settings.currency
          )} this week.`
        : `${money(weeklyLeaks, settings.currency)} in weekly leaks detected.`;

  const selfRoast =
    weeklyLeaks <= 0
      ? "Your wallet is quiet. Keep it that way."
      : lifeHoursLost >= 8
        ? `You traded about ${lifeHoursLost} hours of life for leaks this week. That is not a small habit.`
        : biggestLeakAmount > 0
          ? `${categoryLabel(biggestLeakCategory)} is trying to become your lifestyle.`
          : "The leak was already there. Now it is visible.";

  return {
    weeklySurvivalScore,
    biggestLeakCategory,
    biggestLeakAmount,
    weeklyLeaks,
    monthlyLeaks,
    lifeHoursLost,
    status,
    statusDetail,
    doomAlertTitle,
    doomAlertBody,
    selfRoast,
  };
}


function getChartCycleDayCount(settings: Settings) {
  if (settings.profile.incomeStyle === "Daily") return 1;
  if (settings.profile.incomeStyle === "Weekly") return 7;
  if (settings.profile.incomeStyle === "Irregular") return 14;
  return getDaysInCurrentMonth();
}

function getChartDailyLeakBudget(settings: Settings) {
  const freeMoney = Math.max(getTotalIncome(settings) - getFixedCosts(settings), 0);
  return Math.max(freeMoney / Math.max(getChartCycleDayCount(settings), 1), 1);
}

function getChartPressureStatus(
  leakAmount: number,
  trackedAmount: number,
  dailyLeakBudget: number
): ChartPressureStatus {
  if (trackedAmount <= 0) return "quiet";
  if (leakAmount <= 0) return "safe";

  const pressure = (leakAmount / Math.max(dailyLeakBudget, 1)) * 100;

  if (pressure >= 80) return "danger";
  if (pressure >= 35) return "warning";
  return "safe";
}

function getChartPointPressure(leakAmount: number, dailyLeakBudget: number) {
  return clamp(Math.round((leakAmount / Math.max(dailyLeakBudget, 1)) * 100), 0, 999);
}

function getChartPointClassName(point: ChartPoint) {
  if (point.status === "danger") return "red";
  if (point.status === "warning") return "yellow";
  if (point.status === "quiet") return "quiet";
  return "green";
}

function getChartPointStatusLabel(point: ChartPoint) {
  if (point.status === "quiet") return "Quiet day";
  if (point.status === "danger") return "Danger leak day";
  if (point.status === "warning") return "Warning leak day";
  return "Controlled day";
}

function getCycleStartKey(settings: Settings) {
  const payday = parseDateInputValue(getNextPaydayDate(settings));

  if (payday) {
    const start = new Date(payday);

    if (settings.profile.incomeStyle === "Daily") {
      start.setDate(start.getDate() - 1);
    } else if (settings.profile.incomeStyle === "Weekly") {
      start.setDate(start.getDate() - 7);
    } else if (settings.profile.incomeStyle === "Irregular") {
      start.setDate(start.getDate() - 14);
    } else {
      start.setMonth(start.getMonth() - 1);
    }

    return dayKey(start);
  }

  const now = new Date();
  return dayKey(new Date(now.getFullYear(), now.getMonth(), 1));
}

function getChartDatesForRange(range: ChartRange) {
  const now = new Date();
  const dates: Date[] = [];

  if (range === "day") {
    dates.push(now);
    return dates;
  }

  if (range === "week") {
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  }

  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();

  for (let day = 1; day <= todayDate; day++) {
    dates.push(new Date(year, month, day));
  }

  return dates;
}

function getExpensesForDayKey(expenses: Expense[], key: string) {
  return expenses.filter((expense) => dayKey(new Date(expense.createdAt)) === key);
}

function sumTrackedExpensesByNeedType(expenses: Expense[], needType: NeedType) {
  return sumTrackedExpenses(expenses.filter((expense) => expense.needType === needType));
}

function buildChartPoint(
  date: Date,
  expenses: Expense[],
  runningBalance: number,
  settings: Settings,
  dailyLeakBudget: number,
  cycleStartKey: string,
  label: string
): ChartPoint {
  const key = dayKey(date);
  const dayExpenses = expenses.filter((expense) => dayKey(new Date(expense.createdAt)) === key);
  const spent = sumTrackedExpenses(dayExpenses);
  const leakAmount = sumLeakExpenses(dayExpenses);
  const topLeakCategory = getCategoryLeakSummaries(dayExpenses)[0]?.category || "";
  const open = runningBalance;
  const close = runningBalance - spent;
  const pressure = getChartPointPressure(leakAmount, dailyLeakBudget);
  const status = getChartPressureStatus(leakAmount, spent, dailyLeakBudget);

  return {
    label,
    key,
    spent,
    leakAmount,
    count: dayExpenses.length,
    open,
    close,
    pressure,
    status,
    biggestLeakCategory: topLeakCategory,
    isCycleStart: key === cycleStartKey,
  };
}

function buildChartData(
  range: ChartRange,
  expenses: Expense[],
  settings: Settings
): ChartPoint[] {
  const totalIncome = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);
  const baseBalance = totalIncome - fixedCosts;
  const dailyLeakBudget = getChartDailyLeakBudget(settings);
  const cycleStartKey = getCycleStartKey(settings);
  const dates = getChartDatesForRange(range);
  const firstDateKey = dates.length > 0 ? dayKey(dates[0]) : dayKey(new Date());
  const priorTrackedThisMonth = sumTrackedExpenses(
    getCurrentMonthExpenses(expenses).filter((expense) => dayKey(new Date(expense.createdAt)) < firstDateKey)
  );
  let runningBalance = baseBalance - priorTrackedThisMonth;

  return dates.map((date) => {
    const label =
      range === "day"
        ? "Today"
        : range === "week"
          ? date.toLocaleDateString("en-US", { weekday: "short" })
          : String(date.getDate());

    const point = buildChartPoint(
      date,
      expenses,
      runningBalance,
      settings,
      dailyLeakBudget,
      cycleStartKey,
      label
    );

    runningBalance = point.close;
    return point;
  });
}

async function callBrokeApi(
  initData: string,
  action: string,
  payload: Record<string, unknown> = {}
): Promise<BrokeApiResponse> {
  const response = await fetch("/api/broke", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      initData,
      ...payload,
    }),
  });

  const text = await response.text();
  let data: BrokeApiResponse;

  try {
    data = JSON.parse(text) as BrokeApiResponse;
  } catch {
    const shortText = text.slice(0, 80).replace(/\s+/g, " ");
    throw new Error(
      `API /api/broke returned non-JSON. Check app/api/broke/route.ts. Response: ${shortText}`
    );
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Cloud sync failed");
  }

  return data;
}

async function callCurrencyRepairApi(
  initData: string,
  currency: Currency,
  repairScope: CurrencyRepairScope,
  payload: Record<string, unknown> = {}
): Promise<{ ok: boolean; expensesUpdated?: number; settingsSynced?: boolean; appStateSynced?: boolean; error?: string }> {
  const response = await fetch("/api/currency-repair", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      initData,
      currency,
      repairScope,
      ...payload,
    }),
  });

  const text = await response.text();
  let data: { ok: boolean; expensesUpdated?: number; settingsSynced?: boolean; appStateSynced?: boolean; error?: string };

  try {
    data = JSON.parse(text) as { ok: boolean; expensesUpdated?: number; settingsSynced?: boolean; appStateSynced?: boolean; error?: string };
  } catch {
    const shortText = text.slice(0, 80).replace(/\s+/g, " ");
    throw new Error(
      `API /api/currency-repair returned non-JSON. Check app/api/currency-repair/route.ts. Response: ${shortText}`
    );
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Currency repair failed");
  }

  return data;
}


export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [telegram, setTelegram] = useState<TelegramState>(emptyTelegramState);
  const [webAuth, setWebAuth] = useState<WebAuthState>({
    authenticated: false,
    loading: true,
    user: null,
  });
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("local");
  const [cloudError, setCloudError] = useState("");
  const [streak, setStreak] = useState<Streak>(emptyStreak);
  const [challengeTemplates, setChallengeTemplates] = useState<ChallengeTemplate[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<UserChallenge | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<ChallengeProgress | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [badges, setBadges] = useState<BadgeItem[]>(defaultBadges);
  const [leaderboard, setLeaderboard] = useState<LeaderboardState | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [patternHistory, setPatternHistory] = useState<PatternHistoryRecord[]>([]);
  const [toast, setToast] = useState<AppToast | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [leakMission, setLeakMission] = useState<LocalLeakMission | null>(null);
  const [activeStreakProof, setActiveStreakProof] = useState<ActiveStreakProofState>(() => readActiveStreakProofState());
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>("standard");

  const openAppTrackedRef = useRef(false);
  const badgesReadyRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);
  const appStateSyncTimerRef = useRef<number | null>(null);
  const patternHistorySyncTimerRef = useRef<number | null>(null);
  const patternHistorySignatureRef = useRef("");

  const [amount, setAmount] = useState("25.00");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Coffee");
  const [expenseType, setExpenseType] = useState<NeedType>("Needed");
  const [necessaryAmount, setNecessaryAmount] = useState("");
  const [selectedLeakTriggers, setSelectedLeakTriggers] = useState<LeakTriggerId[]>([]);
  const [lastTrackedExpense, setLastTrackedExpense] = useState<Expense | null>(null);
  const [leakReflection, setLeakReflection] = useState<LeakReflection | null>(null);

  useEffect(() => {
    try {
      const isEmbedded = window.self !== window.top;
      document.documentElement.classList.toggle("embedded-app-view", isEmbedded);

      return () => {
        document.documentElement.classList.remove("embedded-app-view");
      };
    } catch {
      document.documentElement.classList.add("embedded-app-view");

      return () => {
        document.documentElement.classList.remove("embedded-app-view");
      };
    }
  }, []);

  const cloudInitData = telegram.isTelegram ? telegram.initData : "";
  const cloudAuthReady = Boolean(
    (telegram.isTelegram && telegram.initData) || webAuth.authenticated
  );

  function showToast(title: string, detail = "", tone: AppToast["tone"] = "info") {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast({
      id: Date.now(),
      title,
      detail,
      tone,
    });

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2400);
  }

  function applyBadges(nextBadges: BadgeItem[], silent = false) {
    const newlyUnlocked =
      !silent && badgesReadyRef.current
        ? nextBadges.find((badge) => {
            const previous = badges.find((item) => item.id === badge.id);
            return badge.earned && !previous?.earned;
          })
        : null;

    setBadges(nextBadges);
    badgesReadyRef.current = true;

    if (newlyUnlocked) {
      showToast("Badge unlocked", newlyUnlocked.title, "badge");
    }
  }

  function applyApiFeedback(data: BrokeApiResponse, context = "$BROKE Score updated") {
    if (data.leaderboard) setLeaderboard(data.leaderboard);
    if (data.badges) applyBadges(data.badges);

    if (data.xpAwarded && data.xpAwarded > 0) {
      showToast(`+${data.xpAwarded} XP`, context, "xp");
    }
  }


  function queueCloudAppStateSync() {
    if (!loaded || cloudStatus !== "cloud" || !cloudAuthReady) return;

    if (appStateSyncTimerRef.current) {
      window.clearTimeout(appStateSyncTimerRef.current);
    }

    appStateSyncTimerRef.current = window.setTimeout(async () => {
      try {
        const data = await callBrokeApi(cloudInitData, "saveAppState", {
          appState: readLocalCloudAppState(),
        });

        if (data.appState) {
          writeLocalCloudAppState(data.appState);
        }
      } catch (error) {
        setCloudStatus("error");
        setCloudError(error instanceof Error ? error.message : "App state cloud save failed");
      }
    }, 800);
  }

  useEffect(() => {
    function syncLocalAppStateChange() {
      queueCloudAppStateSync();
    }

    window.addEventListener(LOCAL_APP_STATE_CHANGE_EVENT, syncLocalAppStateChange);

    return () => {
      window.removeEventListener(LOCAL_APP_STATE_CHANGE_EVENT, syncLocalAppStateChange);
    };
  }, [loaded, cloudStatus, cloudAuthReady, cloudInitData]);

  useEffect(() => {
    if (!loaded) return;

    function refreshActiveStreakProof() {
      setActiveStreakProof(readActiveStreakProofState());
    }

    refreshActiveStreakProof();
    window.addEventListener(LOCAL_APP_STATE_CHANGE_EVENT, refreshActiveStreakProof);
    window.addEventListener(CLOUD_APP_STATE_SYNC_EVENT, refreshActiveStreakProof);

    return () => {
      window.removeEventListener(LOCAL_APP_STATE_CHANGE_EVENT, refreshActiveStreakProof);
      window.removeEventListener(CLOUD_APP_STATE_SYNC_EVENT, refreshActiveStreakProof);
    };
  }, [loaded]);

  useEffect(() => {
    function applyTelegramWebApp() {
      const webApp = getTelegramWebApp();

      if (!webApp) {
        setTelegram(emptyTelegramState);
        return;
      }

      try {
        webApp.ready?.();
        webApp.expand?.();
        webApp.setHeaderColor?.("#050806");
        webApp.setBackgroundColor?.("#050806");
      } catch {
        // Telegram methods are optional outside Telegram.
      }

      setTelegram(readTelegramState());
    }

    if (getTelegramWebApp()) {
      applyTelegramWebApp();
      return;
    }

    const existingScript = document.getElementById("telegram-web-app-script");

    if (existingScript) {
      existingScript.addEventListener("load", applyTelegramWebApp);
      window.setTimeout(applyTelegramWebApp, 600);
      return () => {
        existingScript.removeEventListener("load", applyTelegramWebApp);
      };
    }

    const script = document.createElement("script");
    script.id = "telegram-web-app-script";
    script.src = TELEGRAM_WEB_APP_SCRIPT;
    script.async = true;
    script.onload = applyTelegramWebApp;
    document.head.appendChild(script);

    const fallback = window.setTimeout(applyTelegramWebApp, 900);

    return () => {
      window.clearTimeout(fallback);
      script.onload = null;
    };
  }, []);

  useEffect(() => {
    function handleAppNotify(event: Event) {
      const detail = (event as CustomEvent<{
        title?: string;
        detail?: string;
        tone?: AppToast["tone"];
      }>).detail;

      if (!detail?.title) return;

      showToast(detail.title, detail.detail ?? "", detail.tone ?? "info");
    }

    window.addEventListener(APP_NOTIFY_EVENT, handleAppNotify);

    return () => {
      window.removeEventListener(APP_NOTIFY_EVENT, handleAppNotify);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      if (appStateSyncTimerRef.current) {
        window.clearTimeout(appStateSyncTimerRef.current);
      }

      if (patternHistorySyncTimerRef.current) {
        window.clearTimeout(patternHistorySyncTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw) as {
          settings?: Settings;
          expenses?: Expense[];
          onboardingCompleted?: boolean;
          appMode?: AppMode;
        };

        if (parsed.settings) {
          setSettings(normalizeSettings(parsed.settings));
        }

        if (Array.isArray(parsed.expenses)) {
          setExpenses(parsed.expenses.map(normalizeExpense));
        }

        if (parsed.onboardingCompleted === true) {
          setOnboardingCompleted(true);
        }

        if (parsed.appMode) {
          setAppMode(normalizeAppMode(parsed.appMode));
        }
      }

      if (localStorage.getItem(ONBOARDING_KEY) === "true") {
        setOnboardingCompleted(true);
      }

      setAppMode(readAppMode());
      setLeakMission(readLocalLeakMission());
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || telegram.isTelegram) return;

    let cancelled = false;

    async function loadWebAuth() {
      try {
        const response = await fetch("/api/auth/telegram/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json();

        if (cancelled) return;

        setWebAuth({
          authenticated: Boolean(data.authenticated),
          loading: false,
          user: data.user ?? null,
        });
      } catch {
        if (cancelled) return;

        setWebAuth({
          authenticated: false,
          loading: false,
          user: null,
        });
      }
    }

    loadWebAuth();

    return () => {
      cancelled = true;
    };
  }, [loaded, telegram.isTelegram]);

  useEffect(() => {
    if (!loaded || !cloudAuthReady) return;

    let cancelled = false;

    async function syncCloudData() {
      try {
        setCloudStatus("syncing");
        setCloudError("");

        const data = await callBrokeApi(cloudInitData, "sync", {
          localData: {
            settings,
            expenses,
            appState: readLocalCloudAppState(),
          },
        });

        if (cancelled) return;

        if (data.settings) setSettings(normalizeSettings(data.settings));
        if (data.expenses) {
          const cloudExpenses = data.expenses.map(normalizeExpense);
          setExpenses((prev) => mergeExpensesForSync(prev, cloudExpenses));
        }
        if (data.streak) setStreak(data.streak);
        if (data.challengeTemplates) setChallengeTemplates(data.challengeTemplates);
        if ("activeChallenge" in data) setActiveChallenge(data.activeChallenge ?? null);
        if ("challengeProgress" in data) setChallengeProgress(data.challengeProgress ?? null);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.badges) applyBadges(data.badges, true);
        if (data.appState) writeLocalCloudAppState(data.appState);
        if (data.patternHistory) setPatternHistory(data.patternHistory);

        const cloudOnboardingCompleted =
          data.settings?.onboardingCompleted === true ||
          Boolean(data.expenses && data.expenses.length > 0);

        if (cloudOnboardingCompleted) {
          setOnboardingCompleted(true);
          localStorage.setItem(ONBOARDING_KEY, "true");
        }

        setCloudStatus("cloud");
      } catch (error) {
        if (cancelled) return;

        setCloudStatus("error");
        setCloudError(error instanceof Error ? error.message : "Cloud sync failed");
      }
    }

    syncCloudData();

    return () => {
      cancelled = true;
    };
  }, [loaded, cloudAuthReady, cloudInitData]);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings,
        expenses,
        onboardingCompleted,
        appMode,
      })
    );
    writeAppMode(appMode, false);
  }, [loaded, settings, expenses, onboardingCompleted, appMode]);

  useEffect(() => {
    if (!loaded || appMode !== "standard" || isStandardModeTab(activeTab)) return;
    setActiveTab("home");
  }, [loaded, appMode, activeTab]);

  useEffect(() => {
    if (!loaded || cloudStatus !== "cloud" || !cloudAuthReady) return;

    const timeout = window.setTimeout(async () => {
      try {
        const data = await callBrokeApi(cloudInitData, "saveSettings", {
          settings,
        });
        applyApiFeedback(data, "Settings synced");
      } catch (error) {
        setCloudStatus("error");
        setCloudError(error instanceof Error ? error.message : "Settings cloud save failed");
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [loaded, cloudStatus, cloudAuthReady, cloudInitData, settings]);

  useEffect(() => {
    if (
      !loaded ||
      !onboardingCompleted ||
      !cloudAuthReady ||
      cloudStatus !== "cloud" ||
      openAppTrackedRef.current
    ) {
      return;
    }

    openAppTrackedRef.current = true;
    trackXpAction("open_app");
  }, [loaded, onboardingCompleted, cloudAuthReady, cloudStatus]);

  useEffect(() => {
    if (
      !loaded ||
      !onboardingCompleted ||
      !cloudAuthReady ||
      cloudStatus !== "cloud"
    ) {
      return;
    }

    if (activeTab === "chart") {
      trackXpAction("open_chart");
    }

    if (activeTab === "whatif") {
      trackXpAction("check_challenge");
    }
  }, [activeTab, loaded, onboardingCompleted, cloudAuthReady, cloudStatus]);

  const expenseCurrencySources = useMemo(
    () => expenses.map((expense) => expense.currency),
    [expenses]
  );
  const settingsCurrencySources = useMemo(
    () => getSettingsMoneySources(settings),
    [settings]
  );
  const appCurrencySources = useMemo(
    () => [...expenseCurrencySources, ...settingsCurrencySources],
    [expenseCurrencySources, settingsCurrencySources]
  );
  const appRateState = useExchangeRates(settings, appCurrencySources);
  const displayExpenses = useMemo(
    () => expenses.map((expense) => expenseToDisplayExpense(expense, settings, appRateState.rates)),
    [expenses, settings, appRateState.rates]
  );

  const currentWeeklyPatternSummary = useMemo(
    () => buildWeeklyPatternSummary(displayExpenses, settings),
    [displayExpenses, settings]
  );
  const currentPatternHistoryRecord = useMemo(
    () => buildPatternHistoryRecord(currentWeeklyPatternSummary),
    [currentWeeklyPatternSummary]
  );

  useEffect(() => {
    if (!loaded || !onboardingCompleted || cloudStatus !== "cloud" || !cloudAuthReady) return;
    if (!shouldSavePatternHistory(currentPatternHistoryRecord)) return;

    const signature = patternHistorySignature(currentPatternHistoryRecord);

    if (patternHistorySignatureRef.current === signature) return;

    if (patternHistorySyncTimerRef.current) {
      window.clearTimeout(patternHistorySyncTimerRef.current);
    }

    patternHistorySyncTimerRef.current = window.setTimeout(async () => {
      try {
        const data = await callBrokeApi(cloudInitData, "savePatternHistory", {
          pattern: currentPatternHistoryRecord,
        });

        patternHistorySignatureRef.current = signature;

        if (data.patternHistory) {
          setPatternHistory(data.patternHistory);
        }
      } catch (error) {
        setCloudStatus("error");
        setCloudError(error instanceof Error ? error.message : "Pattern history cloud save failed");
      }
    }, 1200);

    return () => {
      if (patternHistorySyncTimerRef.current) {
        window.clearTimeout(patternHistorySyncTimerRef.current);
      }
    };
  }, [loaded, onboardingCompleted, cloudStatus, cloudAuthReady, cloudInitData, currentPatternHistoryRecord]);

  const displaySettings = useMemo(
    () => displaySettingsForMoney(settings, appRateState.rates),
    [settings, appRateState.rates]
  );
  const walletSummary = useMemo(() => {
    return buildWalletSummary(displaySettings, displayExpenses);
  }, [displaySettings, displayExpenses]);
  const currentMonthExpenses = walletSummary.currentMonthExpenses;
  const totalIncome = walletSummary.totalIncome;
  const fixedCosts = walletSummary.fixedCosts;
  const spentThisMonth = walletSummary.spentThisMonth;
  const totalLeaks = walletSummary.totalLeaks;
  const realBalance = walletSummary.realBalance;
  const walletHp = walletSummary.walletHp;

  const todaySpent = useMemo(() => {
    const today = dayKey(new Date());

    return sumTrackedExpenses(
      displayExpenses.filter((e) => dayKey(new Date(e.createdAt)) === today)
    );
  }, [displayExpenses]);

  const chartDays = useMemo(() => {
    return buildChartData("week", displayExpenses, displaySettings);
  }, [displayExpenses, displaySettings]);

  const localStreak = useMemo(() => {
    return calculateStreakFromExpenses(expenses);
  }, [expenses]);

  const activeStreak = cloudAuthReady && cloudStatus === "cloud"
    ? mergeStreaksForDisplay(streak, localStreak)
    : localStreak;

  const activeProofStatus = useMemo(() => {
    return buildActiveStreakProofStatus(activeStreakProof);
  }, [activeStreakProof]);

  const smartInsightContext = useMemo<SmartInsightContext>(() => {
    const debtRadarItems = readDebtRadarItems();
    const debtRadarTotals = getDebtRadarTotals(debtRadarItems, displaySettings, appRateState.rates);
    const growthPlanner = readGrowthPlannerState();
    const oldExpenseCurrencyMissingCount = expenses.filter((expense) => !expense.currency).length;

    return {
      debtRadarTotals,
      growthPlanner,
      exchangeRates: appRateState.rates,
      oldExpenseCurrencyMissingCount,
    };
  }, [activeTab, displaySettings, appRateState.rates, expenses]);

  const walletInsights = useMemo(() => {
    return buildWalletInsights(displayExpenses, displaySettings, smartInsightContext);
  }, [displayExpenses, displaySettings, smartInsightContext]);

  async function addExpense() {
    const value = safeNumber(amount);

    if (value <= 0) return;

    const noteWithTriggers = buildNoteWithLeakTriggers(note, selectedLeakTriggers);
    const necessaryInput = necessaryAmount.trim();
    const normalizedNecessaryAmount = expenseType !== "Needed" && necessaryInput
      ? clamp(safeNumber(necessaryInput), 0, value)
      : null;
    const normalizedAvoidableLeakAmount = normalizedNecessaryAmount !== null
      ? clamp(value - normalizedNecessaryAmount, 0, value)
      : null;

    const expense: Expense = {
      id: uid(),
      amount: value,
      category: selectedCategory,
      needType: expenseType,
      note: noteWithTriggers,
      createdAt: new Date().toISOString(),
      triggerTags: normalizeLeakTriggerTags(selectedLeakTriggers),
      ...(normalizedNecessaryAmount !== null
        ? { necessaryAmount: normalizedNecessaryAmount, avoidableLeakAmount: normalizedAvoidableLeakAmount ?? 0 }
        : {}),
      currency: settings.currency,
    };

    const nextExpenses = [expense, ...expenses];

    triggerHaptic("success");
    setExpenses((prev) => [expense, ...prev]);
    setLastTrackedExpense(expense);
    setLeakReflection(buildLeakReflection(expense, nextExpenses, settings));
    setAmount("");
    setNote("");
    setNecessaryAmount("");
    setSelectedLeakTriggers([]);
    setExpenseType("Needed");
    setActiveTab("add");

    if (cloudAuthReady) {
      try {
        const data = await callBrokeApi(cloudInitData, "addExpense", {
          expense,
        });

        if (data.expense) {
          setExpenses((prev) =>
            prev.map((item) =>
              item.id === expense.id
                ? { ...data.expense!, necessaryAmount: expense.necessaryAmount, avoidableLeakAmount: expense.avoidableLeakAmount }
                : item
            )
          );
          if (data.streak) setStreak(data.streak);
          if ("activeChallenge" in data) setActiveChallenge(data.activeChallenge ?? null);
          if ("challengeProgress" in data) setChallengeProgress(data.challengeProgress ?? null);
          applyApiFeedback(data, "Expense tracked");
          setCloudStatus("cloud");
        }
      } catch (error) {
        setCloudStatus("error");
        setCloudError(error instanceof Error ? error.message : "Expense cloud save failed");
      }
    }
  }

  async function addQuickExpense(category: string, value: number, needType: NeedType = "Not needed") {
    if (value <= 0) return;

    const expense: Expense = {
      id: uid(),
      amount: value,
      category,
      needType,
      note: "First leak",
      createdAt: new Date().toISOString(),
      triggerTags: [],
      currency: settings.currency,
    };

    const nextExpenses = [expense, ...expenses];

    triggerHaptic("success");
    setExpenses((prev) => [expense, ...prev]);
    setLastTrackedExpense(expense);
    setLeakReflection(buildLeakReflection(expense, nextExpenses, settings));
    setAmount("");
    setNote("");
    setSelectedLeakTriggers([]);
    setSelectedCategory(category);
    setExpenseType(needType);
    setActiveTab("home");

    if (cloudAuthReady) {
      try {
        const data = await callBrokeApi(cloudInitData, "addExpense", {
          expense,
        });

        if (data.expense) {
          setExpenses((prev) =>
            prev.map((item) => (item.id === expense.id ? data.expense! : item))
          );
          if (data.streak) setStreak(data.streak);
          if ("activeChallenge" in data) setActiveChallenge(data.activeChallenge ?? null);
          if ("challengeProgress" in data) setChallengeProgress(data.challengeProgress ?? null);
          applyApiFeedback(data, "First leak tracked");
          setCloudStatus("cloud");
        }
      } catch (error) {
        setCloudStatus("error");
        setCloudError(error instanceof Error ? error.message : "First leak cloud save failed");
      }
    }
  }

  async function repairOldCurrencyData(currency: Currency, repairScope: CurrencyRepairScope = "missing"): Promise<CurrencyRepairResult> {
    const repairCurrency = normalizeCurrency(currency, settings.currency);
    const shouldRepairExpense = (expense: Expense) => repairScope === "all" || !expense.currency;
    const expensesUpdated = expenses.filter(shouldRepairExpense).length;
    const incomeFieldsUpdated = incomeKeys.filter((key) => settings.income[key] > 0).length;
    const fixedCostFieldsUpdated = fixedCostKeys.filter((key) => settings.fixedCosts[key] > 0).length;
    const repairedAppState = repairLocalAppStateCurrency(repairCurrency, repairScope);
    const nextSettings: Settings = {
      ...settings,
      incomeCurrencies: currencyMapForKeys(incomeKeys, repairCurrency),
      fixedCostCurrencies: currencyMapForKeys(fixedCostKeys, repairCurrency),
    };

    triggerHaptic("medium");
    setSettings(nextSettings);
    setExpenses((prev) =>
      prev.map((expense) =>
        shouldRepairExpense(expense)
          ? {
              ...expense,
              currency: repairCurrency,
            }
          : expense
      )
    );

    let cloudExpenseSync = false;
    let cloudAppStateSync = false;
    let serverExpenseRepair = false;

    if (cloudAuthReady) {
      try {
        const repairPayload = {
          currency: repairCurrency,
          repairScope,
          settings: nextSettings,
          appState: readLocalCloudAppState(),
        };

        const repairData = await callCurrencyRepairApi(
          cloudInitData,
          repairCurrency,
          repairScope,
          repairPayload
        );

        serverExpenseRepair = true;
        cloudExpenseSync = Number(repairData.expensesUpdated || 0) >= 0;
        cloudAppStateSync = Boolean(repairData.appStateSynced);
        setCloudStatus("cloud");
        showToast("Currency repair synced", `${repairCurrency} metadata was applied without changing amounts.`, "info");
      } catch (repairError) {
        try {
          const data = await callBrokeApi(cloudInitData, "repairOldCurrency", {
            currency: repairCurrency,
            repairScope,
            settings: nextSettings,
            appState: readLocalCloudAppState(),
          });

          if (data.settings) setSettings(normalizeSettings(data.settings));
          if (data.expenses) setExpenses(data.expenses.map(normalizeExpense));
          if (data.appState) writeLocalCloudAppState(data.appState);
          applyApiFeedback(data, "Currency repair synced");
          setCloudStatus("cloud");
          cloudExpenseSync = Boolean(data.expenseCurrencyRepair?.cloudExpenseSync);
          cloudAppStateSync = Boolean(data.appStateCloudSync);
        } catch (fallbackError) {
          setCloudStatus("error");
          setCloudError(
            fallbackError instanceof Error
              ? fallbackError.message
              : repairError instanceof Error
                ? repairError.message
                : "Currency repair cloud save failed"
          );
        }
      }
    }

    return {
      expensesUpdated,
      incomeFieldsUpdated,
      fixedCostFieldsUpdated,
      growthTargetsUpdated: repairedAppState.growthTargetsUpdated,
      debtItemsUpdated: repairedAppState.debtItemsUpdated,
      cloudExpenseSync,
      cloudAppStateSync,
      serverExpenseRepair,
      repairScope,
    };
  }

  async function deleteExpense(id: string) {
    triggerHaptic("medium");
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));

    if (cloudAuthReady) {
      try {
        const data = await callBrokeApi(cloudInitData, "deleteExpense", { id });
        if (data.streak) setStreak(data.streak);
        if ("activeChallenge" in data) setActiveChallenge(data.activeChallenge ?? null);
        if ("challengeProgress" in data) setChallengeProgress(data.challengeProgress ?? null);
        applyApiFeedback(data, "Record updated");
        setCloudStatus("cloud");
      } catch (error) {
        setCloudStatus("error");
        setCloudError(error instanceof Error ? error.message : "Expense cloud delete failed");
      }
    }
  }

  async function resetData() {
    const ok = window.confirm("Delete all $BROKE Life Tracker data?");
    if (!ok) return;

    triggerHaptic("error");
    setSettings(defaultSettings);
    setExpenses([]);
    localStorage.removeItem(STORAGE_KEY);
    setActiveTab("home");

    if (cloudAuthReady) {
      try {
        const data = await callBrokeApi(cloudInitData, "reset");
        setStreak(data.streak ?? emptyStreak);
        setActiveChallenge(data.activeChallenge ?? null);
        setChallengeProgress(data.challengeProgress ?? null);
        if (data.badges) applyBadges(data.badges, true);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        setCloudStatus("cloud");
      } catch (error) {
        setCloudStatus("error");
        setCloudError(error instanceof Error ? error.message : "Cloud reset failed");
      }
    }
  }

  function goHome() {
    setActiveTab("home");
  }

  function openProjectTelegram() {
    openTelegramUrl(PROJECT_TG_URL);
  }

  function openHelp() {
    triggerHaptic("light");
    setHelpOpen(true);
  }

  function openExportHelp() {
    triggerHaptic("light");
    setHelpOpen(true);
  }

  function completeOnboarding(
    nextSettings: Settings,
    targetTab: Tab = "home",
    starterExpense?: OnboardingStarterExpense
  ) {
    triggerHaptic("success");

    const completedSettings: Settings = {
      ...nextSettings,
      onboardingCompleted: true,
    };

    setSettings(completedSettings);
    setOnboardingCompleted(true);
    localStorage.setItem(ONBOARDING_KEY, "true");

    if (starterExpense) {
      setSelectedCategory(starterExpense.category);
      setAmount(String(starterExpense.amount));
      setExpenseType(starterExpense.needType);
      setNote(starterExpense.note);
    }

    setActiveTab(targetTab);

    if (cloudAuthReady) {
      callBrokeApi(cloudInitData, "saveSettings", {
        settings: completedSettings,
      }).catch(() => {
        // Normal debounce save will try again after state updates.
      });
    }
  }

  async function startChallenge(challengeId: string) {
    triggerHaptic("medium");

    if (!cloudAuthReady) {
      notifyApp("Connect Telegram", "Sync your account first, then start challenges.");
      return;
    }

    try {
      setChallengeLoading(true);
      const data = await callBrokeApi(cloudInitData, "startChallenge", {
        challengeId,
      });

      if (data.challengeTemplates) setChallengeTemplates(data.challengeTemplates);
      setActiveChallenge(data.activeChallenge ?? null);
      setChallengeProgress(data.challengeProgress ?? null);
      applyApiFeedback(data, "Challenge started");
      setCloudStatus("cloud");
    } catch (error) {
      setCloudStatus("error");
      setCloudError(error instanceof Error ? error.message : "Challenge failed");
    } finally {
      setChallengeLoading(false);
    }
  }

  function startLocalLeakMission(category: string, baselineWeekly: number) {
    if (!category || category === "No leak") {
      showToast("Track a leak first", "Add one Not needed or Maybe expense.", "info");
      setActiveTab("add");
      return;
    }

    const mission = createLocalLeakMission(category, baselineWeekly);
    writeLocalLeakMission(mission);
    setLeakMission(mission);
    triggerHaptic("success");
    showToast("Mission started", `3-day anti-${categoryLabel(category)} challenge`, "xp");
  }

  function resetLocalLeakMission() {
    writeLocalLeakMission(null);
    setLeakMission(null);
    triggerHaptic("light");
    showToast("Mission cleared", "You can start a new anti-leak mission.", "info");
  }

  async function trackXpAction(
    xpAction: XpAction,
    context = "$BROKE Score updated"
  ) {
    if (!cloudAuthReady) return null;

    try {
      const data = await callBrokeApi(cloudInitData, "trackXp", {
        xpAction,
      });

      applyApiFeedback(data, context);
      return data;
    } catch {
      // XP tracking must never block the app.
      return null;
    }
  }

  function recordActiveStreakProof(action: ActiveStreakProofAction, showFeedback = true) {
    const beforeStatus = buildActiveStreakProofStatus(readActiveStreakProofState());
    const nextState = markActiveStreakProofAction(action);
    const nextStatus = buildActiveStreakProofStatus(nextState);

    setActiveStreakProof(nextState);

    if (showFeedback) {
      const justReachedEligibility = !beforeStatus.eligible && nextStatus.eligible;
      const recovered = Boolean(nextStatus.recoveryMissedDate && nextStatus.recoveryActionsNeeded === 0);
      const title = justReachedEligibility
        ? "7-day streak reached"
        : recovered
          ? "Streak recovered"
          : nextStatus.eligible
            ? "Active streak protected"
            : "Active proof saved";
      const detail = justReachedEligibility
        ? "Future Holder Reward eligibility foundation is live. Keep checking in daily."
        : recovered
          ? "Recovery used. Your active streak stays alive."
          : nextStatus.activeToday
            ? "Today is protected. Reminder state updated in Rewards."
            : `${nextStatus.currentStreak}/${ACTIVE_STREAK_ELIGIBILITY_DAYS} days toward Holder Reward eligibility.`;

      showToast(title, detail, nextStatus.eligible || justReachedEligibility ? "xp" : "info");
    }

    return nextState;
  }

  function markCleanDayProof() {
    triggerHaptic("light");
    notifyApp("Daily Routine required", "Active Streak is protected only after the full 7/7 Daily Routine is complete.", "info");
  }

  function completeOneFixProof() {
    triggerHaptic("light");
    notifyApp("Daily Routine required", "One Fix remains useful, but the Active Streak is counted only by full Daily Routine completion.", "info");
    setActiveTab("chart");
  }

  async function completeDailyRoutineStreakProof() {
    const today = dayKey(new Date());
    const currentStatus = buildActiveStreakProofStatus(readActiveStreakProofState());
    const alreadyLogged = currentStatus.todayActions.includes("daily_routine");

    if (!alreadyLogged) {
      recordActiveStreakProof("daily_routine");
    }

    writeDailyRoutineReward(today, true);
    return true;
  }

  async function toggleLeaderboardPublic(nextValue: boolean) {
    if (!cloudAuthReady) {
      notifyApp("Connect Telegram", "Public leaderboard needs cloud sync first.");
      return;
    }

    try {
      setLeaderboardLoading(true);
      const data = await callBrokeApi(cloudInitData, "setLeaderboardOptIn", {
        publicLeaderboard: nextValue,
      });

      if (data.leaderboard) setLeaderboard(data.leaderboard);
      showToast(nextValue ? "Leaderboard joined" : "Private mode", nextValue ? "Your public progress is visible." : "You are hidden from public ranking.", "info");
      setCloudStatus("cloud");
    } catch (error) {
      setCloudStatus("error");
      setCloudError(error instanceof Error ? error.message : "Leaderboard update failed");
    } finally {
      setLeaderboardLoading(false);
    }
  }

  const summary = {
    totalIncome,
    fixedCosts,
    spentThisMonth,
    totalLeaks,
    realBalance,
    walletHp,
    todaySpent,
    streak: activeStreak,
  };

  return (
    <main className="app-shell app-shell-with-community">
      <section className="phone">
        <LanguageRuntime language={settings.language} />

        {!loaded && (
          <div className="screen loading-screen">
            <Header title="$BROKE Life Tracker" />
            <div className="loading-card">
              <img src={A.walletMascot} alt="" />
              <strong>Loading tracker...</strong>
              <span>Checking your wallet leaks.</span>
            </div>
          </div>
        )}

        {loaded && telegram.isTelegram && cloudStatus === "syncing" && !onboardingCompleted && (
          <div className="screen loading-screen">
            <Header title="$BROKE Life Tracker" />
            <div className="loading-card">
              <img src={A.walletMascot} alt="" />
              <strong>Syncing cloud progress...</strong>
              <span>Checking your Telegram profile before setup.</span>
            </div>
          </div>
        )}

        {loaded && !(telegram.isTelegram && cloudStatus === "syncing") && !onboardingCompleted && (
          <OnboardingScreen
            settings={settings}
            telegram={telegram}
            onComplete={completeOnboarding}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "home" && (
          <DashboardScreen
            settings={displaySettings}
            exchangeRates={appRateState.rates}
            summary={summary}
            badges={badges}
            walletInsights={walletInsights}
            chartDays={chartDays}
            weeklyPatternSummary={currentWeeklyPatternSummary}
            patternHistory={patternHistory}
            leaderboard={leaderboard}
            expenses={currentMonthExpenses.slice(0, 6)}
            routineExpenses={currentMonthExpenses}
            allExpenses={displayExpenses}
            leakMission={leakMission}
            activeProofStatus={activeProofStatus}
            onMarkCleanDay={markCleanDayProof}
            onCompleteOneFix={completeOneFixProof}
            onStartLeakMission={startLocalLeakMission}
            onResetLeakMission={resetLocalLeakMission}
            onDeleteExpense={deleteExpense}
            onQuickLeak={addQuickExpense}
            onOpenAdd={() => setActiveTab("add")}
            onOpenChart={() => {
              markDailyRoutineAction("checkedChart");
              setActiveTab("chart");
            }}
            onOpenSurvival={() => setActiveTab("whatif")}
            telegram={telegram}
            webAuth={webAuth}
            cloudStatus={cloudStatus}
            cloudError={cloudError}
            cloudAuthReady={cloudAuthReady}
            appMode={appMode}
            onToggleAppMode={() => {
              setAppMode((current) => {
                const next = current === "standard" ? "pro" : "standard";
                showToast(`${APP_MODE_LABELS[next].label} Mode`, APP_MODE_LABELS[next].detail, "info");
                return next;
              });
            }}
            onRoutineComplete={completeDailyRoutineStreakProof}
            onBellClick={openHelp}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "add" && (
          <AddExpenseScreen
            settings={settings}
            amount={amount}
            setAmount={setAmount}
            note={note}
            setNote={setNote}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            expenseType={expenseType}
            setExpenseType={setExpenseType}
            necessaryAmount={necessaryAmount}
            setNecessaryAmount={setNecessaryAmount}
            selectedLeakTriggers={selectedLeakTriggers}
            setSelectedLeakTriggers={setSelectedLeakTriggers}
            lastTrackedExpense={lastTrackedExpense}
            onAdd={addExpense}
            onBack={goHome}
            onHelp={openHelp}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "chart" && (
          <ChartScreen
            settings={displaySettings}
            expenses={displayExpenses}
            walletInsights={walletInsights}
            exchangeRates={appRateState.rates}
            patternHistory={patternHistory}
            shareInitData={telegram.isTelegram ? telegram.initData : ""}
            activeStreakProof={activeStreakProof}
            activeProofStatus={activeProofStatus}
            onBack={goHome}
            onExport={openExportHelp}
            onOpenAdd={() => setActiveTab("add")}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "growth" && (
          <GrowthLabScreen
            settings={displaySettings}
            expenses={currentMonthExpenses}
            shareInitData={telegram.isTelegram ? telegram.initData : ""}
            onBack={goHome}
            onHelp={openHelp}
            onOpenAdd={() => setActiveTab("add")}
            onAppStateChange={queueCloudAppStateSync}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "leakscore" && (
          <LeakScoreScreen
            shareInitData={telegram.isTelegram ? telegram.initData : ""}
            onBack={goHome}
            onHelp={openHelp}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "whatif" && (
          <WhatIfScreen
            settings={displaySettings}
            setSettings={setSettings}
            expenses={currentMonthExpenses}
            challengeTemplates={challengeTemplates}
            activeChallenge={activeChallenge}
            challengeProgress={challengeProgress}
            challengeLoading={challengeLoading}
            weeklyPatternSummary={currentWeeklyPatternSummary}
            leaderboard={leaderboard}
            leaderboardLoading={leaderboardLoading}
            shareInitData={telegram.isTelegram ? telegram.initData : ""}
            onToggleLeaderboard={toggleLeaderboardPublic}
            onStartChallenge={startChallenge}
            activeProofStatus={activeProofStatus}
            onMarkCleanDay={markCleanDayProof}
            onCompleteOneFix={completeOneFixProof}
            onDailyChallengeProof={() => {
              setActiveTab("whatif");
            }}
            onBack={goHome}
            onHelp={openHelp}
            onOpenAdd={() => setActiveTab("add")}
            onOpenChart={() => {
              markDailyRoutineAction("checkedChart");
              setActiveTab("chart");
            }}
            onOpenProfile={() => setActiveTab("settings")}
            onAppStateChange={queueCloudAppStateSync}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "settings" && (
          <SettingsScreen
            settings={settings}
            setSettings={setSettings}
            expenses={displayExpenses}
            rawExpenses={expenses}
            currentMonthExpenses={currentMonthExpenses}
            exchangeRateStatus={appRateState.status}
            exchangeRateError={appRateState.error}
            exchangeRates={appRateState.rates}
            conversionSourceCount={getUniqueCurrencies(appCurrencySources, settings.currency).filter((currency) => currency !== settings.currency).length}
            onReset={resetData}
            onDeleteExpense={deleteExpense}
            onRepairOldCurrency={repairOldCurrencyData}
            telegram={telegram}
            webAuth={webAuth}
            cloudStatus={cloudStatus}
            cloudError={cloudError}
            streak={activeStreak}
            activeProofStatus={activeProofStatus}
            badges={badges}
            leaderboard={leaderboard}
            leaderboardLoading={leaderboardLoading}
            onToggleLeaderboard={toggleLeaderboardPublic}
            onBack={goHome}
            onHelp={openHelp}
          />
        )}

        {loaded && onboardingCompleted && (
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} appMode={appMode} />
        )}

        {helpOpen && <HelpGuideModal activeTab={activeTab} onClose={() => setHelpOpen(false)} />}

        {leakReflection && (
          <LeakReflectionPopupView
            reflection={leakReflection}
            onClose={() => setLeakReflection(null)}
            onOpenHistory={() => {
              setLeakReflection(null);
              setActiveTab("chart");
            }}
            onOpenSurvival={() => {
              setLeakReflection(null);
              setActiveTab("whatif");
            }}
          />
        )}

        {toast && <AppToastView toast={toast} />}
      </section>

      {loaded && onboardingCompleted && <CommunityLiveSidebar />}
    </main>
  );
}





function HelpGuideModal({
  activeTab,
  onClose,
}: {
  activeTab: Tab;
  onClose: () => void;
}) {
  const [selectedGuide, setSelectedGuide] = useState<Tab>(activeTab);

  const tabGuides: Record<
    Tab,
    {
      label: string;
      eyebrow: string;
      title: string;
      intro: string;
      icon: string;
      footerTitle: string;
      footerBody: string;
      sections: {
        title: string;
        body: string[];
        icon: string;
      }[];
    }
  > = {
    home: {
      label: "Home",
      eyebrow: "Home Button Guide",
      title: "Home: Daily Command Center",
      intro:
        "Home is the first screen to open every day. It tells you the current wallet condition, what changed today, what needs attention, and which button to press next.",
      icon: "/nav-home.png",
      footerTitle: "Home rule",
      footerBody:
        "Use Home for the daily decision: read the status, follow one suggested action, then leave the deeper analysis for Chart, Rewards, or Growth.",
      sections: [
        {
          title: "Bottom navigation: what every button opens",
          body: [
            "Home opens the main dashboard, Wallet HP, today status, reports, routine, and the next action.",
            "Add opens Track Leak. Press it when money leaves your wallet and you want the app to learn from it.",
            "Chart opens Wallet Pressure Chart and Leak Pattern Lab. Press it when you want to understand why the leak happened.",
            "Growth opens the planning lab. Press it when you want to see what leaked money could cover instead.",
            "Leak opens BROKE Leak Score, an experimental project risk-signal checklist for DYOR discipline.",
            "Rewards opens Survival Mode, leak cuts, challenges, leaderboard, Debt & Bills Radar, and Active Streak proof.",
            "Profile opens Personal Cabinet: identity, wallet proof, Share Studio, privacy, currency, sync, and data settings.",
          ],
          icon: A.navHome,
        },
        {
          title: "Top numbers: Income, Life Cost, Money Leaks, Real Balance",
          body: [
            "Income is the planned money for the current period. It is not public by default.",
            "Life Cost is required spending: rent, bills, transport basics, food basics, education, family support, and similar fixed costs.",
            "Money Leaks is the part of spending marked as Maybe or Not needed. This is where avoidable pressure is visible.",
            "Real Balance is what remains after planned costs and tracked records. Use it as a pressure signal, not as a public flex number.",
            "Tap Profile if these base numbers are wrong and update Money Setup there.",
          ],
          icon: A.walletHp,
        },
        {
          title: "Wallet HP: what the score means",
          body: [
            "Wallet HP is the main health score of the wallet.",
            "High HP means the month is still controlled.",
            "Medium HP means leaks are visible and should be reduced before they become normal.",
            "Low HP means spending pressure is becoming dangerous for the current cycle.",
            "Do not chase 100/100. The goal is to keep the wallet alive by fixing the loudest leak first.",
          ],
          icon: A.walletMascot,
        },
        {
          title: "Today / Week / Month tabs",
          body: [
            "Today shows what happened during the current day.",
            "Recent day chips let you compare today with earlier days without opening the full chart.",
            "Quiet means the day has little or no leak pressure.",
            "A money amount on a day means tracked pressure exists there.",
            "Tap Chart if you need a full candle story and exact pattern explanation.",
          ],
          icon: A.calendar,
        },
        {
          title: "Today’s Wallet Snapshot",
          body: [
            "State after day shows the wallet position after today’s records are applied.",
            "Tracked shows how much was recorded today.",
            "Leak pressure shows the part that damaged Wallet HP.",
            "Use this block to decide whether today was controlled or whether one category needs attention.",
          ],
          icon: A.balance,
        },
        {
          title: "Today’s Focus / Next Best Action",
          body: [
            "This block tells you the next useful button to press.",
            "If there are no records, it usually sends you to Add so the app has real data.",
            "If a pattern exists, it may send you to Chart or Rewards.",
            "If public proof is ready, it may suggest a safe share card.",
            "Follow one action. Do not try to fix the whole app in one session.",
          ],
          icon: A.progressFlame,
        },
        {
          title: "Reports, share cards, and public proof",
          body: [
            "Reports summarize progress without exposing sensitive income by default.",
            "Share cards are for Telegram, X, or community proof.",
            "Use them when you want to show status, streak, Wallet HP, Survival Score, biggest leak, or holder identity.",
            "Private numbers like income, exact balance, payday, and debt details should stay hidden unless the user explicitly enables them.",
          ],
          icon: A.export,
        },
        {
          title: "Daily Routine and streak logic",
          body: [
            "Routine tasks are meant to be real actions, not fake one-click farming.",
            "Open the app, check wallet state, review today, lock one next move, check Chart, check Rewards, and finish the final Share on X step.",
            "Active Streak is protected only after the full 7/7 Daily Routine is complete.",
            "Future reward readiness uses this Daily Routine streak, not separate Rewards button taps.",
          ],
          icon: A.dailyCheck,
        },
      ],
    },
    add: {
      label: "Add",
      eyebrow: "Add Button Guide",
      title: "Add: Track Leak Correctly",
      intro:
        "Add is the data entry screen. Every chart, pattern, challenge, report, growth plan, and share card becomes better when records here are honest.",
      icon: "/nav-add.png",
      footerTitle: "Add rule",
      footerBody:
        "Record the expense as soon as possible, choose the real category, mark the real decision type, then save. Accuracy beats perfection.",
      sections: [
        {
          title: "Amount field",
          body: [
            "Enter the exact amount that left your wallet.",
            "Use the same currency behavior you set in Profile unless you intentionally changed Currency Mode.",
            "Small expenses should still be tracked because repeated small leaks create monthly damage.",
            "If the amount is wrong, fix it before saving. The chart and Wallet HP depend on this value.",
          ],
          icon: A.income,
        },
        {
          title: "Category buttons",
          body: [
            "Choose the category that best describes the expense.",
            "Use Coffee, Smoking, Takeouts, Shopping, Subscriptions, Taxi, Snacks, Gaming, Family, School, or Custom consistently.",
            "Do not split the same habit between random categories. The app needs consistency to find the biggest leak.",
            "Use Profile → Personalization if category names should match your real lifestyle better.",
          ],
          icon: A.categories,
        },
        {
          title: "Needed / Maybe / Not needed buttons",
          body: [
            "Needed means the expense was required. It reduces money but should not be treated as a leak.",
            "Maybe means the expense was questionable. It adds partial leak pressure.",
            "Not needed means the expense was avoidable. It adds full leak pressure.",
            "Be honest here. This button controls Wallet HP, Chart pressure, Rewards scenarios, and Growth calculations.",
          ],
          icon: A.leaks,
        },
        {
          title: "Trigger chips",
          body: [
            "Trigger chips explain why the expense happened.",
            "Stress means pressure or emotion pushed the purchase.",
            "Boredom means the spending filled empty time.",
            "Impulse means the decision was fast and not planned.",
            "After payday means money landed and discipline dropped.",
            "Late night, social pressure, weekend, and habit help Pattern Lab detect timing and behavior loops.",
          ],
          icon: A.progressFlame,
        },
        {
          title: "Note field",
          body: [
            "Use a short note when the context matters.",
            "Good notes are simple: after work, tired, friends pushed it, payday, bored, forgot subscription, late night delivery.",
            "The note does not need to be long. One honest clue is enough.",
            "Old hashtag-style notes still help, but structured trigger chips are cleaner.",
          ],
          icon: A.pencil,
        },
        {
          title: "Save / Track button",
          body: [
            "Press the main save button after amount, category, decision type, and optional triggers are correct.",
            "After saving, Wallet HP updates and the record becomes part of Chart, Rewards, Growth, reports, and streak activity.",
            "If cloud sync is available, the record is also saved to the account.",
            "If cloud sync fails, the app can still keep local data and show a warning.",
          ],
          icon: A.navAdd,
        },
        {
          title: "Recent records / delete action",
          body: [
            "Recent records show what was already tracked.",
            "Use them to catch duplicates or wrong entries.",
            "Delete only records that are truly wrong. Deleting real leaks makes the app less useful.",
            "After delete, totals, Wallet HP, pattern analysis, and reports can change.",
          ],
          icon: A.deleteData,
        },
        {
          title: "When to use Add instead of other screens",
          body: [
            "Use Add when money was spent and the app needs a new record.",
            "Use Chart after the record exists and you want analysis.",
            "Use Rewards when you want to reduce the leak, protect proof, or start a challenge.",
            "Use Growth when you want to redirect the leak into a goal.",
          ],
          icon: A.addFrog,
        },
      ],
    },
    chart: {
      label: "Chart",
      eyebrow: "Chart Button Guide",
      title: "Chart: Read Wallet Pressure",
      intro:
        "Chart explains what happened after records are saved. It turns daily spending into pressure candles, patterns, one fix, weekly review, and monthly history.",
      icon: "/nav-chart.png",
      footerTitle: "Chart rule",
      footerBody:
        "Use Chart after adding records. First read the selected day, then follow One Fix. Open deeper labs only when you need more context.",
      sections: [
        {
          title: "Range buttons",
          body: [
            "Day focuses on the current day.",
            "Week shows the recent rhythm and is best for detecting habits.",
            "Month shows the larger cycle and helps reveal repeated pressure.",
            "Switch ranges when you want to know whether a leak was one-time or becoming normal.",
          ],
          icon: A.calendar,
        },
        {
          title: "Wallet Pressure Chart candles",
          body: [
            "Each candle represents one day of wallet pressure.",
            "The color follows leak pressure, not just balance movement.",
            "Needed spending can lower balance without making the day dangerous.",
            "Maybe and Not needed spending create pressure because they are controllable leaks.",
          ],
          icon: A.chartFrog,
        },
        {
          title: "Tap / click a candle",
          body: [
            "Tap a candle to open that day’s detail card.",
            "The selected day shows tracked amount, leak pressure, state after day, main causes, spending mix, and top events.",
            "Use this when you want to understand one specific bad day.",
            "If a candle looks dangerous, check the top events before blaming the whole month.",
          ],
          icon: A.navChart,
        },
        {
          title: "Main causes and spending mix",
          body: [
            "Main causes show which categories created the most pressure.",
            "Spending mix separates Needed, Maybe, and Not needed spending.",
            "A high Not needed share means the day had clear avoidable leaks.",
            "A high Maybe share means the day had grey-zone decisions worth reviewing.",
          ],
          icon: A.leaks,
        },
        {
          title: "One Fix",
          body: [
            "One Fix gives one practical action instead of a long lecture.",
            "It may suggest cutting a category, avoiding a timing trigger, checking Rewards, or changing tomorrow’s behavior.",
            "Use it when the chart is clear but you do not know what to do next.",
            "One Fix is the fastest route from analysis to action.",
          ],
          icon: A.progressFlame,
        },
        {
          title: "Active Streak Timeline",
          body: [
            "This block shows the last 7 proof days inside Chart.",
            "It explains which days were protected by completed Daily Routine proof.",
            "If the streak is 0, use this timeline to see whether today has proof, yesterday was missed, or recovery is available.",
            "Chart is for history and trust. Use Rewards when you need to protect today.",
          ],
          icon: A.bestStreak,
        },
        {
          title: "Leak Pattern Lab",
          body: [
            "Leak Pattern Lab detects repeated categories, late-night leaks, weekend spikes, payday pressure, and emotion clues.",
            "It uses categories, decision types, trigger chips, notes, and timing.",
            "Open it when the same problem keeps returning.",
            "This is the screen that explains behavior, not only amounts.",
          ],
          icon: A.walletMascot,
        },
        {
          title: "Leak Streaks, Weekly Review, and Monthly History",
          body: [
            "Leak Streaks show repeated control or repeated damage.",
            "Weekly Review summarizes the strongest pattern of the week.",
            "Monthly History helps compare past cycles and find recurring lifestyle leaks.",
            "Use these blocks when daily view is not enough.",
          ],
          icon: A.bestStreak,
        },
        {
          title: "Chart sharing",
          body: [
            "Use share buttons only for safe summaries.",
            "Do not expose exact income, payday, real balance, or debt details in public.",
            "Public chart proof should focus on pattern, pressure, progress, and next move.",
          ],
          icon: A.export,
        },
      ],
    },
    growth: {
      label: "Growth",
      eyebrow: "Growth Button Guide",
      title: "Growth: Redirect Leaks Into Goals",
      intro:
        "Growth shows what could happen if money leaks were redirected into something useful. It is a planner and simulator, not investing, staking, custody, or financial advice.",
      icon: "/nav-growth.png",
      footerTitle: "Growth rule",
      footerBody:
        "Use Growth to turn leak awareness into a target. It does not move funds and does not promise returns.",
      sections: [
        {
          title: "Use detected leaks button",
          body: [
            "This button pulls this month’s Maybe and Not needed spending into Growth.",
            "It creates a realistic redirected amount based on real app records.",
            "Use it before manually entering random goals.",
            "If there are no leaks yet, go to Add first and track real expenses.",
          ],
          icon: GROWTH_PUBLIC_ASSETS.leak,
        },
        {
          title: "Target Coverage cards",
          body: [
            "Target Coverage shows what leaks could cover in real life.",
            "Default examples can include insurance, mortgage or rent, bills, education, debt payment, family support, or emergency fund.",
            "Use 1m to understand monthly coverage.",
            "Use 12m to understand yearly potential.",
          ],
          icon: GROWTH_PUBLIC_ASSETS.lab,
        },
        {
          title: "Personal Goal fields",
          body: [
            "Goal name is the thing the user actually wants: phone upgrade, trip, debt payment, laptop, emergency buffer, or family support.",
            "Goal amount is the target value.",
            "Monthly redirected amount should combine a realistic base saving amount plus leak boost the user can actually reduce.",
            "Currency and USD reference make the goal easier to understand globally.",
          ],
          icon: GROWTH_PUBLIC_ASSETS.trophy,
        },
        {
          title: "Simulation controls",
          body: [
            "Starting amount is the amount already available for the plan.",
            "Contribution is the monthly leak amount the user wants to redirect.",
            "Duration controls how long the simulation runs.",
            "Yearly growth and risk settings are only illustrative. They do not guarantee real results.",
            "Reinvest simulated gains changes the math only inside the planner.",
          ],
          icon: GROWTH_PUBLIC_ASSETS.market,
        },
        {
          title: "Create simulation button",
          body: [
            "Press this after the inputs look realistic.",
            "The app will show projected value, total contribution, estimated gain, and scenario range.",
            "Use the result to understand the cost of leaks, not to make financial promises.",
          ],
          icon: A.navWhatIf,
        },
        {
          title: "Save plan button",
          body: [
            "Save plan stores the simulation for later review.",
            "Use saved plans to compare old goals with current leak behavior.",
            "If the user changes habits, create a new plan instead of pretending the old one is still accurate.",
          ],
          icon: A.dailyCheck,
        },
        {
          title: "Generate / share growth card",
          body: [
            "Generate share card creates a public-friendly goal card.",
            "The card should show the goal and redirected leak idea, not private income or full budget.",
            "If Telegram blocks direct sharing, use Download card, copied text, or long-press the preview.",
          ],
          icon: SHARE_CARD_PUBLIC_ASSETS.growth,
        },
        {
          title: "What Growth is not",
          body: [
            "It is not staking.",
            "It is not custody.",
            "It is not investing.",
            "It does not collect deposits.",
            "It is a personal planning tool that makes leaks visible as missed opportunities.",
          ],
          icon: A.walletMascot,
        },
      ],
    },
    whatif: {
      label: "Rewards",
      eyebrow: "Rewards Button Guide",
      title: "Rewards: Proof, Streak, Future Holder Rewards",
      intro:
        "Rewards is the proof/readiness hub. Active Streak is protected from full Daily Routine completion only; Rewards explains the state, wallet proof, and future Holder Rewards rules before any payout system exists.",
      icon: "/nav-save.png",
      footerTitle: "Rewards rule",
      footerBody:
        "Rewards are not a one-time unlock. Keep the Daily Routine streak live, verify wallet ownership, and hold eligible $BROKE. No Creator Fee payouts or claims are active yet.",
      sections: [
        {
          title: "Rewards overview card",
          body: [
            "This is the short top card in Rewards.",
            "It shows the planned June 1 direction: Daily Routine activity matters, 100K $BROKE minimum hold, 7+ day streak, wallet verification, and balance-share split.",
            "It is a preparation card, not a live payout screen.",
            "Use Open Daily Routine when today’s proof is still needed.",
          ],
          icon: A.challengeTrophy,
        },
        {
          title: "Today’s Proof",
          body: [
            "Today’s Proof shows whether the full Daily Routine has protected today.",
            "There are no separate Rewards buttons for farming streak proof anymore.",
            "The only valid Active Streak proof is Daily Routine 7/7 completion.",
            "The final Daily Routine task must be Share on X, not copy text, Telegram share, or image download.",
          ],
          icon: A.dailyCheck,
        },
        {
          title: "Daily Routine proof",
          body: [
            "Open Daily Routine from Home or from the Rewards proof button.",
            "Complete all seven real actions: open app, check wallet state, review today/no-spend day, lock one next move, check Chart, check Rewards, and Share on X.",
            "When 7/7 is complete, the app logs Daily Routine proof and protects today’s Active Streak.",
            "Track Leak, Clean Day, One Fix, and Daily Challenge can still be useful features, but they do not activate Active Streak by themselves, and the routine never requires a fake daily expense.",
          ],
          icon: A.dailyCheck,
        },
        {
          title: "7+ day Active Streak",
          body: [
            "The Active Streak is live Daily Routine eligibility proof, not a permanent badge.",
            "0–6 completed routine days means you are still building eligibility.",
            "7+ completed routine days means the activity side is ready for future Holder Reward checks.",
            "If the routine streak drops below 7 days, eligibility pauses until it is rebuilt or recovered.",
          ],
          icon: A.bestStreak,
        },
        {
          title: "Recovery Mode",
          body: [
            "Recovery is the safety window after a missed day.",
            "Recovery is limited to one recovery per 7 days.",
            "During recovery, complete today’s full Daily Routine in time to restore the streak.",
            "If recovery expires, the active streak resets and must be rebuilt.",
          ],
          icon: A.calendar,
        },
        {
          title: "Future Holder Rewards rules",
          body: [
            "Future Holder Rewards are planned, not live payouts yet.",
            "Planned requirements: legitimate Daily Routine activity, verified wallet, minimum 100,000 $BROKE hold, live 7+ day streak, and an active reward epoch.",
            "Up to 50% of the Creator Fee may be allocated to a future rewards pool after the volume trigger.",
            "Holding alone is not enough. App activity and wallet proof matter too.",
          ],
          icon: A.walletHp,
        },
        {
          title: "Balance-share split",
          body: [
            "Balance-share means your percentage depends on your verified eligible $BROKE balance compared with the total verified eligible $BROKE balance at snapshot time.",
            "Example: if all eligible holders together hold 10 BROKE and one holder holds 5, that holder represents 50% of the eligible pool.",
            "If another holder has 3 out of 10, that holder represents 30% of the eligible pool.",
            "This is different from a fixed tier-weight payout.",
          ],
          icon: A.currency,
        },
        {
          title: "Reward epoch / snapshot",
          body: [
            "Reward epoch means a future reward period controlled by the project.",
            "Snapshot means the app checks who is eligible at that moment.",
            "The planned check uses the current state: verified wallet, eligible balance, active streak, and reward rules.",
            "If your streak was 7+ before but is broken at snapshot time, eligibility can pause.",
          ],
          icon: A.calendar,
        },
        {
          title: "Reward Snapshot Ledger",
          body: [
            "The snapshot ledger is the future project record of who was eligible at a specific moment.",
            "It records verified wallet, verified $BROKE balance, active streak days, eligibility reason, and balance-share percentage.",
            "It does not send tokens, open claims, create staking, or distribute Creator Fee by itself.",
            "Final share is locked only when a reward epoch snapshot is run.",
          ],
          icon: A.calendar,
        },
        {
          title: "Notifications Prep",
          body: [
            "Notifications Prep is only a settings preparation block right now.",
            "Daily Proof, Recovery, 7-day milestone, and reminder time are saved as preferences.",
            "Real Telegram scheduled alerts or push notifications are not active yet.",
            "Use this block to tell the app what reminders should exist later.",
          ],
          icon: A.bell,
        },
        {
          title: "Share Active Streak Card",
          body: [
            "This card is public proof for streak activity and holder-readiness status.",
            "It can show avatar, identity style, streak, today status, wallet verification, holder tier, and reward preparation state.",
            "It should not expose income, real balance, payday, or private debt details.",
            "Use it for X or Telegram when you want to show consistency without leaking private finance data.",
          ],
          icon: A.export,
        },
        {
          title: "Old Save tools inside Rewards",
          body: [
            "Survival Mode, Debt & Bills Radar, Home Habit Leaks, Pattern Challenge Coach, Challenges, Leaderboard, and Leak Cut Scenarios still exist inside Rewards.",
            "They are grouped here because they all support proof, discipline, or leak control.",
            "Open only the tool you need instead of scrolling through everything.",
            "Rewards is now the activity and proof hub, not just the old Save tab.",
          ],
          icon: A.navWhatIf,
        },
      ],
    },

    leakscore: {
      label: "Leak",
      eyebrow: "Leak Score Guide",
      title: "Leak Score: Project Risk Signals",
      intro:
        "Leak Score is an experimental DYOR checklist. It does not call projects scams. It helps users notice possible project, wallet, hype, and liquidity leaks before emotional decisions become financial leaks.",
      icon: "/nav-chart.png",
      footerTitle: "Leak Score rule",
      footerBody:
        "Use it as a pause button before entering a project. A signal is not a verdict; it is a reason to verify more slowly.",
      sections: [
        {
          title: "What this screen is",
          body: [
            "It is a manual risk-signal checklist for projects and wallets.",
            "This version saves one active local draft and optional local snapshots on this device only; it does not fetch on-chain data and does not publish public accusations.",
            "The score is educational: it helps users slow down, verify, and avoid FOMO-driven decisions.",
          ],
          icon: A.navChart,
        },
        {
          title: "How to use it",
          body: [
            "Enter the project or token name, chain, and optional contract/mint address if useful.",
            "Select only the signals you can actually observe.",
            "Read the risk tier as a discipline warning, not as investment advice.",
            "If many severe signals are selected, pause before acting.",
          ],
          icon: A.help,
        },
        {
          title: "Local drafts and share text",
          body: [
            "The screen saves one active local draft on this device, so the checklist survives reloads.",
            "Save snapshot stores up to five local versions before you test another project.",
            "Copy text creates a neutral DYOR note with project, chain, score, selected signals, and safety disclaimer.",
            "The share text says leak signals, not scam labels. Keep it factual and non-accusatory.",
          ],
          icon: A.export,
        },
        {
          title: "Why it fits $BROKE",
          body: [
            "$BROKE is about detecting what quietly drains people.",
            "Personal leaks drain wallets through habits and emotional spending.",
            "Project leaks drain wallets through weak structure, fake hype, poor liquidity, and rushed decisions.",
          ],
          icon: A.walletHp,
        },
      ],
    },

    settings: {
      label: "Profile",
      eyebrow: "Profile Button Guide",
      title: "Profile: Personal Cabinet",
      intro:
        "Profile controls identity, wallet proof, public share cards, privacy, currency, sync, and data. Most blocks are collapsed so the screen stays compact.",
      icon: "/nav-settings.png",
      footerTitle: "Profile rule",
      footerBody:
        "Use Profile to control what the app knows privately and what the community can see publicly. Verify only through message signature; never enter a seed phrase.",
      sections: [
        {
          title: "Identity Setup / Edit button",
          body: [
            "Identity Setup controls avatar, nickname, status line, and identity style.",
            "Press Edit to change the public identity shown on profile cards and share cards.",
            "Avatar presets are available for everyone.",
            "Custom avatar is a holder reward and depends on verified wallet requirements.",
            "Nickname and status should be public-safe because they can appear on share cards.",
          ],
          icon: A.walletMascot,
        },
        {
          title: "Wallet & $BROKE Balance card",
          body: [
            "This card is collapsed by default to keep Profile short.",
            "Open it when you want to paste a wallet, recheck $BROKE balance, verify ownership, sync verification, or inspect holder tier.",
            "Watch-only wallet can show balance but cannot unlock verified holder rewards.",
            "Verified wallet means the user proved ownership by signing a message.",
          ],
          icon: A.walletHp,
        },
        {
          title: "Paste wallet / Clear buttons",
          body: [
            "Paste wallet adds a Solana address for read-only balance checks.",
            "No seed phrase is needed. No transaction is needed. No token approval is needed.",
            "Clear removes the watched wallet from the local/profile flow.",
            "Use Paste only with the public wallet address, never with private keys or recovery words.",
          ],
          icon: A.pencil,
        },
        {
          title: "Recheck $BROKE balance button",
          body: [
            "Recheck asks the backend to read the latest $BROKE balance for the linked wallet.",
            "Use it after buying, selling, transferring, or returning to the app after some time.",
            "Balance can affect holder tier and public display slots.",
            "Rewards and unlocks should use verified ownership, not only watched balance.",
          ],
          icon: A.currency,
        },
        {
          title: "Verify wallet / Sync verification buttons",
          body: [
            "Verify wallet proves ownership by message signature.",
            "Telegram browser may not expose a signing provider, so open the app inside a supported Solana wallet browser or desktop extension if needed.",
            "Signature proof does not move tokens and does not approve spending.",
            "Sync verification refreshes the app after returning from a wallet browser or another session.",
          ],
          icon: A.bestStreak,
        },
        {
          title: "Provider Help / Rescan provider",
          body: [
            "Provider Help explains whether the app can detect a wallet signing provider.",
            "Rescan provider checks again for Phantom, Solflare, Backpack, Jupiter Wallet, OKX, Glow, Exodus, Coinbase Wallet, Brave, Trust, Magic Eden, and other injected Solana providers.",
            "Use it if the wallet app was opened after the page loaded.",
            "If provider still does not appear, open the app inside the wallet browser instead of Telegram WebView.",
          ],
          icon: A.help,
        },
        {
          title: "Holder Proof and Holder Rewards blocks",
          body: [
            "Holder Proof shows verified holder identity and tier progress.",
            "Holder Rewards show cosmetic/profile unlocks such as custom avatar, extra public slots, proof frame, and elite style.",
            "These are profile rewards, not automatic token payouts.",
            "Future reward-pool mechanics should still check verified wallet, balance snapshot, and activity requirements.",
          ],
          icon: A.challengeTrophy,
        },
        {
          title: "Share Studio card",
          body: [
            "Share Studio is collapsed by default because it has many options.",
            "Open it to choose what your public profile card can show.",
            "Wallet HP and verified holder balance can unlock more public display slots.",
            "The selected items determine what appears on public profile/share cards.",
          ],
          icon: A.export,
        },
        {
          title: "Share Studio checkboxes",
          body: [
            "Survival Score shows public survival strength.",
            "Wallet HP shows current pressure state.",
            "Streak shows discipline.",
            "Badges show progress achievements.",
            "Leaderboard shows public rank if enabled.",
            "Biggest leak can show category-level pressure without exposing private transactions.",
            "Life hours shows time cost of leaks.",
            "Holder tier shows verified $BROKE proof when enabled.",
          ],
          icon: A.navSettings,
        },
        {
          title: "Open share card / Preview here buttons",
          body: [
            "Open share card opens the public profile card flow.",
            "Preview here shows the card inside Profile before exporting.",
            "Use preview to check avatar, nickname, status, selected stats, and privacy before sharing.",
            "If the card looks crowded, reduce selected items in Share Studio.",
          ],
          icon: SHARE_CARD_PUBLIC_ASSETS.profile,
        },
        {
          title: "Profile Settings sections",
          body: [
            "Quick Setup controls language, region, life mode, currency mode, and basic profile rules.",
            "Money Setup controls income, payday, and fixed costs that power Wallet HP.",
            "Currency & Repair controls display currency, conversion helpers, and old data repair.",
            "Privacy & Public Proof controls what public cards and leaderboards can show.",
            "Personalization controls category names and labels.",
            "Notifications & Sync controls reminders, Telegram connection, and cloud status.",
            "Progress Vault shows streak progress and badges.",
            "Data & Records contains sensitive reset/delete tools and should be used carefully.",
          ],
          icon: A.navSettings,
        },
      ],
    },
  };

  const guideTabs: Tab[] = ["home", "add", "chart", "growth", "leakscore", "whatif", "settings"];
  const guide = tabGuides[selectedGuide] ?? tabGuides.home;

  return (
    <div
      className="help-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="$BROKE Life Tracker guide"
    >
      <div className="help-modal tab-guide-modal">
        <div className="help-modal-head">
          <div>
            <span>{guide.eyebrow}</span>
            <strong>{guide.title}</strong>
          </div>

          <button type="button" onClick={onClose} aria-label="Close guide">
            ×
          </button>
        </div>

        <div className="tab-guide-tabs" role="tablist" aria-label="Guide tabs">
          {guideTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={selectedGuide === tab ? "active" : ""}
              onClick={() => setSelectedGuide(tab)}
            >
              <img src={tabGuides[tab].icon} alt="" />
              <span>{tabGuides[tab].label}</span>
            </button>
          ))}
        </div>

        <section className="tab-guide-hero">
          <img src={guide.icon} alt="" />
          <p>{guide.intro}</p>
        </section>

        <div className="help-modal-list tab-guide-list">
          {guide.sections.map((section) => (
            <article key={section.title}>
              <img src={section.icon} alt="" />
              <div>
                <strong>{section.title}</strong>
                {section.body.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>            </article>
          ))}
        </div>

        <div className="help-modal-footer">
          <strong>{guide.footerTitle}</strong>
          <span>{guide.footerBody}</span>
        </div>

        <button type="button" className="help-modal-close" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

function CommunityLiveSidebar() {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const feedRef = useRef<HTMLDivElement | null>(null);

  const fallbackMessages: CommunityMessage[] = [
    {
      id: "fallback-1",
      senderName: "$BROKE",
      username: "SmokeIsBroke",
      text: "Community Live will show recent Telegram group messages once the bot is connected.",
      source: "system",
      createdAt: new Date().toISOString(),
    },
    {
      id: "fallback-2",
      senderName: "$BROKE",
      username: "SmokeIsBroke",
      text: "This sidebar is read-only. Open Telegram if you want to join the conversation.",
      source: "system",
      createdAt: new Date().toISOString(),
    },
  ];

  const visibleMessages = messages.length ? messages : fallbackMessages;

  async function loadMessages() {
    try {
      setStatus("loading");
      const response = await fetch("/api/community", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Community feed unavailable");
      }

      setMessages(data.messages || []);
      setError("");
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Community feed unavailable");
      setStatus("error");
    }
  }

  useEffect(() => {
    loadMessages();

    const interval = window.setInterval(() => {
      loadMessages();
    }, 8000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const feed = feedRef.current;

    if (!feed) return;

    const goBottom = () => {
      feed.scrollTop = feed.scrollHeight;
    };

    const id = window.setTimeout(goBottom, 20);
    return () => window.clearTimeout(id);
  }, [visibleMessages.length, status]);

  return (
    <aside className="community-live-sidebar">
      <div className="community-live-card">
        <header>
          <div>
            <span>$BROKE Community</span>
            <strong>Live Telegram</strong>
          </div>

          <a
            href="https://t.me/SmokeIsBroke"
            target="_blank"
            rel="noreferrer"
          >
            Open TG
          </a>
        </header>

        <div className="community-live-feed" ref={feedRef}>
          {visibleMessages.map((message) => (
            <article
              className={`community-message ${message.source}`}
              key={message.id}
            >
              <div>
                <strong>{message.senderName}</strong>
                <time>{formatCommunityTime(message.createdAt)}</time>
              </div>
              <p>{message.text}</p>
            </article>
          ))}
        </div>

        <div className="community-live-footer">
          <strong>Read only</strong>
          <p>Newest messages stay at the bottom. To reply, open the Telegram group.</p>
          {error && <small>{error}</small>}
        </div>
      </div>
    </aside>
  );
}

function formatCommunityTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function LeakReflectionPopupView({
  reflection,
  onClose,
  onOpenHistory,
  onOpenSurvival,
}: {
  reflection: LeakReflection;
  onClose: () => void;
  onOpenHistory: () => void;
  onOpenSurvival: () => void;
}) {
  return (
    <div className="leak-reflection-backdrop" role="presentation">
      <section className={`leak-reflection-popup ${reflection.tone}`} role="dialog" aria-modal="true">
        <div className="leak-reflection-top">
          <img src={reflection.icon} alt="" />
          <div>
            <span>{reflection.needType}</span>
            <strong>{reflection.title}</strong>
            <small>
              {reflection.amountLabel} · {reflection.categoryLabel}
            </small>
          </div>
          <button type="button" aria-label="Close reflection" onClick={onClose}>
            ×
          </button>
        </div>

        <p>{reflection.body}</p>

        <div className="leak-reflection-insight">
          <strong>{reflection.insight}</strong>
        </div>

        <div className="leak-reflection-question">
          <span>Leak check</span>
          <strong>{reflection.question}</strong>
          <small>{reflection.exampleAnswer}</small>
        </div>

        <div className="leak-reflection-mini-grid">
          <div>
            <span>This month</span>
            <strong>{reflection.categoryCount}x</strong>
          </div>
          <div>
            <span>Category total</span>
            <strong>{reflection.categoryTotalLabel}</strong>
          </div>
          {reflection.necessaryAmountLabel && (
            <div>
              <span>Necessary part</span>
              <strong>{reflection.necessaryAmountLabel}</strong>
            </div>
          )}
        </div>

        <div className="leak-reflection-actions">
          <button type="button" className="primary" onClick={onClose}>
            Got it
          </button>
          <button type="button" onClick={onOpenHistory}>
            Check history
          </button>
          <button type="button" onClick={onOpenSurvival}>
            Open Survival
          </button>
        </div>
      </section>
    </div>
  );
}

function AppToastView({ toast }: { toast: AppToast }) {
  return (
    <div className={`app-toast ${toast.tone}`} key={toast.id}>
      <strong>{toast.title}</strong>
      {toast.detail && <span>{toast.detail}</span>}
    </div>
  );
}

function OnboardingScreen({
  settings,
  telegram,
  onComplete,
}: {
  settings: Settings;
  telegram: TelegramState;
  onComplete: (
    settings: Settings,
    targetTab?: Tab,
    starterExpense?: OnboardingStarterExpense
  ) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Settings>(() => normalizeSettings(settings));
  const [starterLeak, setStarterLeak] = useState(firstLeakPresets[0]);
  const [starterAmount, setStarterAmount] = useState(firstLeakPresets[0].amount);

  const onboardingSteps = [
    {
      label: "Start",
      title: "Wallet Survival Setup",
      icon: A.walletMascot,
    },
    {
      label: "Profile",
      title: "Fit the app to your life",
      icon: A.appFrog,
    },
    {
      label: "Income",
      title: "Set money coming in",
      icon: A.income,
    },
    {
      label: "Costs",
      title: "Set fixed life costs",
      icon: A.lifeCost,
    },
    {
      label: "First leak",
      title: "Prepare the first real leak",
      icon: A.leaks,
    },
    {
      label: "Ready",
      title: "Start the 3-day path",
      icon: A.progressFlame,
    },
  ];

  const totalSteps = onboardingSteps.length;
  const currentStep = onboardingSteps[step];
  const firstName = telegram.user?.first_name || "there";
  const totalIncome = getTotalIncome(draft);
  const totalFixedCosts = getFixedCosts(draft);
  const realBalance = totalIncome - totalFixedCosts;
  const setupQuality =
    draft.profile.country &&
    totalIncome > 0 &&
    (totalFixedCosts > 0 || draft.profile.lifeMode === "Student" || draft.profile.lifeMode === "Living with family")
      ? "Ready"
      : "Needs data";

  function updateIncome(key: keyof Settings["income"], value: string) {
    setDraft((prev) => ({
      ...prev,
      income: {
        ...prev.income,
        [key]: safeNumber(value),
      },
      incomeCurrencies: {
        ...prev.incomeCurrencies,
        [key]: prev.currency,
      },
    }));
  }

  function updateFixedCost(key: keyof Settings["fixedCosts"], value: string) {
    setDraft((prev) => ({
      ...prev,
      fixedCosts: {
        ...prev.fixedCosts,
        [key]: safeNumber(value),
      },
      fixedCostCurrencies: {
        ...prev.fixedCostCurrencies,
        [key]: prev.currency,
      },
    }));
  }

  function selectStarterLeak(leak: (typeof firstLeakPresets)[number]) {
    triggerHaptic("light");
    setStarterLeak(leak);
    setStarterAmount(leak.amount);
  }

  function next() {
    triggerHaptic("light");
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }

  function back() {
    triggerHaptic("light");
    setStep((prev) => Math.max(prev - 1, 0));
  }

  function finish(targetTab: Tab = "home") {
    const finalSettings = normalizeSettings(draft);
    const starterExpense =
      targetTab === "add"
        ? {
            category: starterLeak.category,
            amount: Math.max(Math.round(starterAmount), 1),
            needType: "Not needed" as NeedType,
            note: "First leak from onboarding",
          }
        : undefined;

    onComplete(finalSettings, targetTab, starterExpense);
  }

  function startFast() {
    triggerHaptic("medium");
    finish("add");
  }

  return (
    <div className="screen onboarding-screen v58-onboarding">
      <div className="onboarding-top v58-onboarding-top">
        <img src={currentStep.icon} alt="" />
        <div>
          <span>
            Step {step + 1} / {totalSteps} · {currentStep.label}
          </span>
          <strong>{currentStep.title}</strong>
        </div>
      </div>

      <div className="onboarding-progress">
        <i style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>

      <div className="v58-step-dots" aria-label="Onboarding progress">
        {onboardingSteps.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className={index === step ? "active" : index < step ? "done" : ""}
            onClick={() => setStep(index)}
            aria-label={item.label}
          >
            <span>{index + 1}</span>
          </button>
        ))}
      </div>

      {step === 0 && (
        <section className="onboarding-card intro v58-onboarding-hero">
          <div className="v58-hero-copy">
            <span>$BROKE Life Tracker</span>
            <h1>Welcome, {firstName}.</h1>
            <p>
              This is not a finance dashboard. It is a first-session loop: track one real leak,
              see what it did to Wallet HP, then get one clear next move.
            </p>
          </div>

          <div className="v58-onboarding-route">
            <article>
              <img src={A.leaks} alt="" />
              <div>
                <strong>Track one leak</strong>
                <span>Save one real expense, then mark it as Survival, Grey zone, or Full leak.</span>
              </div>
            </article>

            <article>
              <img src={A.walletMascot} alt="" />
              <div>
                <strong>Read Wallet HP</strong>
                <span>See whether the month is stable or whether small leaks are creating pressure.</span>
              </div>
            </article>

            <article>
              <img src={A.chartFrog} alt="" />
              <div>
                <strong>Get the pattern</strong>
                <span>Pattern Lab starts explaining the trigger behind the leak, not just the amount.</span>
              </div>
            </article>
          </div>

          <div className="v58-fast-start-card">
            <div>
              <span>Fast Start</span>
              <strong>Skip the setup. Track one real leak now.</strong>
              <p>Best for first-time users: private numbers can wait. The first result should come fast.</p>
            </div>
            <button type="button" onClick={startFast}>
              Fast start: Track leak
            </button>
          </div>

          <div className="first-session-promise-card">
            <span>First-session promise</span>
            <strong>One real leak should unlock one useful insight.</strong>
            <p>No spreadsheet feeling. Save a leak, read the signal, then decide the next move.</p>
          </div>

          <div className="v58-privacy-note">
            <strong>Privacy rule</strong>
            <span>Public cards hide income and real balance. You share progress, not private numbers.</span>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="v58-onboarding-stack">
          <div className="v58-guidance-card">
            <img src={A.appFrog} alt="" />
            <div>
              <strong>Make the app local.</strong>
              <span>
                Country, currency and life mode change the meaning of every number. A student,
                worker and freelancer should not be judged by the same setup.
              </span>
            </div>
          </div>

          <LifeProfileEditor settings={draft} setSettings={setDraft} />
        </section>
      )}

      {step === 2 && (
        <section className="onboarding-card v58-onboarding-card">
          <div className="v58-card-head">
            <img src={A.income} alt="" />
            <div>
              <span>{getIncomePeriodLabel(draft)}</span>
              <h2>Set what comes in.</h2>
              <p>Use the way money actually reaches you: salary, allowance, daily work, weekly pay, or irregular income.</p>
            </div>
          </div>

          <div className="onboarding-fields">
            <EditableMoneyLine
              label={getPrimaryIncomeLabel(draft)}
              value={draft.income.salary}
              currency={draft.incomeCurrencies.salary || draft.currency}
              onChange={(value) => updateIncome("salary", value)}
            />

            <EditableMoneyLine
              label="Side hustle / extra"
              value={draft.income.side}
              currency={draft.incomeCurrencies.side || draft.currency}
              onChange={(value) => updateIncome("side", value)}
            />

            <EditableMoneyLine
              label="Other / support"
              value={draft.income.other}
              currency={draft.incomeCurrencies.other || draft.currency}
              onChange={(value) => updateIncome("other", value)}
            />
          </div>

          <div className="v58-onboarding-summary-grid">
            <div>
              <span>Estimated monthly income</span>
              <strong>{money(totalIncome, draft.currency)}</strong>
            </div>
            <div>
              <span>Income style</span>
              <strong>{draft.profile.incomeStyle}</strong>
            </div>
          </div>

          <div className="v58-soft-skip-row">
            <div>
              <strong>Private numbers can wait.</strong>
              <span>Add income later and still reach the first leak. Accuracy improves when you fill it in.</span>
            </div>
            <button type="button" onClick={next}>Add later</button>
          </div>

          <div className="v58-privacy-note">
            <strong>Not public</strong>
            <span>Income is used for calculations. Share cards do not expose it.</span>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="onboarding-card v58-onboarding-card">
          <div className="v58-card-head">
            <img src={A.lifeCost} alt="" />
            <div>
              <span>Fixed life costs</span>
              <h2>Set what must be paid.</h2>
              <p>Only add costs that apply. If you live with family or you are a student, rent can stay off.</p>
            </div>
          </div>

          <div className="onboarding-fields">
            {draft.profile.hasRent && (
              <EditableMoneyLine
                label="Rent"
                value={draft.fixedCosts.rent}
                currency={draft.fixedCostCurrencies.rent || draft.currency}
                onChange={(value) => updateFixedCost("rent", value)}
              />
            )}

            <EditableMoneyLine
              label="Food basics"
              value={draft.fixedCosts.food}
              currency={draft.fixedCostCurrencies.food || draft.currency}
              onChange={(value) => updateFixedCost("food", value)}
            />

            <EditableMoneyLine
              label="Transport"
              value={draft.fixedCosts.transport}
              currency={draft.fixedCostCurrencies.transport || draft.currency}
              onChange={(value) => updateFixedCost("transport", value)}
            />

            <EditableMoneyLine
              label="Data / Internet"
              value={draft.fixedCosts.data}
              currency={draft.fixedCostCurrencies.data || draft.currency}
              onChange={(value) => updateFixedCost("data", value)}
            />

            <EditableMoneyLine
              label="School / study"
              value={draft.fixedCosts.education}
              currency={draft.fixedCostCurrencies.education || draft.currency}
              onChange={(value) => updateFixedCost("education", value)}
            />
          </div>

          <div className="v58-onboarding-summary-grid">
            <div>
              <span>Total fixed costs</span>
              <strong>{money(totalFixedCosts, draft.currency)}</strong>
            </div>
            <div>
              <span>Real balance before leaks</span>
              <strong className={realBalance >= 0 ? "good" : "bad"}>
                {money(realBalance, draft.currency)}
              </strong>
            </div>
          </div>

          <div className="v58-soft-skip-row">
            <div>
              <strong>Fixed costs can wait.</strong>
              <span>Track one real leak first, then return here when you know the monthly numbers.</span>
            </div>
            <button type="button" onClick={next}>Add later</button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="onboarding-card v58-onboarding-card">
          <div className="v58-card-head">
            <img src={A.leaks} alt="" />
            <div>
              <span>First real leak</span>
              <h2>Prepare one expense.</h2>
              <p>
                This does not create a fake record. It prepares the Add tab so the user can confirm
                the first real local leak.
              </p>
            </div>
          </div>

          <div className="v58-starter-leak-grid">
            {firstLeakPresets.map((leak) => (
              <button
                key={leak.category}
                type="button"
                className={starterLeak.category === leak.category ? "active" : ""}
                onClick={() => selectStarterLeak(leak)}
              >
                <img src={leak.icon} alt="" />
                <strong>{leak.label}</strong>
                <span>{categoryLabel(leak.category)}</span>
              </button>
            ))}
          </div>

          <EditableMoneyLine
            label="Expected amount"
            value={starterAmount}
            currency={draft.currency}
            onChange={(value) => setStarterAmount(safeNumber(value))}
          />

          <div className="v58-privacy-note warning">
            <strong>Discipline rule</strong>
            <span>Do not just click and pretend. After onboarding, Add opens and the record must be saved manually.</span>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="onboarding-card final v58-onboarding-final">
          <img src={A.homeMascot} alt="" />
          <span className={`v58-setup-status ${setupQuality === "Ready" ? "ready" : "needs-data"}`}>
            {setupQuality}
          </span>
          <h2>Your wallet system is ready.</h2>

          <div className="v58-onboarding-summary-grid final">
            <div>
              <span>Profile</span>
              <strong>{draft.profile.lifeMode}</strong>
            </div>
            <div>
              <span>Region</span>
              <strong>{draft.profile.country || "Custom"}</strong>
            </div>
            <div>
              <span>Currency</span>
              <strong>{draft.currency}</strong>
            </div>
            <div>
              <span>First leak</span>
              <strong>
                {categoryLabel(starterLeak.category)} · {money(Math.max(starterAmount, 1), draft.currency)}
              </strong>
            </div>
          </div>

          <div className="v58-first-path">
            <strong>First 3-day path</strong>
            <span>Day 1 — track your first leak.</span>
            <span>Day 2 — check the chart and biggest leak.</span>
            <span>Day 3 — share a safe public result card.</span>
          </div>
        </section>
      )}

      <div className="onboarding-actions v58-onboarding-actions">
        {step > 0 ? (
          <button type="button" className="secondary-btn" onClick={back}>
            Back
          </button>
        ) : (
          <button type="button" className="secondary-btn ghost" onClick={() => finish("home")}>
            Skip setup
          </button>
        )}

        {step < totalSteps - 1 ? (
          <button type="button" className="primary-btn onboarding-next" onClick={next}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="primary-btn onboarding-next"
            onClick={() => finish("add")}
          >
            Open Track Leak
          </button>
        )}
      </div>
    </div>
  );
}



function AppModeToggle({
  mode,
  onToggle,
}: {
  mode: AppMode;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`app-mode-toggle ${mode}`}
      aria-label={`Switch to ${mode === "standard" ? "Pro" : "Standard"} mode`}
      onClick={() => {
        triggerHaptic("light");
        onToggle();
      }}
    >
      <span>{mode === "standard" ? "Standard" : "Pro"}</span>
      <b>{mode === "standard" ? "Lite" : "Full"}</b>
    </button>
  );
}

function StandardModeNoticeCard({
  onOpenAdd,
  onOpenChart,
  onSwitchToPro,
}: {
  onOpenAdd: () => void;
  onOpenChart: () => void;
  onSwitchToPro: () => void;
}) {
  return (
    <section className="standard-mode-notice-card">
      <div>
        <span>Standard Mode</span>
        <strong>Only the core loop is visible.</strong>
        <p>Track leaks, finish Daily Routine, protect streak, check wallet status, and read simple reports. Pro tools are hidden until you need them.</p>
      </div>
      <div className="standard-mode-actions">
        <button type="button" onClick={onOpenAdd}>Track leak</button>
        <button type="button" onClick={onOpenChart}>Simple report</button>
        <button type="button" onClick={onSwitchToPro}>Switch to Pro</button>
      </div>
    </section>
  );
}

function Header({
  title,
  showBack = false,
  rightIcon,
  extraRight,
  onBack,
  onRight,
}: {
  title: string;
  showBack?: boolean;
  rightIcon?: string;
  extraRight?: ReactNode;
  onBack?: () => void;
  onRight?: () => void;
}) {
  return (
    <div className="screen-header">
      <div className="header-side">
        <button
          className="header-button"
          type="button"
          onClick={() => {
            triggerHaptic("light");
            if (showBack) {
              onBack?.();
            }
          }}
          aria-label={showBack ? "Back" : "App"}
        >
          {showBack ? (
            <img className="header-icon" src={A.back} alt="Back" />
          ) : (
            <img className="app-icon" src={A.appFrog} alt="$BROKE" />
          )}
        </button>
      </div>

      <div className="header-title">{title}</div>

      <div className="header-side right">
        {extraRight}
        <button
          className="header-button"
          type="button"
          onClick={() => {
            triggerHaptic("light");
            onRight?.();
          }}
          aria-label="Action"
        >
          {rightIcon ? (
            <img className="header-icon" src={rightIcon} alt="" />
          ) : (
            <img className="header-icon" src={A.bell} alt="Notifications" />
          )}
        </button>
      </div>
    </div>
  );
}

// V55: Clean UI / Less Clutter uses collapsible detail sections.
// V55.1: Polish adds Next Best Action and clearer collapsible section descriptions.
// V56: Daily / Weekly Reports adds shareable report cards.
// V56.1: Daily / Weekly Reports share clean image cards.
function DashboardScreen({
  settings,
  exchangeRates,
  summary,
  badges,
  walletInsights,
  chartDays,
  weeklyPatternSummary,
  patternHistory,
  leaderboard,
  expenses,
  routineExpenses,
  allExpenses,
  leakMission,
  activeProofStatus,
  onMarkCleanDay,
  onCompleteOneFix,
  onStartLeakMission,
  onResetLeakMission,
  onDeleteExpense,
  onQuickLeak,
  onOpenAdd,
  onOpenChart,
  onOpenSurvival,
  telegram,
  webAuth,
  cloudStatus,
  cloudError,
  cloudAuthReady,
  appMode,
  onToggleAppMode,
  onRoutineComplete,
  onBellClick,
}: {
  settings: Settings;
  exchangeRates: ExchangeRateMap;
  summary: {
    totalIncome: number;
    fixedCosts: number;
    spentThisMonth: number;
    totalLeaks: number;
    realBalance: number;
    walletHp: number;
    todaySpent: number;
    streak: Streak;
  };
  badges: BadgeItem[];
  walletInsights: WalletInsight[];
  chartDays: ChartPoint[];
  weeklyPatternSummary: WeeklyPatternSummary;
  patternHistory: PatternHistoryRecord[];
  leaderboard: LeaderboardState | null;
  expenses: Expense[];
  routineExpenses: Expense[];
  allExpenses: Expense[];
  leakMission: LocalLeakMission | null;
  activeProofStatus: ActiveStreakProofStatus;
  onMarkCleanDay: () => void;
  onCompleteOneFix: () => void;
  onStartLeakMission: (category: string, baselineWeekly: number) => void;
  onResetLeakMission: () => void;
  onDeleteExpense: (id: string) => void;
  onQuickLeak: (category: string, value: number, needType?: NeedType) => void;
  onOpenAdd: () => void;
  onOpenChart: () => void;
  onOpenSurvival: () => void;
  telegram: TelegramState;
  webAuth: WebAuthState;
  cloudStatus: CloudStatus;
  cloudError: string;
  cloudAuthReady: boolean;
  appMode: AppMode;
  onToggleAppMode: () => void;
  onRoutineComplete: () => Promise<boolean>;
  onBellClick: () => void;
}) {
  const incomeUsdNote = usdReferenceNote(summary.totalIncome, settings.currency, settings, exchangeRates);
  const fixedCostsUsdNote = usdReferenceNote(summary.fixedCosts, settings.currency, settings, exchangeRates);
  const totalLeaksUsdNote = usdReferenceNote(summary.totalLeaks, settings.currency, settings, exchangeRates);
  const realBalanceUsdNote = usdReferenceNote(summary.realBalance, settings.currency, settings, exchangeRates);
  const stats = [
    {
      title: "Income",
      value: money(summary.totalIncome, settings.currency),
      subtitle: incomeUsdNote || "This month",
      icon: A.income,
      tone: "green",
    },
    {
      title: "Life Cost",
      value: money(summary.fixedCosts, settings.currency),
      subtitle: fixedCostsUsdNote || "This month",
      icon: A.lifeCost,
      tone: "red",
    },
    {
      title: "Money Leaks",
      value: money(summary.totalLeaks, settings.currency),
      subtitle: totalLeaksUsdNote || "This month",
      icon: A.leaks,
      tone: "orange",
    },
    {
      title: "Real Balance",
      value: money(summary.realBalance, settings.currency),
      subtitle: realBalanceUsdNote || "Left to stack",
      icon: A.balance,
      tone: "green",
    },
  ];

  const walletSnapshotTabs = useMemo(() => {
    const todayKey = dayKey(new Date());
    return chartDays
      .slice(-7)
      .reverse()
      .map((point, index) => {
        const date = new Date(`${point.key}T12:00:00`);
        const isToday = point.key === todayKey || index === 0;
        const shortLabel = isToday
          ? "Today"
          : date.toLocaleDateString("en-US", { weekday: "short" });
        const fullLabel = isToday
          ? "Today’s Wallet Snapshot"
          : `${date.toLocaleDateString("en-US", { weekday: "long" })} Wallet Snapshot`;

        return {
          point,
          shortLabel,
          fullLabel,
        };
      });
  }, [chartDays]);

  const [selectedWalletSnapshotKey, setSelectedWalletSnapshotKey] = useState("");

  const selectedWalletSnapshot =
    walletSnapshotTabs.find((tab) => tab.point.key === selectedWalletSnapshotKey) || walletSnapshotTabs[0] || null;

  const selectedSnapshotPoint = selectedWalletSnapshot?.point || null;
  const selectedSnapshotPressure = selectedSnapshotPoint
    ? selectedSnapshotPoint.pressure >= 80
      ? "High pressure"
      : selectedSnapshotPoint.pressure >= 45
        ? "Watch zone"
        : selectedSnapshotPoint.spent > 0
          ? "Controlled"
          : "Quiet"
    : "No snapshot";
  const selectedSnapshotTone = selectedSnapshotPoint?.status || "quiet";

  const identityStats = useMemo(() => {
    return buildV2IdentityStats(allExpenses, settings, summary.walletHp);
  }, [allExpenses, settings, summary.walletHp]);
  const comebackState = useMemo(() => {
    return buildComebackState(allExpenses, settings);
  }, [allExpenses, settings]);
  const isProMode = appMode === "pro";

  return (
    <div className="screen home-screen">
      <Header
        title="$BROKE Life Tracker"
        rightIcon={A.help}
        extraRight={<AppModeToggle mode={appMode} onToggle={onToggleAppMode} />}
        onRight={onBellClick}
      />

      <section className="hero home-compact-hero" aria-label="Home wallet status">
        <div className="home-compact-hero-copy">
          <span className="home-compact-kicker">Home status</span>
          <h1>
            Your wallet is leaking.
            <span>Numbers first. Pattern next.</span>
          </h1>
          <div className="home-clarity-pill compact">
            <span>Track leak</span>
            <b>→</b>
            <span>Read pattern</span>
            <b>→</b>
            <span>Next move</span>
          </div>
        </div>

        <img
          className="home-mascot home-compact-mascot"
          src={PREMIUM_VISUAL_PACK.homeMascot}
          alt="Mascot"
          onError={(event) => {
            event.currentTarget.src = A.homeMascot;
          }}
        />
      </section>

      {appMode === "standard" && (
        <StandardModeNoticeCard
          onOpenAdd={onOpenAdd}
          onOpenChart={onOpenChart}
          onSwitchToPro={onToggleAppMode}
        />
      )}

      <details open className="home-compact-details home-wallet-snapshot-card home-collapsed-section">
        <summary className="home-compact-summary home-wallet-snapshot-summary">
          <div>
            <span>Wallet Snapshot</span>
            <strong>{summary.walletHp}/100 HP · {money(summary.realBalance, settings.currency)} left</strong>
            <small>Income, life cost, leaks, and day snapshots stay here.</small>
          </div>
          <b>Open</b>
        </summary>
        <div className="home-compact-body home-wallet-snapshot-collapsible-body">
        <div className="wallet-snapshot-heading">
          <div>
            <span>Wallet Snapshot for Today</span>
            <strong>Your cash flow is still the hook.</strong>
            <p>Open the app and see the money state first. Scroll days to compare older wallet snapshots.</p>
          </div>
          <b>{summary.walletHp}/100 HP</b>
        </div>

        <section className="stats-grid compact-home-stats wallet-snapshot-primary-stats">
          {stats.map((item) => (
            <div className={`stat-card ${item.tone}`} key={item.title}>
              <div className="stat-top">
                <img src={item.icon} alt="" />
                <span>{item.title}</span>
              </div>
              <strong>{item.value}</strong>
              <small>{item.subtitle}</small>
            </div>
          ))}
        </section>

        {walletSnapshotTabs.length > 0 && selectedSnapshotPoint && (
          <>
            <div className="wallet-snapshot-tabs" aria-label="Wallet snapshot days">
              {walletSnapshotTabs.map((tab) => (
                <button
                  key={tab.point.key}
                  type="button"
                  className={tab.point.key === selectedSnapshotPoint.key ? "active" : ""}
                  onClick={() => setSelectedWalletSnapshotKey(tab.point.key)}
                >
                  <span>{tab.shortLabel}</span>
                  <small>{tab.point.spent > 0 ? money(tab.point.spent, settings.currency) : "quiet"}</small>
                </button>
              ))}
            </div>

            <section className={`wallet-snapshot-day-card ${selectedSnapshotTone}`}>
              <div>
                <span>{selectedWalletSnapshot?.fullLabel}</span>
                <strong>{selectedSnapshotPressure}</strong>
              </div>
              <div className="wallet-snapshot-day-metrics">
                <article>
                  <span>State after day</span>
                  <strong>{money(selectedSnapshotPoint.close, settings.currency)}</strong>
                </article>
                <article>
                  <span>Tracked</span>
                  <strong>{money(selectedSnapshotPoint.spent, settings.currency)}</strong>
                </article>
                <article>
                  <span>Leak pressure</span>
                  <strong>{money(selectedSnapshotPoint.leakAmount, settings.currency)}</strong>
                </article>
              </div>
            </section>
          </>
        )}

        <details className="wallet-snapshot-more">
          <summary>
            <span>More wallet context</span>
            <b>Profile / streak / HP</b>
          </summary>

          <section className="home-wallet-snapshot-panel">
            <LifeProfileSummaryCard settings={settings} />

            <StreakCard streak={summary.streak} />

            <section className="hp-card">
              <div className="section-title">
                <span>Wallet HP</span>
                <b>{summary.walletHp >= 80 ? "Stable Wallet" : "Small Leak"}</b>
              </div>

              <div className="hp-row">
                <img src={A.walletHp} alt="Wallet HP" />
                <div className="hp-bar">
                  <div style={{ width: `${summary.walletHp}%` }} />
                </div>
                <strong>{summary.walletHp} / 100</strong>
              </div>

              <p>Hold the line, fix the leaks.</p>
            </section>
          </section>
        </details>
        </div>
      </details>


      <details className="home-compact-details home-focus-details home-collapsed-section">
        <summary className="home-compact-summary home-focus-summary">
          <div>
            <span>Today’s Focus</span>
            <strong>{summary.todaySpent > 0 ? `${money(summary.todaySpent, settings.currency)} tracked today` : "No leak tracked today"}</strong>
            <small>Next action, pressure signal, and the button to press next.</small>
          </div>
          <b>Open</b>
        </summary>
        <div className="home-compact-body">
          <SmartHomeFocusCard
            settings={settings}
            summary={summary}
            allExpenses={allExpenses}
            identityStats={identityStats}
            onOpenAdd={onOpenAdd}
            onOpenChart={onOpenChart}
          />
        </div>
      </details>

      {isProMode && (
      <details className="home-compact-details home-weekly-report-details home-collapsed-section">
        <summary className="home-compact-summary home-weekly-report-summary">
          <div>
            <span>Weekly Behavior Report</span>
            <strong>{weeklyPatternSummary.strongestPattern || weeklyPatternSummary.headline}</strong>
            <small>Weekly pattern, pressure, comparison, share card, and next move.</small>
          </div>
          <b>{weeklyPatternSummary.leakPressure}%</b>
        </summary>
        <div className="home-compact-body">
          <WeeklyBehaviorReportHomeCard
            settings={settings}
            weeklyPatternSummary={weeklyPatternSummary}
            patternHistory={patternHistory}
            walletHp={summary.walletHp}
            identityStats={identityStats}
            leaderboard={leaderboard}
            shareInitData={telegram.isTelegram ? telegram.initData : ""}
            onOpenChart={onOpenChart}
            onOpenAdd={onOpenAdd}
          />
        </div>
      </details>
      )}

      {allExpenses.length === 0 && (
        <section className="first-user-clarity-card">
          <div>
            <span>New here?</span>
            <strong>Do not fill the whole app first.</strong>
            <p>Track one real leak. That is enough to unlock Wallet HP, the first chart signal, and a useful next move.</p>
          </div>
          <button type="button" onClick={onOpenAdd}>
            Track first leak
          </button>
        </section>
      )}

      {isProMode && comebackState && (
        <details className="home-compact-details home-comeback-details home-collapsed-section">
          <summary className="home-compact-summary home-comeback-summary">
            <div>
              <span>Comeback Mode</span>
              <strong>Restart without filling the whole app.</strong>
              <small>Use this when you missed tracking and need a controlled restart.</small>
            </div>
            <b>Open</b>
          </summary>
          <div className="home-compact-body">
            <ComebackModeCard
              settings={settings}
              comeback={comebackState}
              onAddMissedLeak={onOpenAdd}
              onRestartToday={onOpenAdd}
              onShowDamage={onOpenChart}
              onOpenSurvival={onOpenSurvival}
            />
          </div>
        </details>
      )}

      {isProMode && (
      <details className="clean-details">
        <summary>
          <div>
            <span>Biggest Leak Challenge</span>
            <small>Optional 3-day mission built from your real leak pattern.</small>
          </div>
          <b>{identityStats.biggestLeakAmount > 0 ? "Ready" : "Needs leak"}</b>
        </summary>
        <BiggestLeakChallengePanel
          settings={settings}
          identityStats={identityStats}
          mission={leakMission}
          expenses={allExpenses}
          shareInitData={telegram.isTelegram ? telegram.initData : ""}
          onStartMission={onStartLeakMission}
          onResetMission={onResetLeakMission}
          onOpenAdd={onOpenAdd}
        />
      </details>
      )}

      {expenses.length === 0 && (
        <details className="clean-details">
          <summary>
            <div>
              <span>First Leak Mission</span>
              <small>Quick preset if you want to start faster.</small>
            </div>
            <b>Start</b>
          </summary>
          <FirstLeakOnboardingCard
            settings={settings}
            onQuickLeak={onQuickLeak}
            onOpenAdd={onOpenAdd}
          />
        </details>
      )}

      <details className="clean-details" id="daily-routine-panel">
        <summary>
          <div>
            <span>Daily Routine</span>
            <small>7 actions. Final task: Share on X.</small>
          </div>
          <b>Streak proof</b>
        </summary>
        <DailyRoutinePanel
          settings={settings}
          summary={summary}
          expenses={routineExpenses}
          onRoutineComplete={onRoutineComplete}
        />
      </details>

      <details className="clean-details">
        <summary>
          <div>
            <span>Wallet Survival Report</span>
            <small>Your weekly score, status, and biggest leak.</small>
          </div>
          <b>{identityStats.weeklySurvivalScore}/100</b>
        </summary>
        <V2IdentityPanel settings={settings} identityStats={identityStats} />
      </details>

      {isProMode && (
      <details className="clean-details">
        <summary>
          <div>
            <span>Share Reports</span>
            <small>Generate clean public wallet cards.</small>
          </div>
          <b>Reports</b>
        </summary>
        <ReportsPanel
          settings={settings}
          summary={summary}
          expenses={allExpenses}
          identityStats={identityStats}
          exchangeRates={exchangeRates}
          shareInitData={telegram.isTelegram ? telegram.initData : ""}
        />
      </details>
      )}

      {isProMode && (
      <details className="clean-details">
        <summary>
          <div>
            <span>Smart Insights Lab</span>
            <small>Signals from leaks, fixed costs, silent pressure, targets, and currency repair.</small>
          </div>
          <b>{walletInsights.length} signals</b>
        </summary>
        <WalletInsightsPanel insights={walletInsights} />
      </details>
      )}

      {isProMode && (
      <details className="clean-details">
        <summary>
          <span>Badges</span>
          <b>{badges.filter((badge) => badge.earned).length}/{badges.length}</b>
        </summary>
        <BadgeMiniStrip badges={badges} />
      </details>
      )}

      {isProMode && (
      <details className="clean-details" id="share-result-card-panel">
        <summary>
          <div>
            <span>Profile Share Card</span>
            <small>Uses the slots selected in Profile.</small>
          </div>
          <b>Public card</b>
        </summary>
        <ShareResultCard
          settings={settings}
          walletHp={summary.walletHp}
          totalLeaks={summary.totalLeaks}
          realBalance={summary.realBalance}
          potentialYearlySavings={summary.totalLeaks * 12}
          leaderboard={leaderboard}
          identityStats={identityStats}
          exchangeRates={exchangeRates}
          shareInitData={telegram.isTelegram ? telegram.initData : ""}
        />
      </details>
      )}

      <details className="clean-details">
        <summary>
          <div>
            <span>$BROKE Chart</span>
            <small>Preview wallet movement and today’s damage.</small>
          </div>
          <b>7D Preview</b>
        </summary>
        <section className="chart-preview">
          <div className="section-title">
            <span>$BROKE Chart</span>
            <small>7D Preview</small>
          </div>

          <MiniChart chartDays={chartDays} />

          <div className="damage-card">
            <div>
              <small>Today&apos;s Damage</small>
              <strong>
                {summary.todaySpent > 0
                  ? `-${money(summary.todaySpent, settings.currency)}`
                  : money(0, settings.currency)}
              </strong>
              <span>tracked today</span>
            </div>
            <img src={A.chartFrog} alt="Chart frog" />
          </div>
        </section>
      </details>

      <details className="clean-details">
        <summary>
          <span>Recent Expenses</span>
          <b>{expenses.length} total</b>
        </summary>
        <RecentExpenses
          settings={settings}
          expenses={expenses}
          onDeleteExpense={onDeleteExpense}
          onOpenAdd={onOpenAdd}
        />
      </details>

      <details className="clean-details">
        <summary>
          <span>Account / Sync</span>
          <b>{telegram.isTelegram ? "Telegram" : webAuth.authenticated ? "Synced" : "Web"}</b>
        </summary>
        <WebTelegramSyncCard telegram={telegram} webAuth={webAuth} />
      </details>
    </div>
  );
}


function ActiveStreakProofCard({
  status,
  onOpenDailyRoutine,
}: {
  status: ActiveStreakProofStatus;
  onOpenDailyRoutine: () => void;
}) {
  const tone = status.eligible
    ? "eligible"
    : status.recoveryMode || status.recoveryAvailable
      ? "recovery"
      : status.activeToday
        ? "active"
        : "building";
  const actionLabels = status.todayActions.map(activeStreakProofActionLabel);
  const progressPercent = status.eligible
    ? 100
    : Math.round((status.progressDays / ACTIVE_STREAK_ELIGIBILITY_DAYS) * 100);

  return (
    <section className={`active-streak-proof-card ${tone}`}>
      <div className="active-streak-proof-head">
        <div>
          <span>BROKE Active Streak</span>
          <strong>{status.label}</strong>
          <small>{status.detail}</small>
        </div>
        <b>{status.currentStreak}d</b>
      </div>

      <div className="active-streak-proof-meter" aria-hidden="true">
        <i style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="active-streak-proof-grid">
        <article>
          <span>Eligibility line</span>
          <strong>7+ days</strong>
        </article>
        <article>
          <span>Today</span>
          <strong>{status.activeToday ? "Routine complete" : status.recoveryMode ? "Recovery" : "Needs routine"}</strong>
        </article>
        <article>
          <span>Proof source</span>
          <strong>Daily Routine</strong>
        </article>
      </div>

      {actionLabels.length > 0 && (
        <div className="active-streak-proof-actions-done">
          {actionLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      )}

      <div className="active-streak-proof-buttons single-action">
        <button type="button" className="primary" onClick={onOpenDailyRoutine}>Open Daily Routine</button>
      </div>

      <p>
        Active Streak is no longer counted by separate Rewards buttons. Finish the full Daily Routine: 7/7 actions, with Share on X as the final public proof task.
      </p>
    </section>
  );
}

function RewardsStatusHero({
  status,
  settings,
  onOpenDailyRoutine,
}: {
  status: ActiveStreakProofStatus;
  settings: Settings;
  onOpenDailyRoutine: () => void;
}) {
  const verified = Boolean(settings.wallet.isVerified);
  const verifiedHolderBalance = verified ? settings.wallet.brokeBalance : 0;
  const meetsMinHold = verifiedHolderBalance >= FUTURE_HOLDER_REWARD_MIN_BALANCE;
  const hasVerifiedBalance = verifiedHolderBalance > 0;
  const rewardReady = verified && meetsMinHold && status.eligible;
  const todayState = status.activeToday
    ? "Routine complete"
    : status.recoveryMode || status.recoveryAvailable
      ? "Recovery"
      : "Needs Daily Routine";

  return (
    <section className={`rewards-status-hero ${rewardReady ? "ready" : status.recoveryAvailable ? "recovery" : "building"}`}>
      <div className="rewards-status-copy">
        <span>Rewards Status</span>
        <h2>{rewardReady ? "Ready for future snapshots." : getActiveStreakRewardReadinessLabel(status, settings)}</h2>
        <p>
          Active Streak proof now comes from one source only: complete the full Daily Routine. Separate clicks in Rewards no longer protect the streak.
        </p>
      </div>

      <div className="rewards-status-orbit">
        <strong>{status.currentStreak}d</strong>
        <small>{status.eligible ? "7+ active" : `${status.progressDays}/${ACTIVE_STREAK_ELIGIBILITY_DAYS} built`}</small>
      </div>

      <div className="rewards-status-grid">
        <article>
          <span>Today</span>
          <strong>{todayState}</strong>
        </article>
        <article>
          <span>Wallet</span>
          <strong>{verified ? "Verified" : "Not verified"}</strong>
        </article>
        <article>
          <span>Holder tier</span>
          <strong>{hasVerifiedBalance ? settings.wallet.holderTier.label : verified ? "No tier" : "Verify first"}</strong>
        </article>
        <article>
          <span>Reward status</span>
          <strong>{rewardReady ? "Ready" : "Preparing"}</strong>
        </article>
      </div>

      <div className="rewards-status-actions single-action">
        <button type="button" onClick={onOpenDailyRoutine}>Open Daily Routine</button>
      </div>
    </section>
  );
}

function DailyProofChecklist({
  status,
  onOpenDailyRoutine,
}: {
  status: ActiveStreakProofStatus;
  onOpenDailyRoutine: () => void;
}) {
  const done = status.todayActions.includes("daily_routine");
  const checklistTitle = status.recoveryAvailable || status.recoveryMode
    ? "Recovery proof"
    : "Today’s proof";
  const checklistDetail = status.recoveryAvailable || status.recoveryMode
    ? "Complete today’s full Daily Routine to restore the missed day."
    : "Complete the full 7/7 Daily Routine to protect today’s Active Streak.";

  return (
    <section className="daily-proof-checklist-card routine-only-proof-card">
      <div className="daily-proof-checklist-head">
        <div>
          <span>{checklistTitle}</span>
          <strong>{done ? "1/1 completed" : "0/1 completed"}</strong>
          <small>{checklistDetail}</small>
        </div>
        <b>{done ? "Safe" : status.recoveryAvailable ? "Recovery" : "Open"}</b>
      </div>

      <div className="daily-proof-checklist-list single-action">
        <button
          type="button"
          className={done ? "done" : "pending"}
          onClick={onOpenDailyRoutine}
        >
          <b>{done ? "✓" : "□"}</b>
          <span>
            <strong>Finish Daily Routine</strong>
            <small>Track the 7 real actions. The final task must be Share on X.</small>
          </span>
        </button>
      </div>
    </section>
  );
}

function RewardsNotificationPrepCard({
  status,
  prefs,
  onChange,
}: {
  status: ActiveStreakProofStatus;
  prefs: RewardNotificationPrefs;
  onChange: Dispatch<SetStateAction<RewardNotificationPrefs>>;
}) {
  const [copied, setCopied] = useState(false);
  const activePrefsCount = [prefs.dailyProofReminder, prefs.recoveryReminder, prefs.milestoneReminder].filter(Boolean).length;
  const todayNotificationLine = status.activeToday
    ? "Already safe."
    : status.recoveryAvailable
      ? "Daily Routine needed."
      : "Needs Daily Routine.";
  const milestoneLine = status.eligible
    ? "7-day line live."
    : `${Math.max(0, ACTIVE_STREAK_ELIGIBILITY_DAYS - status.progressDays)}d left.`;

  function updatePrefs(patch: Partial<RewardNotificationPrefs>) {
    onChange((current) => normalizeRewardNotificationPrefs({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
    triggerHaptic("light");
  }

  async function copyReminderPlan() {
    try {
      await navigator.clipboard.writeText(buildRewardReminderCopy(status, prefs));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      notifyApp("Reminder plan copied", "Use it for Telegram/push setup notes.");
    } catch {
      notifyApp("Copy unavailable", "Clipboard access was blocked by this browser.", "info");
    }
  }

  return (
    <section className="reward-notification-prep-card">
      <div className="reward-notification-head">
        <div>
          <span>Reminder prep</span>
          <strong>{activePrefsCount}/3 active</strong>
          <small>Local settings for future Telegram/push alerts.</small>
        </div>
        <b>{prefs.reminderTime}</b>
      </div>

      <div className="reward-notification-state-grid">
        <article className={prefs.dailyProofReminder ? "active" : "muted"}>
          <span>Daily proof</span>
          <strong>{prefs.dailyProofReminder ? "Armed" : "Off"}</strong>
          <small>{todayNotificationLine}</small>
        </article>
        <article className={prefs.recoveryReminder ? "active" : "muted"}>
          <span>Recovery alert</span>
          <strong>{prefs.recoveryReminder ? "Armed" : "Off"}</strong>
          <small>Missed day warning.</small>
        </article>
        <article className={prefs.milestoneReminder ? "active" : "muted"}>
          <span>7-day line</span>
          <strong>{prefs.milestoneReminder ? "Armed" : "Off"}</strong>
          <small>{milestoneLine}</small>
        </article>
      </div>

      <div className="reward-notification-toggle-row">
        <button
          type="button"
          className={prefs.dailyProofReminder ? "active" : ""}
          aria-pressed={prefs.dailyProofReminder}
          onClick={() => updatePrefs({ dailyProofReminder: !prefs.dailyProofReminder })}
        >
          Daily proof
        </button>
        <button
          type="button"
          className={prefs.recoveryReminder ? "active" : ""}
          aria-pressed={prefs.recoveryReminder}
          onClick={() => updatePrefs({ recoveryReminder: !prefs.recoveryReminder })}
        >
          Recovery
        </button>
        <button
          type="button"
          className={prefs.milestoneReminder ? "active" : ""}
          aria-pressed={prefs.milestoneReminder}
          onClick={() => updatePrefs({ milestoneReminder: !prefs.milestoneReminder })}
        >
          7-day reached
        </button>
      </div>

      <div className="reward-notification-time-row" aria-label="Preferred reminder time">
        {REWARD_NOTIFICATION_TIME_OPTIONS.map((time) => (
          <button
            type="button"
            key={time}
            className={prefs.reminderTime === time ? "active" : ""}
            aria-pressed={prefs.reminderTime === time}
            onClick={() => updatePrefs({ reminderTime: time })}
          >
            {time}
          </button>
        ))}
      </div>

      <div className="reward-notification-actions">
        <button type="button" onClick={copyReminderPlan}>{copied ? "Copied" : "Copy reminder plan"}</button>
      </div>
    </section>
  );
}

function FutureRewardsExplainerCard() {
  const terms = [
    {
      label: "Live streak",
      value: "7+ active days",
      detail: "Current state, not a one-time unlock.",
    },
    {
      label: "Wallet proof",
      value: "Verified owner",
      detail: "Message signature only. No token movement.",
    },
    {
      label: "Minimum hold",
      value: "100K $BROKE",
      detail: "Planned minimum for future eligibility.",
    },
    {
      label: "Balance-share",
      value: "Your % of eligible pool",
      detail: "Your eligible BROKE / total eligible BROKE.",
    },
    {
      label: "Reward epoch",
      value: "Not live yet",
      detail: "No payouts, claims, or Creator Fee distribution now.",
    },
  ];

  return (
    <section className="future-rewards-explainer-card rewards-clarity-card">
      <div className="section-title compact-title">
        <span>Quick reward terms</span>
        <small>Full details are in the ? guide.</small>
      </div>
      <div className="future-rewards-steps reward-term-grid">
        {terms.map((item) => (
          <article key={item.label}>
            <b>{item.label}</b>
            <strong>{item.value}</strong>
            <span>{item.detail}</span>
          </article>
        ))}
      </div>
    </section>
  );
}


function RewardSnapshotLedgerCard({
  settings,
  status,
}: {
  settings: Settings;
  status: ActiveStreakProofStatus;
}) {
  const walletVerified = Boolean(settings.wallet.isVerified);
  const verifiedBalance = walletVerified ? settings.wallet.brokeBalance : 0;
  const minHoldReady = verifiedBalance >= FUTURE_HOLDER_REWARD_MIN_BALANCE;
  const snapshotReady = walletVerified && minHoldReady && status.eligible;
  const missing = [
    !walletVerified ? "wallet proof" : "",
    walletVerified && !minHoldReady ? "100K+ hold" : "",
    !status.eligible ? "7+ active streak" : "",
  ].filter(Boolean);
  const balanceSharePreview = snapshotReady
    ? "Calculated at snapshot"
    : missing.length
      ? `Needs ${missing.join(" + ")}`
      : "Waiting for epoch";

  return (
    <section className={`reward-snapshot-ledger-card ${snapshotReady ? "ready" : "building"}`}>
      <div className="section-title compact-title">
        <span>Reward Snapshot Ledger</span>
        <small>Project snapshot foundation. No payout or claim active.</small>
      </div>
      <div className="reward-snapshot-ledger-grid">
        <article>
          <span>Snapshot status</span>
          <strong>{snapshotReady ? "Ready to be counted" : "Preparing"}</strong>
          <small>Final eligibility is locked only when an epoch snapshot is run.</small>
        </article>
        <article>
          <span>Eligible balance</span>
          <strong>{walletVerified ? formatTokenAmount(verifiedBalance) : "Verify first"}</strong>
          <small>Only verified wallet balance can enter the ledger.</small>
        </article>
        <article>
          <span>Active streak</span>
          <strong>{status.currentStreak}d / {ACTIVE_STREAK_ELIGIBILITY_DAYS}+</strong>
          <small>{status.eligible ? "Live streak ready" : "Keep building daily proof."}</small>
        </article>
        <article>
          <span>Balance-share</span>
          <strong>{balanceSharePreview}</strong>
          <small>Your verified eligible BROKE / total verified eligible BROKE.</small>
        </article>
      </div>
      <div className="reward-snapshot-ledger-note">
        <b>Ledger only</b>
        <span>v59.27 prepares epochs and snapshot rows. Token transfers, claims, staking, payouts, and Creator Fee distribution stay off.</span>
      </div>
    </section>
  );
}

function RewardsLaunchOverviewCard({
  status,
  settings,
  onTrackLeak,
  onOpenProfile,
}: {
  status: ActiveStreakProofStatus;
  settings: Settings;
  onTrackLeak: () => void;
  onOpenProfile: () => void;
}) {
  const verified = Boolean(settings.wallet.isVerified);
  const meetsMinHold = settings.wallet.brokeBalance >= FUTURE_HOLDER_REWARD_MIN_BALANCE;
  const rewardReady = verified && meetsMinHold && status.eligible;
  const todayLabel = status.activeToday
    ? "Protected today"
    : status.recoveryAvailable
      ? "Recovery available"
      : "Needs Daily Routine";
  const verifiedHolderBalance = verified ? settings.wallet.brokeBalance : 0;
  const holdLabel = !verified
    ? "Verify first"
    : meetsMinHold
      ? `${formatTokenAmount(verifiedHolderBalance)} BROKE`
      : `${formatTokenAmount(Math.max(0, FUTURE_HOLDER_REWARD_MIN_BALANCE - verifiedHolderBalance))} left`;

  return (
    <section className={`rewards-launch-overview-card ${rewardReady ? "ready" : status.recoveryAvailable ? "recovery" : "building"}`}>
      <div className="rewards-launch-eyebrow">
        <span>Starting June 1</span>
        <b>Prep</b>
      </div>

      <div className="rewards-launch-main">
        <div>
          <span>Holder Rewards</span>
          <strong>Daily Routine matters.</strong>
          <p>June 1 prep. Hold $BROKE, verify wallet, keep 7+ Daily Routine days.</p>
        </div>
        <aside>
          <strong>{status.currentStreak}d</strong>
          <small>{status.eligible ? "7+ active" : `${status.progressDays}/${ACTIVE_STREAK_ELIGIBILITY_DAYS}`}</small>
        </aside>
      </div>

      <div className="rewards-launch-rules">
        <article>
          <span>Pool</span>
          <strong>Up to 50%</strong>
          <small>Creator Fee allocation, once opened.</small>
        </article>
        <article>
          <span>Min hold</span>
          <strong>100K $BROKE</strong>
          <small>{holdLabel}</small>
        </article>
        <article>
          <span>Streak</span>
          <strong>7+ routines</strong>
          <small>Daily Routine only.</small>
        </article>
        <article>
          <span>Split</span>
          <strong>Balance-share</strong>
          <small>Your eligible BROKE / total eligible BROKE.</small>
        </article>
      </div>

      <div className="rewards-launch-status-row">
        <span className={verified ? "done" : "pending"}>{verified ? "Wallet verified" : "Verify wallet"}</span>
        <span className={meetsMinHold ? "done" : "pending"}>{meetsMinHold ? "100K+ hold" : "100K+ needed"}</span>
        <span className={status.eligible ? "done" : "pending"}>{status.eligible ? "7+ streak live" : "Build 7-day streak"}</span>
        <span className={status.activeToday ? "done" : status.recoveryAvailable ? "recovery" : "pending"}>{todayLabel}</span>
      </div>

      <div className="rewards-launch-actions">
        <button type="button" className="primary" onClick={onTrackLeak}>Open Daily Routine</button>
        <button type="button" onClick={onOpenProfile}>Wallet proof</button>
      </div>
    </section>
  );
}

function ActiveStreakShareCard({
  settings,
  status,
  shareInitData,
}: {
  settings: Settings;
  status: ActiveStreakProofStatus;
  shareInitData: string;
}) {
  const [copied, setCopied] = useState(false);
  const [imageSharing, setImageSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const publicIdentityName = getPublicIdentityName(settings);
  const publicIdentityStatus = getPublicIdentityStatus(settings);
  const publicIdentityAvatar = getPublicProfileAvatarImage(settings);
  const identityStyle = getIdentityStyleMeta(settings.identity.identityStyle);
  const shareText = buildActiveStreakProofShareText(settings, status);
  const verifiedHolderBalance = settings.wallet.isVerified ? settings.wallet.brokeBalance : 0;
  const rewardStatusReady = settings.wallet.isVerified && verifiedHolderBalance >= FUTURE_HOLDER_REWARD_MIN_BALANCE && status.eligible;
  const holderTierLine = verifiedHolderBalance > 0
    ? settings.wallet.holderTier.label
    : settings.wallet.isVerified
      ? "Building"
      : "Verify first";
  const todayLine = status.activeToday
    ? "Today protected"
    : status.recoveryAvailable
      ? `${status.recoveryActionsNeeded} recovery actions left`
      : "Needs proof today";
  const loggedLabels = status.todayActions.length
    ? status.todayActions.map(activeStreakProofActionShortLabel).join(" · ")
    : "Daily Routine not done yet";

  async function copyProofText() {
    try {
      await navigator.clipboard.writeText(shareText);
      triggerHaptic("success");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      notifyApp("Copy unavailable", "Your browser blocked clipboard access.", "info");
    }
  }

  function openXShare() {
    triggerHaptic("light");
    markDailyRoutineAction("sharedProgress");
    openExternalUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
  }

  async function shareProofImage() {
    if (!shareCardRef.current || imageSharing) return;

    triggerHaptic("light");
    setImageSharing(true);

    try {
      const imageFile = await createShareImageFileFromElement(shareCardRef.current);
      const nativeShared = await tryNativeImageShare(imageFile);

      if (nativeShared) return;

      if (!shareInitData) {
        downloadImageFile(imageFile);
        notifyApp("Proof card downloaded", "Open inside Telegram to send it directly to the bot.");
        return;
      }

      try {
        await sendShareImageViaBot(imageFile, shareInitData, shareText);
        notifyApp("Proof card sent", "Open your Telegram bot chat and forward it anywhere.");
      } catch {
        downloadImageFile(imageFile);
        notifyApp("PNG downloaded", "Bot delivery failed, so the proof card was saved as a file.");
      }
    } catch {
      notifyApp("Sharing unavailable", "Proof image sharing was cancelled or is not supported here.");
    } finally {
      setImageSharing(false);
    }
  }

  return (
    <section className="active-streak-share-section">
      <div className="section-title compact-title">
        <span>Shareable Active Streak Card</span>
        <small>Public proof without income, payday, or real balance.</small>
      </div>

      <div className={`active-streak-share-card premium-share-card identity-share-style-${settings.identity.identityStyle || "classic"}`} ref={shareCardRef}>
        <img className="premium-share-card-art" src={SHARE_CARD_PUBLIC_ASSETS.background} alt="" />
        <div className="active-streak-share-top">
          <img src={publicIdentityAvatar} alt="" />
          <div>
            <span>$BROKE ACTIVE PROOF</span>
            <strong>{publicIdentityName}</strong>
            <small>{publicIdentityStatus}</small>
          </div>
          <b>{identityStyle.badge}</b>
        </div>

        <div className="active-streak-share-main">
          <div>
            <span>Active streak</span>
            <strong>{status.currentStreak}/{ACTIVE_STREAK_ELIGIBILITY_DAYS}+</strong>
            <small>{status.eligible ? "Eligible streak live" : `${status.progressDays}/${ACTIVE_STREAK_ELIGIBILITY_DAYS} days built`}</small>
          </div>
          <div>
            <span>Today</span>
            <strong>{todayLine}</strong>
            <small>{loggedLabels}</small>
          </div>
        </div>

        <div className="active-streak-share-proof-grid">
          <article>
            <span>Wallet</span>
            <strong>{settings.wallet.isVerified ? "Verified" : "Not verified"}</strong>
          </article>
          <article>
            <span>Holder tier</span>
            <strong>{holderTierLine}</strong>
          </article>
          <article>
            <span>Reward status</span>
            <strong>{rewardStatusReady ? "Ready" : "Preparing"}</strong>
          </article>
        </div>

        <footer>
          <strong>Keep 7+ active days to stay eligible.</strong>
          <span>Future Holder Rewards use live proof, not a one-time unlock.</span>
        </footer>
      </div>

      <div className="active-streak-share-actions">
        <button type="button" onClick={openXShare}>Share on X</button>
        <button type="button" onClick={copyProofText}>{copied ? "Copied" : "Copy text"}</button>
        <button type="button" onClick={shareProofImage}>{imageSharing ? "Preparing..." : "Share image"}</button>
      </div>
    </section>
  );
}

function ActiveHolderEligibilityStrip({
  status,
  wallet,
}: {
  status: ActiveStreakProofStatus;
  wallet: Settings["wallet"];
}) {
  const verified = Boolean(wallet.isVerified);
  const hasBalance = wallet.brokeBalance > 0;
  const ready = verified && hasBalance && status.eligible;
  const label = ready
    ? "Reward eligible foundation"
    : !verified
      ? "Verify wallet"
      : !hasBalance
        ? "Hold $BROKE"
        : status.recoveryMode || status.recoveryAvailable
          ? "Recovery mode"
          : `${status.progressDays}/${ACTIVE_STREAK_ELIGIBILITY_DAYS} active days`;

  return (
    <section className={`active-holder-eligibility-strip ${ready ? "ready" : status.recoveryMode ? "recovery" : "building"}`}>
      <div>
        <span>Future Holder Rewards</span>
        <strong>{label}</strong>
        <small>
          Verified wallet + $BROKE balance + live 7+ day Daily Routine streak. If the streak breaks, eligibility pauses.
        </small>
      </div>
      <b>{ready ? "Ready" : status.eligible ? "Streak ready" : `${status.currentStreak}d`}</b>
    </section>
  );
}


function WeeklyBehaviorReportHomeCard({
  settings,
  weeklyPatternSummary,
  patternHistory,
  walletHp,
  identityStats,
  leaderboard,
  shareInitData,
  onOpenChart,
  onOpenAdd,
}: {
  settings: Settings;
  weeklyPatternSummary: WeeklyPatternSummary;
  patternHistory: PatternHistoryRecord[];
  walletHp: number;
  identityStats: V2IdentityStats;
  leaderboard: LeaderboardState | null;
  shareInitData: string;
  onOpenChart: () => void;
  onOpenAdd: () => void;
}) {
  const currentWeekKey = getIsoWeekPatternKey();
  const previousRead = patternHistory.find((record) => record.periodKey !== currentWeekKey) || null;
  const strongestCard = weeklyPatternSummary.cards[0] || null;
  const secondaryCard = weeklyPatternSummary.cards[1] || null;
  const pressureDelta = previousRead ? weeklyPatternSummary.leakPressure - previousRead.leakPressure : 0;
  const comparisonText = previousRead
    ? pressureDelta > 6
      ? `Leak pressure is up ${pressureDelta}% vs ${previousRead.periodLabel}.`
      : pressureDelta < -6
        ? `Leak pressure is down ${Math.abs(pressureDelta)}% vs ${previousRead.periodLabel}.`
        : `Leak pressure is almost flat vs ${previousRead.periodLabel}.`
    : "Track this week and next week to unlock comparison.";
  const [weeklyShareCopied, setWeeklyShareCopied] = useState(false);
  const [weeklyImageSharing, setWeeklyImageSharing] = useState(false);
  const weeklyShareCardRef = useRef<HTMLDivElement | null>(null);
  const reportTitle =
    weeklyPatternSummary.confidence === "Waiting"
      ? "Weekly report needs a few honest leaks"
      : weeklyPatternSummary.strongestPattern || weeklyPatternSummary.headline;
  const publicIdentityName = getPublicIdentityName(settings);
  const publicIdentityStatus = getPublicIdentityStatus(settings);
  const publicIdentityStyle = getIdentityStyleMeta(settings.identity.identityStyle);
  const publicIdentityAvatar = getPublicProfileAvatarImage(settings);
  const selectedShareMetrics = getEnabledProfileShareItems(settings, walletHp)
    .map((id) =>
      buildProfileShareMetric({
        id,
        settings,
        walletHp,
        identityStats,
        leaderboard,
      })
    )
    .slice(0, 4);
  const shareText = [
    `${publicIdentityName} on $BROKE`,
    `${publicIdentityStyle.label} · ${publicIdentityStatus}`,
    "",
    "My weekly behavior report:",
    reportTitle,
    strongestCard ? `Top signal: ${strongestCard.label}` : "Top signal: still learning",
    `Pressure: ${weeklyPatternSummary.leakPressure}%`,
    `Next move: ${weeklyPatternSummary.nextMove}`,
    "",
    ...selectedShareMetrics.map((metric) => `${metric.label}: ${metric.value}${metric.detail ? ` (${metric.detail})` : ""}`),
    "",
    "No income. No real balance. No debt details.",
    "Broke, but self-aware.",
  ].filter(Boolean).join("\n");

  async function copySafeReport() {
    triggerHaptic("light");

    try {
      await navigator.clipboard?.writeText(shareText);
      setWeeklyShareCopied(true);
      window.setTimeout(() => setWeeklyShareCopied(false), 1600);
      notifyApp("Weekly report copied", "Safe text copied without income, real balance or debt details.");
    } catch {
      notifyApp("Copy unavailable", "Open Chart and copy the report manually.");
    }
  }

  async function shareWeeklyImage() {
    if (!weeklyShareCardRef.current || weeklyImageSharing) return;

    try {
      triggerHaptic("light");
      setWeeklyImageSharing(true);

      const imageFile = await createShareImageFileFromElement(weeklyShareCardRef.current);
      const nativeShared = await tryNativeImageShare(imageFile);

      if (nativeShared) {
        return;
      }

      try {
        await sendShareImageViaBot(imageFile, shareInitData, shareText);
        notifyApp("Weekly card sent", "Open your Telegram bot chat and forward it anywhere.");
      } catch {
        downloadImageFile(imageFile);
        notifyApp("PNG downloaded", "Telegram WebView could not send directly, so the weekly card was saved as a file.");
      }
    } catch {
      notifyApp("Sharing unavailable", "Weekly image sharing was cancelled or is not supported by this browser.");
    } finally {
      setWeeklyImageSharing(false);
    }
  }

  return (
    <section className={`weekly-behavior-home-card ${weeklyPatternSummary.tone}`}>
      <div className="weekly-behavior-home-head">
        <div>
          <span>Weekly Behavior Report</span>
          <strong>{reportTitle}</strong>
          <p>{weeklyPatternSummary.body}</p>
        </div>
        <b>{weeklyPatternSummary.confidence}</b>
      </div>

      <div className="weekly-behavior-home-grid">
        <article>
          <span>Pattern</span>
          <strong>{strongestCard?.label || "Learning"}</strong>
          <small>{strongestCard?.title || "Use trigger chips to teach the app."}</small>
        </article>
        <article>
          <span>Pressure</span>
          <strong>{weeklyPatternSummary.leakPressure}%</strong>
          <small>{money(weeklyPatternSummary.totalLeaks, settings.currency)} weekly leaks</small>
        </article>
        <article>
          <span>Change</span>
          <strong>{previousRead ? (pressureDelta > 0 ? "+" : "") + `${pressureDelta}%` : "new"}</strong>
          <small>{comparisonText}</small>
        </article>
      </div>

      <div className="weekly-behavior-home-signals">
        {strongestCard && (
          <span className={strongestCard.severity}>{strongestCard.label}: {strongestCard.value}</span>
        )}
        {secondaryCard && (
          <span className={secondaryCard.severity}>{secondaryCard.label}: {secondaryCard.value}</span>
        )}
        {!strongestCard && <span>Waiting for 3–4 useful records</span>}
      </div>

      <div className="weekly-behavior-next-move">
        <small>One next move</small>
        <strong>{weeklyPatternSummary.nextMove}</strong>
      </div>

      <section className={`safe-weekly-share-card premium-share-card identity-share-style-${settings.identity.identityStyle || "classic"}`} ref={weeklyShareCardRef}>
        <div className="safe-weekly-share-top">
          <div className="safe-weekly-share-identity">
            <img src={publicIdentityAvatar} alt="" />
            <div>
              <span>$BROKE WEEKLY</span>
              <strong>{publicIdentityName}</strong>
              <small>{publicIdentityStatus}</small>
            </div>
          </div>
          <b>{publicIdentityStyle.badge}</b>
        </div>

        <div className="safe-weekly-share-main">
          <span>Weekly pattern</span>
          <strong>{reportTitle}</strong>
          <p>{weeklyPatternSummary.nextMove}</p>
        </div>

        <div className="safe-weekly-share-grid">
          <article>
            <span>Confidence</span>
            <strong>{weeklyPatternSummary.confidence}</strong>
          </article>
          <article>
            <span>Pressure</span>
            <strong>{weeklyPatternSummary.leakPressure}%</strong>
          </article>
          <article>
            <span>Top signal</span>
            <strong>{strongestCard?.label || "Learning"}</strong>
          </article>
        </div>

        {selectedShareMetrics.length > 0 && (
          <div className="safe-weekly-share-profile-grid">
            {selectedShareMetrics.map((metric) => (
              <article key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                {metric.detail && <small>{metric.detail}</small>}
              </article>
            ))}
          </div>
        )}

        <footer>
          <span>No income · No real balance · No debt details</span>
          <b>Broke, but self-aware.</b>
        </footer>
      </section>

      <div className="weekly-behavior-home-actions safe-weekly-share-actions">
        <button type="button" className="primary" onClick={onOpenChart}>
          Open full report
        </button>
        <button type="button" onClick={copySafeReport}>
          {weeklyShareCopied ? "Copied" : "Copy safe text"}
        </button>
        <button type="button" onClick={shareWeeklyImage}>
          {weeklyImageSharing ? "Preparing image..." : "Share weekly card"}
        </button>
        {weeklyPatternSummary.confidence === "Waiting" && (
          <button type="button" onClick={onOpenAdd}>
            Track leak
          </button>
        )}
      </div>
    </section>
  );
}









function ComebackModeCard({
  settings,
  comeback,
  onAddMissedLeak,
  onRestartToday,
  onShowDamage,
  onOpenSurvival,
}: {
  settings: Settings;
  comeback: ComebackState;
  onAddMissedLeak: () => void;
  onRestartToday: () => void;
  onShowDamage: () => void;
  onOpenSurvival: () => void;
}) {
  return (
    <section className="comeback-mode-card">
      <div className="section-title">
        <span>Comeback Mode</span>
        <small>Restart without shame.</small>
      </div>

      <div className="comeback-hero">
        <img
          src={PREMIUM_VISUAL_PACK.comebackModeMascot}
          alt=""
          onError={(event) => {
            event.currentTarget.src = A.progressFlame;
          }}
        />
        <div>
          <span>Last active: {comeback.lastActiveLabel}</span>
          <strong>{comeback.title}</strong>
          <p>{comeback.body}</p>
        </div>
      </div>

      <div className="comeback-insight">
        <strong>{comeback.insight}</strong>
        <p>
          Start with one honest record. Do not try to rebuild the whole missing period perfectly.
        </p>
      </div>

      <div className="comeback-grid">
        <div>
          <span>Days away</span>
          <strong>{comeback.daysAway}</strong>
        </div>
        <div>
          <span>Estimated hidden leak</span>
          <strong>{money(comeback.estimatedMissedLeaks, settings.currency)}</strong>
        </div>
        <div>
          <span>Known pressure</span>
          <strong>
            {comeback.biggestLeakAmount > 0
              ? categoryDisplayLabel(settings, comeback.biggestLeakCategory)
              : "none yet"}
          </strong>
        </div>
      </div>

      <div className="comeback-actions">
        <button type="button" className="primary" onClick={onAddMissedLeak}>
          Add missed leak
        </button>
        <button type="button" onClick={onRestartToday}>
          Restart today
        </button>
        <button type="button" onClick={onShowDamage}>
          Show damage
        </button>
        <button type="button" onClick={onOpenSurvival}>
          Open Survival
        </button>
      </div>
    </section>
  );
}

function SmartHomeFocusCard({
  settings,
  summary,
  allExpenses,
  identityStats,
  onOpenAdd,
  onOpenChart,
}: {
  settings: Settings;
  summary: {
    todaySpent: number;
    totalLeaks: number;
    walletHp: number;
    streak: Streak;
  };
  allExpenses: Expense[];
  identityStats: V2IdentityStats;
  onOpenAdd: () => void;
  onOpenChart: () => void;
}) {
  const [routineActions, setRoutineActions] = useState<DailyRoutineActions>(() =>
    readDailyRoutineActions()
  );
  const [goal, setGoal] = useState<ReturnHookGoal | null>(() => readReturnHookGoal());

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRoutineActions(readDailyRoutineActions());
      setGoal(readReturnHookGoal());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [summary.todaySpent, summary.totalLeaks, summary.streak.currentStreak, allExpenses.length]);

  const todayKey = dayKey(new Date());
  const tomorrowKey = getTomorrowDayKey();
  const hasExpense = allExpenses.length > 0 || summary.todaySpent > 0;
  const chartChecked = routineActions.checkedChart;
  const shareDone = routineActions.sharedProgress;
  const activeGoal = goal?.targetDate === todayKey ? goal : null;
  const futureGoal = goal?.targetDate === tomorrowKey ? goal : null;

  const biggestLeak =
    identityStats.biggestLeakAmount > 0
      ? categoryDisplayLabel(settings, identityStats.biggestLeakCategory)
      : "none yet";

  const stepStates = [
    hasExpense,
    hasExpense && chartChecked,
    hasExpense && chartChecked && shareDone,
    Boolean(futureGoal || activeGoal),
  ];

  const progress = Math.round((stepStates.filter(Boolean).length / stepStates.length) * 100);

  function openSharePanel() {
    triggerHaptic("light");

    if (typeof document === "undefined") return;

    const element = document.getElementById("share-result-card-panel") as HTMLDetailsElement | null;

    if (element) {
      element.open = true;
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  function lockTomorrowGoal() {
    triggerHaptic("success");

    const nextGoal: ReturnHookGoal = {
      createdAt: new Date().toISOString(),
      targetDate: tomorrowKey,
      action:
        !hasExpense
          ? "add_leak"
          : !chartChecked
            ? "check_chart"
            : !shareDone
              ? "share_result"
              : "keep_streak",
      title:
        !hasExpense
          ? "Return tomorrow and track one real leak"
          : !chartChecked
            ? "Return tomorrow and check the chart"
            : !shareDone
              ? "Return tomorrow and share a safe result"
              : "Return tomorrow and keep the streak alive",
      detail:
        !hasExpense
          ? "Create real wallet movement instead of a fake click."
          : !chartChecked
            ? "See if the same leak repeats and where wallet pressure starts."
            : !shareDone
              ? "Use a public card. It hides income and real balance."
              : "One small real action tomorrow is enough to keep momentum.",
    };

    writeReturnHookGoal(nextGoal);
    setGoal(nextGoal);
  }

  function openChartStep() {
    triggerHaptic("light");
    markDailyRoutineAction("checkedChart");
    setRoutineActions(readDailyRoutineActions());
    onOpenChart();
  }

  function runActiveGoal() {
    if (!activeGoal) return;

    if (activeGoal.action === "check_chart") {
      openChartStep();
      return;
    }

    if (activeGoal.action === "share_result") {
      openSharePanel();
      return;
    }

    onOpenAdd();
  }

  const activeGoalDone =
    activeGoal?.action === "add_leak"
      ? hasExpense
      : activeGoal?.action === "check_chart"
        ? chartChecked
        : activeGoal?.action === "share_result"
          ? shareDone
          : activeGoal?.action === "keep_streak"
            ? summary.streak.currentStreak > 0
            : false;

  const focus =
    activeGoal && !activeGoalDone
      ? {
          eyebrow: "Today’s Focus",
          title: activeGoal.title,
          detail: activeGoal.detail,
          button: "Continue goal",
          action: runActiveGoal,
        }
      : !hasExpense
        ? {
            eyebrow: "Today’s Focus",
            title: "Track your first real leak",
            detail:
              "One real expense unlocks Wallet HP, Chart, Rewards, Growth Lab and public share cards.",
            button: "Track first leak",
            action: onOpenAdd,
          }
        : !chartChecked
          ? {
              eyebrow: "Today’s Focus",
              title: "Check your wallet movement",
              detail:
                "Open Chart once and find the category that started the biggest pressure.",
              button: "Check Chart",
              action: openChartStep,
            }
          : !shareDone
            ? {
                eyebrow: "Today’s Focus",
                title: "Share safe public progress",
                detail:
                  "Open the public card. It hides income and real balance, but shows discipline.",
                button: "Open share card",
                action: openSharePanel,
              }
            : !futureGoal
              ? {
                  eyebrow: "Tomorrow Hook",
                  title: "Lock one reason to return tomorrow",
                  detail:
                    "The app should not end after one session. Set tomorrow’s real action now.",
                  button: "Lock tomorrow goal",
                  action: lockTomorrowGoal,
                }
              : {
                  eyebrow: "Tomorrow Hook",
                  title: "Tomorrow goal is locked",
                  detail: futureGoal.detail,
                  button: "Keep streak alive",
                  action: onOpenAdd,
                };

  return (
    <section className="smart-home-focus-card">
      <div className="section-title">
        <span>Today’s Focus</span>
        <small>{progress}% path</small>
      </div>

      <div className="smart-focus-hero">
        <img
          src={PREMIUM_VISUAL_PACK.homeMascot}
          alt=""
          onError={(event) => {
            event.currentTarget.src = A.walletMascot;
          }}
        />
        <div>
          <span>{focus.eyebrow}</span>
          <strong>{focus.title}</strong>
          <p>{focus.detail}</p>
        </div>
      </div>

      <div className="smart-focus-progress">
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="smart-focus-steps">
        <article className={hasExpense ? "done" : "active"}>
          <b>{hasExpense ? "✓" : "1"}</b>
          <div>
            <strong>Track</strong>
            <span>First real leak</span>
          </div>
        </article>

        <article className={chartChecked ? "done" : hasExpense ? "active" : "locked"}>
          <b>{chartChecked ? "✓" : "2"}</b>
          <div>
            <strong>Read</strong>
            <span>Chart movement</span>
          </div>
        </article>

        <article className={shareDone ? "done" : chartChecked ? "active" : "locked"}>
          <b>{shareDone ? "✓" : "3"}</b>
          <div>
            <strong>Share</strong>
            <span>Public result</span>
          </div>
        </article>

        <article className={futureGoal || activeGoal ? "done" : shareDone ? "active" : "locked"}>
          <b>{futureGoal || activeGoal ? "✓" : "4"}</b>
          <div>
            <strong>Return</strong>
            <span>Tomorrow hook</span>
          </div>
        </article>
      </div>

      <div className="smart-focus-metrics">
        <div>
          <span>Wallet HP</span>
          <strong>{summary.walletHp}/100</strong>
        </div>
        <div>
          <span>Biggest leak</span>
          <strong>{biggestLeak}</strong>
        </div>
        <div>
          <span>Today</span>
          <strong>{money(summary.todaySpent, settings.currency)}</strong>
        </div>
      </div>

      <button type="button" onClick={focus.action}>
        {focus.button}
      </button>

      <small className="smart-focus-note">
        Start with one action. This screen is the loop: track a leak, read the pattern, then come back tomorrow.
      </small>
    </section>
  );
}

function FirstThreeDayJourneyCard({
  summary,
  allExpenses,
  identityStats,
  onOpenAdd,
  onOpenChart,
}: {
  summary: {
    todaySpent: number;
    walletHp: number;
    streak: Streak;
  };
  allExpenses: Expense[];
  identityStats: V2IdentityStats;
  onOpenAdd: () => void;
  onOpenChart: () => void;
}) {
  const [routineActions, setRoutineActions] = useState<DailyRoutineActions>(() =>
    readDailyRoutineActions()
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRoutineActions(readDailyRoutineActions());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [summary.todaySpent, identityStats.biggestLeakAmount, summary.streak.currentStreak]);

  const day1Done = allExpenses.length > 0 || summary.todaySpent > 0;
  const day2Unlocked = day1Done;
  const day2Done = day1Done && routineActions.checkedChart;
  const day3Unlocked = day2Done;
  const day3Done = day2Done && routineActions.sharedProgress;
  const completedCount = [day1Done, day2Done, day3Done].filter(Boolean).length;

  function openChartStep() {
    triggerHaptic("light");
    markDailyRoutineAction("checkedChart");
    setRoutineActions(readDailyRoutineActions());
    onOpenChart();
  }

  function openShareStep() {
    triggerHaptic("light");

    if (typeof document === "undefined") return;

    const element = document.getElementById("share-result-card-panel") as HTMLDetailsElement | null;

    if (element) {
      element.open = true;
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  const nextAction =
    !day1Done
      ? {
          label: "Track Day 1 leak",
          onClick: onOpenAdd,
        }
      : !day2Done
        ? {
            label: "Check Chart",
            onClick: openChartStep,
          }
        : !day3Done
          ? {
              label: "Open share card",
              onClick: openShareStep,
            }
          : {
              label: "Keep streak alive",
              onClick: onOpenAdd,
            };

  return (
    <section className="first-journey-card">
      <div className="section-title">
        <span>First 3-Day User Journey</span>
        <small>{completedCount}/3 complete</small>
      </div>

      <div className="first-journey-hero">
        <img src={A.progressFlame} alt="" />
        <div>
          <strong>Turn first use into a habit.</strong>
          <p>
            Follow the first 3 days: track a real leak, read the chart, then share
            a safe public result card.
          </p>
        </div>
      </div>

      <div className="first-journey-progress">
        <i style={{ width: `${(completedCount / 3) * 100}%` }} />
      </div>

      <div className="first-journey-grid">
        <article className={day1Done ? "done" : "active"}>
          <b>{day1Done ? "✓" : "1"}</b>
          <div>
            <strong>Day 1 — Track first leak</strong>
            <span>
              {day1Done
                ? "First real movement detected."
                : "Add one real Needed / Maybe / Not needed expense."}
            </span>
          </div>
        </article>

        <article className={day2Done ? "done" : day2Unlocked ? "active" : "locked"}>
          <b>{day2Done ? "✓" : "2"}</b>
          <div>
            <strong>Day 2 — Check Chart</strong>
            <span>
              {day2Done
                ? "Chart checked. You saw the wallet movement."
                : day2Unlocked
                  ? "Open Chart and find the biggest movement."
                  : "Unlock this after your first expense."}
            </span>
          </div>
        </article>

        <article className={day3Done ? "done" : day3Unlocked ? "active" : "locked"}>
          <b>{day3Done ? "✓" : "3"}</b>
          <div>
            <strong>Day 3 — Share result</strong>
            <span>
              {day3Done
                ? "Public progress shared."
                : day3Unlocked
                  ? "Open the public card and share without private numbers."
                  : "Unlock this after checking Chart."}
            </span>
          </div>
        </article>
      </div>

      <div className="first-journey-bottom">
        <div>
          <span>Wallet HP</span>
          <strong>{summary.walletHp}/100</strong>
        </div>
        <div>
          <span>Biggest leak</span>
          <strong>
            {identityStats.biggestLeakAmount > 0
              ? categoryLabel(identityStats.biggestLeakCategory)
              : "none yet"}
          </strong>
        </div>
      </div>

      <button type="button" onClick={nextAction.onClick}>
        {nextAction.label}
      </button>
    </section>
  );
}

function DailyReturnHookCard({
  summary,
  allExpenses,
  identityStats,
  onOpenAdd,
  onOpenChart,
}: {
  summary: {
    todaySpent: number;
    walletHp: number;
    streak: Streak;
  };
  allExpenses: Expense[];
  identityStats: V2IdentityStats;
  onOpenAdd: () => void;
  onOpenChart: () => void;
}) {
  const [routineActions, setRoutineActions] = useState<DailyRoutineActions>(() =>
    readDailyRoutineActions()
  );
  const [goal, setGoal] = useState<ReturnHookGoal | null>(() => readReturnHookGoal());

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRoutineActions(readDailyRoutineActions());
      setGoal(readReturnHookGoal());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [summary.todaySpent, summary.streak.currentStreak, allExpenses.length]);

  const todayKey = dayKey(new Date());
  const tomorrowKey = getTomorrowDayKey();

  const suggestedAction: {
    action: ReturnHookAction;
    title: string;
    detail: string;
    button: string;
  } =
    allExpenses.length === 0
      ? {
          action: "add_leak",
          title: "Return tomorrow and track one real leak",
          detail: "The first return should create real wallet movement, not a fake click.",
          button: "Track first leak",
        }
      : !routineActions.checkedChart
        ? {
            action: "check_chart",
            title: "Return tomorrow and check the chart",
            detail: "See if the same leak repeats and where wallet pressure starts.",
            button: "Check Chart",
          }
        : !routineActions.sharedProgress
          ? {
              action: "share_result",
              title: "Return tomorrow and share a safe result",
              detail: "Use a public card. It hides income and real balance.",
              button: "Open share card",
            }
          : {
              action: "keep_streak",
              title: "Return tomorrow and keep the streak alive",
              detail: "One small real action tomorrow is better than a perfect plan today.",
              button: "Keep streak alive",
            };

  const activeGoal = goal?.targetDate === todayKey ? goal : null;
  const futureGoal = goal?.targetDate === tomorrowKey ? goal : null;
  const displayGoal = activeGoal || futureGoal || null;
  const isTodayGoal = Boolean(activeGoal);

  const activeGoalCompleted =
    activeGoal?.action === "add_leak"
      ? allExpenses.length > 0 || summary.todaySpent > 0
      : activeGoal?.action === "check_chart"
        ? routineActions.checkedChart
        : activeGoal?.action === "share_result"
          ? routineActions.sharedProgress
          : activeGoal?.action === "keep_streak"
            ? summary.streak.currentStreak > 0
            : false;

  function lockTomorrowGoal() {
    triggerHaptic("success");

    const nextGoal: ReturnHookGoal = {
      createdAt: new Date().toISOString(),
      targetDate: tomorrowKey,
      action: suggestedAction.action,
      title: suggestedAction.title,
      detail: suggestedAction.detail,
    };

    writeReturnHookGoal(nextGoal);
    setGoal(nextGoal);
  }

  function openSharePanel() {
    triggerHaptic("light");

    if (typeof document === "undefined") return;

    const element = document.getElementById("share-result-card-panel") as HTMLDetailsElement | null;

    if (element) {
      element.open = true;
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  function runGoalAction(action: ReturnHookAction) {
    if (action === "check_chart") {
      markDailyRoutineAction("checkedChart");
      setRoutineActions(readDailyRoutineActions());
      onOpenChart();
      return;
    }

    if (action === "share_result") {
      openSharePanel();
      return;
    }

    onOpenAdd();
  }

  const buttonLabel =
    isTodayGoal && activeGoalCompleted
      ? "Return hook completed"
      : isTodayGoal && activeGoal
        ? suggestedAction.button
        : futureGoal
          ? "Tomorrow goal locked"
          : "Lock tomorrow goal";

  return (
    <section className="daily-return-hook-card">
      <div className="section-title">
        <span>Return Hook</span>
        <small>{displayGoal ? (isTodayGoal ? "today" : "tomorrow") : "not locked"}</small>
      </div>

      <div className="return-hook-hero">
        <img src={A.dailyCheck} alt="" />
        <div>
          <strong>{displayGoal?.title || suggestedAction.title}</strong>
          <p>{displayGoal?.detail || suggestedAction.detail}</p>
        </div>
      </div>

      <div className="return-hook-grid">
        <div>
          <span>Target</span>
          <strong>{displayGoal?.targetDate || tomorrowKey}</strong>
        </div>
        <div>
          <span>Wallet HP</span>
          <strong>{summary.walletHp}/100</strong>
        </div>
        <div>
          <span>Biggest leak</span>
          <strong>
            {identityStats.biggestLeakAmount > 0
              ? categoryLabel(identityStats.biggestLeakCategory)
              : "none yet"}
          </strong>
        </div>
      </div>

      <button
        type="button"
        className={isTodayGoal && activeGoalCompleted ? "completed" : ""}
        disabled={Boolean(futureGoal && !isTodayGoal)}
        onClick={() => {
          if (isTodayGoal && activeGoal) {
            runGoalAction(activeGoal.action);
            return;
          }

          lockTomorrowGoal();
        }}
      >
        {buttonLabel}
      </button>

      <small className="return-hook-note">
        No fake completion. The app only counts real tracking, chart checks, or real share actions.
      </small>
    </section>
  );
}

function FirstRunPathCard({ onOpenAdd }: { onOpenAdd: () => void }) {
  return (
    <section className="v58-empty-card v58-first-run-card">
      <div className="v58-empty-head">
        <img src={A.walletMascot} alt="" />
        <div>
          <span>Start here</span>
          <strong>Your wallet has no movement yet.</strong>
          <p>
            Track one real expense to unlock Wallet HP, Chart movement, Rewards scenarios,
            Growth Lab and share cards.
          </p>
        </div>
      </div>

      <div className="v58-empty-steps">
        <article>
          <b>1</b>
          <div>
            <strong>Add first expense</strong>
            <span>Use a real spend, not a fake test.</span>
          </div>
        </article>
        <article>
          <b>2</b>
          <div>
            <strong>Mark the leak</strong>
            <span>Needed, Maybe or Not needed.</span>
          </div>
        </article>
        <article>
          <b>3</b>
          <div>
            <strong>Unlock the system</strong>
            <span>Chart, Rewards, Growth and reports become real.</span>
          </div>
        </article>
      </div>

      <button type="button" className="v58-empty-primary" onClick={onOpenAdd}>
        Track first leak
      </button>
    </section>
  );
}

function LifeProfileSummaryCard({ settings }: { settings: Settings }) {
  return (
    <section className="life-profile-summary">
      <div>
        <span>Life Profile</span>
        <strong>{settings.profile.lifeMode}</strong>
        <small>
          {settings.profile.country} · {settings.currency} · {settings.currencyMode === "convert" ? "Convert mode" : "Display mode"} · {settings.profile.incomeStyle}
        </small>
      </div>

      <b>{settings.profile.hasRent ? "Rent mode" : "No-rent mode"}</b>
    </section>
  );
}

function LifeProfileEditor({
  settings,
  setSettings,
  exchangeRateStatus = "idle",
  exchangeRateError = "",
  conversionSourceCount = 0,
  oldCurrencyRepairCount = 0,
}: {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  exchangeRateStatus?: ExchangeRateStatus;
  exchangeRateError?: string;
  conversionSourceCount?: number;
  oldCurrencyRepairCount?: number;
}) {
  const hasOldCurrencyRepairCandidates = oldCurrencyRepairCount > 0;
  const currencyStatusClassName = `currency-conversion-status-card${hasOldCurrencyRepairCandidates ? " warning" : ""}`;
  const currencyStatusLabel =
    exchangeRateStatus === "loading"
      ? "Loading rates"
      : exchangeRateStatus === "ready"
        ? hasOldCurrencyRepairCandidates
          ? "Rates ready · repair old data"
          : "Rates ready"
        : exchangeRateStatus === "partial"
          ? "Some rates unavailable"
          : exchangeRateStatus === "error"
            ? "Rate unavailable"
            : conversionSourceCount > 0
              ? "Waiting for entries"
              : "No mixed currencies yet";
  const currencyStatusDescription =
    exchangeRateError ||
    (hasOldCurrencyRepairCandidates
      ? `${oldCurrencyRepairCount} old expense row${oldCurrencyRepairCount === 1 ? "" : "s"} do not remember original currency yet. Use Old Data Currency Repair before judging converted totals.`
      : conversionSourceCount > 0
        ? `${conversionSourceCount} source currenc${conversionSourceCount === 1 ? "y" : "ies"} checked against ${settings.currency} and USD reference.`
        : "New entries remember currency automatically. Old entries can be marked with Old Data Currency Repair if needed.");

  function updateProfile<K extends keyof Settings["profile"]>(
    key: K,
    value: Settings["profile"][K]
  ) {
    setSettings((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [key]: value,
      },
      fixedCosts:
        key === "hasRent" && value === false
          ? {
              ...prev.fixedCosts,
              rent: 0,
            }
          : prev.fixedCosts,
    }));
  }

  return (
    <section className="settings-group life-profile-card">
      <h3>Life Profile</h3>
      <p>Make the tracker fit your country, currency, and lifestyle.</p>

      <div className="profile-field">
        <span>Language</span>
        <select
          className="settings-select profile-select"
          value={settings.language}
          onChange={(event) =>
            setSettings((prev) => ({
              ...prev,
              language: event.target.value as Language,
            }))
          }
        >
          {languageOptions.map((language) => (
            <option key={language.value} value={language.value}>
              {language.label}
            </option>
          ))}
        </select>
      </div>

      <div className="profile-field">
        <span>Country preset</span>
        <select
          className="settings-select profile-select"
          value={settings.profile.region}
          onChange={(event) => {
            const region = event.target.value as RegionPreset;
            setSettings((prev) => applyRegionPreset(prev, region));
          }}
        >
          {regionOptions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div className="profile-field">
        <span>Your country</span>
        <input
          className="profile-country-input"
          value={settings.profile.country}
          placeholder="Type your country"
          onChange={(event) =>
            setSettings((prev) => ({
              ...prev,
              profile: {
                ...prev.profile,
                region: "Custom",
                country: event.target.value,
              },
            }))
          }
        />
      </div>

      <div className="profile-field">
        <span>Display currency</span>
        <select
          className="settings-select profile-select"
          value={settings.currency}
          onChange={(event) =>
            setSettings((prev) => ({
              ...prev,
              currency: normalizeCurrency(event.target.value, prev.currency),
            }))
          }
        >
          {currencyOptions.map((currency) => (
            <option key={currency.value} value={currency.value}>
              {currency.label}
            </option>
          ))}
        </select>
        <small className="currency-foundation-note">
          Display currency controls how totals are shown. It does not rewrite saved income, fixed costs, expenses, Growth targets, or Debt Radar amounts.
        </small>
      </div>

      <div className="currency-mode-panel">
        <div className="currency-mode-heading">
          <span>Currency Mode</span>
          <b>{settings.currencyMode === "convert" ? "Conversion on" : "Display only"}</b>
        </div>
        <div className="currency-mode-options" role="group" aria-label="Currency Mode">
          {currencyModeOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className={settings.currencyMode === option.value ? "active" : ""}
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  currencyMode: option.value,
                }))
              }
            >
              <strong>{option.label}</strong>
              <small>{option.helper}</small>
            </button>
          ))}
        </div>
        <small className="currency-foundation-note">
          {settings.currencyMode === "convert"
            ? "Converted display is live across expenses, income, fixed costs, Growth targets, and Debt Radar. Non-USD views also show an approximate USD reference where available."
            : "Display-only keeps old behavior: app labels change, but stored numbers are not converted or rewritten."}
        </small>
        {settings.currencyMode === "convert" && (
          <div className={currencyStatusClassName}>
            <span>Exchange-rate status</span>
            <strong>{currencyStatusLabel}</strong>
            <small>{currencyStatusDescription}</small>
            {settings.currency !== usdReferenceCurrency && (
              <small className="currency-edge-note">
                Main values use {settings.currency}. The USD line is only an approximate global reference.
              </small>
            )}
          </div>
        )}
      </div>

      <div className="profile-block">
        <span>Life mode</span>
        <div className="profile-chip-grid">
          {lifeModeOptions.map((mode) => (
            <button
              type="button"
              key={mode}
              className={settings.profile.lifeMode === mode ? "active" : ""}
              onClick={() => setSettings((prev) => applyLifeMode(prev, mode))}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="profile-block">
        <span>Income style</span>
        <div className="profile-chip-grid compact">
          {incomeStyleOptions.map((style) => (
            <button
              type="button"
              key={style}
              className={settings.profile.incomeStyle === style ? "active" : ""}
              onClick={() => updateProfile("incomeStyle", style)}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="profile-toggle-line"
        onClick={() => updateProfile("hasRent", !settings.profile.hasRent)}
      >
        <span>Rent applies</span>
        <strong>{settings.profile.hasRent ? "Yes" : "No"}</strong>
      </button>

      <EditableMoneyLine
        label="Work / study hours per month"
        value={settings.profile.workHoursPerMonth}
        currency={settings.currency}
        plainNumber
        onChange={(value) => updateProfile("workHoursPerMonth", Math.max(safeNumber(value), 1))}
      />
    </section>
  );
}

function V2IdentityPanel({
  settings,
  identityStats,
}: {
  settings: Settings;
  identityStats: V2IdentityStats;
}) {
  const survivalTone =
    identityStats.weeklySurvivalScore >= 75
      ? "green"
      : identityStats.weeklySurvivalScore >= 55
        ? "orange"
        : "red";

  const tiles = [
    {
      label: "Survival Score",
      value: `${identityStats.weeklySurvivalScore}/100`,
      detail: "Your weekly wallet score.",
      icon: A.challengeTrophy,
    },
    {
      label: "Biggest Leak",
      value:
        identityStats.biggestLeakAmount > 0
          ? categoryDisplayLabel(settings, identityStats.biggestLeakCategory)
          : "None",
      detail:
        identityStats.biggestLeakAmount > 0
          ? `${money(identityStats.biggestLeakAmount, settings.currency)} this week`
          : "No visible leak this week.",
      icon: getCategoryIcon(identityStats.biggestLeakCategory),
    },
    {
      label: "Hours Lost",
      value: `${identityStats.lifeHoursLost}h`,
      detail: "Time traded for leaks.",
      icon: A.calendar,
    },
    {
      label: "Status",
      value: identityStats.status,
      detail: identityStats.statusDetail,
      icon: A.walletMascot,
    },
  ];

  return (
    <section className={`v2-identity-card ${survivalTone}`}>
      <div className="section-title">
        <span>Wallet Survival</span>
        <small>This week</small>
      </div>

      <div className="v2-identity-hero">
        <div>
          <strong>Find the leak before it becomes your lifestyle.</strong>
          <p>
            See what drains you, how much it costs, and what to fix next.
          </p>
        </div>

        <div className="v2-score-orb">
          <span>{identityStats.weeklySurvivalScore}</span>
          <small>survival</small>
        </div>
      </div>

      <div className="v2-identity-grid">
        {tiles.map((tile) => (
          <div key={tile.label} className="v2-identity-tile">
            <img src={tile.icon} alt="" />
            <span>{tile.label}</span>
            <strong>{tile.value}</strong>
            <small>{tile.detail}</small>
          </div>
        ))}
      </div>

      <div className="v2-doom-alert">
        <img src={identityStats.weeklySurvivalScore < 55 ? A.badgePressureMode : A.help} alt="" />
        <div>
          <strong>{identityStats.doomAlertTitle}</strong>
          <span>{identityStats.doomAlertBody}</span>
        </div>
      </div>

      <div className="v2-self-roast">
        <span>Self-roast insight</span>
        <strong>{identityStats.selfRoast}</strong>
      </div>
    </section>
  );
}

function NextBestActionCard({
  summary,
  identityStats,
  expenses,
  onOpenAdd,
}: {
  summary: {
    totalIncome: number;
    fixedCosts: number;
    spentThisMonth: number;
    totalLeaks: number;
    realBalance: number;
    walletHp: number;
    todaySpent: number;
    streak: Streak;
  };
  identityStats: V2IdentityStats;
  expenses: Expense[];
  onOpenAdd: () => void;
}) {
  const today = dayKey(new Date());
  const todayExpenses = expenses.filter(
    (expense) => dayKey(new Date(expense.createdAt)) === today
  );
  const hasTrackedToday = todayExpenses.length > 0;
  const leakLabel =
    identityStats.biggestLeakAmount > 0
      ? categoryLabel(identityStats.biggestLeakCategory)
      : "random spending";

  const action = !hasTrackedToday
    ? {
        title: "Track one real expense",
        body: "Start with one honest record. The app gets smarter after real data.",
        button: "Track now",
        tone: "green",
      }
    : summary.walletHp < 55
      ? {
          title: `Avoid ${leakLabel} today`,
          body: "Wallet HP is under pressure. Protect it by blocking the biggest leak for one day.",
          button: "Add context",
          tone: "red",
        }
      : identityStats.biggestLeakAmount > 0
        ? {
            title: `Control ${leakLabel}`,
            body: "This is the loudest leak right now. Keep it under control before it becomes normal.",
            button: "Track next move",
            tone: "orange",
          }
        : {
            title: "Keep the wallet clean",
            body: "No major leak detected. Keep tracking and protect the streak.",
            button: "Track now",
            tone: "green",
          };

  return (
    <section className={`next-action-card ${action.tone}`}>
      <div>
        <span>Next Best Action</span>
        <strong>{action.title}</strong>
        <p>{action.body}</p>
      </div>

      <button type="button" onClick={onOpenAdd}>
        {action.button}
      </button>
    </section>
  );
}

function ReportsPanel({
  settings,
  summary,
  expenses,
  identityStats,
  exchangeRates,
  shareInitData,
}: {
  settings: Settings;
  summary: {
    totalIncome: number;
    fixedCosts: number;
    spentThisMonth: number;
    totalLeaks: number;
    realBalance: number;
    walletHp: number;
    todaySpent: number;
    streak: Streak;
  };
  expenses: Expense[];
  identityStats: V2IdentityStats;
  exchangeRates: ExchangeRateMap;
  shareInitData: string;
}) {
  const [reportSharing, setReportSharing] = useState<"daily" | "weekly" | null>(null);
  const dailyReportCardRef = useRef<HTMLDivElement | null>(null);
  const weeklyReportCardRef = useRef<HTMLDivElement | null>(null);
  const todayExpenses = useMemo(() => getTodayExpenses(expenses), [expenses]);
  const weekExpenses = useMemo(() => getLastSevenDaysExpenses(expenses), [expenses]);

  const todayLeakAmount = sumLeakExpenses(todayExpenses);
  const weeklyLeakAmount = sumLeakExpenses(weekExpenses);

  const todayTopCategory = getCategoryTrackedSummaries(todayExpenses)[0];
  const weekTopCategory = getCategoryTrackedSummaries(weekExpenses)[0];

  const todayStatus =
    todayLeakAmount <= 0
      ? "Clean day"
      : todayLeakAmount <= Math.max(summary.totalIncome - summary.fixedCosts, 1) * 0.02
        ? "Small leak"
        : "Leak warning";

  const weeklyStatus = identityStats.status;
  const dailyScore = clamp(100 - Math.round((todayLeakAmount / Math.max(summary.totalIncome - summary.fixedCosts, 1)) * 100), 0, 100);
  const dailySpentUsdNote = usdReferenceNote(summary.todaySpent, settings.currency, settings, exchangeRates);
  const dailyLeaksUsdNote = usdReferenceNote(todayLeakAmount, settings.currency, settings, exchangeRates);
  const weeklyLeaksUsdNote = usdReferenceNote(weeklyLeakAmount, settings.currency, settings, exchangeRates);
  const weeklyBiggestLeakUsdNote = usdReferenceNote(identityStats.biggestLeakAmount, settings.currency, settings, exchangeRates);
  const publicIdentityName = getPublicIdentityName(settings);
  const publicIdentityStatus = getPublicIdentityStatus(settings);
  const publicIdentityAvatar = getPublicProfileAvatarImage(settings);

  const dailyReportText = [
    "$BROKE Daily Wallet Report",
    "",
    `Status: ${todayStatus}`,
    `Wallet HP: ${summary.walletHp}/100`,
    `Spent today: ${money(summary.todaySpent, settings.currency)}`,
    `Leaks today: ${money(todayLeakAmount, settings.currency)}`,
    dailySpentUsdNote || dailyLeaksUsdNote
      ? `USD reference: ${[dailySpentUsdNote && `spent ${dailySpentUsdNote}`, dailyLeaksUsdNote && `leaks ${dailyLeaksUsdNote}`].filter(Boolean).join(" · ")}`
      : "",
    `Top category: ${todayTopCategory ? categoryLabel(todayTopCategory.category) : "none"}`,
    `Daily score: ${dailyScore}/100`,
    "",
    "Find the leak before it becomes your lifestyle.",
    "Smoke is broke.",
  ].filter(Boolean).join("\n");

  const weeklyReportText = [
    "$BROKE Weekly Wallet Report",
    "",
    `Status: ${weeklyStatus}`,
    `Survival Score: ${identityStats.weeklySurvivalScore}/100`,
    `Wallet HP: ${summary.walletHp}/100`,
    `Weekly leaks: ${money(weeklyLeakAmount, settings.currency)}`,
    `Biggest leak: ${
      identityStats.biggestLeakAmount > 0
        ? `${categoryDisplayLabel(settings, identityStats.biggestLeakCategory)} (${money(identityStats.biggestLeakAmount, settings.currency)})`
        : "none"
    }`,
    weeklyLeaksUsdNote || weeklyBiggestLeakUsdNote
      ? `USD reference: ${[weeklyLeaksUsdNote && `weekly leaks ${weeklyLeaksUsdNote}`, weeklyBiggestLeakUsdNote && identityStats.biggestLeakAmount > 0 && `biggest leak ${weeklyBiggestLeakUsdNote}`].filter(Boolean).join(" · ")}`
      : "",
    `Life hours lost: ${identityStats.lifeHoursLost}h`,
    "",
    "Find the leak before it becomes your lifestyle.",
    "Smoke is broke.",
  ].filter(Boolean).join("\n");

  async function copyReportText(text: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        notifyApp("Report copied", "Paste it in Telegram, X, or anywhere you want.");
        return;
      }
    } catch {
      // Clipboard can be blocked in Telegram WebView.
    }

    window.prompt("Copy report", text);
  }

  async function shareReport(
    text: string,
    title: string,
    cardRef: React.RefObject<HTMLDivElement | null>,
    reportType: "daily" | "weekly"
  ) {
    if (reportSharing) return;

    triggerHaptic("light");
    setReportSharing(reportType);

    try {
      if (cardRef.current) {
        const imageFile = await createShareImageFileFromElement(cardRef.current);
        const nativeShared = await tryNativeImageShare(imageFile);

        if (nativeShared) {
          return;
        }

        if (shareInitData) {
          try {
            await sendShareImageViaBot(imageFile, shareInitData, text);
            notifyApp("Report sent", "Open your Telegram bot chat and forward it anywhere.");
            return;
          } catch {
            // Continue to download fallback below.
          }
        }

        downloadImageFile(imageFile);
        notifyApp("Report downloaded", "You can post the PNG in Telegram or X.");
        return;
      }
    } catch {
      // Image generation can fail in some WebViews. Use text fallback.
    } finally {
      setReportSharing(null);
    }

    await copyReportText(text);
  }

  return (
    <section className="reports-panel">
      <div className="reports-grid">
        <article className={`report-card ${todayLeakAmount > 0 ? "warning" : "clean"}`}>
          <div className="report-head">
            <img src={todayTopCategory ? getCategoryIcon(todayTopCategory.category) : A.walletMascot} alt="" />
            <div>
              <span>$BROKE DAILY REPORT</span>
              <strong>{todayStatus}</strong>
              <small>Today</small>
            </div>
          </div>

          <div className="report-metrics">
            <div>
              <span>Spent</span>
              <strong>{money(summary.todaySpent, settings.currency)}</strong>
              {dailySpentUsdNote && <small className="share-usd-reference-note">{dailySpentUsdNote}</small>}
            </div>
            <div>
              <span>Leaks</span>
              <strong>{money(todayLeakAmount, settings.currency)}</strong>
              {dailyLeaksUsdNote && <small className="share-usd-reference-note">{dailyLeaksUsdNote}</small>}
            </div>
            <div>
              <span>Score</span>
              <strong>{dailyScore}/100</strong>
            </div>
          </div>

          <p>
            {todayTopCategory
              ? `${categoryLabel(todayTopCategory.category)} is the main movement today.`
              : "No clear category movement yet today."}
          </p>

          <div className="report-public-share-card daily premium-share-card" ref={dailyReportCardRef}>
            <img
              className="premium-share-card-art"
              src={SHARE_CARD_PUBLIC_ASSETS.daily}
              alt=""
            />
            <div className="report-public-share-top share-card-identity-top">
              <div className="share-card-identity-line">
                <img className="share-card-avatar" src={publicIdentityAvatar} alt="" />
                <div>
                  <span>$BROKE DAILY REPORT</span>
                  <strong>{todayStatus}</strong>
                  <small>{publicIdentityName} · Wallet HP {summary.walletHp}/100</small>
                </div>
              </div>
              <img className="share-card-signal-icon" src={todayTopCategory ? getCategoryIcon(todayTopCategory.category) : A.walletMascot} alt="" />
            </div>

            <div className="report-public-share-grid">
              <div>
                <span>Spent</span>
                <strong>{money(summary.todaySpent, settings.currency)}</strong>
                {dailySpentUsdNote && <small className="share-usd-reference-note">{dailySpentUsdNote}</small>}
              </div>
              <div>
                <span>Leaks</span>
                <strong>{money(todayLeakAmount, settings.currency)}</strong>
                {dailyLeaksUsdNote && <small className="share-usd-reference-note">{dailyLeaksUsdNote}</small>}
              </div>
              <div>
                <span>Score</span>
                <strong>{dailyScore}/100</strong>
              </div>
              <div>
                <span>Top category</span>
                <strong>{todayTopCategory ? categoryLabel(todayTopCategory.category) : "None"}</strong>
              </div>
            </div>

            <div className="report-public-share-footer">
              <strong>Find the leak before it becomes your lifestyle.</strong>
              <span>$BROKE Life Tracker · Smoke is broke.</span>
            </div>
          </div>

          <button
            type="button"
            disabled={reportSharing === "daily"}
            onClick={() =>
              shareReport(
                dailyReportText,
                "$BROKE Daily Wallet Report",
                dailyReportCardRef,
                "daily"
              )
            }
          >
            {reportSharing === "daily" ? "Preparing image..." : "Share daily report"}
          </button>
        </article>

        <article className={`report-card ${identityStats.weeklySurvivalScore >= 75 ? "clean" : "warning"}`}>
          <div className="report-head">
            <img src={identityStats.biggestLeakAmount > 0 ? getCategoryIcon(identityStats.biggestLeakCategory) : A.challengeTrophy} alt="" />
            <div>
              <span>$BROKE WEEKLY REPORT</span>
              <strong>{weeklyStatus}</strong>
              <small>Last 7 days</small>
            </div>
          </div>

          <div className="report-metrics">
            <div>
              <span>Survival</span>
              <strong>{identityStats.weeklySurvivalScore}/100</strong>
            </div>
            <div>
              <span>Leaks</span>
              <strong>{money(weeklyLeakAmount, settings.currency)}</strong>
              {weeklyLeaksUsdNote && <small className="share-usd-reference-note">{weeklyLeaksUsdNote}</small>}
            </div>
            <div>
              <span>Hours lost</span>
              <strong>{identityStats.lifeHoursLost}h</strong>
            </div>
          </div>

          <p>
            {weekTopCategory
              ? `${categoryLabel(weekTopCategory.category)} is the biggest category this week.`
              : "No major weekly leak is visible yet."}
          </p>

          <div className="report-public-share-card weekly premium-share-card" ref={weeklyReportCardRef}>
            <img
              className="premium-share-card-art"
              src={SHARE_CARD_PUBLIC_ASSETS.weekly}
              alt=""
            />
            <div className="report-public-share-top share-card-identity-top">
              <div className="share-card-identity-line">
                <img className="share-card-avatar" src={publicIdentityAvatar} alt="" />
                <div>
                  <span>$BROKE WEEKLY REPORT</span>
                  <strong>{weeklyStatus}</strong>
                  <small>{publicIdentityName} · Survival {identityStats.weeklySurvivalScore}/100</small>
                </div>
              </div>
              <img className="share-card-signal-icon" src={identityStats.biggestLeakAmount > 0 ? getCategoryIcon(identityStats.biggestLeakCategory) : A.challengeTrophy} alt="" />
            </div>

            <div className="report-public-share-grid">
              <div>
                <span>Survival</span>
                <strong>{identityStats.weeklySurvivalScore}/100</strong>
              </div>
              <div>
                <span>Leaks</span>
                <strong>{money(weeklyLeakAmount, settings.currency)}</strong>
                {weeklyLeaksUsdNote && <small className="share-usd-reference-note">{weeklyLeaksUsdNote}</small>}
              </div>
              <div>
                <span>Hours lost</span>
                <strong>{identityStats.lifeHoursLost}h</strong>
              </div>
              <div>
                <span>Biggest leak</span>
                <strong>
                  {identityStats.biggestLeakAmount > 0
                    ? categoryDisplayLabel(settings, identityStats.biggestLeakCategory)
                    : "None"}
                </strong>
              </div>
            </div>

            <div className="report-public-share-footer">
              <strong>Find the leak before it becomes your lifestyle.</strong>
              <span>$BROKE Life Tracker · Smoke is broke.</span>
            </div>
          </div>

          <button
            type="button"
            disabled={reportSharing === "weekly"}
            onClick={() =>
              shareReport(
                weeklyReportText,
                "$BROKE Weekly Wallet Report",
                weeklyReportCardRef,
                "weekly"
              )
            }
          >
            {reportSharing === "weekly" ? "Preparing image..." : "Share weekly report"}
          </button>
        </article>
      </div>

      <div className="reports-note">
        <strong>Privacy rule:</strong>
        <span>Reports never expose income or real balance.</span>
      </div>
    </section>
  );
}

function DailyRoutinePanel({
  settings,
  summary,
  expenses,
  onRoutineComplete,
}: {
  settings: Settings;
  summary: {
    totalIncome: number;
    fixedCosts: number;
    spentThisMonth: number;
    totalLeaks: number;
    realBalance: number;
    walletHp: number;
    todaySpent: number;
    streak: Streak;
  };
  expenses: Expense[];
  onRoutineComplete: () => Promise<boolean>;
}) {
  const today = dayKey(new Date());
  const rewardRequestRef = useRef(false);
  const [actions, setActions] = useState<DailyRoutineActions>(() =>
    readDailyRoutineActions(today)
  );
  const [rewardClaimed, setRewardClaimed] = useState(() =>
    readDailyRoutineReward(today).claimed
  );
  const [routineProofLogged, setRoutineProofLogged] = useState(() =>
    buildActiveStreakProofStatus(readActiveStreakProofState()).todayActions.includes("daily_routine")
  );

  useEffect(() => {
    markDailyRoutineAction("openedApp");
    setActions(readDailyRoutineActions(today));
    setRewardClaimed(readDailyRoutineReward(today).claimed);
    setRoutineProofLogged(buildActiveStreakProofStatus(readActiveStreakProofState()).todayActions.includes("daily_routine"));

    const interval = window.setInterval(() => {
      setActions(readDailyRoutineActions(today));
      setRewardClaimed(readDailyRoutineReward(today).claimed);
      setRoutineProofLogged(buildActiveStreakProofStatus(readActiveStreakProofState()).todayActions.includes("daily_routine"));
    }, 800);

    return () => window.clearInterval(interval);
  }, [today]);

  const todayExpenses = useMemo(() => {
    return expenses.filter((expense) => dayKey(new Date(expense.createdAt)) === today);
  }, [expenses, today]);

  const routineItems: Array<{
    id: DailyRoutineActionKey;
    title: string;
    body: string;
    icon: string;
    done: boolean;
    actionLabel?: string;
  }> = [
    {
      id: "openedApp",
      title: "Open the app",
      body: "Start the day with a wallet check.",
      icon: A.appFrog,
      done: actions.openedApp,
    },
    {
      id: "reviewedWallet",
      title: "Check wallet state",
      body: `Real balance: ${money(summary.realBalance, settings.currency)} · Wallet HP ${summary.walletHp}/100.`,
      icon: A.walletHp,
      done: actions.reviewedWallet,
      actionLabel: "Checked",
    },
    {
      id: "reviewedDay",
      title: todayExpenses.length > 0 ? "Review today’s spend" : "Confirm no extra spend",
      body: todayExpenses.length > 0
        ? `${todayExpenses.length} record${todayExpenses.length === 1 ? "" : "s"} today. Review the decision instead of forcing another leak.`
        : "No spend day still counts. Confirm you had no extra wallet leak today.",
      icon: todayExpenses.length > 0 ? A.leaks : A.dailyCheck,
      done: actions.reviewedDay,
      actionLabel: todayExpenses.length > 0 ? "Reviewed" : "No spend",
    },
    {
      id: "lockedNextMove",
      title: "Lock one next move",
      body: "Choose one small discipline move for the next 24h. No spending required.",
      icon: A.challengeTrophy,
      done: actions.lockedNextMove,
      actionLabel: "Locked",
    },
    {
      id: "checkedChart",
      title: "Check $BROKE Chart",
      body: "Open the Chart tab and look at today’s wallet signal.",
      icon: A.navChart,
      done: actions.checkedChart,
    },
    {
      id: "checkedSave",
      title: "Check Rewards plan",
      body: "Open Rewards and review your eligibility state.",
      icon: A.navWhatIf,
      done: actions.checkedSave,
    },
    {
      id: "sharedProgress",
      title: "Share on X",
      body: "Use a Share on X button. Copy, Telegram share, or image download does not complete this task.",
      icon: A.export,
      done: actions.sharedProgress,
    },
  ];

  const completedCount = routineItems.filter((item) => item.done).length;
  const routineScore = Math.round((completedCount / routineItems.length) * 100);
  const routineComplete = completedCount === routineItems.length;
  const routineStatus =
    routineComplete
      ? routineProofLogged || rewardClaimed
        ? "Streak protected"
        : "7/7 complete"
      : `${completedCount}/7 done`;

  useEffect(() => {
    if (!routineComplete || routineProofLogged || rewardRequestRef.current) return;

    rewardRequestRef.current = true;

    onRoutineComplete()
      .then((claimed) => {
        if (claimed) {
          setRewardClaimed(true);
          setRoutineProofLogged(true);
        }
      })
      .finally(() => {
        rewardRequestRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineComplete, routineProofLogged, today]);

  return (
    <section className="daily-routine-card">
      <div className="section-title">
        <span>Daily Routine</span>
        <small>{routineStatus}</small>
      </div>

      <div className="routine-hero">
        <div>
          <strong>Daily Routine is the only streak proof.</strong>
          <p>
            Finish all 7 actions. A no-spend day can complete the routine; the 7th action must be Share on X, then today’s Active Streak is protected.
          </p>
        </div>

        <div className="routine-score">
          <span>{completedCount}</span>
          <small>/7</small>
        </div>
      </div>

      <div className="routine-progress">
        <div style={{ width: `${routineScore}%` }} />
      </div>

      <div className={`routine-reward ${routineComplete ? "unlocked" : ""}`}>
        <img src={GROWTH_PUBLIC_ASSETS.trophy} alt="" onError={(event) => { event.currentTarget.src = A.challengeTrophy; }} />

        <div>
          <strong>
            {routineComplete
              ? routineProofLogged || rewardClaimed
                ? "Active Streak protected"
                : "Daily Routine proof ready"
              : `Complete ${routineItems.length - completedCount} more task${
                  routineItems.length - completedCount === 1 ? "" : "s"
                }`}
          </strong>
          <span>
            Active Streak is counted only after full Daily Routine completion. No fake leak is required; the final task must be Share on X.
          </span>
        </div>
      </div>

      <div className="routine-list">
        {routineItems.map((item) => (
          <article key={item.id} className={`routine-task ${item.done ? "done" : ""}`}>
            <img src={item.icon} alt="" />

            <div>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </div>

            <div className="routine-task-status">
              {item.actionLabel && !item.done ? (
                <button
                  type="button"
                  className="routine-task-action"
                  onClick={() => {
                    markDailyRoutineAction(item.id);
                    setActions(readDailyRoutineActions(today));
                  }}
                >
                  {item.actionLabel}
                </button>
              ) : (
                <b>{item.done ? "✓" : "—"}</b>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="routine-rule">
        <strong>Discipline rule:</strong>
        <span>No-spend days are valid. The routine never requires adding a fake leak; only the final public proof task must be completed through Share on X.</span>
      </div>
    </section>
  );
}



// V54.2: failed mission saved value is forced to zero, and share result has visible fallbacks.
// V54.3: Mission share text uses real line breaks, not literal backslash-n.
// V54.4: mission result shares a clean image card like the main Share Result card.
// V54.5: duplicate ruText keys removed for strict TypeScript build.
function BiggestLeakChallengePanel({
  settings,
  identityStats,
  mission,
  expenses,
  shareInitData,
  onStartMission,
  onResetMission,
  onOpenAdd,
}: {
  settings: Settings;
  identityStats: V2IdentityStats;
  mission: LocalLeakMission | null;
  expenses: Expense[];
  shareInitData: string;
  onStartMission: (category: string, baselineWeekly: number) => void;
  onResetMission: () => void;
  onOpenAdd: () => void;
}) {
  const [missionImageSharing, setMissionImageSharing] = useState(false);
  const missionShareCardRef = useRef<HTMLDivElement | null>(null);
  const progress = getLocalLeakMissionProgress(mission, expenses);
  const hasLeak = identityStats.biggestLeakAmount > 0;
  const suggestedCategory = hasLeak ? identityStats.biggestLeakCategory : "No leak";
  const missionCategory = mission?.category || suggestedCategory;
  const missionLabel = hasLeak ? categoryLabel(suggestedCategory) : "your first leak";
  const weeklyAmount = hasLeak ? identityStats.biggestLeakAmount : 0;
  const targetSpend = mission?.targetSpend ?? Math.max(1, Math.round((weeklyAmount / 7) * 3 * 0.5));
  const possibleSavings = Math.max(0, Math.round((weeklyAmount / 7) * 3 - targetSpend));

  const baselineForMission = mission ? Math.round((mission.baselineWeekly / 7) * 3) : 0;
  const rawMissionSaved = mission ? Math.max(0, Math.round(baselineForMission - progress.spent)) : 0;
  const missionSaved = mission && progress.failed ? 0 : rawMissionSaved;
  const missionOver = mission ? Math.max(0, Math.round(progress.spent - mission.targetSpend)) : 0;

  const statusLabel = mission
    ? progress.completed
      ? "Completed"
      : progress.failed
        ? "Failed"
        : `${progress.daysLeft}d left`
    : "Suggested";

  const resultTitle = progress.completed
    ? "Mission survived"
    : progress.failed
      ? "Mission failed"
      : "Mission active";

  const resultBody = progress.completed
    ? "You stayed under the leak limit. Wallet HP protected."
    : progress.failed
      ? "The leak broke the limit. Reset and run it back."
      : "Keep tracking. The result card unlocks when this mission ends.";
  const publicIdentityName = getPublicIdentityName(settings);
  const publicIdentityStatus = getPublicIdentityStatus(settings);
  const publicIdentityAvatar = getPublicProfileAvatarImage(settings);

  const shareText = mission
    ? [
        progress.completed ? "Mission survived." : progress.failed ? "Mission failed." : "Mission in progress.",
        "",
        `Leak: ${categoryLabel(mission.category)}`,
        `Days: 3`,
        `Limit: ${money(mission.targetSpend, settings.currency)}`,
        `Spent: ${money(progress.spent, settings.currency)}`,
        `Saved: ${money(missionSaved, settings.currency)}`,
        progress.failed ? `Over limit: ${money(missionOver, settings.currency)}` : "Wallet HP protected.",
        "",
        "Find the leak before it becomes your lifestyle.",
        "Smoke is broke.",
      ].join("\n")
    : "";

  async function copyMissionResultText() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        notifyApp("Mission copied", "Paste it in Telegram, X, or anywhere you want.");
        return;
      }
    } catch {
      // Clipboard can be blocked inside Telegram WebView.
    }

    window.prompt("Copy mission result", shareText);
  }

  async function shareMissionResult() {
    if (!mission || !shareText || missionImageSharing) return;

    triggerHaptic("light");
    setMissionImageSharing(true);

    try {
      if (missionShareCardRef.current) {
        const imageFile = await createShareImageFileFromElement(missionShareCardRef.current);
        const nativeShared = await tryNativeImageShare(imageFile);

        if (nativeShared) {
          return;
        }

        if (shareInitData) {
          try {
            await sendShareImageViaBot(imageFile, shareInitData, shareText);
            notifyApp("Mission sent", "Open your Telegram bot chat and forward it anywhere.");
            return;
          } catch {
            // Continue to download fallback below.
          }
        }

        downloadImageFile(imageFile);
        notifyApp("Mission downloaded", "You can post the PNG in Telegram or X.");
        return;
      }
    } catch {
      // Image generation or file sharing failed. Use text fallback below.
    } finally {
      setMissionImageSharing(false);
    }

    await copyMissionResultText();
  }

  return (
    <section
      className={`biggest-leak-challenge-card ${
        mission ? (progress.failed ? "failed" : progress.completed ? "completed" : "active") : ""
      }`}
    >
      <div className="section-title">
        <span>Biggest Leak Challenge</span>
        <small>{statusLabel}</small>
      </div>

      <div className="blc-hero">
        <img src={getCategoryIcon(missionCategory)} alt="" />

        <div>
          <strong>
            {mission
              ? `Anti-${categoryLabel(mission.category)} mission`
              : hasLeak
                ? `Start anti-${missionLabel} mission`
                : "Find your first leak"}
          </strong>
          <p>
            {mission
              ? `Stay under ${money(mission.targetSpend, settings.currency)} for 3 days.`
              : hasLeak
                ? `${money(weeklyAmount, settings.currency)} drained this week. Cut it before it becomes normal.`
                : "Track one Not needed or Maybe expense first. Then the app will build a mission around it."}
          </p>
        </div>
      </div>

      {mission ? (
        <>
          <div className="blc-progress">
            <div style={{ width: `${Math.min(progress.percentUsed, 100)}%` }} />
          </div>

          <div className="blc-stats">
            <div>
              <span>Spent</span>
              <strong>{money(progress.spent, settings.currency)}</strong>
            </div>

            <div>
              <span>Limit</span>
              <strong>{money(mission.targetSpend, settings.currency)}</strong>
            </div>

            <div>
              <span>Days left</span>
              <strong>{progress.daysLeft}</strong>
            </div>
          </div>

          {(progress.completed || progress.failed) && (
            <div className={`mission-result-card ${progress.completed ? "completed" : "failed"}`}>
              <div className="mission-result-head">
                <img
                  src={progress.completed ? A.challengeCompleted : A.challengeFailed}
                  alt=""
                />

                <div>
                  <span>Mission Result</span>
                  <strong>{resultTitle}</strong>
                  <p>{resultBody}</p>
                </div>
              </div>

              <div className="mission-result-grid">
                <div>
                  <span>Leak</span>
                  <strong>{categoryLabel(mission.category)}</strong>
                </div>

                <div>
                  <span>Spent</span>
                  <strong>{money(progress.spent, settings.currency)}</strong>
                </div>

                <div>
                  <span>Saved</span>
                  <strong>{money(missionSaved, settings.currency)}</strong>
                </div>

                <div>
                  <span>{progress.failed ? "Over limit" : "Wallet HP"}</span>
                  <strong>{progress.failed ? money(missionOver, settings.currency) : "Protected"}</strong>
                </div>
              </div>

              <div
                className={`mission-public-share-card premium-share-card ${progress.failed ? "failed" : "completed"}`}
                ref={missionShareCardRef}
              >
                <img
                  className="premium-share-card-art"
                  src={SHARE_CARD_PUBLIC_ASSETS.mission}
                  alt=""
                />

                <div className="mission-public-share-top share-card-identity-top">
                  <div className="share-card-identity-line">
                    <img className="share-card-avatar" src={publicIdentityAvatar} alt="" />
                    <div>
                      <span>$BROKE MISSION CARD</span>
                      <strong>{resultTitle}</strong>
                      <small>{publicIdentityName} · {progress.failed ? "Limit broken" : "Wallet HP protected"}</small>
                    </div>
                  </div>
                  <img className="share-card-signal-icon" src={progress.completed ? A.challengeCompleted : A.challengeFailed} alt="" />
                </div>

                <div className="mission-public-share-grid">
                  <div>
                    <span>Leak</span>
                    <strong>{categoryLabel(mission.category)}</strong>
                  </div>

                  <div>
                    <span>Days</span>
                    <strong>3</strong>
                  </div>

                  <div>
                    <span>Limit</span>
                    <strong>{money(mission.targetSpend, settings.currency)}</strong>
                  </div>

                  <div>
                    <span>Spent</span>
                    <strong>{money(progress.spent, settings.currency)}</strong>
                  </div>

                  <div>
                    <span>Saved</span>
                    <strong>{money(missionSaved, settings.currency)}</strong>
                  </div>

                  <div>
                    <span>{progress.failed ? "Over limit" : "Result"}</span>
                    <strong>{progress.failed ? money(missionOver, settings.currency) : "Survived"}</strong>
                  </div>
                </div>

                <div className="mission-public-share-footer">
                  <strong>Find the leak before it becomes your lifestyle.</strong>
                  <span>$BROKE Life Tracker · t.me/BrokeLifeTrackerBot</span>
                </div>
              </div>

              <div className="mission-result-actions">
                <button type="button" onClick={shareMissionResult} disabled={missionImageSharing}>
                  {missionImageSharing ? "Preparing image..." : "Share result"}
                </button>

                <button type="button" className="secondary" onClick={onResetMission}>
                  Start new mission
                </button>
              </div>
            </div>
          )}

          {!progress.completed && !progress.failed && (
            <button type="button" className="blc-secondary-btn" onClick={onOpenAdd}>
              Track mission expense
            </button>
          )}
        </>
      ) : (
        <div className="blc-start-row">
          <div>
            <span>3-day target</span>
            <strong>{money(targetSpend, settings.currency)} max</strong>
            <small>Possible save: {money(possibleSavings, settings.currency)}</small>
          </div>

          <button
            type="button"
            onClick={() =>
              hasLeak ? onStartMission(suggestedCategory, weeklyAmount) : onOpenAdd()
            }
          >
            {hasLeak ? "Start mission" : "Track first leak"}
          </button>
        </div>
      )}
    </section>
  );
}

function TodayMissionPanel({
  settings,
  summary,
  identityStats,
  onOpenAdd,
}: {
  settings: Settings;
  summary: {
    totalIncome: number;
    fixedCosts: number;
    spentThisMonth: number;
    totalLeaks: number;
    realBalance: number;
    walletHp: number;
    todaySpent: number;
    streak: Streak;
  };
  identityStats: V2IdentityStats;
  onOpenAdd: () => void;
}) {
  const hasDetectedLeak = identityStats.biggestLeakAmount > 0;
  const rawTargetLeak = identityStats.biggestLeakCategory || "";
  const targetLeak =
    hasDetectedLeak
      ? rawTargetLeak.toLowerCase() === "custom"
        ? "your custom leak"
        : categoryLabel(rawTargetLeak)
      : "no leak detected yet";

  const missionProgress = [
    summary.todaySpent > 0,
    identityStats.biggestLeakAmount > 0,
    summary.streak.currentStreak > 0,
  ].filter(Boolean).length;

  const estimatedYearlyLeak = identityStats.weeklyLeaks > 0
    ? identityStats.weeklyLeaks * 52
    : summary.totalLeaks * 12;

  return (
    <section className="today-mission-card">
      <div className="section-title">
        <span>Today Mission</span>
        <small>{missionProgress}/3 active</small>
      </div>

      <div className="mission-hero">
        <img src={A.walletMascot} alt="" />

        <div>
          <strong>Protect your Wallet HP today.</strong>
          <p>
            Track one real expense, avoid your biggest leak, and keep the routine
            alive.
          </p>
        </div>
      </div>

      <div className="mission-steps">
        <div className={summary.todaySpent > 0 ? "done" : ""}>
          <b>{summary.todaySpent > 0 ? "✓" : "1"}</b>
          <span>Track one real expense</span>
        </div>

        <div className={hasDetectedLeak ? "danger" : ""}>
          <b>2</b>
          <span className="mission-step-copy">
            <strong>Avoid your biggest leak today</strong>
            <small>
              {hasDetectedLeak
                ? `Detected: ${targetLeak}`
                : "Track a leak first so the app can detect it."}
            </small>
          </span>
        </div>

        <div className={summary.streak.currentStreak > 0 ? "done" : ""}>
          <b>{summary.streak.currentStreak > 0 ? "✓" : "3"}</b>
          <span>Keep daily discipline alive</span>
        </div>
      </div>

      <div className="mission-bottom">
        <div>
          <span>Yearly risk</span>
          <strong>{money(estimatedYearlyLeak, settings.currency)}</strong>
        </div>

        <button type="button" onClick={onOpenAdd}>
          Track now
        </button>
      </div>
    </section>
  );
}

function ExpenseImpactCard({
  settings,
  expense,
}: {
  settings: Settings;
  expense: Expense | null;
}) {
  if (!expense) return null;

  const monthlyImpact = expense.amount * 30;
  const yearlyImpact = expense.amount * 365;
  const hourlyValue = Math.max(
    getTotalIncome(settings) / Math.max(settings.profile.workHoursPerMonth, 1),
    1
  );
  const hoursLost = Math.round((yearlyImpact / hourlyValue) * 10) / 10;

  return (
    <section className="expense-impact-card">
      <div className="section-title">
        <span>Latest impact</span>
        <small>{expense.needType}</small>
      </div>

      <div className="impact-hero">
        <img src={getCategoryIcon(expense.category)} alt="" />

        <div>
          <strong>{expense.category} tracked.</strong>
          <p>
            {money(expense.amount, settings.currency)} looks small once. Repeated
            daily, it becomes a real wallet leak.
          </p>
        </div>
      </div>

      <div className="impact-grid">
        <div>
          <span>If repeated daily</span>
          <strong>{money(monthlyImpact, settings.currency)}</strong>
          <small>/month</small>
        </div>

        <div>
          <span>Yearly damage</span>
          <strong>{money(yearlyImpact, settings.currency)}</strong>
          <small>/year</small>
        </div>

        <div>
          <span>Life hours traded</span>
          <strong>{hoursLost}h</strong>
          <small>estimated</small>
        </div>
      </div>
    </section>
  );
}

function FirstLeakOnboardingCard({
  settings,
  onQuickLeak,
  onOpenAdd,
}: {
  settings: Settings;
  onQuickLeak: (category: string, value: number, needType?: NeedType) => void;
  onOpenAdd: () => void;
}) {
  return (
    <section className="first-leak-card">
      <div className="first-leak-hero">
        <img src={A.walletMascot} alt="" />
        <div>
          <span>First Leak Mission</span>
          <strong>Catch one leak in under 10 seconds.</strong>
          <p>
            Start with a small real expense. The app will calculate Wallet HP,
            unlock your first progress, and show the leak pattern.
          </p>
        </div>
      </div>

      <div className="first-leak-steps">
        <div>
          <b>1</b>
          <span>Pick a leak</span>
        </div>
        <div>
          <b>2</b>
          <span>Get insight</span>
        </div>
        <div>
          <b>3</b>
          <span>Share result</span>
        </div>
      </div>

      <div className="first-leak-presets">
        {firstLeakPresets.map((preset) => (
          <button
            type="button"
            key={preset.category}
            onClick={() => onQuickLeak(preset.category, preset.amount, "Not needed")}
          >
            <img src={preset.icon} alt="" />
            <span>{preset.label}</span>
            <strong>{money(preset.amount, settings.currency)}</strong>
          </button>
        ))}
      </div>

      <button type="button" className="first-leak-custom" onClick={onOpenAdd}>
        Add custom first leak
      </button>
    </section>
  );
}

function WebTelegramSyncCard({
  telegram,
  webAuth,
}: {
  telegram: TelegramState;
  webAuth: WebAuthState;
}) {
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (telegram.isTelegram || webAuth.authenticated || webAuth.loading) return;
    if (!widgetRef.current) return;

    widgetRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = TELEGRAM_LOGIN_SCRIPT;
    script.async = true;
    script.setAttribute("data-telegram-login", TELEGRAM_BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-auth-url", "/api/auth/telegram");

    widgetRef.current.appendChild(script);

    return () => {
      script.remove();
    };
  }, [telegram.isTelegram, webAuth.authenticated, webAuth.loading]);

  if (telegram.isTelegram) return null;

  return (
    <section className={`web-sync-card ${webAuth.authenticated ? "connected" : ""}`}>
      <div>
        <span>Account sync</span>
        <strong>
          {webAuth.authenticated
            ? `Synced with ${webAuth.user?.username ? `@${webAuth.user.username}` : webAuth.user?.first_name || "Telegram"}`
            : "Use one account on website and Telegram"}
        </strong>
        <p>
          {webAuth.authenticated
            ? "Website progress now uses the same Supabase profile as your Telegram Mini App."
            : "Login with Telegram to sync expenses, streaks, badges, challenges and leaderboard across website and Telegram."}
        </p>
      </div>

      {webAuth.authenticated ? (
        <a className="web-sync-logout" href="/api/auth/telegram/logout">
          Log out
        </a>
      ) : (
        <div className="telegram-login-widget" ref={widgetRef}>
          {webAuth.loading ? "Checking..." : "Loading Telegram login..."}
        </div>
      )}
    </section>
  );
}

function WalletInsightsPanel({
  insights,
  compact = false,
}: {
  insights: WalletInsight[];
  compact?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const safeInsights = insights.length ? insights : buildWalletInsights([], defaultSettings);
  const active = safeInsights[index % safeInsights.length];

  useEffect(() => {
    if (safeInsights.length <= 1 || expanded) return;

    const interval = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeInsights.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, [safeInsights.length, expanded]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIndex(0);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [safeInsights.length]);

  return (
    <section className={`wallet-insights-panel ${compact ? "compact" : ""} ${expanded ? "expanded" : ""}`}>
      <button
        type="button"
        className={`wallet-insight-main ${active.tone}`}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <img src={active.icon} alt="" />

        <div>
          <div className="wallet-insight-head">
            <span>Leak Insight</span>
            <b>{expanded ? "Hide" : "Tap for all"}</b>
          </div>

          <strong>{active.title}</strong>
          <p>{active.body}</p>
          <small>{active.detail}</small>
        </div>
      </button>

      {safeInsights.length > 1 && (
        <div className="wallet-insight-dots" aria-hidden="true">
          {safeInsights.map((item, itemIndex) => (
            <i key={item.id} className={itemIndex === index % safeInsights.length ? "active" : ""} />
          ))}
        </div>
      )}

      {expanded && (
        <div className="wallet-insight-list">
          {safeInsights.map((insight) => (
            <article className={`wallet-insight-item ${insight.tone}`} key={insight.id}>
              <img src={insight.icon} alt="" />
              <div>
                <strong>{insight.title}</strong>
                <p>{insight.body}</p>
                <span>{insight.detail}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function StreakCard({ streak }: { streak: Streak }) {
  const activeToday = isStreakActiveToday(streak);
  const icon = streak.currentStreak > 0
    ? activeToday
      ? A.streakFire
      : A.dailyCheck
    : A.streakBroken;

  return (
    <section className="streak-card">
      <img src={icon} alt="" />

      <div>
        <div className="section-title streak-title">
          <span>Daily Streak</span>
          <b>{getStreakLabel(streak)}</b>
        </div>

        <strong>
          {streak.currentStreak}
          <small> day{streak.currentStreak === 1 ? "" : "s"}</small>
        </strong>

        <p>
          {activeToday
            ? "You already tracked a leak today."
            : "Add one expense today to keep the streak alive."}
        </p>
      </div>

      <aside>
        <img src={A.bestStreak} alt="" />
        <span>Best</span>
        <b>{streak.bestStreak}</b>
      </aside>
    </section>
  );
}

function StreakSettingsPanel({ streak }: { streak: Streak }) {
  return (
    <section className="tracked-panel streak-settings-panel">
      <div className="section-title">
        <span>Streak Progress</span>
        <small>{getStreakLabel(streak)}</small>
      </div>

      <div className="streak-settings-grid">
        <div>
          <img src={A.streakFire} alt="" />
          <span>Current streak</span>
          <strong>{streak.currentStreak} days</strong>
        </div>
        <div>
          <img src={A.bestStreak} alt="" />
          <span>Best streak</span>
          <strong>{streak.bestStreak} days</strong>
        </div>
        <div>
          <img src={A.dailyCheck} alt="" />
          <span>Last active</span>
          <strong>{streak.lastActiveDate ?? "No activity"}</strong>
        </div>
      </div>
    </section>
  );
}

function BadgeMiniStrip({ badges }: { badges: BadgeItem[] }) {
  const earned = badges.filter((badge) => badge.earned);
  const preview = earned.slice(0, 4);

  return (
    <section className="badges-strip">
      <div className="section-title">
        <span>Badge Vault</span>
        <small>{earned.length}/{badges.length} unlocked</small>
      </div>

      {preview.length > 0 ? (
        <div className="badge-chip-list">
          {preview.map((badge) => (
            <div className="badge-chip" key={badge.id} title={badge.title}>
              <img src={badge.icon} alt="" />
              <div>
                <strong>{badge.title}</strong>
                <span>{badge.earnedAt ? badge.earnedAt.slice(0, 10) : "Unlocked"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="badge-strip-empty">Start tracking and the first badges will unlock here.</div>
      )}
    </section>
  );
}

function BadgeVaultPanel({ badges }: { badges: BadgeItem[] }) {
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const latestEarned = badges.find((badge) => badge.earned);

  return (
    <details className="badge-vault-details">
      <summary>
        <div>
          <strong>Badge Vault</strong>
          <span>
            {earnedCount > 0
              ? `Latest: ${latestEarned?.title ?? "Unlocked badge"}`
              : "Achievements are hidden"}
          </span>
        </div>
        <b>{earnedCount}/{badges.length} unlocked</b>
      </summary>

      <section className="tracked-panel badge-vault-panel">
        <div className="badge-vault-grid">
          {badges.map((badge) => (
            <article
              key={badge.id}
              className={badge.earned ? "badge-vault-card earned" : "badge-vault-card"}
            >
              <img src={badge.icon} alt="" />
              <div>
                <strong>{badge.title}</strong>
                <p>{badge.description}</p>
              </div>
              <b>{badge.earned ? "Unlocked" : "Locked"}</b>
              <span>{badge.earnedAt ? badge.earnedAt.slice(0, 10) : "Keep going"}</span>
            </article>
          ))}
        </div>
      </section>
    </details>
  );
}

function TelegramMiniStatus({
  telegram,
  webAuth,
  cloudStatus,
  cloudError,
  compact = false,
}: {
  telegram: TelegramState;
  webAuth?: WebAuthState;
  cloudStatus: CloudStatus;
  cloudError: string;
  compact?: boolean;
}) {
  const activeUser = telegram.user ?? webAuth?.user ?? null;
  const username = activeUser?.username
    ? `@${activeUser.username}`
    : activeUser?.first_name || "Telegram user";

  const cloudLabel = !telegram.isTelegram && webAuth?.authenticated
    ? "Web cloud"
    : !telegram.isTelegram
      ? "Local demo"
      : cloudStatus === "cloud"
      ? "Cloud synced"
      : cloudStatus === "syncing"
        ? "Syncing..."
        : cloudStatus === "error"
          ? "Sync error"
          : "Local only";

  const statusText = !telegram.isTelegram && webAuth?.authenticated
    ? "Website is synced with your Telegram account."
    : !telegram.isTelegram
      ? "Web demo mode. Login with Telegram to enable cloud sync."
      : cloudStatus === "error"
      ? cloudError || "Check Vercel logs"
      : "Ready";

  return (
    <section className={compact ? "tg-status tg-status-compact" : "tg-status"}>
      <div>
        <span>Mode</span>
        <strong>{telegram.isTelegram ? "Telegram App" : webAuth?.authenticated ? "Web Synced" : "Web Demo"}</strong>
      </div>

      <div>
        <span>Data</span>
        <strong>{cloudLabel}</strong>
      </div>

      {!compact && (
        <>
          <div>
            <span>User</span>
            <strong>{activeUser ? username : "Not detected"}</strong>
          </div>
          <div>
            <span>User ID</span>
            <strong>{activeUser?.id ?? "-"}</strong>
          </div>
          <div>
            <span>Platform</span>
            <strong>{telegram.platform}</strong>
          </div>
          <div>
            <span>Version</span>
            <strong>{telegram.version}</strong>
          </div>
          <div>
            <span>Start param</span>
            <strong>{telegram.startParam || "-"}</strong>
          </div>
          <div className="tg-status-wide">
            <span>Status</span>
            <strong>{statusText}</strong>
          </div>
        </>
      )}
    </section>
  );
}

function getLeaderboardRank(rows: LeaderboardProfile[] | undefined, telegramId?: number) {
  if (!rows?.length || !telegramId) return null;

  const index = rows.findIndex((row) => row.telegramId === telegramId);

  return index >= 0 ? index + 1 : null;
}

function getShareLeaderboardStats(leaderboard: LeaderboardState | null) {
  const me = leaderboard?.me ?? null;
  const dailyRank = getLeaderboardRank(leaderboard?.daily, me?.telegramId);
  const weeklyRank = getLeaderboardRank(leaderboard?.weekly, me?.telegramId);
  const allTimeRank = getLeaderboardRank(leaderboard?.allTime, me?.telegramId);

  const bestRank = dailyRank ?? weeklyRank ?? allTimeRank;
  const bestRankLabel = dailyRank
    ? `#${dailyRank} Daily`
    : weeklyRank
      ? `#${weeklyRank} Weekly`
      : allTimeRank
        ? `#${allTimeRank} All`
        : me?.publicLeaderboard
          ? "Top pending"
          : "Private";

  return {
    xp: me?.brokeScore ?? 0,
    dailyXp: me?.dailyXp ?? 0,
    weeklyXp: me?.weeklyXp ?? 0,
    totalXp: me?.totalXp ?? me?.brokeScore ?? 0,
    rank: bestRank,
    rankLabel: bestRankLabel,
    badgeCount: me?.badgeCount ?? 0,
    currentStreak: me?.currentStreak ?? 0,
    publicLeaderboard: Boolean(me?.publicLeaderboard),
  };
}

function buildShareText({
  settings,
  walletHp,
  totalLeaks,
  potentialYearlySavings,
  leaderboard,
  identityStats,
  exchangeRates,
}: {
  settings: Settings;
  walletHp: number;
  totalLeaks: number;
  potentialYearlySavings: number;
  leaderboard: LeaderboardState | null;
  identityStats: V2IdentityStats;
  exchangeRates?: ExchangeRateMap;
}) {
  const shareStats = getShareLeaderboardStats(leaderboard);
  const selectedShareItems = getEnabledProfileShareItems(settings, walletHp);
  const selectedMetricLines = selectedShareItems.map((id) => {
    const metric = buildProfileShareMetric({
      id,
      settings,
      walletHp,
      identityStats,
      leaderboard,
    });

    return `${metric.label}: ${metric.value}`;
  });
  const publicProofMode = settings.privacy.publicProofMode;
  const publicIdentityName = getPublicIdentityName(settings);
  const publicIdentityStatus = getPublicIdentityStatus(settings);
  const publicIdentityStyle = getIdentityStyleMeta(settings.identity.identityStyle);
  const rankLine =
    shareStats.rank || shareStats.publicLeaderboard
      ? `Leaderboard: ${shareStats.rankLabel}`
      : "Leaderboard: private";
  const potentialSavingsUsdNote = exchangeRates
    ? usdReferenceNote(potentialYearlySavings, settings.currency, settings, exchangeRates)
    : "";

  return [
    `${publicIdentityName} on $BROKE`,
    `${publicIdentityStyle.label} · ${publicIdentityStatus}`,
    "",
    "My wallet is not broken.",
    "It is leaking.",
    "",
    ...selectedMetricLines,
    selectedShareItems.includes("rank") ? "" : rankLine,
    "",
    `Potential yearly savings: ${
      publicProofMode ? "hidden by Public Proof Mode" : money(potentialYearlySavings, settings.currency)
    }`,
    !publicProofMode && potentialSavingsUsdNote ? `USD reference: ${potentialSavingsUsdNote}` : "",
    getSharePrivacyLine(settings),
    "",
    "Find the leak before it becomes your lifestyle.",
  ].filter(Boolean).join("\n");
}

async function createShareImageFileFromElement(element: HTMLElement, fileName = "broke-life-tracker-result.png") {
  const html2canvasModule = await import("html2canvas");
  const html2canvas = html2canvasModule.default;
  const captureId = `share-capture-${Date.now()}`;
  const scrollOffsetX = typeof window !== "undefined" ? window.scrollX : 0;
  const scrollOffsetY = typeof window !== "undefined" ? window.scrollY : 0;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : element.scrollWidth;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : element.scrollHeight;

  element.setAttribute("data-share-capture-id", captureId);

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#020402",
      scale: 2,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      logging: false,
      imageTimeout: 15000,
      removeContainer: true,
      scrollX: -scrollOffsetX,
      scrollY: -scrollOffsetY,
      windowWidth: Math.max(viewportWidth, element.scrollWidth + 80),
      windowHeight: Math.max(viewportHeight, element.scrollHeight + 120),
      onclone: (clonedDocument) => {
        const clonedElement = clonedDocument.querySelector(
          `[data-share-capture-id="${captureId}"]`
        );

        if (clonedElement instanceof HTMLElement) {
          clonedElement.classList.add("share-capture-safe");

          clonedElement
            .querySelectorAll<HTMLElement>("*")
            .forEach((node) => node.classList.add("share-capture-safe-child"));
        }
      },
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/png", 0.96);
    });

    if (!blob) {
      throw new Error("Could not create share image.");
    }

    return new File([blob], fileName, {
      type: "image/png",
    });
  } finally {
    element.removeAttribute("data-share-capture-id");
  }
}

async function tryNativeImageShare(imageFile: File) {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [imageFile] }) &&
    typeof navigator.share === "function"
  ) {
    await navigator.share({
      files: [imageFile],
    });

    return true;
  }

  return false;
}

async function sendShareImageViaBot(imageFile: File, initData: string, caption: string) {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("caption", caption);
  formData.append("initData", initData);
  formData.append("target", "user");

  const response = await fetch("/api/share-result", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Telegram image send failed");
  }

  return data;
}

function downloadImageFile(imageFile: File) {
  const url = URL.createObjectURL(imageFile);
  const link = document.createElement("a");
  link.href = url;
  link.download = imageFile.name;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function ShareResultCard({
  settings,
  walletHp,
  totalLeaks,
  realBalance,
  potentialYearlySavings,
  leaderboard,
  identityStats,
  exchangeRates,
  shareInitData,
}: {
  settings: Settings;
  walletHp: number;
  totalLeaks: number;
  realBalance: number;
  potentialYearlySavings: number;
  leaderboard: LeaderboardState | null;
  identityStats: V2IdentityStats;
  exchangeRates: ExchangeRateMap;
  shareInitData: string;
}) {
  const [copied, setCopied] = useState(false);
  const [imageSharing, setImageSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const shareStats = getShareLeaderboardStats(leaderboard);
  const selectedShareItems = getEnabledProfileShareItems(settings, walletHp);
  const selectedShareMetrics = selectedShareItems.map((id) =>
    buildProfileShareMetric({
      id,
      settings,
      walletHp,
      identityStats,
      leaderboard,
    })
  );
  const publicIdentityName = getPublicIdentityName(settings);
  const publicIdentityStatus = getPublicIdentityStatus(settings);
  const publicIdentityStyle = getIdentityStyleMeta(settings.identity.identityStyle);
  const publicIdentityAvatar = getPublicProfileAvatarImage(settings);
  const publicIdentityPrivacyLine = getSharePrivacyLine(settings);
  const potentialYearlySavingsUsdNote = settings.privacy.publicProofMode
    ? ""
    : usdReferenceNote(potentialYearlySavings, settings.currency, settings, exchangeRates);

  const shareText = buildShareText({
    settings,
    walletHp,
    totalLeaks,
    potentialYearlySavings,
    leaderboard,
    identityStats,
    exchangeRates,
  });

  function openXShare() {
    triggerHaptic("light");
    markDailyRoutineAction("sharedProgress");
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    openExternalUrl(url);
  }

  function openTelegramShare() {
    triggerHaptic("light");
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      PROJECT_TG_URL
    )}&text=${encodeURIComponent(shareText)}`;
    openTelegramUrl(url);
  }

  async function nativeShare() {
    try {
      triggerHaptic("light");
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "$BROKE Life Tracker",
          text: shareText,
          url: PROJECT_TG_URL,
        });
      } else {
        await copyShareText();
      }
    } catch {
      // User cancelled native share. No action needed.
    }
  }

  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(shareText);
      triggerHaptic("success");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function shareImageOnly() {
    if (!shareCardRef.current || imageSharing) return;

    try {
      triggerHaptic("light");
      setImageSharing(true);

      const imageFile = await createShareImageFileFromElement(shareCardRef.current);
      const nativeShared = await tryNativeImageShare(imageFile);

      if (nativeShared) {
        return;
      }

      try {
        await sendShareImageViaBot(imageFile, shareInitData, shareText);
        notifyApp("Image sent", "Open your Telegram bot chat and forward it anywhere.");
        return;
      } catch {
        downloadImageFile(imageFile);
        notifyApp("PNG downloaded", "Telegram WebView could not share directly, so the card was saved as a file.");
      }
    } catch {
      notifyApp("Sharing unavailable", "Image sharing was cancelled or is not supported by this browser.");
    } finally {
      setImageSharing(false);
    }
  }

  return (
    <section className="share-card">
      <div className="section-title">
        <span>Share Result</span>
        <small>Telegram / X ready</small>
      </div>

      <div className={`public-share-image-card premium-share-card identity-share-style-${settings.identity.identityStyle || "classic"}`} ref={shareCardRef}>
        <img
          className="premium-share-card-art"
          src={SHARE_CARD_PUBLIC_ASSETS.result}
          alt=""
        />
        <div className="public-share-top profile-share-card-top">
          <div className="profile-share-card-identity">
            <img className="profile-share-card-avatar" src={publicIdentityAvatar} alt="" />
            <div>
              <span>$BROKE PROFILE</span>
              <strong>{publicIdentityName}</strong>
              <small>{publicIdentityStatus}</small>
            </div>
          </div>
          <b className="profile-share-card-style-pill">{publicIdentityStyle.badge}</b>
        </div>

        <div className="share-preview share-preview-social profile-selected-share-grid">
          {selectedShareMetrics.map((metric) => (
            <div
              className={`profile-share-metric-card profile-share-metric-${metric.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              key={metric.label}
            >
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              {metric.detail && <small>{metric.detail}</small>}
            </div>
          ))}
        </div>

        <div className="public-share-savings">
          <span>Potential yearly savings</span>
          <strong>{publicProofMoney(settings, potentialYearlySavings)}</strong>
          {potentialYearlySavingsUsdNote && <small className="share-usd-reference-note">{potentialYearlySavingsUsdNote}</small>}
          <small>
            {settings.privacy.publicProofMode
              ? "Exact private numbers hidden by Public Proof Mode."
              : "Find the leak before it becomes lifestyle."}
          </small>
        </div>

        <footer className="public-share-footer">
          <div>
            <strong>$BROKE Life Tracker</strong>
            <span>Anti-doomspending identity app.</span>
          </div>
          <b>t.me/BrokeLifeTrackerBot</b>
        </footer>
      </div>

      <div className="share-privacy-note">
        <span>
          {settings.privacy.publicProofMode
            ? `Public Proof Mode is ON. ${publicIdentityPrivacyLine}`
            : `Profile identity is visible. ${publicIdentityPrivacyLine}`}
        </span>
      </div>

      <div className="share-buttons">
        <button type="button" onClick={openXShare}>
          Share on X
        </button>
        <button type="button" onClick={openTelegramShare}>
          Share in TG
        </button>
        <button type="button" onClick={nativeShare}>
          Share
        </button>
      </div>

      <button type="button" className="copy-share-btn" onClick={copyShareText}>
        {copied ? "Copied" : "Copy share text"}
      </button>

      <button type="button" className="copy-share-btn share-image-only-btn" onClick={shareImageOnly}>
        {imageSharing ? "Preparing image..." : "Send clean image to TG"}
      </button>
    </section>
  );
}

function RecentExpenses({
  settings,
  expenses,
  onDeleteExpense,
  onOpenAdd,
}: {
  settings: Settings;
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onOpenAdd: () => void;
}) {
  return (
    <section className="recent-card">
      <div className="section-title">
        <span>Recent Expenses</span>
        <small>{expenses.length ? `${expenses.length} latest` : "No records"}</small>
      </div>

      {expenses.length === 0 ? (
        <div className="empty-expenses v58-empty-mini">
          <img
            src={PREMIUM_VISUAL_PACK.firstLeakMascot}
            alt=""
            onError={(event) => {
              event.currentTarget.src = A.addFrog;
            }}
          />
          <strong>No leaks tracked yet.</strong>
          <span>Add your first expense to make Wallet HP, Chart and Growth Lab real.</span>
          <button type="button" onClick={onOpenAdd}>
            Track first leak
          </button>
        </div>
      ) : (
        <div className="expense-list">
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              settings={settings}
              onDeleteExpense={onDeleteExpense}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ExpenseRow({
  expense,
  settings,
  currency,
  onDeleteExpense,
}: {
  expense: Expense;
  settings?: Settings;
  currency?: Currency;
  onDeleteExpense: (id: string) => void;
}) {
  const rowCurrency = expense.currency ?? settings?.currency ?? currency ?? "USD";
  const rowCategoryLabel = settings
    ? categoryDisplayName(settings, expense.category)
    : sentenceCase(categoryLabel(expense.category));

  return (
    <div className="expense-row">
      <img src={getCategoryIcon(expense.category)} alt="" />

      <div>
        <strong>{rowCategoryLabel}</strong>
        <span>
          {expense.needType}
          {expense.note ? ` · ${expense.note}` : ""}
        </span>
      </div>

      <b>
        {money(expense.amount, rowCurrency)}
        {expense.usdReferenceAmount !== undefined &&
          expense.usdReferenceCurrency &&
          rowCurrency !== usdReferenceCurrency &&
          Number.isFinite(expense.usdReferenceAmount) && (
            <small className="converted-original-note">
              ≈ {formatMoney(expense.usdReferenceAmount, expense.usdReferenceCurrency, { includeCode: true, precision: "auto" })}
            </small>
          )}
        {(expense.usdReferenceAmount === undefined || rowCurrency === usdReferenceCurrency) &&
          expense.convertedForDisplay &&
          expense.originalCurrency &&
          Number.isFinite(expense.originalAmount) && (
            <small className="converted-original-note">
              {originalMoneyNote({
                amount: expense.amount,
                currency: rowCurrency,
                originalAmount: expense.originalAmount || 0,
                originalCurrency: expense.originalCurrency,
                converted: true,
                ready: true,
              })}
            </small>
          )}
      </b>

      <button
        type="button"
        onClick={() => onDeleteExpense(expense.id)}
        aria-label="Delete expense"
      >
        ×
      </button>
    </div>
  );
}

function AddExpenseScreen({
  settings,
  amount,
  setAmount,
  note,
  setNote,
  selectedCategory,
  setSelectedCategory,
  expenseType,
  setExpenseType,
  necessaryAmount,
  setNecessaryAmount,
  selectedLeakTriggers,
  setSelectedLeakTriggers,
  lastTrackedExpense,
  onAdd,
  onBack,
  onHelp,
}: {
  settings: Settings;
  amount: string;
  setAmount: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  expenseType: NeedType;
  setExpenseType: (value: NeedType) => void;
  necessaryAmount: string;
  setNecessaryAmount: (value: string) => void;
  selectedLeakTriggers: LeakTriggerId[];
  setSelectedLeakTriggers: (value: LeakTriggerId[]) => void;
  lastTrackedExpense: Expense | null;
  onAdd: () => void;
  onBack: () => void;
  onHelp: () => void;
}) {
  const triggerPreview = selectedLeakTriggers.length
    ? LEAK_TRIGGER_CHIPS
        .filter((trigger) => selectedLeakTriggers.includes(trigger.id))
        .map((trigger) => trigger.label)
        .join(" · ")
    : "No trigger selected yet";
  const trackedAmountPreview = safeNumber(amount);
  const necessaryAmountPreview = necessaryAmount.trim() ? safeNumber(necessaryAmount) : NaN;
  const hasSmartLeakPreview = expenseType !== "Needed" && Number.isFinite(necessaryAmountPreview);
  const normalizedNecessaryPreview = hasSmartLeakPreview ? clamp(necessaryAmountPreview, 0, Math.max(trackedAmountPreview, 0)) : 0;
  const avoidableLeakPreview = hasSmartLeakPreview ? clamp(trackedAmountPreview - normalizedNecessaryPreview, 0, Math.max(trackedAmountPreview, 0)) : 0;

  function toggleLeakTrigger(triggerId: LeakTriggerId) {
    triggerHaptic("light");
    setSelectedLeakTriggers(
      selectedLeakTriggers.includes(triggerId)
        ? selectedLeakTriggers.filter((id) => id !== triggerId)
        : [...selectedLeakTriggers, triggerId]
    );
  }

  return (
    <form
      className="screen track-leak-screen"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd();
      }}
    >
      <Header title="Track Leak" showBack rightIcon={A.help} onBack={onBack} onRight={onHelp} />

      <section className="track-leak-hero">
        <div>
          <span>Behavior mode</span>
          <strong>Track the trigger, not only the amount.</strong>
          <p>Amount shows the damage. Decision type and trigger chips help Pattern Lab explain why it happened.</p>
        </div>
        <img src={A.addFrog} alt="" />
      </section>

      <section className="track-leak-result-preview">
        <span>After saving this leak</span>
        <div>
          <article>
            <strong>1</strong>
            <p>Wallet HP updates</p>
          </article>
          <article>
            <strong>2</strong>
            <p>Pattern Lab learns context</p>
          </article>
          <article>
            <strong>3</strong>
            <p>Next move becomes clearer</p>
          </article>
        </div>
      </section>

      <section className="amount-box track-leak-amount">
        <label>Amount</label>
        <div className="amount-input">
          <span>{currencySymbol(settings.currency)}</span>
          <input
            value={amount}
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            onChange={(event) => setAmount(event.target.value)}
          />
          <b>{settings.currency}</b>
        </div>
        <p className="tiny-note">New records are saved with their original currency.</p>
      </section>

      <section className="quick-add-panel">
        <div className="section-title">
          <span>Quick leak presets</span>
          <small>amount stays editable</small>
        </div>

        <div className="quick-add-grid">
          {quickAddPresets.map((preset) => (
            <button
              type="button"
              key={preset.category}
              onClick={() => {
                setSelectedCategory(preset.category);
                setAmount(String(preset.amount));
                setNecessaryAmount("");
                setExpenseType("Not needed");
                triggerHaptic("light");
              }}
            >
              <img src={preset.icon} alt="" />
              <span>{categoryDisplayName(settings, preset.category)}</span>
              <strong>{money(preset.amount, settings.currency)}</strong>
            </button>
          ))}
        </div>
      </section>

      <section>
        <label className="field-label">Leak category</label>
        <div className="category-grid">
          {categories.map((cat) => (
            <button
              type="button"
              className={selectedCategory === cat.name ? "cat active" : "cat"}
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
            >
              <img src={cat.icon} alt="" />
              <span>{categoryDisplayName(settings, cat.name)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="decision-panel">
        <label className="field-label">Decision type</label>
        <div className="choice-row decision-choice-row">
          {(["Needed", "Maybe", "Not needed"] as NeedType[]).map((type) => {
            const label = NEED_TYPE_LABELS[type];
            const tone = type === "Needed" ? "survival" : type === "Maybe" ? "grey" : "leak";

            return (
              <button
                type="button"
                key={type}
                onClick={() => {
                  setExpenseType(type);
                  if (type === "Needed") setNecessaryAmount("");
                }}
                className={`choice decision-choice ${tone} ${expenseType === type ? "active" : ""}`}
              >
                <strong>{label.title}</strong>
                <small>{label.subtitle}</small>
              </button>
            );
          })}
        </div>
        <p className="tiny-note">{NEED_TYPE_HELP[expenseType]}</p>
      </section>

      {expenseType !== "Needed" && (
        <section className="smart-leak-panel">
          <div className="section-title">
            <span>Real leak amount</span>
            <small>optional smart baseline</small>
          </div>
          <p>Not every purchase is fully bad. Enter what the cheaper or necessary version would have cost, and only the extra part counts as leak pressure.</p>
          <label className="smart-leak-input">
            <span>Necessary / smarter cost</span>
            <div>
              <b>{currencySymbol(settings.currency)}</b>
              <input
                value={necessaryAmount}
                inputMode="decimal"
                type="number"
                min="0"
                step="0.01"
                placeholder="Example: 3"
                onChange={(event) => setNecessaryAmount(event.target.value)}
              />
            </div>
          </label>
          <div className="smart-leak-preview">
            <article>
              <span>Tracked spend</span>
              <strong>{money(Math.max(trackedAmountPreview, 0), settings.currency)}</strong>
            </article>
            <article>
              <span>Necessary part</span>
              <strong>{hasSmartLeakPreview ? money(normalizedNecessaryPreview, settings.currency) : "—"}</strong>
            </article>
            <article>
              <span>Leak counted</span>
              <strong>{hasSmartLeakPreview ? money(avoidableLeakPreview, settings.currency) : "Auto"}</strong>
            </article>
          </div>
          <small className="tiny-note">Example: outside food {money(5, settings.currency)}, home version {money(3, settings.currency)} → leak counted {money(2, settings.currency)}.</small>
        </section>
      )}

      <section className="trigger-panel">
        <div className="section-title">
          <span>Trigger chips</span>
          <small>optional, but useful</small>
        </div>

        <div className="trigger-chip-grid">
          {LEAK_TRIGGER_CHIPS.map((trigger) => {
            const active = selectedLeakTriggers.includes(trigger.id);

            return (
              <button
                type="button"
                key={trigger.id}
                className={active ? "trigger-chip active" : "trigger-chip"}
                onClick={() => toggleLeakTrigger(trigger.id)}
              >
                <span>{trigger.label}</span>
                <small>{trigger.hint}</small>
              </button>
            );
          })}
        </div>

        <p className="trigger-preview">
          <span>Pattern context</span>
          <strong>{triggerPreview}</strong>
        </p>
        <p className="tiny-note">Tip: choose one trigger if you know it. This is what makes future pattern reads feel personal.</p>
      </section>

      <section className="note-box track-note-box">
        <input
          value={note}
          placeholder="Add context... e.g. tired after work"
          onChange={(event) => setNote(event.target.value)}
        />
        <img src={A.pencil} alt="" />
      </section>

      <button className="primary-btn track-leak-submit" type="submit">
        <span>+</span>
        Track Leak
      </button>

      <ExpenseImpactCard settings={settings} expense={lastTrackedExpense} />

      <div className="tiny-note">
        <img src={A.addFrog} alt="" />
        <span>Track honestly. The app cannot detect a pattern without context.</span>
      </div>
    </form>
  );
}

// V54.6: Chart tab visual upgrade with pulse, stats, and empty state.
function PatternDetectorPanel({
  settings,
  patterns,
  labSummary,
  weeklyPatternSummary,
  patternHistory,
  onOpenAdd,
}: {
  settings: Settings;
  patterns: LeakPattern[];
  labSummary: LeakPatternLabSummary;
  weeklyPatternSummary: WeeklyPatternSummary;
  patternHistory: PatternHistoryRecord[];
  onOpenAdd: () => void;
}) {
  const topSignal = labSummary.signals[0] || null;
  const topPattern = patterns[0] || null;
  const heroSeverity = topSignal?.severity || topPattern?.severity || "low";
  const heroTitle = topSignal?.title || topPattern?.title || labSummary.headline;
  const heroBody = topSignal?.body || topPattern?.body || labSummary.detail;
  const heroTag = topSignal?.label || topPattern?.tag || labSummary.confidence;
  const heroIcon = topPattern?.icon || A.chartFrog;
  const heroCount = topSignal?.count || topPattern?.count || 0;
  const heroTotal = topSignal?.total || topPattern?.total || 0;
  const heroAverage = heroCount > 0 ? heroTotal / heroCount : topPattern?.average || 0;
  const whyText = topSignal
    ? "Timing and context reveal the trigger behind the leak. This turns tracking into behavior awareness."
    : topPattern?.why || "The lab needs a few leak records before it can detect a reliable behavior signal.";
  const fixText = topSignal
    ? topSignal.id === "late-night"
      ? "Create a late-night no-spend rule and prepare a cheaper fallback before 22:00."
      : topSignal.id === "weekend"
        ? "Set a weekend leak cap before Friday. Do not decide while already spending."
        : topSignal.id === "after-payday"
          ? "Protect the first 4 days after income. Move essentials first, then allow optional spending."
          : "When the note says stress, boredom, or impulse, wait 10 minutes before buying."
    : topPattern?.fix || "Track 3–5 more Maybe or Not needed expenses to unlock clearer patterns.";

  return (
    <section className={`pattern-detector-panel leak-pattern-lab ${labSummary.riskLevel}`}>
      <div className="section-title">
        <span>Leak Pattern Lab</span>
        <small>When, why, and how the leak repeats.</small>
      </div>

      <div className="leak-pattern-lab-hero-copy">
        <strong>{labSummary.headline}</strong>
        <p>{labSummary.detail}</p>
      </div>

      <div className="pattern-detector-grid leak-pattern-lab-stats">
        <div>
          <span>Confidence</span>
          <strong>{labSummary.confidence}</strong>
        </div>
        <div>
          <span>Top trigger</span>
          <strong>{labSummary.dominantTrigger}</strong>
        </div>
        <div>
          <span>Mapped pressure</span>
          <strong>{labSummary.patternPressure}%</strong>
        </div>
      </div>

      <div className={`weekly-pattern-summary ${weeklyPatternSummary.tone}`}>
        <div className="weekly-pattern-summary-head">
          <span>7-day behavior read</span>
          <strong>{weeklyPatternSummary.headline}</strong>
          <p>{weeklyPatternSummary.body}</p>
        </div>

        <div className="weekly-pattern-summary-metrics">
          <div>
            <small>Confidence</small>
            <b>{weeklyPatternSummary.confidence}</b>
          </div>
          <div>
            <small>Leaks</small>
            <b>{money(weeklyPatternSummary.totalLeaks, settings.currency)}</b>
          </div>
          <div>
            <small>Pressure</small>
            <b>{weeklyPatternSummary.leakPressure}%</b>
          </div>
        </div>

        {weeklyPatternSummary.cards.length > 0 ? (
          <div className="weekly-pattern-card-grid">
            {weeklyPatternSummary.cards.map((card) => (
              <article className={card.severity} key={card.id}>
                <span>{card.label}</span>
                <strong>{card.title}</strong>
                <p>{card.body}</p>
                <b>{card.value}</b>
              </article>
            ))}
          </div>
        ) : (
          <div className="weekly-pattern-empty">
            <strong>No weekly trigger is loud yet.</strong>
            <p>Use trigger chips on the next Track Leak entry so the app can separate habit, timing, mood, and category.</p>
          </div>
        )}

        <div className="weekly-pattern-next-move">
          <small>Next move this week</small>
          <span>{weeklyPatternSummary.nextMove}</span>
        </div>
      </div>

      <div className="pattern-history-panel">
        <div className="pattern-history-head">
          <span>Pattern memory</span>
          <strong>{patternHistory.length > 0 ? `${patternHistory.length} saved read${patternHistory.length === 1 ? "" : "s"}` : "Cloud history is warming up"}</strong>
          <p>Weekly pattern reads are now saved as structured history, so future reports can compare behavior over time.</p>
        </div>

        {patternHistory.length > 0 ? (
          <div className="pattern-history-list">
            {patternHistory.slice(0, 4).map((record) => (
              <article className={record.tone} key={`${record.periodType}-${record.periodKey}`}>
                <div>
                  <span>{record.periodLabel}</span>
                  <strong>{record.strongestPattern}</strong>
                  <p>{record.headline}</p>
                </div>
                <b>{record.leakPressure}%</b>
              </article>
            ))}
          </div>
        ) : (
          <div className="pattern-history-empty">
            <strong>No saved weekly reads yet.</strong>
            <p>Track a few leaks with trigger chips and open Chart again after cloud sync.</p>
          </div>
        )}
      </div>

      {(topSignal || topPattern) ? (
        <>
          <div className={`pattern-detector-hero ${heroSeverity}`}>
            <img src={heroIcon} alt="" />
            <div>
              <span>{heroTag}</span>
              <strong>{heroTitle}</strong>
              <p>{heroBody}</p>
            </div>
          </div>

          <div className="pattern-signal-strip">
            {labSummary.signals.length > 0 ? (
              labSummary.signals.slice(0, 4).map((signal) => (
                <article className={signal.severity} key={signal.id}>
                  <span>{signal.label}</span>
                  <strong>{signal.count}x</strong>
                  <small>{money(signal.total, settings.currency)}</small>
                </article>
              ))
            ) : (
              <article>
                <span>Behavior</span>
                <strong>{patterns.length}</strong>
                <small>category patterns</small>
              </article>
            )}
          </div>

          <div className="pattern-detector-insight">
            <strong>Why this matters</strong>
            <p>{whyText}</p>
          </div>

          <div className="pattern-detector-fix">
            <strong>One fix</strong>
            <p>{fixText}</p>
          </div>

          <div className="pattern-detector-grid">
            <div>
              <span>Count</span>
              <strong>{heroCount}x</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{money(heroTotal, settings.currency)}</strong>
            </div>
            <div>
              <span>Average</span>
              <strong>{money(heroAverage, settings.currency)}</strong>
            </div>
          </div>

          <details className="pattern-more-details">
            <summary>
              <span>Detected signals</span>
              <b>{labSummary.signals.length + patterns.length}</b>
            </summary>

            <div className="pattern-list">
              {labSummary.signals.map((signal) => (
                <article className={`pattern-item ${signal.severity}`} key={signal.id}>
                  <img src={A.chartFrog} alt="" />
                  <div>
                    <strong>{signal.title}</strong>
                    <span>{signal.label} · {signal.count}x · {money(signal.total, settings.currency)}</span>
                    <p>{signal.body}</p>
                  </div>
                </article>
              ))}

              {patterns.map((pattern) => (
                <article className={`pattern-item ${pattern.severity}`} key={pattern.id}>
                  <img src={pattern.icon} alt="" />
                  <div>
                    <strong>{pattern.title}</strong>
                    <span>{pattern.tag} · {pattern.count}x · {money(pattern.total, settings.currency)}</span>
                    <p>{pattern.fix}</p>
                  </div>
                </article>
              ))}
            </div>
          </details>
        </>
      ) : (
        <section className="v58-empty-card pattern-empty">
          <div className="v58-empty-head">
            <img src={A.chartFrog} alt="" />
            <div>
              <span>No pattern yet</span>
              <strong>Track more expenses to reveal behavior.</strong>
              <p>
                The detector looks for late-night leaks, weekend leaks,
                after-payday spikes, emotional notes, repeated categories,
                and decision-zone spending.
              </p>
            </div>
          </div>
          <button type="button" className="v58-empty-primary" onClick={onOpenAdd}>
            Track more expenses
          </button>
        </section>
      )}
    </section>
  );
}


function LeakStreaksPanel({
  settings,
  streaks,
  onOpenAdd,
}: {
  settings: Settings;
  streaks: LeakStreakItem[];
  onOpenAdd: () => void;
}) {
  const bestStreak = streaks.find((item) => item.status === "clean") || streaks[0];

  return (
    <details className="leak-streaks-details">
      <summary>
        <div>
          <span>Leak Streaks</span>
          <small>Clean days by category.</small>
        </div>
        <b>
          {bestStreak?.status === "clean"
            ? `${bestStreak.daysClean}d clean`
            : `${streaks.length} tracked`}
        </b>
      </summary>

      <section className="leak-streaks-panel">
        {bestStreak && (
          <div className={`leak-streak-hero ${bestStreak.tone}`}>
            <img src={bestStreak.icon} alt="" />
            <div>
              <span>{bestStreak.status === "clean" ? "Best active streak" : "Streak signal"}</span>
              <strong>{bestStreak.title}</strong>
              <p>{bestStreak.detail}</p>
            </div>
          </div>
        )}

        <div className="leak-streak-list">
          {streaks.map((item) => (
            <article className={`leak-streak-card ${item.tone}`} key={item.id}>
              <img src={item.icon} alt="" />

              <div>
                <strong>{item.title}</strong>
                <span>{item.suggestion}</span>

                <div className="leak-streak-mini">
                  <div>
                    <small>This month</small>
                    <b>{item.countThisMonth}x</b>
                  </div>
                  <div>
                    <small>Leak value</small>
                    <b>{money(item.totalThisMonth, settings.currency)}</b>
                  </div>
                  <div>
                    <small>Last leak</small>
                    <b>{item.lastLeakLabel}</b>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <button type="button" className="leak-streak-action" onClick={onOpenAdd}>
          Track next decision
        </button>
      </section>
    </details>
  );
}

function OneFixRecommendationPanel({
  settings,
  recommendation,
  accepted,
  ignored,
  onAccept,
  onMakeEasier,
  onMakeHarder,
  onIgnore,
  onOpenAdd,
}: {
  settings: Settings;
  recommendation: OneFixRecommendation;
  accepted: boolean;
  ignored: boolean;
  onAccept: () => void;
  onMakeEasier: () => void;
  onMakeHarder: () => void;
  onIgnore: () => void;
  onOpenAdd: () => void;
}) {
  const hasEstimatedSave = recommendation.estimatedSave > 0;

  return (
    <section className={`one-fix-panel ${accepted ? "accepted" : ""} ${ignored ? "ignored" : ""}`}>
      <div className="section-title">
        <span>One Fix Recommendation</span>
        <small>One clear action. Not ten random tips.</small>
      </div>

      <div className="one-fix-hero">
        <img src={recommendation.icon} alt="" />
        <div>
          <span>{recommendation.source} · {recommendation.difficultyLabel}</span>
          <strong>{recommendation.title}</strong>
          <p>{recommendation.body}</p>
        </div>
      </div>

      <div className="one-fix-target">
        <strong>{recommendation.target}</strong>
        <p>{recommendation.reason}</p>
      </div>

      <div className="one-fix-grid">
        <div>
          <span>Difficulty</span>
          <strong>{recommendation.difficultyLabel}</strong>
        </div>
        <div>
          <span>Estimated save</span>
          <strong>
            {hasEstimatedSave ? money(recommendation.estimatedSave, settings.currency) : "signal first"}
          </strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{accepted ? "accepted" : ignored ? "ignored" : "ready"}</strong>
        </div>
      </div>

      {accepted && (
        <div className="one-fix-state-note accepted">
          <strong>Fix accepted.</strong>
          <span>Next step: track honestly and check whether the pattern changes.</span>
        </div>
      )}

      {ignored && (
        <div className="one-fix-state-note ignored">
          <strong>Ignored for now.</strong>
          <span>No problem. The pattern stays visible in Chart when you want to return to it.</span>
        </div>
      )}

      <div className="one-fix-actions">
        <button type="button" className="primary" onClick={onAccept}>
          Accept fix
        </button>
        <button type="button" onClick={onMakeEasier}>
          Make easier
        </button>
        <button type="button" onClick={onMakeHarder}>
          Make harder
        </button>
        <button type="button" onClick={onOpenAdd}>
          Track next
        </button>
        <button type="button" onClick={onIgnore}>
          Ignore
        </button>
      </div>
    </section>
  );
}

function WeeklyReviewPanel({
  settings,
  review,
  exchangeRates,
  shareCardRef,
  sharing,
  onShare,
}: {
  settings: Settings;
  review: WeeklyReview;
  exchangeRates: ExchangeRateMap;
  shareCardRef: React.RefObject<HTMLDivElement | null>;
  sharing: boolean;
  onShare: () => void;
}) {
  const spentUsdNote = usdReferenceNote(review.totalSpent, settings.currency, settings, exchangeRates);
  const leaksUsdNote = usdReferenceNote(review.totalLeaks, settings.currency, settings, exchangeRates);
  const publicIdentityName = getPublicIdentityName(settings);
  const publicIdentityAvatar = getPublicProfileAvatarImage(settings);

  return (
    <details className="weekly-review-details">
      <summary>
        <div>
          <span>This Week in $BROKE</span>
          <small>Weekly review, one fix, and share card.</small>
        </div>
        <b>{review.totalCount} records</b>
      </summary>

      <section className="weekly-review-panel">
        <div className="weekly-review-summary">
          <div>
            <span>Spent this week</span>
            <strong>{money(review.totalSpent, settings.currency)}</strong>
            {spentUsdNote && <small className="share-usd-reference-note">{spentUsdNote}</small>}
          </div>
          <div>
            <span>Leaks this week</span>
            <strong>{money(review.totalLeaks, settings.currency)}</strong>
            {leaksUsdNote && <small className="share-usd-reference-note">{leaksUsdNote}</small>}
          </div>
          <div>
            <span>Leak pressure</span>
            <strong>{review.leakPressure}%</strong>
          </div>
        </div>

        <div className="weekly-review-grid">
          <div>
            <span>Biggest leak</span>
            <strong>
              {review.biggestLeakAmount > 0
                ? categoryLabel(review.biggestLeakCategory)
                : "none"}
            </strong>
            <small>
              {review.biggestLeakAmount > 0
                ? money(review.biggestLeakAmount, settings.currency)
                : "No leak"}
            </small>
          </div>
          <div>
            <span>Most repeated</span>
            <strong>
              {review.mostRepeatedCount > 0
                ? categoryLabel(review.mostRepeatedCategory)
                : "none"}
            </strong>
            <small>
              {review.mostRepeatedCount > 0 ? `${review.mostRepeatedCount}x` : "No repeat"}
            </small>
          </div>
          <div>
            <span>Best day</span>
            <strong>{review.bestDay ? review.bestDay.label : "none"}</strong>
            <small>
              {review.bestDay ? `${money(review.bestDay.leaks, settings.currency)} leaks` : "No data"}
            </small>
          </div>
          <div>
            <span>Worst day</span>
            <strong>{review.worstDay ? review.worstDay.label : "none"}</strong>
            <small>
              {review.worstDay ? money(review.worstDay.spent, settings.currency) : "No data"}
            </small>
          </div>
        </div>

        <div className="weekly-review-fix">
          <strong>{review.oneFixTitle}</strong>
          <p>{review.oneFixBody}</p>
        </div>

        <div className="weekly-review-days">
          {review.days.length === 0 ? (
            <span>No weekly records yet.</span>
          ) : (
            review.days.map((day) => (
              <div key={day.key}>
                <span>{day.label}</span>
                <strong>{money(day.spent, settings.currency)}</strong>
                <small>{day.count} records · {money(day.leaks, settings.currency)} leaks</small>
              </div>
            ))
          )}
        </div>

        <div className="weekly-review-share-card premium-share-card" ref={shareCardRef}>
          <img
            className="premium-share-card-art"
            src={PREMIUM_VISUAL_PACK.shareCleanBackground}
            alt=""
            onError={(event) => {
              event.currentTarget.src = SHARE_CARD_PUBLIC_ASSETS.background;
            }}
          />

          <div className="weekly-share-top share-card-identity-top">
            <div className="share-card-identity-line">
              <img className="share-card-avatar" src={publicIdentityAvatar} alt="" />
              <div>
                <span>$BROKE WEEKLY REVIEW</span>
                <strong>This Week in $BROKE</strong>
                <small>{publicIdentityName}</small>
              </div>
            </div>
            <img className="share-card-signal-icon" src={A.chartFrog} alt="" />
          </div>

          <div className="weekly-share-grid">
            <div>
              <span>Spent</span>
              <strong>{money(review.totalSpent, settings.currency)}</strong>
              {spentUsdNote && <small className="share-usd-reference-note">{spentUsdNote}</small>}
            </div>
            <div>
              <span>Leaks</span>
              <strong>{money(review.totalLeaks, settings.currency)}</strong>
              {leaksUsdNote && <small className="share-usd-reference-note">{leaksUsdNote}</small>}
            </div>
            <div>
              <span>Pressure</span>
              <strong>{review.leakPressure}%</strong>
            </div>
            <div>
              <span>Records</span>
              <strong>{review.totalCount}</strong>
            </div>
          </div>

          <div className="weekly-share-fix">
            <strong>{review.oneFixTitle}</strong>
            <span>{review.oneFixBody}</span>
          </div>

          <div className="weekly-share-footer">
            <strong>One week shows the pattern. One fix changes next week.</strong>
            <span>$BROKE Life Tracker · Weekly Review</span>
          </div>
        </div>

        <button type="button" className="weekly-review-share-button" onClick={onShare} disabled={sharing}>
          {sharing ? "Creating weekly review card..." : "Share weekly review card"}
        </button>
      </section>
    </details>
  );
}

function MonthlyLeakHistoryPanel({
  settings,
  archive,
  exchangeRates,
  monthOptions,
  selectedMonth,
  onMonthChange,
  shareCardRef,
  sharing,
  onShare,
}: {
  settings: Settings;
  archive: MonthlyLeakArchive;
  exchangeRates: ExchangeRateMap;
  monthOptions: string[];
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  shareCardRef: React.RefObject<HTMLDivElement | null>;
  sharing: boolean;
  onShare: () => void;
}) {
  const totalSpentUsdNote = usdReferenceNote(archive.totalSpent, settings.currency, settings, exchangeRates);
  const totalLeaksUsdNote = usdReferenceNote(archive.totalLeaks, settings.currency, settings, exchangeRates);
  const publicIdentityName = getPublicIdentityName(settings);
  const publicIdentityAvatar = getPublicProfileAvatarImage(settings);

  return (
    <section className="monthly-leak-history">
      <div className="section-title">
        <span>Monthly Leak History</span>
        <small>Grouped from your saved expenses.</small>
      </div>

      <div className="monthly-history-control">
        <label>
          <span>Month</span>
          <select value={selectedMonth} onChange={(event) => onMonthChange(event.target.value)}>
            {monthOptions.map((key) => (
              <option key={key} value={key}>
                {formatMonthTitle(key)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="monthly-history-summary">
        <div>
          <span>Total spent</span>
          <strong>{money(archive.totalSpent, settings.currency)}</strong>
          {totalSpentUsdNote && <small className="share-usd-reference-note">{totalSpentUsdNote}</small>}
        </div>
        <div>
          <span>Total leaks</span>
          <strong>{money(archive.totalLeaks, settings.currency)}</strong>
          {totalLeaksUsdNote && <small className="share-usd-reference-note">{totalLeaksUsdNote}</small>}
        </div>
        <div>
          <span>Records</span>
          <strong>{archive.totalCount}</strong>
        </div>
      </div>

      <div className="monthly-history-comment">
        <strong>App comment</strong>
        <p>{archive.summaryComment}</p>
      </div>

      <div className="monthly-history-share-card premium-share-card" ref={shareCardRef}>
        <img
          className="premium-share-card-art"
          src={PREMIUM_VISUAL_PACK.shareCleanBackground}
          alt=""
          onError={(event) => {
            event.currentTarget.src = SHARE_CARD_PUBLIC_ASSETS.background;
          }}
        />

        <div className="monthly-share-top share-card-identity-top">
          <div className="share-card-identity-line">
            <img className="share-card-avatar" src={publicIdentityAvatar} alt="" />
            <div>
              <span>$BROKE MONTHLY HISTORY</span>
              <strong>{archive.monthLabel}</strong>
              <small>{publicIdentityName}</small>
            </div>
          </div>
          <img className="share-card-signal-icon" src={A.chartFrog} alt="" />
        </div>

        <div className="monthly-share-grid">
          <div>
            <span>Total spent</span>
            <strong>{money(archive.totalSpent, settings.currency)}</strong>
            {totalSpentUsdNote && <small className="share-usd-reference-note">{totalSpentUsdNote}</small>}
          </div>
          <div>
            <span>Total leaks</span>
            <strong>{money(archive.totalLeaks, settings.currency)}</strong>
            {totalLeaksUsdNote && <small className="share-usd-reference-note">{totalLeaksUsdNote}</small>}
          </div>
          <div>
            <span>Records</span>
            <strong>{archive.totalCount}</strong>
          </div>
          <div>
            <span>Top category</span>
            <strong>
              {archive.topCategory ? categoryDisplayLabel(settings, archive.topCategory.category) : "none"}
            </strong>
          </div>
        </div>

        <div className="monthly-share-comment">
          <strong>
            {archive.repeatedCategory
              ? `${archive.repeatedCategory.count}x ${categoryDisplayLabel(settings, archive.repeatedCategory.category)}`
              : "No repeated leak yet"}
          </strong>
          <span>{archive.summaryComment}</span>
        </div>

        <div className="monthly-share-footer">
          <strong>Small purchases become a lifestyle if you never count them.</strong>
          <span>$BROKE Life Tracker · Monthly Leak History</span>
        </div>
      </div>

      <button type="button" className="monthly-history-share-button" onClick={onShare} disabled={sharing}>
        {sharing ? "Creating history card..." : "Share monthly history card"}
      </button>

      {archive.categories.length === 0 ? (
        <section className="v58-empty-card monthly-history-empty">
          <div className="v58-empty-head">
            <img src={A.chartFrog} alt="" />
            <div>
              <span>No monthly memory yet</span>
              <strong>Track expenses to build history.</strong>
              <p>
                Once you add expenses, this archive will group them by category,
                purchase count, average price and leak pattern.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <div className="monthly-category-list">
          {archive.categories.map((item) => (
            <details className="monthly-category-card" key={item.category}>
              <summary>
                <img src={item.icon} alt="" />
                <div>
                  <strong>{categoryDisplayName(settings, item.category)}</strong>
                  <span>
                    {money(item.total, settings.currency)} · {item.count} purchase{item.count === 1 ? "" : "s"} · avg {money(item.average, settings.currency)}
                  </span>
                </div>
                <b>{item.sharePercent}%</b>
              </summary>

              <div className="monthly-category-breakdown">
                <div>
                  <span>Needed</span>
                  <strong>{money(item.neededTotal, settings.currency)}</strong>
                </div>
                <div>
                  <span>Maybe</span>
                  <strong>{money(item.maybeTotal, settings.currency)}</strong>
                </div>
                <div>
                  <span>Not needed</span>
                  <strong>{money(item.notNeededTotal, settings.currency)}</strong>
                </div>
                <div>
                  <span>Leak value</span>
                  <strong>{money(item.leakTotal, settings.currency)}</strong>
                </div>
              </div>

              <div className="monthly-category-comment">
                <strong>{item.commentTitle}</strong>
                <p>{item.commentBody}</p>
              </div>

              <div className="monthly-purchase-list">
                {item.purchases.map((expense) => (
                  <div className="monthly-purchase-row" key={expense.id}>
                    <div>
                      <strong>{money(expense.amount, settings.currency)}</strong>
                      <span>
                        {new Date(expense.createdAt).toLocaleDateString()} · {expense.needType}
                      </span>
                      {expense.note && <small>{expense.note}</small>}
                    </div>
                    <b>{expense.needType === "Needed" ? "OK" : "Leak"}</b>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

function ChartActiveStreakTimeline({
  state,
  status,
}: {
  state: ActiveStreakProofState;
  status: ActiveStreakProofStatus;
}) {
  const timeline = useMemo(() => buildActiveStreakProofTimeline(state), [state]);
  const summary = getActiveStreakTimelineSummary(status);
  const protectedCount = timeline.filter((day) => day.protected).length;
  const missingCount = Math.max(0, timeline.length - protectedCount);

  return (
    <section className={`chart-proof-timeline-card ${summary.tone}`}>
      <div className="chart-proof-timeline-head">
        <div>
          <span>Active Streak Timeline</span>
          <strong>{summary.title}</strong>
          <p>{summary.detail}</p>
        </div>
        <b>{status.currentStreak}d</b>
      </div>

      <div className="chart-proof-week-strip" aria-label="Last 7 days active streak proof">
        {timeline.map((day) => (
          <article
            key={day.date}
            className={`${day.protected ? "protected" : "missed"}${day.recovered ? " recovered" : ""}${day.isToday ? " today" : ""}`}
            title={`${day.label}: ${getActiveStreakTimelineDayLabel(day)}`}
          >
            <span>{day.dayName.slice(0, 1)}</span>
            <b>{day.protected ? day.recovered ? "R" : "✓" : "—"}</b>
            <small>{day.isToday ? "Today" : day.label}</small>
          </article>
        ))}
      </div>

      <div className="chart-proof-history-list">
        {timeline.map((day) => (
          <div key={`history-${day.date}`} className={day.protected ? "protected" : "missed"}>
            <span>{day.isToday ? "Today" : day.isYesterday ? "Yesterday" : `${day.dayName}, ${day.label}`}</span>
            <strong>{getActiveStreakTimelineDayLabel(day)}</strong>
          </div>
        ))}
      </div>

      <footer>
        <span>{protectedCount}/{ACTIVE_STREAK_ELIGIBILITY_DAYS} protected days in view</span>
        <small>{missingCount > 0 ? `${missingCount} day${missingCount === 1 ? "" : "s"} without proof` : "Clean 7-day proof window"}</small>
      </footer>
    </section>
  );
}

function ChartScreen({
  settings,
  expenses,
  walletInsights,
  exchangeRates,
  patternHistory,
  shareInitData,
  activeStreakProof,
  activeProofStatus,
  onBack,
  onExport,
  onOpenAdd,
}: {
  settings: Settings;
  expenses: Expense[];
  walletInsights: WalletInsight[];
  exchangeRates: ExchangeRateMap;
  patternHistory: PatternHistoryRecord[];
  shareInitData: string;
  activeStreakProof: ActiveStreakProofState;
  activeProofStatus: ActiveStreakProofStatus;
  onBack: () => void;
  onExport: () => void;
  onOpenAdd: () => void;
}) {
  const [range, setRange] = useState<ChartRange>("week");
  const [historyMonth, setHistoryMonth] = useState(monthKey(new Date()));
  const [historySharing, setHistorySharing] = useState(false);
  const [weeklyReviewSharing, setWeeklyReviewSharing] = useState(false);
  const [oneFixDifficulty, setOneFixDifficulty] = useState<OneFixDifficulty>("normal");
  const [oneFixAccepted, setOneFixAccepted] = useState(false);
  const [oneFixIgnored, setOneFixIgnored] = useState(false);
  const historyShareCardRef = useRef<HTMLDivElement | null>(null);
  const weeklyReviewShareCardRef = useRef<HTMLDivElement | null>(null);

  const weeklyReview = useMemo(
    () => buildWeeklyReview(expenses, settings),
    [expenses, settings]
  );

  const historyMonthOptions = useMemo(() => getMonthlyHistoryOptions(expenses), [expenses]);
  const historyExpenses = useMemo(
    () => getExpensesForMonthKey(expenses, historyMonth),
    [expenses, historyMonth]
  );
  const monthlyArchive = useMemo(
    () => buildMonthlyLeakArchive(historyExpenses, historyMonth),
    [historyExpenses, historyMonth]
  );
  const leakPatterns = useMemo(
    () => buildLeakPatterns(expenses, settings),
    [expenses, settings]
  );
  const leakPatternLabSummary = useMemo(
    () => buildLeakPatternLabSummary(expenses, settings, leakPatterns),
    [expenses, settings, leakPatterns]
  );
  const weeklyPatternSummary = useMemo(
    () => buildWeeklyPatternSummary(expenses, settings),
    [expenses, settings]
  );
  const oneFixRecommendation = useMemo(
    () => buildOneFixRecommendation(leakPatterns, weeklyReview, settings, oneFixDifficulty),
    [leakPatterns, weeklyReview, settings, oneFixDifficulty]
  );
  const leakStreaks = useMemo(
    () => buildLeakStreaks(expenses, settings),
    [expenses, settings]
  );
  const weeklyReviewSpentUsdNote = usdReferenceNote(weeklyReview.totalSpent, settings.currency, settings, exchangeRates);
  const weeklyReviewLeaksUsdNote = usdReferenceNote(weeklyReview.totalLeaks, settings.currency, settings, exchangeRates);
  const weeklyReviewBiggestUsdNote = usdReferenceNote(weeklyReview.biggestLeakAmount, settings.currency, settings, exchangeRates);
  const monthlySpentUsdNote = usdReferenceNote(monthlyArchive.totalSpent, settings.currency, settings, exchangeRates);
  const monthlyLeaksUsdNote = usdReferenceNote(monthlyArchive.totalLeaks, settings.currency, settings, exchangeRates);
  const monthlyTopUsdNote = usdReferenceNote(monthlyArchive.topCategory?.total ?? 0, settings.currency, settings, exchangeRates);

  const weeklyReviewShareText = [
    "$BROKE Weekly Review",
    "",
    `Spent this week: ${money(weeklyReview.totalSpent, settings.currency)}`,
    `Leaks this week: ${money(weeklyReview.totalLeaks, settings.currency)}`,
    weeklyReviewSpentUsdNote || weeklyReviewLeaksUsdNote
      ? `USD reference: ${[weeklyReviewSpentUsdNote && `spent ${weeklyReviewSpentUsdNote}`, weeklyReviewLeaksUsdNote && `leaks ${weeklyReviewLeaksUsdNote}`].filter(Boolean).join(" · ")}`
      : "",
    `Records: ${weeklyReview.totalCount}`,
    `Leak pressure: ${weeklyReview.leakPressure}%`,
    `Biggest leak: ${
      weeklyReview.biggestLeakAmount > 0
        ? `${categoryDisplayLabel(settings, weeklyReview.biggestLeakCategory)} (${money(weeklyReview.biggestLeakAmount, settings.currency)})`
        : "none"
    }`,
    weeklyReview.biggestLeakAmount > 0 && weeklyReviewBiggestUsdNote ? `Biggest leak USD: ${weeklyReviewBiggestUsdNote}` : "",
    `Most repeated: ${
      weeklyReview.mostRepeatedCount > 0
        ? `${categoryDisplayLabel(settings, weeklyReview.mostRepeatedCategory)} (${weeklyReview.mostRepeatedCount}x)`
        : "none"
    }`,
    "",
    weeklyReview.oneFixTitle,
    weeklyReview.oneFixBody,
    "",
    "One week shows the pattern. One fix changes next week.",
    "Smoke is broke.",
  ].filter(Boolean).join("\n");

  async function shareWeeklyReviewCard() {
    if (!weeklyReviewShareCardRef.current || weeklyReviewSharing) return;

    triggerHaptic("light");
    setWeeklyReviewSharing(true);

    try {
      const imageFile = await createShareImageFileFromElement(weeklyReviewShareCardRef.current);
      const nativeShared = await tryNativeImageShare(imageFile);

      if (nativeShared) return;

      if (!shareInitData) {
        downloadImageFile(imageFile);
        notifyApp("Weekly Review downloaded", "Open inside Telegram next time to send the card to the bot.");
        return;
      }

      try {
        await sendShareImageViaBot(imageFile, shareInitData, weeklyReviewShareText);
        notifyApp("Weekly Review sent", "Open your Telegram bot chat and forward it anywhere.");
      } catch {
        downloadImageFile(imageFile);
        notifyApp("PNG downloaded", "Bot delivery failed, so the Weekly Review card was saved as a file.");
      }
    } catch {
      notifyApp("Sharing unavailable", "Weekly Review sharing is not supported by this browser.");
    } finally {
      setWeeklyReviewSharing(false);
    }
  }

  const monthlyHistoryShareText = [
    "$BROKE Monthly Leak History",
    "",
    `Month: ${monthlyArchive.monthLabel}`,
    `Total spent: ${money(monthlyArchive.totalSpent, settings.currency)}`,
    `Total leaks: ${money(monthlyArchive.totalLeaks, settings.currency)}`,
    monthlySpentUsdNote || monthlyLeaksUsdNote
      ? `USD reference: ${[monthlySpentUsdNote && `spent ${monthlySpentUsdNote}`, monthlyLeaksUsdNote && `leaks ${monthlyLeaksUsdNote}`].filter(Boolean).join(" · ")}`
      : "",
    `Records: ${monthlyArchive.totalCount}`,
    `Top category: ${
      monthlyArchive.topCategory
        ? `${categoryDisplayLabel(settings, monthlyArchive.topCategory.category)} (${money(monthlyArchive.topCategory.total, settings.currency)})`
        : "none"
    }`,
    monthlyArchive.topCategory && monthlyTopUsdNote ? `Top category USD: ${monthlyTopUsdNote}` : "",
    `Most repeated: ${
      monthlyArchive.repeatedCategory
        ? `${categoryDisplayLabel(settings, monthlyArchive.repeatedCategory.category)} (${monthlyArchive.repeatedCategory.count}x)`
        : "none"
    }`,
    "",
    monthlyArchive.summaryComment,
    "",
    "Small purchases become a lifestyle if you never count them.",
    "Smoke is broke.",
  ].filter(Boolean).join("\n");

  async function shareMonthlyHistoryCard() {
    if (!historyShareCardRef.current || historySharing) return;

    triggerHaptic("light");
    setHistorySharing(true);

    try {
      const imageFile = await createShareImageFileFromElement(historyShareCardRef.current);
      const nativeShared = await tryNativeImageShare(imageFile);

      if (nativeShared) return;

      if (!shareInitData) {
        downloadImageFile(imageFile);
        notifyApp("Monthly card downloaded", "Open inside Telegram next time to send the card to the bot.");
        return;
      }

      try {
        await sendShareImageViaBot(imageFile, shareInitData, monthlyHistoryShareText);
        notifyApp("Monthly card sent", "Open your Telegram bot chat and forward it anywhere.");
      } catch {
        downloadImageFile(imageFile);
        notifyApp("PNG downloaded", "Bot delivery failed, so the Monthly Leak History card was saved as a file.");
      }
    } catch {
      notifyApp("Sharing unavailable", "Monthly Leak History sharing is not supported by this browser.");
    } finally {
      setHistorySharing(false);
    }
  }

  const chartData = useMemo(() => {
    return buildChartData(range, expenses, settings);
  }, [range, expenses, settings]);

  const rangeExpenses = useMemo(() => {
    if (range === "day") return getTodayExpenses(expenses);
    if (range === "week") return getLastSevenDaysExpenses(expenses);

    return getCurrentMonthExpenses(expenses);
  }, [range, expenses]);

  const [selectedChartKey, setSelectedChartKey] = useState<string | null>(null);

  const maxSpent = Math.max(...chartData.map((point) => point.spent), 1);
  const maxLeakPressure = Math.max(...chartData.map((point) => point.pressure), 1);
  const latestPoint = chartData[chartData.length - 1];
  const selectedPoint =
    chartData.find((point) => point.key === selectedChartKey) || latestPoint;

  const selectedDayExpenses = useMemo(
    () => (selectedPoint ? getExpensesForDayKey(expenses, selectedPoint.key) : []),
    [expenses, selectedPoint?.key]
  );
  const selectedDayLeakSummaries = useMemo(
    () => getCategoryLeakSummaries(selectedDayExpenses),
    [selectedDayExpenses]
  );
  const selectedDayTrackedSummaries = useMemo(
    () => getCategoryTrackedSummaries(selectedDayExpenses),
    [selectedDayExpenses]
  );

  const periodOpen = chartData[0]?.open ?? 0;
  const periodSpent = sum(chartData.map((point) => point.spent));
  const periodClose = latestPoint?.close ?? periodOpen;
  const periodCount = sum(chartData.map((point) => point.count));
  const rangeLeaks = sum(chartData.map((point) => point.leakAmount));
  const daysInView = Math.max(chartData.length, 1);
  const dailyLeakBudget = getChartDailyLeakBudget(settings);
  const periodLeakBudget = dailyLeakBudget * daysInView;
  const leakPressure = clamp(Math.round((rangeLeaks / Math.max(periodLeakBudget, 1)) * 100), 0, 999);

  const topRangeLeakCategory = getCategoryLeakSummaries(rangeExpenses)[0];
  const topRangeTrackedCategory = getCategoryTrackedSummaries(rangeExpenses)[0];
  const topRangeCategory = topRangeLeakCategory || topRangeTrackedCategory;

  const averageDailySpend = periodSpent / daysInView;
  const averageDailyLeak = rangeLeaks / daysInView;
  const hasRangeData = rangeExpenses.length > 0;
  const title =
    range === "day"
      ? "Today"
      : range === "week"
        ? "Last 7 days"
        : "This cycle";
  const latestPointLabel = selectedPoint ? getChartPointStatusLabel(selectedPoint) : "No candle yet";
  const selectedTopLeak = selectedDayLeakSummaries[0] || null;
  const selectedTopTracked = selectedDayTrackedSummaries[0] || null;
  const selectedNeededTotal = sumTrackedExpensesByNeedType(selectedDayExpenses, "Needed");
  const selectedMaybeTotal = sumTrackedExpensesByNeedType(selectedDayExpenses, "Maybe");
  const selectedNotNeededTotal = sumTrackedExpensesByNeedType(selectedDayExpenses, "Not needed");
  const selectedTrackedTotal = selectedPoint?.spent ?? 0;
  const selectedLeakTotal = selectedPoint?.leakAmount ?? 0;
  const selectedDayEventCount = selectedDayExpenses.length;
  const selectedNeededPercent = selectedTrackedTotal > 0 ? Math.round((selectedNeededTotal / selectedTrackedTotal) * 100) : 0;
  const selectedMaybePercent = selectedTrackedTotal > 0 ? Math.round((selectedMaybeTotal / selectedTrackedTotal) * 100) : 0;
  const selectedNotNeededPercent = selectedTrackedTotal > 0 ? Math.max(0, 100 - selectedNeededPercent - selectedMaybePercent) : 0;
  const selectedLeakShareOfRange = rangeLeaks > 0 ? Math.round((selectedLeakTotal / rangeLeaks) * 100) : 0;
  const selectedLeakRank = selectedPoint && selectedLeakTotal > 0
    ? [...chartData]
        .filter((point) => point.leakAmount > 0)
        .sort((a, b) => b.leakAmount - a.leakAmount)
        .findIndex((point) => point.key === selectedPoint.key) + 1
    : 0;
  const selectedMainCauseMode = selectedDayLeakSummaries.length > 0 ? "leak" : "spending";
  const selectedMainCauseTotal = selectedMainCauseMode === "leak" ? selectedLeakTotal : selectedTrackedTotal;
  const selectedMainCauses = (selectedMainCauseMode === "leak" ? selectedDayLeakSummaries : selectedDayTrackedSummaries).slice(0, 3);
  const selectedTopEvents = [...selectedDayExpenses]
    .sort((a, b) => getExpenseLeakValue(b) - getExpenseLeakValue(a) || getExpenseTrackedValue(b) - getExpenseTrackedValue(a))
    .slice(0, 3);
  const selectedPatternText = describeSelectedCandlePattern(
    selectedPoint,
    selectedDayExpenses,
    selectedTopLeak,
    settings
  );
  const selectedTakeawayText = !selectedPoint || selectedPoint.count <= 0
    ? "This candle is empty. Track one expense to make the chart tell a real story."
    : selectedPoint.leakAmount <= 0
      ? "This candle stayed controlled because the spending was marked Needed."
      : selectedPoint.status === "danger"
        ? "This candle turned red because avoidable spending created enough pressure to hurt Wallet HP."
        : selectedPoint.status === "warning"
          ? "This candle is a warning: the pressure is visible, but still easy to correct."
          : "This candle had small leak pressure, but it stayed below the danger zone.";
  const selectedRangeContext = !selectedPoint || selectedPoint.count <= 0
    ? "No range impact yet."
    : selectedLeakTotal <= 0
      ? "This candle added tracked spending, but 0% of the selected range leaks."
      : `${selectedLeakShareOfRange}% of ${title.toLowerCase()} leaks came from this candle${selectedLeakRank > 0 ? ` · leak rank #${selectedLeakRank}` : ""}.`;
  const selectedDiagnosis = buildSelectedCandleDiagnosis(
    selectedPoint,
    selectedDayExpenses,
    selectedTopLeak,
    selectedLeakShareOfRange,
    selectedLeakRank,
    settings,
    title
  );

  return (
    <div className="screen">
      <Header title="$BROKE Chart" showBack rightIcon={A.export} onBack={onBack} onRight={onExport} />

      <section className="chart-banner">
        <p>
          Wallet Pressure Chart tracks daily leak pressure.
          <br />
          Green means controlled. Red means <span>Wallet HP danger.</span>
        </p>
      </section>

      <div className="switcher">
        <button
          type="button"
          className={range === "day" ? "active" : ""}
          onClick={() => setRange("day")}
        >
          Day
        </button>

        <button
          type="button"
          className={range === "week" ? "active" : ""}
          onClick={() => setRange("week")}
        >
          Week
        </button>

        <button
          type="button"
          className={range === "month" ? "active" : ""}
          onClick={() => setRange("month")}
        >
          Month
        </button>
      </div>

      <section className="chart-pulse-card">
        <div>
          <span>Wallet Pressure Chart</span>
          <strong>
            {hasRangeData
              ? `${leakPressure}% pressure`
              : "No pressure yet"}
          </strong>
          <small>
            {hasRangeData
              ? `${periodCount} records · ${money(rangeLeaks, settings.currency)} weighted leaks`
              : "One day becomes one candle. Expenses update today’s candle."}
          </small>
        </div>
        <img src={A.chartFrog} alt="" />
      </section>

      <section className="chart-stats-grid">
        <div>
          <span>Tracked spending</span>
          <strong>
            {periodSpent > 0 ? `-${money(periodSpent, settings.currency)}` : money(0, settings.currency)}
          </strong>
          <small>{title}</small>
        </div>

        <div>
          <span>Money leaks</span>
          <strong>{money(rangeLeaks, settings.currency)}</strong>
          <small>{money(averageDailyLeak, settings.currency)} daily leak pace</small>
        </div>

        <div>
          <span>Top leak</span>
          <strong>{topRangeCategory ? categoryDisplayLabel(settings, topRangeCategory.category) : "None"}</strong>
          <small>
            {topRangeCategory
              ? money(topRangeCategory.amount, settings.currency)
              : "No marked leak"}
          </small>
        </div>

        <div>
          <span>Avg spend/day</span>
          <strong>{money(averageDailySpend, settings.currency)}</strong>
          <small>{money(dailyLeakBudget, settings.currency)} daily leak budget</small>
        </div>
      </section>

      <ChartActiveStreakTimeline
        state={activeStreakProof}
        status={activeProofStatus}
      />

      {!hasRangeData && (
        <section className="chart-empty-state v58-empty-card v58-chart-empty">
          <img src={A.chartFrog} alt="" />
          <div>
            <span>$BROKE Chart is waiting</span>
            <strong>No wallet pressure yet.</strong>
            <p>
              Track one expense to create today’s candle. Needed spending stays controlled;
              Maybe and Not needed create leak pressure.
            </p>
            <button type="button" onClick={onOpenAdd}>
              Track first expense
            </button>
          </div>
        </section>
      )}

      <div className="chart-interaction-hint">
        <span>Tap a candle to inspect the day</span>
        <b>{selectedPoint ? `${selectedPoint.label} · ${getChartPointStatusLabel(selectedPoint)}` : "No candle selected"}</b>
      </div>

      <section className={`big-chart ${range}`}>
        <div className="chart-lines">
          {chartData.map((point) => {
            const height = clamp(24 + (point.pressure / maxLeakPressure) * 68, 18, 92);
            const pointTitle = [
              `${point.label}: ${getChartPointStatusLabel(point)}`,
              `Tracked: ${money(point.spent, settings.currency)}`,
              `Leaks: ${money(point.leakAmount, settings.currency)}`,
              `Pressure: ${point.pressure}%`,
              point.biggestLeakCategory
                ? `Top leak: ${categoryDisplayLabel(settings, point.biggestLeakCategory)}`
                : "Top leak: none",
              point.isCycleStart ? "Cycle start / payday marker" : "",
            ].filter(Boolean).join(" · ");

            const isSelected = selectedPoint?.key === point.key;
            const className = [
              getChartPointClassName(point),
              isSelected ? "selected" : "",
              point.isCycleStart ? "cycle-start" : "",
            ].filter(Boolean).join(" ");

            return (
              <i
                key={point.key}
                role="button"
                tabIndex={0}
                aria-label={pointTitle}
                className={className}
                style={{ height: `${height}%`, width: range === "day" ? "24px" : undefined }}
                title={pointTitle}
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedChartKey(point.key);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    triggerHaptic("light");
                    setSelectedChartKey(point.key);
                  }
                }}
              />
            );
          })}
        </div>

        <div className="price-line">
          <span>{leakPressure}% pressure</span>
        </div>
      </section>

      <section className="volume">
        <label>Leak Volume — {title}</label>
        <div className={range}>
          {chartData.map((point) => {
            const height = clamp(12 + (point.leakAmount / Math.max(rangeLeaks, 1)) * 75, 10, 90);

            const isSelected = selectedPoint?.key === point.key;

            return (
              <i
                key={point.key}
                role="button"
                tabIndex={0}
                aria-label={`${point.label}: ${money(point.leakAmount, settings.currency)} leaks`}
                className={`${getChartPointClassName(point)}${isSelected ? " selected" : ""}`}
                style={{ height: `${height}%`, width: range === "day" ? "24px" : undefined }}
                title={`${point.label}: ${money(point.leakAmount, settings.currency)} leaks`}
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedChartKey(point.key);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    triggerHaptic("light");
                    setSelectedChartKey(point.key);
                  }
                }}
              />
            );
          })}
        </div>
      </section>

      <section className="day-card selected-candle-card candle-story-card">
        <div className="day-title candle-story-title">
          <div>
            <strong>{selectedPoint?.label ?? title}</strong>
            <small>Pattern Insight · {selectedPoint ? getChartPointStatusLabel(selectedPoint) : "No candle selected"}</small>
          </div>
          <img src={A.calendar} alt="" />
        </div>

        <div className={`candle-pattern-diagnosis ${selectedDiagnosis.tone}`}>
          <div className="candle-pattern-diagnosis-head">
            <span>{selectedDiagnosis.label}</span>
            <strong>{selectedDiagnosis.title}</strong>
            <p>{selectedDiagnosis.body}</p>
          </div>

          <div className="candle-pattern-diagnosis-metrics">
            <div>
              <small>{selectedDiagnosis.primaryLabel}</small>
              <b>{selectedDiagnosis.primaryValue}</b>
            </div>
            <div>
              <small>{selectedDiagnosis.secondaryLabel}</small>
              <b>{selectedDiagnosis.secondaryValue}</b>
            </div>
          </div>

          <div className="candle-pattern-diagnosis-action">
            <small>Next move</small>
            <span>{selectedDiagnosis.action}</span>
          </div>
        </div>

        <div className="day-info candle-story-stats">
          <div>
            <span>Tracked</span>
            <b>{money(selectedTrackedTotal, settings.currency)}</b>
          </div>

          <div>
            <span>Leaks</span>
            <b>{money(selectedLeakTotal, settings.currency)}</b>
          </div>

          <div>
            <span>Pressure</span>
            <b>{selectedPoint?.pressure ?? 0}%</b>
          </div>

          <div>
            <span>Balance after</span>
            <b className={(selectedPoint?.close ?? periodClose) < 0 ? "bad" : "good"}>{money(selectedPoint?.close ?? periodClose, settings.currency)}</b>
          </div>
        </div>

        <div className="candle-story-grid">
          <div className="candle-story-block">
            <span>Main causes</span>
            {selectedMainCauses.length > 0 ? (
              <div className="candle-story-cause-list">
                {selectedMainCauses.map((item) => {
                  const share = selectedMainCauseTotal > 0 ? Math.round((item.amount / selectedMainCauseTotal) * 100) : 0;

                  return (
                    <article key={item.category}>
                      <div>
                        <b>{categoryDisplayLabel(settings, item.category)}</b>
                        <small>{selectedMainCauseMode === "leak" ? "Leak pressure" : "Tracked spending"} · {item.count}x</small>
                      </div>
                      <strong>{share}%</strong>
                      <i style={{ width: `${clamp(share, 3, 100)}%` }} />
                    </article>
                  );
                })}
              </div>
            ) : (
              <small>No spending categories recorded yet.</small>
            )}
          </div>

          <div className="candle-story-block">
            <span>Spending mix</span>
            <div className="candle-story-mix-bars" aria-label="Spending mix">
              <i className="needed" style={{ width: `${clamp(selectedNeededPercent, 0, 100)}%` }} />
              <i className="maybe" style={{ width: `${clamp(selectedMaybePercent, 0, 100)}%` }} />
              <i className="not-needed" style={{ width: `${clamp(selectedNotNeededPercent, 0, 100)}%` }} />
            </div>
            <div className="candle-story-mix-labels">
              <span><b>Needed</b>{selectedNeededPercent}%</span>
              <span><b>Maybe</b>{selectedMaybePercent}%</span>
              <span><b>Not needed</b>{selectedNotNeededPercent}%</span>
            </div>
          </div>
        </div>

        <div className="candle-story-compact-row">
          <div>
            <span>Pattern detected</span>
            <p>{selectedPatternText}</p>
          </div>
          <div>
            <span>Range context</span>
            <p>{selectedRangeContext}</p>
          </div>
        </div>

        {selectedTopEvents.length > 0 && (
          <div className="selected-candle-events candle-story-events">
            <span>Top events</span>
            {selectedTopEvents.map((expense) => {
              const leakValue = getExpenseLeakValue(expense);
              const expenseTime = new Date(expense.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={expense.id}>
                  <span>{categoryDisplayLabel(settings, expense.category)}</span>
                  <b>{money(getExpenseTrackedValue(expense), settings.currency)}</b>
                  <small>{expense.needType} · {expenseTime} · leak {money(leakValue, settings.currency)}</small>
                </div>
              );
            })}
          </div>
        )}

        <div className="candle-story-takeaway">
          <span>Takeaway</span>
          <p>{selectedTakeawayText}</p>
        </div>

        <div className="chart-range-note">
          <span>
            Current candle: {selectedPoint?.label ?? "-"} · {latestPointLabel} · {money(selectedLeakTotal, settings.currency)} leaks · {selectedPoint?.pressure ?? 0}% pressure · {selectedDayEventCount} events
          </span>
          <span>
            Payday is treated as a cycle marker. It does not create a fake green candle and history is not deleted.
          </span>
        </div>
      </section>

      <OneFixRecommendationPanel
        settings={settings}
        recommendation={oneFixRecommendation}
        accepted={oneFixAccepted}
        ignored={oneFixIgnored}
        onAccept={() => {
          triggerHaptic("success");
          setOneFixAccepted(true);
          setOneFixIgnored(false);
        }}
        onMakeEasier={() => {
          triggerHaptic("light");
          setOneFixDifficulty("easy");
          setOneFixAccepted(false);
          setOneFixIgnored(false);
        }}
        onMakeHarder={() => {
          triggerHaptic("light");
          setOneFixDifficulty("hard");
          setOneFixAccepted(false);
          setOneFixIgnored(false);
        }}
        onIgnore={() => {
          triggerHaptic("medium");
          setOneFixIgnored(true);
          setOneFixAccepted(false);
        }}
        onOpenAdd={onOpenAdd}
      />

      <details className="chart-premium-details analysis-lab-details">
        <summary>
          <div>
            <span>Leak Pattern Lab</span>
            <small>Timing, payday, weekend, and behavior signals.</small>
          </div>
          <img
            src={PREMIUM_VISUAL_PACK.analysisLabMascot}
            alt=""
            onError={(event) => {
              event.currentTarget.src = A.chartFrog;
            }}
          />
        </summary>

        <section className="chart-premium-details-body">
          <PatternDetectorPanel
            settings={settings}
            patterns={leakPatterns}
            labSummary={leakPatternLabSummary}
            weeklyPatternSummary={weeklyPatternSummary}
            patternHistory={patternHistory}
            onOpenAdd={onOpenAdd}
          />

          <LeakStreaksPanel
            settings={settings}
            streaks={leakStreaks}
            onOpenAdd={onOpenAdd}
          />

          <details className="chart-subdetails">
            <summary>
              <span>More wallet insights</span>
              <b>{walletInsights.length}</b>
            </summary>
            <WalletInsightsPanel insights={walletInsights} compact />
          </details>
        </section>
      </details>

      <details className="chart-premium-details history-archive-details">
        <summary>
          <div>
            <span>History Archive</span>
            <small>Weekly review and monthly spending memory.</small>
          </div>
          <img src={A.calendar} alt="" />
        </summary>

        <section className="chart-premium-details-body">
          <WeeklyReviewPanel
            settings={settings}
            review={weeklyReview}
            exchangeRates={exchangeRates}
            shareCardRef={weeklyReviewShareCardRef}
            sharing={weeklyReviewSharing}
            onShare={shareWeeklyReviewCard}
          />

          <MonthlyLeakHistoryPanel
            settings={settings}
            archive={monthlyArchive}
            exchangeRates={exchangeRates}
            monthOptions={historyMonthOptions}
            selectedMonth={historyMonth}
            onMonthChange={setHistoryMonth}
            shareCardRef={historyShareCardRef}
            sharing={historySharing}
            onShare={shareMonthlyHistoryCard}
          />
        </section>
      </details>
    </div>
  );
}



function LeaderboardPanel({
  leaderboard,
  loading,
  onToggleLeaderboard,
}: {
  leaderboard: LeaderboardState | null;
  loading: boolean;
  onToggleLeaderboard: (nextValue: boolean) => void;
}) {
  const [board, setBoard] = useState<"daily" | "weekly" | "allTime">("daily");
  const me = leaderboard?.me ?? null;
  const rows =
    board === "daily"
      ? leaderboard?.daily ?? []
      : board === "weekly"
        ? leaderboard?.weekly ?? []
        : leaderboard?.allTime ?? [];

  const isPublic = Boolean(me?.publicLeaderboard);

  return (
    <section className="leaderboard-panel">
      <div className="section-title">
        <span>$BROKE Score</span>
        <small>{isPublic ? "Public progress" : "Private mode"}</small>
      </div>

      <div className="leaderboard-me-card">
        <img src={A.challengeTrophy} alt="" />
        <div>
          <span>Your score</span>
          <strong>{me ? me.brokeScore.toLocaleString("en-US") : "0"} XP</strong>
          <small>
            Trust L{me?.trustLevel ?? 0} · {me?.currentStreak ?? 0}d streak ·{" "}
            {me?.badgeCount ?? 0} badges
          </small>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => onToggleLeaderboard(!isPublic)}
        >
          {isPublic ? "Hide" : "Join"}
        </button>
      </div>

      <div className="leaderboard-tabs">
        <button
          type="button"
          className={board === "daily" ? "active" : ""}
          onClick={() => setBoard("daily")}
        >
          Daily
        </button>
        <button
          type="button"
          className={board === "weekly" ? "active" : ""}
          onClick={() => setBoard("weekly")}
        >
          Weekly
        </button>
        <button
          type="button"
          className={board === "allTime" ? "active" : ""}
          onClick={() => setBoard("allTime")}
        >
          All
        </button>
      </div>

      <div className="leaderboard-list">
        {rows.length === 0 ? (
          <div className="leaderboard-empty">
            No public players yet. Join the board to make the first move.
          </div>
        ) : (
          rows.slice(0, 10).map((row, index) => (
            <LeaderboardRow
              key={`${board}-${row.telegramId}`}
              row={row}
              rank={row.rank ?? index + 1}
              mode={board}
            />
          ))
        )}
      </div>

      <details className="leaderboard-faq">
        <summary>
          <img src={A.help} alt="" />
          <span>How does this leaderboard work?</span>
        </summary>
        <div>
          <p>
            Leaderboard is not based on income, private expenses, or claimed savings.
            Those numbers are private and easy to fake.
          </p>
          <p>
            $BROKE Score is based on consistency: tracking activity, streaks,
            challenges, badges, and trust level.
          </p>
          <p>
            Public ranking shows only score, streak, badges, completed challenges,
            and trust level. Financial details stay private.
          </p>
        </div>
      </details>
    </section>
  );
}

function LeaderboardRow({
  row,
  rank,
  mode,
}: {
  row: LeaderboardProfile;
  rank: number;
  mode: "daily" | "weekly" | "allTime";
}) {
  const score =
    mode === "daily" ? row.dailyXp : mode === "weekly" ? row.weeklyXp : row.totalXp;

  return (
    <article className="leaderboard-row">
      <b>#{rank}</b>
      <div>
        <strong>{row.displayName}</strong>
        <span>
          L{row.trustLevel} · {row.currentStreak}d streak · {row.badgeCount} badges ·{" "}
          {row.challengesCompleted} challenges
        </span>
      </div>
      <em>{score.toLocaleString("en-US")} XP</em>
    </article>
  );
}


function PatternChallengeCoachCard({
  recommendation,
  activeChallenge,
  progress,
  loading,
  currency,
  onStartChallenge,
  onOpenAdd,
}: {
  recommendation: PatternChallengeRecommendation;
  activeChallenge: UserChallenge | null;
  progress: ChallengeProgress | null;
  loading: boolean;
  currency: Currency;
  onStartChallenge: (challengeId: string) => void;
  onOpenAdd: () => void;
}) {
  const template = recommendation.template;
  const hasActiveChallenge = Boolean(activeChallenge || progress);
  const waiting = recommendation.urgency === "waiting" || !template;

  return (
    <section className={`pattern-challenge-coach ${recommendation.urgency}`}>
      <div className="pattern-challenge-coach-head">
        <div>
          <span>Pattern Challenge Coach</span>
          <strong>{recommendation.title}</strong>
          <p>{recommendation.reason}</p>
        </div>
        <b>{waiting ? "Learning" : "Recommended"}</b>
      </div>

      <div className="pattern-challenge-coach-grid">
        <article>
          <small>Focus</small>
          <strong>{recommendation.focus}</strong>
        </article>
        <article>
          <small>Mission</small>
          <strong>{template ? template.title : "Track more leaks"}</strong>
        </article>
        <article>
          <small>Limit</small>
          <strong>{template ? money(template.maxSpend, currency) : "—"}</strong>
        </article>
      </div>

      <div className="pattern-challenge-next-move">
        <small>Next move</small>
        <span>{recommendation.nextMove}</span>
      </div>

      <div className="pattern-challenge-actions">
        {waiting ? (
          <button type="button" onClick={onOpenAdd}>
            Track leak with context
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || hasActiveChallenge || !template}
            onClick={() => template && onStartChallenge(template.id)}
          >
            {hasActiveChallenge ? "Finish active challenge first" : "Start recommended challenge"}
          </button>
        )}
        <small>Suggestion is based on this week’s pattern, not private income or real balance.</small>
      </div>
    </section>
  );
}

function ChallengesPanel({
  templates,
  activeChallenge,
  progress,
  loading,
  currency,
  onStartChallenge,
}: {
  templates: ChallengeTemplate[];
  activeChallenge: UserChallenge | null;
  progress: ChallengeProgress | null;
  loading: boolean;
  currency: Currency;
  onStartChallenge: (challengeId: string) => void;
}) {
  const availableTemplates = templates.slice(0, 6);

  return (
    <section className="challenges-panel">
      <div className="section-title">
        <span>Leak Challenges</span>
        <small>{activeChallenge ? "Active now" : "Choose one"}</small>
      </div>

      {progress ? (
        <ActiveChallengeCard progress={progress} currency={currency} />
      ) : (
        <div className="challenge-grid">
          {availableTemplates.map((template) => (
            <button
              type="button"
              key={template.id}
              className="challenge-template-card"
              disabled={loading}
              onClick={() => onStartChallenge(template.id)}
            >
              <img src={template.icon} alt="" />
              <div>
                <strong>{template.title}</strong>
                <span>
                  {template.durationDays}d · limit {money(template.maxSpend, currency)}
                </span>
              </div>
              <b>+{template.rewardHp} HP</b>
            </button>
          ))}
        </div>
      )}

      {activeChallenge && !progress && (
        <div className="challenge-note">
          Challenge data is syncing. Reopen the app if this stays visible.
        </div>
      )}
    </section>
  );
}

function ActiveChallengeCard({
  progress,
  currency,
}: {
  progress: ChallengeProgress;
  currency: Currency;
}) {
  const icon =
    progress.status === "completed"
      ? A.challengeCompleted
      : progress.status === "failed"
        ? A.challengeFailed
        : progress.icon;

  const statusLabel =
    progress.status === "completed"
      ? "Completed"
      : progress.status === "failed"
        ? "Failed"
        : `${progress.daysLeft}d left`;

  return (
    <article className={`active-challenge-card ${progress.status}`}>
      <img src={icon} alt="" />

      <div className="active-challenge-body">
        <div className="active-challenge-head">
          <div>
            <span>Active Challenge</span>
            <strong>{progress.title}</strong>
          </div>
          <b>{statusLabel}</b>
        </div>

        <p>{progress.description}</p>

        <div className="challenge-progress-row">
          <span>{money(progress.spent, currency)}</span>
          <small>/ {money(progress.maxSpend, currency)} limit</small>
        </div>

        <div className="challenge-progress-bar">
          <div style={{ width: `${Math.min(100, Math.max(0, progress.percentUsed))}%` }} />
        </div>

        <footer>
          <span>{progress.category === "All" ? "All leaks" : progress.category}</span>
          <strong>+{progress.rewardHp} Wallet HP</strong>
        </footer>
      </div>
    </article>
  );
}


const GROWTH_SIMULATIONS_KEY = "broke-growth-simulations-v2";
const GROWTH_PLANNER_KEY = "broke-growth-planner-v1";
const CLOUD_APP_STATE_SYNC_EVENT = "broke-cloud-app-state-sync";

const defaultGrowthPlannerState: GrowthPlannerState = {
  realLifeTargets: [
    { id: "insurance", name: "Insurance", amount: "", period: "one" },
    { id: "housing", name: "Mortgage / rent", amount: "", period: "one" },
  ],
  savingGoalName: "",
  savingGoalAmount: "",
};

function growthFrequencyMultiplier(frequency: GrowthFrequency) {
  if (frequency === "daily") return 30;
  if (frequency === "weekly") return 4.35;
  return 1;
}

function growthFrequencyLabel(frequency: GrowthFrequency) {
  if (frequency === "daily") return "daily";
  if (frequency === "weekly") return "weekly";
  return "monthly";
}

function growthRiskLabel(risk: GrowthRisk) {
  if (risk === "low") return "Low risk";
  if (risk === "medium") return "Medium risk";
  return "High risk";
}

function normalizeGrowthPlanProgressEntry(
  input: Partial<GrowthPlanProgressEntry>
): GrowthPlanProgressEntry | null {
  const amount = Math.max(0, Number(input.amount) || 0);

  if (amount <= 0) return null;

  return {
    id: input.id || uid(),
    amount,
    createdAt: input.createdAt || new Date().toISOString(),
    ...(input.note ? { note: String(input.note) } : {}),
  };
}

function normalizeGrowthSimulation(input: Partial<GrowthSimulation>): GrowthSimulation {
  return {
    id: input.id || uid(),
    title: input.title || "Leak to Growth Plan",
    startingAmount: Number(input.startingAmount) || 0,
    contributionAmount: Number(input.contributionAmount) || 0,
    contributionFrequency: input.contributionFrequency || "weekly",
    durationMonths: clamp(Math.round(Number(input.durationMonths) || 12), 1, 60),
    expectedAnnualGrowth: clamp(Number(input.expectedAnnualGrowth) || 0, 0, 100),
    riskLevel: input.riskLevel || "medium",
    reinvest: input.reinvest !== false,
    createdAt: input.createdAt || new Date().toISOString(),
    progressEntries: Array.isArray(input.progressEntries)
      ? input.progressEntries
          .flatMap((entry) => {
            const normalized = normalizeGrowthPlanProgressEntry(entry);
            return normalized ? [normalized] : [];
          })
          .slice(0, 30)
      : [],
  };
}

function readGrowthSimulations(): GrowthSimulation[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(GROWTH_SIMULATIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<GrowthSimulation>[]) : [];

    return Array.isArray(parsed)
      ? parsed.map(normalizeGrowthSimulation).slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

function writeGrowthSimulations(simulations: GrowthSimulation[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      GROWTH_SIMULATIONS_KEY,
      JSON.stringify(simulations.slice(0, 8))
    );
  } catch {
    // Local saved simulations are optional.
  }
}

function normalizeGrowthManualTarget(input: Partial<GrowthManualTarget>): GrowthManualTarget {
  const currency = normalizeOptionalCurrency(input.currency);

  return {
    id: input.id || uid(),
    name: String(input.name ?? ""),
    amount: String(input.amount ?? ""),
    period: input.period === "year" ? "year" : "one",
    ...(currency ? { currency } : {}),
  };
}

function normalizeGrowthPlannerState(input?: Partial<GrowthPlannerState> | null): GrowthPlannerState {
  const realLifeTargets = Array.isArray(input?.realLifeTargets)
    ? input.realLifeTargets.map(normalizeGrowthManualTarget).slice(0, 12)
    : defaultGrowthPlannerState.realLifeTargets;

  return {
    realLifeTargets: realLifeTargets.length ? realLifeTargets : defaultGrowthPlannerState.realLifeTargets,
    savingGoalName: String(input?.savingGoalName ?? ""),
    savingGoalAmount: String(input?.savingGoalAmount ?? ""),
    ...(normalizeOptionalCurrency(input?.savingGoalCurrency)
      ? { savingGoalCurrency: normalizeOptionalCurrency(input?.savingGoalCurrency) }
      : {}),
    updatedAt: input?.updatedAt,
  };
}

function readGrowthPlannerState(): GrowthPlannerState {
  if (typeof window === "undefined") return defaultGrowthPlannerState;

  try {
    const raw = window.localStorage.getItem(GROWTH_PLANNER_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<GrowthPlannerState>) : null;
    return normalizeGrowthPlannerState(parsed);
  } catch {
    return defaultGrowthPlannerState;
  }
}

function writeGrowthPlannerState(planner: GrowthPlannerState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      GROWTH_PLANNER_KEY,
      JSON.stringify({
        ...normalizeGrowthPlannerState(planner),
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {
    // Growth planner is local-first and optional.
  }
}

function monthlyGrowthContribution(simulation: GrowthSimulation) {
  return simulation.contributionAmount * growthFrequencyMultiplier(simulation.contributionFrequency);
}

function calculateGrowthPoints(
  simulation: GrowthSimulation,
  annualGrowthOverride?: number
): GrowthPoint[] {
  const annualGrowth = clamp(
    annualGrowthOverride ?? simulation.expectedAnnualGrowth,
    0,
    100
  );
  const monthlyRate = annualGrowth / 100 / 12;
  const monthlyContribution = monthlyGrowthContribution(simulation);

  let principal = simulation.startingAmount;
  let savedGain = 0;
  let contributed = simulation.startingAmount;

  const points: GrowthPoint[] = [
    {
      month: 0,
      balance: principal,
      contributed,
      gain: 0,
    },
  ];

  for (let month = 1; month <= simulation.durationMonths; month += 1) {
    principal += monthlyContribution;
    contributed += monthlyContribution;

    const gain = principal * monthlyRate;

    if (simulation.reinvest) {
      principal += gain;
    } else {
      savedGain += gain;
    }

    const balance = principal + savedGain;

    points.push({
      month,
      balance,
      contributed,
      gain: Math.max(0, balance - contributed),
    });
  }

  return points;
}

function getGrowthGoalPresets(settings: Settings): GrowthGoalPreset[] {
  return [
    {
      id: "rent",
      label: "Rent buffer",
      targetAmount: 0,
      icon: A.lifeCost,
      description: "Housing pressure target. Enter your real amount.",
    },
    {
      id: "emergency",
      label: "Emergency fund",
      targetAmount: 0,
      icon: A.walletHp,
      description: "Emergency buffer. Enter what feels real for you.",
    },
    {
      id: "school",
      label: "School fees",
      targetAmount: 0,
      icon: A.categories,
      description: "Education/payment target. Enter your own number.",
    },
    {
      id: "phone",
      label: "Phone upgrade",
      targetAmount: 0,
      icon: A.currency,
      description: "Device goal. Enter the price you actually need.",
    },
    {
      id: "debt",
      label: "Debt payment",
      targetAmount: 0,
      icon: A.balance,
      description: "Debt pressure target. Enter your own amount.",
    },
    {
      id: "business",
      label: "Business idea",
      targetAmount: 0,
      icon: GROWTH_PUBLIC_ASSETS.trophy,
      description: "Project budget. Enter your real target.",
    },
    {
      id: "family",
      label: "Family support",
      targetAmount: 0,
      icon: A.walletMascot,
      description: "Support goal. Enter the amount you want to build toward.",
    },
  ];
}


function buildGrowthLifeMeaning(
  finalValue: number,
  settings: Settings
): GrowthLifeMeaningItem[] {
  const monthlyLifeCost = Math.max(1, sum(Object.values(settings.fixedCosts)));
  const rent = Math.max(settings.fixedCosts.rent || monthlyLifeCost * 0.35, 1);
  const school = Math.max(settings.fixedCosts.education || 300, 1);
  const phone = settings.currency === "USD" ? 800 : settings.currency === "EUR" ? 750 : 800;
  const emergency = Math.max(monthlyLifeCost, rent);
  const familySupport = Math.max(monthlyLifeCost * 0.25, 150);
  const debtPayment = Math.max(monthlyLifeCost * 0.5, 250);

  const items = [
    {
      id: "rent",
      label: "Rent buffer",
      target: rent,
      icon: A.lifeCost,
      detail: "example housing buffer",
    },
    {
      id: "emergency",
      label: "Emergency savings",
      target: emergency,
      icon: A.walletHp,
      detail: "example basic life-cost buffer",
    },
    {
      id: "school",
      label: "School fees",
      target: school,
      icon: A.categories,
      detail: "example education payment",
    },
    {
      id: "phone",
      label: "Phone upgrade",
      target: phone,
      icon: A.currency,
      detail: "example device goal",
    },
    {
      id: "debt",
      label: "Debt payment",
      target: debtPayment,
      icon: A.balance,
      detail: "example pressure reduction",
    },
    {
      id: "family",
      label: "Family support",
      target: familySupport,
      icon: A.walletMascot,
      detail: "example support budget",
    },
  ];

  return items.map((item) => {
    const coverage = finalValue / item.target;

    return {
      id: item.id,
      label: item.label,
      detail: item.detail,
      icon: item.icon,
      coverageLabel:
        coverage >= 1
          ? `Could cover about ${Math.floor(coverage)}x`
          : `Could cover about ${Math.round(coverage * 100)}%`,
    };
  });
}

function getMonthsToGrowthGoal(targetAmount: number, monthlyContribution: number) {
  if (targetAmount <= 0 || monthlyContribution <= 0) return null;

  return Math.max(1, Math.ceil(targetAmount / monthlyContribution));
}

function formatGoalTime(months: number | null) {
  if (!months) return "Add a target and redirected leak amount first.";
  if (months < 2) return "around 1 month";
  if (months < 12) return `around ${months} months`;

  const years = Math.floor(months / 12);
  const rest = months % 12;

  if (rest === 0) return `around ${years} year${years === 1 ? "" : "s"}`;

  return `around ${years}y ${rest}m`;
}

function formatGrowthCoverage(finalValue: number, targetAmount: number) {
  if (targetAmount <= 0) return "Set a target amount";

  const coverage = finalValue / targetAmount;

  if (coverage >= 1) {
    return `could cover about ${coverage >= 10 ? Math.floor(coverage) : coverage.toFixed(1)}x`;
  }

  return `could cover about ${Math.round(coverage * 100)}%`;
}

function formatCoverageNumber(value: number) {
  if (!Number.isFinite(value)) return "0";

  if (value >= 10) return String(Math.floor(value));

  return value.toFixed(1).replace(".0", "");
}

function formatPlannedCostCoverage(
  finalValue: number,
  monthlyAmount: number,
  period: GrowthMeaningPeriod,
  targetName = "this target"
) {
  const cleanName = targetName.trim() || "this target";

  if (monthlyAmount <= 0) return "Set target amount";

  const monthsCovered = finalValue / monthlyAmount;

  if (period === "one") {
    if (monthsCovered >= 1) {
      return `could cover about ${formatCoverageNumber(monthsCovered)} month${
        monthsCovered === 1 ? "" : "s"
      } of ${cleanName}`;
    }

    return `could cover about ${Math.round(monthsCovered * 100)}% of ${cleanName}`;
  }

  const yearlyTarget = monthlyAmount * 12;
  const yearCoverage = finalValue / yearlyTarget;

  if (yearCoverage >= 1) {
    const extraMonths = Math.max(0, Math.floor(monthsCovered - 12));

    if (extraMonths > 0) {
      return `could cover 12 months of ${cleanName} + ${extraMonths} extra month${
        extraMonths === 1 ? "" : "s"
      }`;
    }

    return `could cover about 12 months of ${cleanName}`;
  }

  return `could cover about ${Math.round(yearCoverage * 100)}% of yearly ${cleanName}`;
}

function formatGrowthMonthsCovered(finalValue: number, monthlyAmount: number) {
  if (monthlyAmount <= 0) return "Set a monthly amount";

  const months = finalValue / monthlyAmount;

  if (months >= 1) {
    return `${months >= 10 ? Math.floor(months) : months.toFixed(1)} months`;
  }

  return `${Math.round(months * 100)}% of 1 month`;
}


function getGrowthFinal(simulation: GrowthSimulation, annualGrowthOverride?: number) {
  const points = calculateGrowthPoints(simulation, annualGrowthOverride);

  return points[points.length - 1] || {
    month: 0,
    balance: simulation.startingAmount,
    contributed: simulation.startingAmount,
    gain: 0,
  };
}

function getGrowthPlanProgress(simulation: GrowthSimulation) {
  return sum((simulation.progressEntries || []).map((entry) => Math.max(0, Number(entry.amount) || 0)));
}

function getGrowthPlanTarget(simulation: GrowthSimulation) {
  const final = getGrowthFinal(simulation);
  const plannedRedirect = monthlyGrowthContribution(simulation) * simulation.durationMonths;

  return Math.max(final.balance, plannedRedirect, simulation.startingAmount, 1);
}

function getGrowthPlanProgressPercent(simulation: GrowthSimulation) {
  return clamp((getGrowthPlanProgress(simulation) / getGrowthPlanTarget(simulation)) * 100, 0, 100);
}

function getGrowthPlanNextCheckpoint(simulation: GrowthSimulation) {
  const target = getGrowthPlanTarget(simulation);
  const progress = getGrowthPlanProgress(simulation);
  const checkpoints = [0.25, 0.5, 0.75, 1];
  const checkpoint = checkpoints.find((point) => progress < target * point) || 1;
  const checkpointAmount = target * checkpoint;

  return {
    label: `${Math.round(checkpoint * 100)}% checkpoint`,
    amount: checkpointAmount,
    remaining: Math.max(0, checkpointAmount - progress),
  };
}

function getGrowthPlanLastProgressLabel(simulation: GrowthSimulation) {
  const latest = (simulation.progressEntries || [])[0];

  if (!latest) return "No progress logged yet";

  return `Last logged ${new Date(latest.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function getGrowthCases(simulation: GrowthSimulation) {
  const spread =
    simulation.riskLevel === "low" ? 0.35 : simulation.riskLevel === "medium" ? 0.7 : 1.15;
  const baseRate = simulation.expectedAnnualGrowth;
  const worstRate = Math.max(0, baseRate * (1 - spread));
  const bestRate = Math.min(100, baseRate * (1 + spread));

  return {
    worst: getGrowthFinal(simulation, worstRate),
    base: getGrowthFinal(simulation, baseRate),
    best: getGrowthFinal(simulation, bestRate),
  };
}

function getLeakAmountForGrowth(expenses: Expense[]) {
  return sumLeakExpenses(expenses);
}

function buildGrowthShareText(
  simulation: GrowthSimulation,
  settings: Settings,
  context?: GrowthShareContext,
  rates: ExchangeRateMap = {}
) {
  const result = getGrowthFinal(simulation);
  const resultUsdNote = usdReferenceNote(result.balance, settings.currency, settings, rates);
  const monthlyUsdNote = usdReferenceNote(monthlyGrowthContribution(simulation), settings.currency, settings, rates);
  const targetUsdNote = context
    ? usdReferenceNote(context.activeGoalTarget, settings.currency, settings, rates)
    : "";

  return [
    "$BROKE Growth Lab",
    "",
    `Monthly leaks redirected: ${money(monthlyGrowthContribution(simulation), settings.currency)}/month${monthlyUsdNote ? ` (${monthlyUsdNote})` : ""}`,
    `Projected total after ${simulation.durationMonths} months: ${money(result.balance, settings.currency)}`,
    resultUsdNote ? `Projected USD reference: ${resultUsdNote}` : "",
    "",
    context
      ? `Personal goal: ${context.activeGoalName}`
      : "Personal goal: add what you are building toward",
    context
      ? `Target: ${money(context.activeGoalTarget, settings.currency)}${targetUsdNote ? ` (${targetUsdNote})` : ""}`
      : "Target: add your own amount",
    context
      ? `Estimated time: ${context.activeGoalTimeLabel}`
      : "Estimated time: available after target is set",
    "",
    "Saving goal simulation only. No real funds, no custody, no staking, no guaranteed returns.",
    "Find the leak. Redirect it into something real.",
  ]
    .filter(Boolean)
    .join("\n");
}


function growthRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function growthFillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string
) {
  growthRoundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function growthStrokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth = 2
) {
  growthRoundRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function growthDrawCircularImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  centerY: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();
}


function loadShareCardImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load share card image: ${src}`));
    image.src = src;
  });
}

async function buildGrowthShareCardBlob(
  simulation: GrowthSimulation,
  settings: Settings,
  context?: GrowthShareContext,
  rates: ExchangeRateMap = {}
): Promise<Blob> {
  const result = getGrowthFinal(simulation);
  const monthlyRedirected = monthlyGrowthContribution(simulation);
  const resultUsdNote = usdReferenceNote(result.balance, settings.currency, settings, rates);
  const monthlyUsdNote = usdReferenceNote(monthlyRedirected, settings.currency, settings, rates);
  const goalUsdNote = context
    ? usdReferenceNote(context.activeGoalTarget, settings.currency, settings, rates)
    : "";
  const publicIdentityName = getPublicIdentityName(settings);
  const publicIdentityStatus = getPublicIdentityStatus(settings);
  const publicIdentityAvatar = getPublicProfileAvatarImage(settings);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas is not available");

  const green = "#b7ff19";
  const green2 = "#67ff2a";
  const text = "#f4f7f0";
  const muted = "rgba(244,247,240,0.68)";
  const panel = "rgba(9, 20, 14, 0.92)";
  const panel2 = "rgba(16, 35, 19, 0.92)";
  const orangePanel = "rgba(255,177,43,0.085)";

  ctx.fillStyle = "#020402";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const premiumBackground = await loadShareCardImage(PREMIUM_VISUAL_PACK.shareCleanBackground);
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.drawImage(premiumBackground, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.fillStyle = "rgba(2, 4, 2, 0.66)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } catch {
    // Public asset is optional. The canvas still renders with the built-in layout.
  }

  for (let x = 0; x < canvas.width; x += 82) {
    ctx.strokeStyle = "rgba(183,255,25,0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += 82) {
    ctx.strokeStyle = "rgba(183,255,25,0.035)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(165, 125, 0, 165, 125, 360);
  glow.addColorStop(0, "rgba(183,255,25,0.26)");
  glow.addColorStop(1, "rgba(183,255,25,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = green;
  ctx.font = "900 34px Arial, sans-serif";
  ctx.fillText("$BROKE", 66, 86);

  ctx.fillStyle = text;
  ctx.font = "900 70px Arial, sans-serif";
  ctx.fillText("GROWTH LAB", 64, 160);

  ctx.fillStyle = muted;
  ctx.font = "500 29px Arial, sans-serif";
  ctx.fillText("Monthly leak plan into a personal saving goal", 68, 207);

  try {
    const identityAvatar = await loadShareCardImage(publicIdentityAvatar);
    growthFillRoundRect(ctx, 770, 58, 248, 110, 32, "rgba(9,20,14,0.76)");
    growthStrokeRoundRect(ctx, 770, 58, 248, 110, 32, "rgba(183,255,25,0.22)", 2);
    growthDrawCircularImage(ctx, identityAvatar, 828, 113, 38);
    ctx.strokeStyle = "rgba(183,255,25,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(828, 113, 41, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = text;
    ctx.font = "900 25px Arial, sans-serif";
    ctx.fillText(publicIdentityName.slice(0, 13), 882, 105);
    ctx.fillStyle = muted;
    ctx.font = "800 18px Arial, sans-serif";
    ctx.fillText(publicIdentityStatus.slice(0, 18), 882, 134);
  } catch {
    // Avatar is optional; the share card still renders without it.
  }

  growthFillRoundRect(ctx, 62, 255, 956, 190, 34, panel);
  growthStrokeRoundRect(ctx, 62, 255, 956, 190, 34, "rgba(183,255,25,0.22)", 2);

  ctx.fillStyle = green;
  ctx.font = "900 30px Arial, sans-serif";
  ctx.fillText("PLAN VALUE", 94, 315);

  ctx.fillStyle = text;
  ctx.font = "900 76px Arial, sans-serif";
  ctx.fillText(money(result.balance, settings.currency), 94, 400);

  ctx.fillStyle = muted;
  ctx.font = "700 25px Arial, sans-serif";
  ctx.fillText(
    resultUsdNote || `${money(monthlyRedirected, settings.currency)}/month redirected from monthly leaks`,
    94,
    432
  );

  if (resultUsdNote) {
    ctx.fillStyle = "rgba(199,255,74,0.72)";
    ctx.font = "800 22px Arial, sans-serif";
    ctx.fillText(
      `${money(monthlyRedirected, settings.currency)}/month${monthlyUsdNote ? ` · ${monthlyUsdNote}/month` : ""}`,
      94,
      465
    );
  }

  growthFillRoundRect(ctx, 62, 510, 956, 360, 36, panel2);
  growthStrokeRoundRect(ctx, 62, 510, 956, 360, 36, "rgba(183,255,25,0.18)", 2);

  ctx.fillStyle = green;
  ctx.font = "900 30px Arial, sans-serif";
  ctx.fillText("PERSONAL GOAL", 94, 575);

  ctx.fillStyle = text;
  ctx.font = "900 58px Arial, sans-serif";
  ctx.fillText(context?.activeGoalName || "Add your saving goal", 94, 658);

  ctx.fillStyle = muted;
  ctx.font = "800 26px Arial, sans-serif";
  ctx.fillText("Target", 94, 742);

  ctx.fillStyle = green;
  ctx.font = "900 46px Arial, sans-serif";
  ctx.fillText(
    context ? money(context.activeGoalTarget, settings.currency) : "Set target",
    94,
    800
  );

  if (goalUsdNote) {
    ctx.fillStyle = "rgba(199,255,74,0.76)";
    ctx.font = "800 22px Arial, sans-serif";
    ctx.fillText(goalUsdNote, 94, 833);
  }

  ctx.fillStyle = muted;
  ctx.font = "800 26px Arial, sans-serif";
  ctx.fillText("Estimated time", 588, 742);

  ctx.fillStyle = green;
  ctx.font = "900 40px Arial, sans-serif";
  ctx.fillText(context?.activeGoalTimeLabel || "Add target first", 588, 800);

  const goalProgress =
    context && context.activeGoalTarget > 0
      ? Math.min(result.balance / context.activeGoalTarget, 1)
      : 0;

  growthFillRoundRect(ctx, 94, 825, 860, 24, 999, "rgba(255,255,255,0.10)");
  growthFillRoundRect(ctx, 94, 825, Math.max(18, 860 * goalProgress), 24, 999, green);

  growthFillRoundRect(ctx, 62, 930, 956, 150, 30, "rgba(183,255,25,0.065)");
  growthStrokeRoundRect(ctx, 62, 930, 956, 150, 30, "rgba(183,255,25,0.16)", 1);

  ctx.fillStyle = green;
  ctx.font = "900 28px Arial, sans-serif";
  ctx.fillText("WHAT THIS MEANS", 94, 985);

  ctx.fillStyle = muted;
  ctx.font = "700 24px Arial, sans-serif";
  ctx.fillText("Not investments. Just monthly leaks redirected toward a real goal.", 94, 1035);

  growthFillRoundRect(ctx, 62, 1135, 956, 98, 26, orangePanel);
  growthStrokeRoundRect(ctx, 62, 1135, 956, 98, 26, "rgba(255,177,43,0.22)", 1);

  ctx.fillStyle = "#ffdf8b";
  ctx.font = "800 23px Arial, sans-serif";
  ctx.fillText("Planning only. No real funds, custody, staking, investments, or guarantees.", 94, 1195);

  ctx.fillStyle = green2;
  ctx.font = "900 28px Arial, sans-serif";
  ctx.fillText("Find the leak. Redirect it into something real.", 66, 1300);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Could not create growth share card"));
      },
      "image/png",
      0.95
    );
  });
}


async function downloadGrowthShareCard(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "broke-growth-plan.png";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadGrowthShareCardUrl(url: string) {
  const link = document.createElement("a");

  link.href = url;
  link.download = "broke-growth-plan.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}


const GROWTH_PUBLIC_ASSETS = {
  hero: "/growth-lab-analyst-glow.png",
  leak: "/growth-lab-loot-hacker.png",
  market: "/growth-lab-market-controller.png",
  lab: "/growth-lab-analyst-lab.png",
  trophy: "/growth-lab-trophy.png",
};


const SHARE_CARD_PUBLIC_ASSETS = {
  result: "/share-card-premium-background.png",
  daily: "/share-card-premium-background.png",
  weekly: "/share-card-premium-background.png",
  growth: "/share-card-premium-background.png",
  mission: "/share-card-premium-background.png",
  leaderboard: "/share-card-premium-background.png",
  profile: "/share-card-premium-background.png",
  background: "/share-card-premium-background.png",
};

const PREMIUM_VISUAL_PACK = {
  homeMascot: "/home-premium-mascot.png",
  survivalMascot: "/survival-mode-mascot.png",
  growthMascot: "/growth-lab-mascot.png",
  firstLeakMascot: "/first-leak-mascot.png",
  shareCleanBackground: "/share-card-clean-bg.png",
  analysisLabMascot: "/analysis-lab-mascot.png",
  publicProofLock: "/public-proof-lock.png",
  comebackModeMascot: "/comeback-mode-mascot.png",
};


function GrowthLabScreen({
  settings,
  expenses,
  shareInitData,
  onBack,
  onHelp,
  onOpenAdd,
  onAppStateChange,
}: {
  settings: Settings;
  expenses: Expense[];
  shareInitData: string;
  onBack: () => void;
  onHelp: () => void;
  onOpenAdd: () => void;
  onAppStateChange?: () => void;
}) {
  const [savedSimulations, setSavedSimulations] = useState<GrowthSimulation[]>(() =>
    readGrowthSimulations()
  );
  const [title, setTitle] = useState("Monthly Leak Plan");
  const [startingAmount, setStartingAmount] = useState("0");
  const [contributionAmount, setContributionAmount] = useState("25");
  const [baseSavingAmount, setBaseSavingAmount] = useState("0");
  const [contributionFrequency, setContributionFrequency] = useState<GrowthFrequency>("weekly");
  const [durationMonths, setDurationMonths] = useState("12");
  const [expectedAnnualGrowth, setExpectedAnnualGrowth] = useState("0");
  const [riskLevel, setRiskLevel] = useState<GrowthRisk>("low");
  const [reinvest, setReinvest] = useState(false);
  const [growthShareCardUrl, setGrowthShareCardUrl] = useState("");
  const [growthShareText, setGrowthShareText] = useState("");
  const [isBuildingShareCard, setIsBuildingShareCard] = useState(false);
  const [growthPlannerTab, setGrowthPlannerTab] = useState<GrowthPlannerTab>("costs");
  const [savingGoalName, setSavingGoalName] = useState(() => readGrowthPlannerState().savingGoalName);
  const [savingGoalAmount, setSavingGoalAmount] = useState(() => readGrowthPlannerState().savingGoalAmount);
  const [savingGoalCurrency, setSavingGoalCurrency] = useState<Currency>(() =>
    readGrowthPlannerState().savingGoalCurrency || settings.currency
  );
  const [realLifeTargets, setRealLifeTargets] = useState<GrowthManualTarget[]>(() =>
    readGrowthPlannerState().realLifeTargets
  );
  const [activeGrowthPlanId, setActiveGrowthPlanId] = useState("");
  const [growthProgressAmount, setGrowthProgressAmount] = useState("");
  const growthTypingLockUntilRef = useRef(0);
  const growthPlannerSyncTimerRef = useRef<number | null>(null);

  function lockGrowthTypingWindow(durationMs = 6000) {
    growthTypingLockUntilRef.current = Date.now() + durationMs;
  }

  function isGrowthTypingLocked() {
    return Date.now() < growthTypingLockUntilRef.current;
  }

  useEffect(() => {
    return () => {
      if (growthShareCardUrl) {
        URL.revokeObjectURL(growthShareCardUrl);
      }
    };
  }, [growthShareCardUrl]);


  useEffect(() => {
    writeGrowthSimulations(savedSimulations);
    onAppStateChange?.();
  }, [savedSimulations]);

  useEffect(() => {
    writeGrowthPlannerState({
      realLifeTargets,
      savingGoalName,
      savingGoalAmount,
      savingGoalCurrency,
    });

    if (growthPlannerSyncTimerRef.current) {
      window.clearTimeout(growthPlannerSyncTimerRef.current);
    }

    growthPlannerSyncTimerRef.current = window.setTimeout(() => {
      onAppStateChange?.();
    }, 900);

    return () => {
      if (growthPlannerSyncTimerRef.current) {
        window.clearTimeout(growthPlannerSyncTimerRef.current);
      }
    };
  }, [realLifeTargets, savingGoalName, savingGoalAmount, savingGoalCurrency]);

  useEffect(() => {
    function applySyncedAppState() {
      if (isGrowthTypingLocked()) return;

      setSavedSimulations(readGrowthSimulations());
      const planner = readGrowthPlannerState();
      setRealLifeTargets(planner.realLifeTargets);
      setSavingGoalName(planner.savingGoalName);
      setSavingGoalAmount(planner.savingGoalAmount);
      setSavingGoalCurrency(planner.savingGoalCurrency || settings.currency);
    }

    window.addEventListener(CLOUD_APP_STATE_SYNC_EVENT, applySyncedAppState);

    return () => {
      window.removeEventListener(CLOUD_APP_STATE_SYNC_EVENT, applySyncedAppState);
    };
  }, []);

  useEffect(() => {
    if (activeGrowthPlanId && !savedSimulations.some((simulation) => simulation.id === activeGrowthPlanId)) {
      setActiveGrowthPlanId("");
      setGrowthProgressAmount("");
    }
  }, [activeGrowthPlanId, savedSimulations]);

  const monthlyLeakExpenses = useMemo(() => getCurrentMonthExpenses(expenses), [expenses]);
  const growthCurrencySources = useMemo(
    () => [
      ...realLifeTargets.map((target) => target.currency),
      savingGoalCurrency,
    ],
    [realLifeTargets, savingGoalCurrency]
  );
  const growthRateState = useExchangeRates(settings, growthCurrencySources);
  const leakAmount = useMemo(
    () => getLeakAmountForGrowth(monthlyLeakExpenses),
    [monthlyLeakExpenses]
  );
  const categorySummaries = useMemo(
    () => getCategoryLeakSummaries(monthlyLeakExpenses),
    [monthlyLeakExpenses]
  );
  const topLeak = categorySummaries[0];
  const activeGrowthPlan = savedSimulations.find((simulation) => simulation.id === activeGrowthPlanId) || null;
  const activeGrowthPlanFinal = activeGrowthPlan ? getGrowthFinal(activeGrowthPlan) : null;
  const activeGrowthPlanProgress = activeGrowthPlan ? getGrowthPlanProgress(activeGrowthPlan) : 0;
  const activeGrowthPlanTarget = activeGrowthPlan ? getGrowthPlanTarget(activeGrowthPlan) : 1;
  const activeGrowthPlanPercent = activeGrowthPlan ? getGrowthPlanProgressPercent(activeGrowthPlan) : 0;
  const activeGrowthPlanCheckpoint = activeGrowthPlan ? getGrowthPlanNextCheckpoint(activeGrowthPlan) : null;

  const preview = useMemo(
    () =>
      normalizeGrowthSimulation({
        title,
        startingAmount: safeNumber(startingAmount),
        contributionAmount: safeNumber(contributionAmount) + safeNumber(baseSavingAmount),
        contributionFrequency,
        durationMonths: safeNumber(durationMonths),
        expectedAnnualGrowth: safeNumber(expectedAnnualGrowth),
        riskLevel,
        reinvest,
      }),
    [
      title,
      startingAmount,
      contributionAmount,
      baseSavingAmount,
      contributionFrequency,
      durationMonths,
      expectedAnnualGrowth,
      riskLevel,
      reinvest,
    ]
  );

  const points = useMemo(() => calculateGrowthPoints(preview), [preview]);
  const finalPoint = points[points.length - 1];
  const cases = useMemo(() => getGrowthCases(preview), [preview]);
  const monthlyContribution = monthlyGrowthContribution(preview);
  const monthlyLeakBoost = safeNumber(contributionAmount) * growthFrequencyMultiplier(contributionFrequency);
  const monthlyBaseSaving = safeNumber(baseSavingAmount) * growthFrequencyMultiplier(contributionFrequency);
  const bars = points.filter((point) => point.month > 0).slice(-6);
  const maxBar = Math.max(...bars.map((point) => point.balance), 1);
  const lifeMeaningItems = useMemo(
    () => buildGrowthLifeMeaning(finalPoint.balance, settings),
    [finalPoint.balance, settings]
  );
  function getRealLifeTargetDisplay(target: GrowthManualTarget) {
    return getDisplayAmount(
      safeNumber(target.amount),
      target.currency || settings.currency,
      settings,
      growthRateState.rates
    );
  }

  function getRealLifeTargetTotal(target: GrowthManualTarget) {
    const periodMonths = target.period === "year" ? 12 : 1;
    return getRealLifeTargetDisplay(target).amount * periodMonths;
  }

  function getRealLifeTargetPeriodLabel(target: GrowthManualTarget) {
    return target.period === "year" ? "12 months" : "1 month";
  }

  function getRealLifeTargetMonthsLabel(target: GrowthManualTarget) {
    const targetDisplay = getRealLifeTargetDisplay(target);

    return `${formatGrowthMonthsCovered(finalPoint.balance, targetDisplay.amount)} at ${money(
      targetDisplay.amount,
      targetDisplay.currency
    )}/month`;
  }

  const completedRealLifeTargets = realLifeTargets.filter(
    (target) => target.name.trim() && safeNumber(target.amount) > 0
  );
  const primaryRealLifeTarget = completedRealLifeTargets[0] || realLifeTargets[0];
  const secondaryRealLifeTarget = completedRealLifeTargets[1] || realLifeTargets[1] || realLifeTargets[0];
  const activeGoalName = savingGoalName.trim() || "Your saving goal";
  const activeGoalDisplay = getDisplayAmount(
    safeNumber(savingGoalAmount),
    savingGoalCurrency || settings.currency,
    settings,
    growthRateState.rates
  );
  const activeGoalUsdNote = usdReferenceNoteFromDisplay(activeGoalDisplay, settings, growthRateState.rates);
  const activeGoalTarget = Math.max(0, activeGoalDisplay.amount);
  const goalMonths = getMonthsToGrowthGoal(activeGoalTarget, monthlyContribution);
  const goalProgress =
    activeGoalTarget > 0 ? clamp((finalPoint.balance / activeGoalTarget) * 100, 0, 100) : 0;
  const savingGoalOptions = [
    "School fees",
    "Phone upgrade",
    "Emergency fund",
    "Debt payment",
    "Family support",
    "Business idea",
  ];
  const targetCoverageSuggestions = [
    "School fees",
    "Phone upgrade",
    "Emergency fund",
    "Debt payment",
    "Family support",
  ];
  const growthShareContext: GrowthShareContext = {
    primaryTargetName: primaryRealLifeTarget?.name.trim() || "Planned expense",
    primaryTargetPeriodLabel: primaryRealLifeTarget
      ? getRealLifeTargetPeriodLabel(primaryRealLifeTarget)
      : "1 month",
    primaryTargetCoverageLabel: primaryRealLifeTarget
      ? formatPlannedCostCoverage(
          finalPoint.balance,
          getRealLifeTargetDisplay(primaryRealLifeTarget).amount,
          primaryRealLifeTarget.period,
          primaryRealLifeTarget.name
        )
      : "Add amount",
    primaryTargetMonthsLabel: primaryRealLifeTarget
      ? getRealLifeTargetMonthsLabel(primaryRealLifeTarget)
      : "Add planned amount",
    secondaryTargetName: secondaryRealLifeTarget?.name.trim() || "Second target",
    secondaryTargetPeriodLabel: secondaryRealLifeTarget
      ? getRealLifeTargetPeriodLabel(secondaryRealLifeTarget)
      : "1 month",
    secondaryTargetCoverageLabel: secondaryRealLifeTarget
      ? formatPlannedCostCoverage(
          finalPoint.balance,
          getRealLifeTargetDisplay(secondaryRealLifeTarget).amount,
          secondaryRealLifeTarget.period,
          secondaryRealLifeTarget.name
        )
      : "Add amount",
    secondaryTargetMonthsLabel: secondaryRealLifeTarget
      ? getRealLifeTargetMonthsLabel(secondaryRealLifeTarget)
      : "Add planned amount",
    activeGoalName,
    activeGoalTarget,
    activeGoalTimeLabel: formatGoalTime(goalMonths),
    monthlyContribution,
    manualTargetName: completedRealLifeTargets[2]?.name || "",
    manualTargetAmount: completedRealLifeTargets[2]
      ? getRealLifeTargetTotal(completedRealLifeTargets[2])
      : 0,
    manualTargetTimeLabel: completedRealLifeTargets[2]
      ? formatGoalTime(getMonthsToGrowthGoal(getRealLifeTargetTotal(completedRealLifeTargets[2]), monthlyContribution))
      : "",
  };

  function updateRealLifeTarget(id: string, patch: Partial<GrowthManualTarget>) {
    setRealLifeTargets((current) =>
      current.map((target) => {
        if (target.id !== id) return target;

        const shouldStampCurrency =
          "amount" in patch && String(patch.amount ?? "").trim().length > 0 && !target.currency;

        return {
          ...target,
          ...(shouldStampCurrency ? { currency: settings.currency } : {}),
          ...patch,
        };
      })
    );
  }

  function addRealLifeTarget() {
    setRealLifeTargets((current) => [
      ...current,
      { id: uid(), name: "", amount: "", period: "one", currency: settings.currency },
    ]);
  }

  function addSuggestedCoverageTarget(name: string) {
    setRealLifeTargets((current) => {
      const alreadyExists = current.some(
        (target) => target.name.trim().toLowerCase() === name.toLowerCase()
      );

      if (alreadyExists) return current;

      const emptyIndex = current.findIndex(
        (target) => !target.name.trim() && !target.amount.trim()
      );

      if (emptyIndex >= 0) {
        return current.map((target, index) =>
          index === emptyIndex ? { ...target, name, period: "one", currency: target.currency || settings.currency } : target
        );
      }

      return [...current, { id: uid(), name, amount: "", period: "one", currency: settings.currency }];
    });

    setGrowthPlannerTab("costs");
    triggerHaptic("light");
  }

  function removeRealLifeTarget(id: string) {
    setRealLifeTargets((current) =>
      current.length <= 1 ? current : current.filter((target) => target.id !== id)
    );
  }

  function useMyLeaks() {
    const monthlyLeak = Math.max(1, Math.round(leakAmount));

    setTitle(topLeak ? `${topLeak.category} Monthly Leak Plan` : "Monthly Leak Plan");
    setStartingAmount("0");
    setContributionFrequency("monthly");
    setContributionAmount(String(monthlyLeak));
    setBaseSavingAmount((current) => current || "0");
    setDurationMonths("12");
    setExpectedAnnualGrowth("0");
    setRiskLevel("low");
    setReinvest(false);
    triggerHaptic("success");
  }

  function useBaseSavingOnly() {
    setTitle("Base Saving Plan");
    setStartingAmount("0");
    setContributionFrequency("monthly");
    setContributionAmount("0");
    setBaseSavingAmount((current) => current && safeNumber(current) > 0 ? current : "25");
    setDurationMonths("12");
    setExpectedAnnualGrowth("0");
    setRiskLevel("low");
    setReinvest(false);
    triggerHaptic("success");
  }

  function saveSimulation() {
    const simulation = {
      ...preview,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    const next = [simulation, ...savedSimulations].slice(0, 8);

    setSavedSimulations(next);
    setActiveGrowthPlanId(simulation.id);
    setGrowthProgressAmount("");
    writeGrowthSimulations(next);
    notifyApp("Growth plan saved", "Open the saved plan to track progress, checkpoints, and next moves.");
    triggerHaptic("success");
  }

  function deleteSimulation(id: string) {
    const next = savedSimulations.filter((simulation) => simulation.id !== id);

    setSavedSimulations(next);
    writeGrowthSimulations(next);
    triggerHaptic("light");
  }

  function addGrowthPlanProgress(simulationId: string, rawAmount: string | number, note = "Manual progress") {
    const amount = Math.max(0, Number(rawAmount) || 0);

    if (amount <= 0) {
      notifyApp("Add progress amount", "Enter what you saved or redirected first.");
      return;
    }

    const next = savedSimulations.map((simulation) =>
      simulation.id === simulationId
        ? normalizeGrowthSimulation({
            ...simulation,
            progressEntries: [
              { id: uid(), amount, createdAt: new Date().toISOString(), note },
              ...(simulation.progressEntries || []),
            ].slice(0, 30),
          })
        : simulation
    );

    setSavedSimulations(next);
    writeGrowthSimulations(next);
    setGrowthProgressAmount("");
    notifyApp("Growth progress added", `${money(amount, settings.currency)} logged into this plan.`);
    triggerHaptic("success");
  }

  function markOneGrowthContribution(simulation: GrowthSimulation) {
    const amount = Math.max(1, monthlyGrowthContribution(simulation));
    addGrowthPlanProgress(simulation.id, amount, "Planned contribution");
  }

  function loadGrowthPlanIntoBuilder(simulation: GrowthSimulation) {
    setTitle(simulation.title);
    setStartingAmount(String(simulation.startingAmount));
    setContributionAmount(String(simulation.contributionAmount));
    setContributionFrequency(simulation.contributionFrequency);
    setDurationMonths(String(simulation.durationMonths));
    setExpectedAnnualGrowth(String(simulation.expectedAnnualGrowth));
    setRiskLevel(simulation.riskLevel);
    setReinvest(simulation.reinvest);
    notifyApp("Plan loaded", "Edit the numbers and save it as an updated version.");
    triggerHaptic("light");
  }

  async function copyGrowthShareText(text = growthShareText || buildGrowthShareText(preview, settings, growthShareContext, growthRateState.rates)) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        notifyApp("Share text copied", "Paste it anywhere you want to post.");
      }
    } catch {
      // Clipboard can be unavailable in some Telegram webviews.
    }
  }

  async function shareGrowthPlan(simulation = preview) {
    const text = buildGrowthShareText(simulation, settings, growthShareContext, growthRateState.rates);

    setIsBuildingShareCard(true);

    try {
      const blob = await buildGrowthShareCardBlob(simulation, settings, growthShareContext, growthRateState.rates);
      const cardUrl = URL.createObjectURL(blob);

      setGrowthShareText(text);
      setGrowthShareCardUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }

        return cardUrl;
      });

      const file = new File([blob], "broke-growth-plan.png", {
        type: "image/png",
      });

      if (shareInitData) {
        await sendShareImageViaBot(file, shareInitData, text);
        notifyApp("Growth card sent", "Open your Telegram bot chat and forward it anywhere.");
      } else if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "$BROKE Growth Lab",
          text,
          files: [file],
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        notifyApp("Share text copied", "Open inside Telegram to send the card to the bot. The preview is ready below.");
      } else {
        notifyApp("Telegram needed", "Open inside Telegram to send the card to the bot. The preview is ready below.");
      }
      triggerHaptic("success");
    } catch {
      try {
        const blob = await buildGrowthShareCardBlob(simulation, settings, growthShareContext, growthRateState.rates);
        const file = new File([blob], "broke-growth-plan.png", {
          type: "image/png",
        });

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: "$BROKE Growth Lab",
            text,
            files: [file],
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
          notifyApp("Share text copied", "Bot delivery failed. The card preview is ready below.");
        } else {
          notifyApp("Bot delivery failed", "The card preview is ready below.");
        }
      } catch {
        // User cancelled share or browser blocked the fallback.
      }
    } finally {
      setIsBuildingShareCard(false);
    }
  }

  return (
    <div
      className="screen growth-screen"
      onFocusCapture={() => lockGrowthTypingWindow()}
      onInputCapture={() => lockGrowthTypingWindow()}
    >
      <Header title="$BROKE Growth Lab" showBack rightIcon={A.help} onBack={onBack} onRight={onHelp} />

      <section className="growth-hero-card">
        <div>
          <span>Monthly Leak Plan</span>
          <h2>Base saving + redirected leaks = real goal progress.</h2>
          <p>
            Leaks are the boost, not the whole engine. Lower leaks should make the user look disciplined, not farther from the goal.
          </p>
        </div>
        <img
          src={PREMIUM_VISUAL_PACK.growthMascot}
          alt=""
          onError={(event) => {
            event.currentTarget.src = GROWTH_PUBLIC_ASSETS.hero;
          }}
        />
      </section>

      <section className="growth-asset-strip">
        <img
          src={GROWTH_PUBLIC_ASSETS.market}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <img
          src={GROWTH_PUBLIC_ASSETS.lab}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <img
          src={GROWTH_PUBLIC_ASSETS.trophy}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </section>

      <section className="growth-leak-card">
        <img
          className="growth-leak-asset"
          src={GROWTH_PUBLIC_ASSETS.leak}
          alt=""
          onError={(event) => {
            event.currentTarget.src = A.leaks;
          }}
        />

        <div>
          <span>This month’s detected leaks</span>
          <strong>{money(leakAmount, settings.currency)}</strong>
          <p>
            {topLeak
              ? `Biggest leak boost: ${categoryLabel(topLeak.category)}`
              : "No leaks detected. Use intentional saving as the base and leaks as optional extra boost."}
          </p>
        </div>

        <button type="button" onClick={leakAmount > 0 ? useMyLeaks : useBaseSavingOnly}>
          {leakAmount > 0 ? "Use detected leaks" : "Use base saving"}
        </button>
      </section>

      {leakAmount <= 0 && (
        <section className="v58-empty-card v58-growth-empty">
          <div className="v58-empty-head">
            <img
              src={PREMIUM_VISUAL_PACK.growthMascot}
              alt=""
              onError={(event) => {
                event.currentTarget.src = GROWTH_PUBLIC_ASSETS.lab;
              }}
            />
            <div>
              <span>Growth Lab can run without a leak</span>
              <strong>No leaks detected. That is good behavior.</strong>
              <p>
                Add a base monthly saving amount below. If leaks appear later, they become an extra boost instead of the whole plan.
              </p>
            </div>
          </div>
          <button type="button" className="v58-empty-primary" onClick={useBaseSavingOnly}>
            Use base saving
          </button>
        </section>
      )}

      <section className="growth-form-card">
        <div className="section-title">
          <span>Create leak plan</span>
          <small>Planning only</small>
        </div>

        <label className="growth-field">
          <span>Plan name</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <div className="growth-field-grid">
          <label className="growth-field">
            <span>Starting amount</span>
            <input
              inputMode="decimal"
              value={startingAmount}
              onChange={(event) => setStartingAmount(event.target.value)}
            />
          </label>

          <label className="growth-field">
            <span>Base saving</span>
            <input
              inputMode="decimal"
              value={baseSavingAmount}
              onChange={(event) => setBaseSavingAmount(event.target.value)}
            />
          </label>

          <label className="growth-field">
            <span>Leak boost</span>
            <input
              inputMode="decimal"
              value={contributionAmount}
              onChange={(event) => setContributionAmount(event.target.value)}
            />
          </label>
        </div>

        <div className="growth-choice-row">
          {(["daily", "weekly", "monthly"] as GrowthFrequency[]).map((frequency) => (
            <button
              type="button"
              key={frequency}
              className={contributionFrequency === frequency ? "active" : ""}
              onClick={() => setContributionFrequency(frequency)}
            >
              {frequency === "daily" ? "Daily" : frequency === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>

        <div className="growth-field-grid single">
          <label className="growth-field">
            <span>Duration</span>
            <input
              inputMode="numeric"
              value={durationMonths}
              onChange={(event) => setDurationMonths(event.target.value)}
            />
            <small>months</small>
          </label>
        </div>

        <p className="growth-plan-note">
          No investment assumptions here. Goal progress is base saving plus optional redirected leaks, so lower leaks do not make the plan look worse.
        </p>
      </section>

      <section className="growth-result-card">
        <div className="section-title">
          <span>Monthly Leak Plan</span>
          <small>Planner</small>
        </div>

        <div className="growth-result-grid">
          <div>
            <span>Total redirected</span>
            <strong>{money(finalPoint.contributed, settings.currency)}</strong>
          </div>
          <div>
            <span>Projected total</span>
            <strong>{money(finalPoint.balance, settings.currency)}</strong>
          </div>

          <div>
            <span>Base/month</span>
            <strong>{money(monthlyBaseSaving, settings.currency)}</strong>
          </div>
          <div>
            <span>Leak boost/month</span>
            <strong>{money(monthlyLeakBoost, settings.currency)}</strong>
          </div>
          <div>
            <span>Total/month</span>
            <strong>{money(monthlyContribution, settings.currency)}</strong>
          </div>
        </div>

        <div className="growth-mini-chart">
          {bars.map((point) => (
            <div key={point.month}>
              <i style={{ height: `${Math.max(12, (point.balance / maxBar) * 100)}%` }} />
              <span>{point.month}m</span>
            </div>
          ))}
        </div>



        <section className="growth-real-life-plan-card">
          <div className="section-title">
            <span>Target Coverage</span>
            <small>1m / 12m view</small>
          </div>

          <p>
            Turn the projected total into something concrete: insurance, mortgage/rent,
            school fees, phone upgrade, emergency fund, debt, family support, or any target you add.
          </p>

          <div className="growth-planner-tabs">
            <button
              type="button"
              className={growthPlannerTab === "costs" ? "active" : ""}
              onClick={() => setGrowthPlannerTab("costs")}
            >
              Coverage lines
            </button>
            <button
              type="button"
              className={growthPlannerTab === "goal" ? "active" : ""}
              onClick={() => setGrowthPlannerTab("goal")}
            >
              Personal goal
            </button>
          </div>

          {growthPlannerTab === "costs" ? (
            <>
              <div className="growth-real-life-targets-head">
                <div>
                  <strong>Main coverage lines</strong>
                  <span>Start with Insurance and Mortgage / rent. Use 1m for one month or 12m for a yearly view.</span>
                </div>
              </div>

              <div className="growth-target-suggestion-row" aria-label="Add custom target suggestions">
                {targetCoverageSuggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => addSuggestedCoverageTarget(suggestion)}
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>

              <div className="growth-real-life-target-list">
                {realLifeTargets.map((target) => {
                  const targetDisplay = getRealLifeTargetDisplay(target);
                  const targetUsdNote = usdReferenceNoteFromDisplay(targetDisplay, settings, growthRateState.rates);
                  const targetAmount = targetDisplay.amount;
                  const targetTotal = getRealLifeTargetTotal(target);
                  const targetMonths = getMonthsToGrowthGoal(targetTotal, monthlyContribution);
                  const targetProgress =
                    targetTotal > 0 ? clamp((finalPoint.balance / targetTotal) * 100, 0, 100) : 0;

                  return (
                    <article className="growth-real-life-target-row" key={target.id}>
                      <div className="growth-real-life-target-main">
                        <input
                          value={target.name}
                          placeholder="Cost name"
                          onChange={(event) =>
                            updateRealLifeTarget(target.id, { name: event.target.value })
                          }
                          aria-label="Planned cost name"
                        />

                        <input
                          inputMode="decimal"
                          value={target.amount}
                          placeholder="Amount"
                          onChange={(event) =>
                            updateRealLifeTarget(target.id, { amount: event.target.value })
                          }
                          aria-label="Planned cost amount"
                        />

                        <small className="growth-currency-chip">
                          {targetDisplay.converted
                            ? `${money(targetDisplay.amount, targetDisplay.currency)} display${targetUsdNote ? ` · ${targetUsdNote}` : ""} · saved as ${target.currency || settings.currency}`
                            : targetUsdNote
                              ? `Saved as ${target.currency || settings.currency} · ${targetUsdNote}`
                              : `Saved as ${target.currency || settings.currency}`}
                        </small>

                        <div className="growth-row-period-toggle">
                          <button
                            type="button"
                            className={target.period === "one" ? "active" : ""}
                            onClick={() => updateRealLifeTarget(target.id, { period: "one" })}
                          >
                            1m
                          </button>
                          <button
                            type="button"
                            className={target.period === "year" ? "active" : ""}
                            onClick={() => updateRealLifeTarget(target.id, { period: "year" })}
                          >
                            12m
                          </button>
                        </div>
                      </div>

                      <div className="growth-real-life-target-result">
                        <span>
                          {formatPlannedCostCoverage(
                            finalPoint.balance,
                            targetAmount,
                            target.period,
                            target.name
                          )}
                        </span>
                        <strong>{formatGoalTime(targetMonths)}</strong>
                        <small>
                          {formatGrowthMonthsCovered(finalPoint.balance, targetAmount)} at{" "}
                          {money(targetAmount, targetDisplay.currency)}/month
                        </small>
                      </div>

                      <div className="growth-goal-progress">
                        <i style={{ width: `${targetProgress}%` }} />
                      </div>

                      {realLifeTargets.length > 1 && (
                        <button
                          type="button"
                          className="growth-manual-target-remove"
                          onClick={() => removeRealLifeTarget(target.id)}
                          aria-label="Remove planned cost"
                        >
                          ×
                        </button>
                      )}
                    </article>
                  );
                })}

                <button
                  type="button"
                  className="growth-add-cost-bottom"
                  onClick={addRealLifeTarget}
                >
                  + Add custom target
                </button>
              </div>
            </>
          ) : (
            <section className="growth-saving-goal-panel">
              <div className="growth-saving-goal-head">
                <div>
                  <strong>What are you actually working toward?</strong>
                  <span>Choose a common target or type your own. The amount stays private unless you share it.</span>
                </div>
              </div>

              <div className="growth-saving-goal-options">
                {savingGoalOptions.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={savingGoalName === option ? "active" : ""}
                    onClick={() => {
                      setSavingGoalName(option);
                      setSavingGoalCurrency((current) => current || settings.currency);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="growth-saving-goal-fields">
                <label className="growth-field">
                  <span>Goal name</span>
                  <input
                    value={savingGoalName}
                    placeholder="Example: Emergency fund"
                    onChange={(event) => {
                      setSavingGoalName(event.target.value);
                      setSavingGoalCurrency((current) => current || settings.currency);
                    }}
                  />
                </label>

                <label className="growth-field">
                  <span>Target amount</span>
                  <input
                    inputMode="decimal"
                    value={savingGoalAmount}
                    placeholder="Example: 800"
                    onChange={(event) => {
                      setSavingGoalAmount(event.target.value);
                      if (event.target.value.trim()) setSavingGoalCurrency((current) => current || settings.currency);
                    }}
                  />
                </label>
              </div>

              <p className="tiny-note">
                {activeGoalDisplay.converted
                  ? `Personal goal is displayed as ${money(activeGoalDisplay.amount, activeGoalDisplay.currency)}${activeGoalUsdNote ? ` (${activeGoalUsdNote})` : ""}. Original: ${money(activeGoalDisplay.originalAmount, activeGoalDisplay.originalCurrency)}.`
                  : activeGoalUsdNote
                    ? `Personal goal amounts are saved as ${savingGoalCurrency || settings.currency}. ${activeGoalUsdNote}.`
                    : `Personal goal amounts are saved as ${savingGoalCurrency || settings.currency}.`}
              </p>

              <div className="growth-goal-result">
                <div>
                  <span>Goal</span>
                  <strong>{activeGoalName}</strong>
                </div>
                <div>
                  <span>Target</span>
                  <strong>{money(activeGoalTarget, activeGoalDisplay.currency)}</strong>
                  {activeGoalUsdNote && <small className="usd-reference-note">{activeGoalUsdNote}</small>}
                </div>
                <div>
                  <span>Total/month</span>
                  <strong>{money(monthlyContribution, settings.currency)}</strong>
                </div>
              </div>

              <div className="growth-goal-progress">
                <i style={{ width: `${goalProgress}%` }} />
              </div>

              <p>
                With base saving plus redirected leak boost, you could reach it in{" "}
                <strong>{formatGoalTime(goalMonths)}</strong>.
              </p>
            </section>
          )}

          <small className="growth-soft-note">
            This is a personal goal simulation. No real funds are deposited, no custody,
            no staking, no promised yield, and no guaranteed returns.
          </small>
        </section>

        <p className="growth-disclaimer">
          This is only a personal planning simulation. It is not investing, staking, custody, or financial advice.
        </p>

        <div className="growth-actions">
          <button type="button" onClick={saveSimulation}>
            Save plan
          </button>
          <button
            type="button"
            disabled={isBuildingShareCard}
            onClick={() => void shareGrowthPlan(preview)}
          >
            {isBuildingShareCard ? "Creating card..." : "Share goal card"}
          </button>
        </div>
      </section>

      {growthShareCardUrl && (
        <section className="growth-share-preview premium-share-card">
          <img
            className="premium-share-card-art"
            src={SHARE_CARD_PUBLIC_ASSETS.growth}
            alt=""
          />
          <div className="section-title">
            <span>Goal card ready</span>
            <small>PNG</small>
          </div>

          <img src={growthShareCardUrl} alt="Saving goal share card preview" />

          <p>
            The card is sent to your Telegram bot chat when possible. If Telegram blocks
            delivery, download it, copy the text, or long-press the preview.
          </p>

          <div className="growth-actions">
            <button type="button" onClick={() => downloadGrowthShareCardUrl(growthShareCardUrl)}>
              Download card
            </button>
            <button type="button" onClick={() => void copyGrowthShareText()}>
              Copy share text
            </button>
          </div>
        </section>
      )}

      <section className="growth-result-card growth-plan-tracker-card">
        <div className="section-title">
          <span>Saved plans</span>
          <small>{savedSimulations.length}/8 · clickable</small>
        </div>

        {savedSimulations.length === 0 && (
          <div className="growth-empty">
            <img src={A.challengeTrophy} alt="" />
            <strong>No saved plans yet.</strong>
            <span>Create one leak plan and save it here.</span>
          </div>
        )}

        {activeGrowthPlan && activeGrowthPlanFinal && activeGrowthPlanCheckpoint && (
          <section className="growth-plan-detail-card">
            <div className="growth-plan-detail-head">
              <div>
                <span>Active tracking plan</span>
                <strong>{activeGrowthPlan.title}</strong>
                <small>{getGrowthPlanLastProgressLabel(activeGrowthPlan)}</small>
              </div>
              <button type="button" onClick={() => setActiveGrowthPlanId("")}>Close</button>
            </div>

            <div className="growth-plan-detail-stats">
              <div>
                <span>Goal value</span>
                <strong>{money(activeGrowthPlanTarget, settings.currency)}</strong>
              </div>
              <div>
                <span>Tracked progress</span>
                <strong>{money(activeGrowthPlanProgress, settings.currency)}</strong>
              </div>
              <div>
                <span>Next checkpoint</span>
                <strong>{activeGrowthPlanCheckpoint.label}</strong>
              </div>
            </div>

            <div className="growth-plan-progress-bar" aria-label="Growth plan progress">
              <i style={{ width: `${Math.max(4, activeGrowthPlanPercent)}%` }} />
            </div>

            <p>
              Keep this plan alive by logging saved progress. Next checkpoint needs about{" "}
              <strong>{money(activeGrowthPlanCheckpoint.remaining, settings.currency)}</strong> more.
            </p>

            <div className="growth-plan-progress-form">
              <input
                inputMode="decimal"
                value={growthProgressAmount}
                placeholder={`Add progress in ${settings.currency}`}
                onChange={(event) => setGrowthProgressAmount(event.target.value)}
              />
              <button
                type="button"
                onClick={() => addGrowthPlanProgress(activeGrowthPlan.id, growthProgressAmount)}
              >
                Add progress
              </button>
            </div>

            <div className="growth-plan-detail-actions">
              <button type="button" onClick={() => markOneGrowthContribution(activeGrowthPlan)}>
                Mark planned contribution
              </button>
              <button type="button" onClick={() => loadGrowthPlanIntoBuilder(activeGrowthPlan)}>
                Update plan
              </button>
              <button type="button" onClick={() => void shareGrowthPlan(activeGrowthPlan)}>
                Share card
              </button>
            </div>

            {activeGrowthPlan.progressEntries.length > 0 && (
              <div className="growth-plan-progress-log">
                <span>Receipt history</span>
                {activeGrowthPlan.progressEntries.slice(0, 3).map((entry) => (
                  <div key={entry.id}>
                    <strong>{money(entry.amount, settings.currency)}</strong>
                    <small>
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="growth-saved-list">
          {savedSimulations.map((simulation) => {
            const result = getGrowthFinal(simulation);
            const tracked = getGrowthPlanProgress(simulation);
            const progressPercent = getGrowthPlanProgressPercent(simulation);

            return (
              <article
                key={simulation.id}
                className={activeGrowthPlanId === simulation.id ? "active" : ""}
              >
                <button
                  type="button"
                  className="growth-saved-plan-open"
                  onClick={() => {
                    setActiveGrowthPlanId(simulation.id);
                    setGrowthProgressAmount("");
                    triggerHaptic("light");
                  }}
                >
                  <img
                    src={GROWTH_PUBLIC_ASSETS.market}
                    alt=""
                    onError={(event) => { event.currentTarget.src = A.progressFlame; }}
                  />
                  <div>
                    <strong>{simulation.title}</strong>
                    <span>
                      {money(simulation.contributionAmount, settings.currency)}{" "}
                      {growthFrequencyLabel(simulation.contributionFrequency)} ·{" "}
                      {simulation.durationMonths} months
                    </span>
                    <small>
                      <span>Projected</span>: {money(result.balance, settings.currency)} ·{" "}
                      <span>Tracked</span>: {money(tracked, settings.currency)}
                    </small>
                    <div className="growth-saved-mini-progress">
                      <i style={{ width: `${Math.max(4, progressPercent)}%` }} />
                    </div>
                  </div>
                </button>
                <button type="button" onClick={() => deleteSimulation(simulation.id)} aria-label={`Delete ${simulation.title}`}>
                  ×
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}


const DEBT_RADAR_KEY = "broke-debt-bills-radar-v1";

const defaultDebtRadarItems: DebtRadarItem[] = [
  {
    id: "debt-main",
    name: "Credit card / loan",
    kind: "debt",
    monthlyAmount: "",
    remainingAmount: "",
    dueDay: "",
    priority: "high",
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    kind: "bill",
    monthlyAmount: "",
    remainingAmount: "",
    dueDay: "",
    priority: "medium",
  },
  {
    id: "maintenance",
    name: "Maintenance reserve",
    kind: "maintenance",
    monthlyAmount: "",
    remainingAmount: "",
    dueDay: "",
    priority: "medium",
  },
];

function normalizeDebtPaymentEntry(input: Partial<DebtPaymentEntry>): DebtPaymentEntry | null {
  const amount = Math.max(0, safeNumber(String(input.amount ?? "")));
  if (amount <= 0) return null;

  const currency = normalizeOptionalCurrency(input.currency);

  return {
    id: input.id || uid(),
    amount,
    createdAt: input.createdAt || new Date().toISOString(),
    note: input.note ? String(input.note) : undefined,
    ...(currency ? { currency } : {}),
  };
}

function normalizeDebtRadarItem(input: Partial<DebtRadarItem>): DebtRadarItem {
  const kind: DebtRadarKind =
    input.kind === "debt" || input.kind === "bill" || input.kind === "maintenance"
      ? input.kind
      : "bill";
  const priority: DebtRadarPriority =
    input.priority === "low" || input.priority === "medium" || input.priority === "high"
      ? input.priority
      : "medium";
  const currency = normalizeOptionalCurrency(input.currency);
  const remainingCurrency = normalizeOptionalCurrency(input.remainingCurrency);
  const paymentHistory = Array.isArray(input.paymentHistory)
    ? input.paymentHistory
        .map(normalizeDebtPaymentEntry)
        .filter((entry): entry is DebtPaymentEntry => Boolean(entry))
        .slice(0, 30)
    : [];

  return {
    id: input.id || uid(),
    name: input.name || (kind === "debt" ? "Debt payment" : kind === "maintenance" ? "Maintenance" : "Recurring bill"),
    kind,
    monthlyAmount: String(input.monthlyAmount ?? ""),
    remainingAmount: String(input.remainingAmount ?? ""),
    dueDay: String(input.dueDay ?? ""),
    priority,
    ...(currency ? { currency } : {}),
    ...(remainingCurrency ? { remainingCurrency } : {}),
    ...(paymentHistory.length > 0 ? { paymentHistory } : {}),
  };
}

function readDebtRadarItems(): DebtRadarItem[] {
  if (typeof window === "undefined") return defaultDebtRadarItems;

  try {
    const raw = window.localStorage.getItem(DEBT_RADAR_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<DebtRadarItem>[]) : null;

    if (!Array.isArray(parsed) || parsed.length === 0) return defaultDebtRadarItems;

    return parsed.map(normalizeDebtRadarItem).slice(0, 12);
  } catch {
    return defaultDebtRadarItems;
  }
}

function writeDebtRadarItems(items: DebtRadarItem[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DEBT_RADAR_KEY, JSON.stringify(items.slice(0, 12)));
  } catch {
    // Debt radar is local-first and optional.
  }
}

const HOME_HABIT_LEAK_KEY = "broke-home-habit-leaks-v1";

const HOME_HABIT_LEAK_PRESETS: Array<{ type: HomeHabitLeakType; label: string; hint: string }> = [
  { type: "lights", label: "Lights left on", hint: "empty room" },
  { type: "fan", label: "Fan running", hint: "running too long" },
  { type: "tv", label: "TV nobody watches", hint: "background drain" },
  { type: "water", label: "Water running", hint: "too long" },
  { type: "charger", label: "Devices left on", hint: "chargers / plugs" },
  { type: "ac-heater", label: "AC / heater waste", hint: "temperature leak" },
  { type: "fridge", label: "Fridge left open", hint: "small repeat leak" },
  { type: "custom", label: "Other home leak", hint: "custom habit" },
];

function normalizeHomeHabitLeakType(input?: unknown): HomeHabitLeakType {
  const value = String(input || "custom");

  return HOME_HABIT_LEAK_PRESETS.some((preset) => preset.type === value)
    ? (value as HomeHabitLeakType)
    : "custom";
}

function cleanHomeHabitLeakLabel(input?: unknown, fallback = "Home leak") {
  const cleaned = String(input || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 42);

  if (!cleaned) return fallback;

  return cleaned;
}

function homeHabitLeakStackKey(label: string) {
  return cleanHomeHabitLeakLabel(label)
    .toLocaleLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHomeHabitLeakEntry(input: Partial<HomeHabitLeakEntry>): HomeHabitLeakEntry {
  const type = normalizeHomeHabitLeakType(input.type);
  const preset = HOME_HABIT_LEAK_PRESETS.find((item) => item.type === type);
  const label = cleanHomeHabitLeakLabel(input.label, preset?.label || "Home leak");
  const stackKey = cleanHomeHabitLeakLabel(input.stackKey, homeHabitLeakStackKey(label));

  return {
    id: input.id || uid(),
    type,
    label,
    createdAt: input.createdAt || new Date().toISOString(),
    stackKey,
    ...(input.note ? { note: String(input.note) } : {}),
  };
}

function readHomeHabitLeaks(): HomeHabitLeakEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HOME_HABIT_LEAK_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<HomeHabitLeakEntry>[]) : null;

    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeHomeHabitLeakEntry).slice(0, 80);
  } catch {
    return [];
  }
}

function writeHomeHabitLeaks(items: HomeHabitLeakEntry[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(HOME_HABIT_LEAK_KEY, JSON.stringify(items.slice(0, 80)));
  } catch {
    // Home habit leaks are awareness-first and optional.
  }
}

function buildHomeHabitLeakInsight(items: HomeHabitLeakEntry[]): HomeHabitLeakInsight {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const weeklyItems = items.filter((item) => new Date(item.createdAt).getTime() >= weekAgo.getTime());
  const stackLabels: Record<string, string> = {};
  const counts = weeklyItems.reduce<Record<string, number>>((acc, item) => {
    const stackKey = item.stackKey || homeHabitLeakStackKey(item.label);
    stackLabels[stackKey] = stackLabels[stackKey] || item.label;
    acc[stackKey] = (acc[stackKey] || 0) + 1;
    return acc;
  }, {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const lateNightCount = weeklyItems.filter((item) => {
    const hour = new Date(item.createdAt).getHours();
    return hour >= 22 || hour < 5;
  }).length;
  const weekendCount = weeklyItems.filter((item) => {
    const day = new Date(item.createdAt).getDay();
    return day === 0 || day === 6;
  }).length;
  const activeDays = new Set(weeklyItems.map((item) => dayKey(new Date(item.createdAt)))).size;

  return {
    weeklyCount: weeklyItems.length,
    topLabel: top ? stackLabels[top[0]] || "Home leak" : "No home leak yet",
    topCount: top?.[1] || 0,
    lateNightCount,
    weekendCount,
    activeDays,
    repeatLabel:
      weeklyItems.length === 0
        ? "Log one habit to unlock patterns."
        : activeDays >= 5
          ? "This repeats almost every day."
          : top && top[1] >= 3
            ? "One home habit is repeating."
            : lateNightCount >= 2
              ? "Late-night home leaks are showing up."
              : weekendCount >= 2
                ? "Weekend home leaks are showing up."
                : "Awareness is starting to build.",
  };
}

function normalizeCloudAppState(input?: Partial<CloudAppState> | null): CloudAppState {
  const today = dayKey(new Date());
  const routineActions = input?.dailyRoutineActions?.date
    ? {
        ...getDefaultDailyRoutineActions(input.dailyRoutineActions.date),
        ...input.dailyRoutineActions,
      }
    : undefined;
  const routineReward = input?.dailyRoutineReward?.date
    ? {
        date: input.dailyRoutineReward.date,
        claimed: Boolean(input.dailyRoutineReward.claimed),
      }
    : undefined;
  const hasActiveStreakProof = Boolean(
    input && Object.prototype.hasOwnProperty.call(input, "activeStreakProof")
  );
  const activeStreakProof = hasActiveStreakProof
    ? normalizeActiveStreakProofState(input?.activeStreakProof)
    : undefined;
  const hasRewardNotificationPrefs = Boolean(
    input && Object.prototype.hasOwnProperty.call(input, "rewardNotificationPrefs")
  );
  const rewardNotificationPrefs = hasRewardNotificationPrefs
    ? normalizeRewardNotificationPrefs(input?.rewardNotificationPrefs)
    : undefined;

  return {
    growthSimulations: Array.isArray(input?.growthSimulations)
      ? input.growthSimulations.map(normalizeGrowthSimulation).slice(0, 8)
      : [],
    growthPlanner: normalizeGrowthPlannerState(input?.growthPlanner),
    debtRadarItems: Array.isArray(input?.debtRadarItems)
      ? input.debtRadarItems.map(normalizeDebtRadarItem).slice(0, 12)
      : defaultDebtRadarItems,
    homeHabitLeaks: Array.isArray(input?.homeHabitLeaks)
      ? input.homeHabitLeaks.map(normalizeHomeHabitLeakEntry).slice(0, 80)
      : [],
    ...(routineActions?.date === today ? { dailyRoutineActions: routineActions } : {}),
    ...(routineReward?.date === today ? { dailyRoutineReward: routineReward } : {}),
    ...(activeStreakProof ? { activeStreakProof } : {}),
    ...(rewardNotificationPrefs ? { rewardNotificationPrefs } : {}),
    localLeakMission: input?.localLeakMission || null,
    appMode: normalizeAppMode(input?.appMode),
    updatedAt: input?.updatedAt,
  };
}

function readLocalCloudAppState(): CloudAppState {
  const today = dayKey(new Date());

  return normalizeCloudAppState({
    growthSimulations: readGrowthSimulations(),
    growthPlanner: readGrowthPlannerState(),
    debtRadarItems: readDebtRadarItems(),
    homeHabitLeaks: readHomeHabitLeaks(),
    dailyRoutineActions: readDailyRoutineActions(today),
    dailyRoutineReward: readDailyRoutineReward(today),
    activeStreakProof: readActiveStreakProofState(),
    rewardNotificationPrefs: readRewardNotificationPrefs(),
    localLeakMission: readLocalLeakMission(),
    appMode: readAppMode(),
    updatedAt: new Date().toISOString(),
  });
}

function writeLocalCloudAppState(input: Partial<CloudAppState>) {
  if (typeof window === "undefined") return;

  const appState = normalizeCloudAppState(input);
  writeGrowthSimulations(appState.growthSimulations);
  writeGrowthPlannerState(appState.growthPlanner);
  writeDebtRadarItems(appState.debtRadarItems);
  writeHomeHabitLeaks(appState.homeHabitLeaks);
  if (appState.dailyRoutineActions) writeDailyRoutineActions(appState.dailyRoutineActions, false);
  if (appState.dailyRoutineReward) writeDailyRoutineReward(appState.dailyRoutineReward.date, appState.dailyRoutineReward.claimed, false);
  if (appState.activeStreakProof) {
    writeActiveStreakProofState(
      mergeActiveStreakProofStates(readActiveStreakProofState(), appState.activeStreakProof),
      false
    );
  }
  if (appState.rewardNotificationPrefs) writeRewardNotificationPrefs(appState.rewardNotificationPrefs, false);
  if ("localLeakMission" in appState) writeLocalLeakMission(appState.localLeakMission || null, false);
  if (appState.appMode) writeAppMode(appState.appMode, false);
  window.dispatchEvent(new Event(CLOUD_APP_STATE_SYNC_EVENT));
}

function repairLocalAppStateCurrency(currency: Currency, repairScope: CurrencyRepairScope = "missing") {
  const planner = readGrowthPlannerState();
  let growthTargetsUpdated = 0;

  const repairedTargets = planner.realLifeTargets.map((target) => {
    const hasAmount = safeNumber(target.amount) > 0;

    if (!hasAmount || (repairScope !== "all" && target.currency)) return target;

    growthTargetsUpdated += 1;
    return {
      ...target,
      currency,
    };
  });

  const savingGoalNeedsCurrency = safeNumber(planner.savingGoalAmount) > 0 && (repairScope === "all" || !planner.savingGoalCurrency);

  if (savingGoalNeedsCurrency) {
    growthTargetsUpdated += 1;
  }

  const repairedPlanner = normalizeGrowthPlannerState({
    ...planner,
    realLifeTargets: repairedTargets,
    ...(savingGoalNeedsCurrency ? { savingGoalCurrency: currency } : {}),
  });

  const debtItems = readDebtRadarItems();
  let debtItemsUpdated = 0;

  const repairedDebtItems = debtItems.map((item) => {
    let next = item;
    const hasMonthlyAmount = safeNumber(item.monthlyAmount) > 0;
    const hasRemainingAmount = safeNumber(item.remainingAmount) > 0;

    if (hasMonthlyAmount && (repairScope === "all" || !item.currency)) {
      next = {
        ...next,
        currency,
      };
      debtItemsUpdated += 1;
    }

    if (hasRemainingAmount && (repairScope === "all" || !item.remainingCurrency)) {
      next = {
        ...next,
        remainingCurrency: currency,
      };
      debtItemsUpdated += 1;
    }

    return next;
  });

  writeGrowthPlannerState(repairedPlanner);
  writeDebtRadarItems(repairedDebtItems);
  window.dispatchEvent(new Event(CLOUD_APP_STATE_SYNC_EVENT));

  return {
    growthTargetsUpdated,
    debtItemsUpdated,
  };
}

function getDebtRadarTotals(
  items: DebtRadarItem[],
  settings?: Settings,
  rates: ExchangeRateMap = {}
): DebtRadarTotals {
  return items.reduce<DebtRadarTotals>(
    (totals, item) => {
      const monthlyDisplay = settings
        ? getDisplayAmount(Math.max(0, safeNumber(item.monthlyAmount)), item.currency, settings, rates)
        : { amount: Math.max(0, safeNumber(item.monthlyAmount)) };
      const remainingDisplay = settings
        ? getDisplayAmount(Math.max(0, safeNumber(item.remainingAmount)), item.remainingCurrency || item.currency, settings, rates)
        : { amount: Math.max(0, safeNumber(item.remainingAmount)) };
      const monthlyAmount = monthlyDisplay.amount;
      const remainingAmount = item.kind === "debt" ? remainingDisplay.amount : 0;

      if (item.kind === "debt") totals.debtMonthly += monthlyAmount;
      if (item.kind === "bill") totals.billMonthly += monthlyAmount;
      if (item.kind === "maintenance") totals.maintenanceMonthly += monthlyAmount;

      totals.totalMonthly += monthlyAmount;
      totals.totalRemainingDebt += remainingAmount;
      if (item.priority === "high" && monthlyAmount > 0) totals.highPriorityCount += 1;

      return totals;
    },
    {
      debtMonthly: 0,
      billMonthly: 0,
      maintenanceMonthly: 0,
      totalMonthly: 0,
      totalRemainingDebt: 0,
      highPriorityCount: 0,
    }
  );
}

function debtRadarKindLabel(kind: DebtRadarKind) {
  if (kind === "debt") return "Debt";
  if (kind === "maintenance") return "Maintenance";
  return "Recurring bill";
}

function debtRadarPriorityLabel(priority: DebtRadarPriority) {
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Medium";
}

function getDebtPaidAmount(item: DebtRadarItem) {
  return (item.paymentHistory || []).reduce((sum, entry) => sum + Math.max(0, safeNumber(String(entry.amount ?? ""))), 0);
}

function getDebtPaymentStatus(item: DebtRadarItem) {
  if (item.kind !== "debt") return "Not debt";

  const paid = getDebtPaidAmount(item);
  const remaining = Math.max(0, safeNumber(item.remainingAmount));

  if (remaining <= 0 && paid > 0) return "Paid";
  if (paid > 0) return "Partial pay";
  return "Unpaid";
}

function getDebtPaymentStatusClass(item: DebtRadarItem) {
  const status = getDebtPaymentStatus(item);
  if (status === "Paid") return "paid";
  if (status === "Partial pay") return "partial";
  return "unpaid";
}

function normalizeDebtRadarDueDay(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 2);
  if (!digits) return "";

  return String(clamp(Number(digits), 1, 31));
}

function buildDebtRadarItem(kind: DebtRadarKind, name: string, currency: Currency): DebtRadarItem {
  return {
    id: uid(),
    name,
    kind,
    monthlyAmount: "",
    remainingAmount: "",
    dueDay: "",
    priority: kind === "debt" ? "high" : "medium",
    currency,
    remainingCurrency: currency,
  };
}

function DebtBillsRadarPanel({
  items,
  totals,
  settings,
  exchangeRates,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onAddPayment,
  onMarkFullPaid,
}: {
  items: DebtRadarItem[];
  totals: DebtRadarTotals;
  settings: Settings;
  exchangeRates: ExchangeRateMap;
  onUpdateItem: (id: string, patch: Partial<DebtRadarItem>) => void;
  onAddItem: (kind: DebtRadarKind, name: string) => void;
  onRemoveItem: (id: string) => void;
  onAddPayment: (id: string, amount: string) => void;
  onMarkFullPaid: (id: string) => void;
}) {
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, string>>({});
  const income = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);
  const pressureBase = income > 0 ? income : Math.max(fixedCosts + totals.totalMonthly, 1);
  const silentPressure = clamp(Math.round((totals.totalMonthly / pressureBase) * 100), 0, 100);
  const walletHpBeforeDailySpending = clamp(100 - Math.round((totals.totalMonthly / pressureBase) * 70), 0, 100);
  const totalMonthlyUsdNote = usdReferenceNote(totals.totalMonthly, settings.currency, settings, exchangeRates);
  const debtMonthlyUsdNote = usdReferenceNote(totals.debtMonthly, settings.currency, settings, exchangeRates);
  const billMonthlyUsdNote = usdReferenceNote(totals.billMonthly, settings.currency, settings, exchangeRates);
  const maintenanceUsdNote = usdReferenceNote(totals.maintenanceMonthly, settings.currency, settings, exchangeRates);
  const remainingDebtUsdNote = usdReferenceNote(totals.totalRemainingDebt, settings.currency, settings, exchangeRates);
  const quickTargets: { kind: DebtRadarKind; name: string }[] = [
    { kind: "debt", name: "Credit card" },
    { kind: "debt", name: "Loan payment" },
    { kind: "bill", name: "Rent / mortgage" },
    { kind: "bill", name: "Insurance" },
    { kind: "bill", name: "Phone / internet" },
    { kind: "bill", name: "Subscriptions" },
    { kind: "maintenance", name: "Car maintenance" },
    { kind: "maintenance", name: "Home repair" },
  ];

  return (
    <section className="debt-radar-panel">
      <div className="debt-radar-hero">
        <div>
          <span>Silent killers</span>
          <strong>{money(totals.totalMonthly, settings.currency)}/month</strong>
          {totalMonthlyUsdNote && <small className="usd-reference-note">{totalMonthlyUsdNote}/mo</small>}
          <p>
            Debt, recurring bills and maintenance hit Wallet HP before daily spending starts.
          </p>
        </div>
        <aside>
          <b>{walletHpBeforeDailySpending}</b>
          <small>HP before daily leaks</small>
        </aside>
      </div>

      <div className="debt-radar-stats">
        <div>
          <span>Debt payments</span>
          <strong>{money(totals.debtMonthly, settings.currency)}</strong>
          {debtMonthlyUsdNote && <small className="usd-reference-note">{debtMonthlyUsdNote}</small>}
        </div>
        <div>
          <span>Recurring bills</span>
          <strong>{money(totals.billMonthly, settings.currency)}</strong>
          {billMonthlyUsdNote && <small className="usd-reference-note">{billMonthlyUsdNote}</small>}
        </div>
        <div>
          <span>Maintenance</span>
          <strong>{money(totals.maintenanceMonthly, settings.currency)}</strong>
          {maintenanceUsdNote && <small className="usd-reference-note">{maintenanceUsdNote}</small>}
        </div>
        <div>
          <span>Silent pressure</span>
          <strong>{silentPressure}%</strong>
        </div>
      </div>

      <div className="debt-radar-warning">
        <strong>
          {totals.totalMonthly > 0
            ? `${money(totals.totalMonthly, settings.currency)}${totalMonthlyUsdNote ? ` (${totalMonthlyUsdNote})` : ""} is already waiting every month.`
            : "Add the silent bills that repeat every month."}
        </strong>
        <span>
          {totals.totalRemainingDebt > 0
            ? `${money(totals.totalRemainingDebt, settings.currency)}${remainingDebtUsdNote ? ` (${remainingDebtUsdNote})` : ""} remaining debt tracked. ${totals.highPriorityCount} high-priority item${totals.highPriorityCount === 1 ? "" : "s"}.`
            : "Use this as a private local log for debt, bills and maintenance. No investment logic."}
        </span>
      </div>

      <p className="debt-radar-note">
        Fill Monthly hit first. Remaining debt is counted only for Debt items. Convert mode displays remembered currencies through the exchange-rate cache.
      </p>

      <div className="debt-radar-quick-row">
        {quickTargets.map((target) => (
          <button
            type="button"
            key={`${target.kind}-${target.name}`}
            onClick={() => onAddItem(target.kind, target.name)}
          >
            + {target.name}
          </button>
        ))}
      </div>

      <div className="debt-radar-list">
        {items.map((item) => {
          const monthlyAmount = Math.max(0, safeNumber(item.monthlyAmount));
          const monthlyDisplay = getDisplayAmount(monthlyAmount, item.currency || settings.currency, settings, exchangeRates);
          const remainingDisplay = getDisplayAmount(
            Math.max(0, safeNumber(item.remainingAmount)),
            item.remainingCurrency || item.currency || settings.currency,
            settings,
            exchangeRates
          );
          const monthlyUsdNote = usdReferenceNoteFromDisplay(monthlyDisplay, settings, exchangeRates);
          const remainingUsdNote = usdReferenceNoteFromDisplay(remainingDisplay, settings, exchangeRates);
          const paidAmount = getDebtPaidAmount(item);
          const paymentStatus = getDebtPaymentStatus(item);
          const paymentStatusClass = getDebtPaymentStatusClass(item);
          const paymentDraft = paymentDrafts[item.id] || "";
          const itemMeta = [
            monthlyAmount > 0
              ? `${money(monthlyDisplay.amount, monthlyDisplay.currency)}/mo${monthlyUsdNote ? ` (${monthlyUsdNote})` : monthlyDisplay.converted ? ` (${originalMoneyNote(monthlyDisplay)})` : ""}`
              : "No monthly hit yet",
            item.kind === "debt" && safeNumber(item.remainingAmount) > 0
              ? `Remaining ${money(remainingDisplay.amount, remainingDisplay.currency)}${remainingUsdNote ? ` (${remainingUsdNote})` : remainingDisplay.converted ? ` (${originalMoneyNote(remainingDisplay)})` : ""}`
              : item.dueDay
                ? `Due day ${item.dueDay}`
                : "No due day",
            `${debtRadarPriorityLabel(item.priority)} priority`,
          ].join(" · ");

          return (
            <article className={`debt-radar-item ${item.kind}`} key={item.id}>
              <div className="debt-radar-item-head">
                <div>
                  <span>{debtRadarKindLabel(item.kind)}</span>
                  <input
                    value={item.name}
                    placeholder="Name"
                    onChange={(event) => onUpdateItem(item.id, { name: event.target.value })}
                  />
                  <small className="debt-radar-item-meta">{itemMeta}</small>
                </div>
                <button type="button" onClick={() => onRemoveItem(item.id)} aria-label={`Remove ${item.name || "item"}`}>
                  ×
                </button>
              </div>

              {item.kind === "debt" && (
                <div className={`debt-payment-status-strip ${paymentStatusClass}`}>
                  <div>
                    <span>Paid status</span>
                    <strong>{paymentStatus}</strong>
                  </div>
                  <div>
                    <span>Paid so far</span>
                    <strong>{money(paidAmount, item.remainingCurrency || item.currency || settings.currency)}</strong>
                  </div>
                  <div>
                    <span>Due</span>
                    <strong>{item.dueDay ? `Day ${item.dueDay}` : "No date"}</strong>
                  </div>
                </div>
              )}

              <div className="debt-radar-fields">
                <label>
                  <span>Type</span>
                  <select
                    value={item.kind}
                    onChange={(event) => onUpdateItem(item.id, { kind: event.target.value as DebtRadarKind })}
                  >
                    <option value="debt">Debt</option>
                    <option value="bill">Recurring bill</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </label>

                <label>
                  <span>Monthly hit</span>
                  <input
                    inputMode="decimal"
                    value={item.monthlyAmount}
                    placeholder="0"
                    onChange={(event) => onUpdateItem(item.id, { monthlyAmount: event.target.value })}
                  />
                </label>

                {item.kind === "debt" && (
                  <label>
                    <span>Remaining debt</span>
                    <input
                      inputMode="decimal"
                      value={item.remainingAmount}
                      placeholder="0"
                      onChange={(event) => onUpdateItem(item.id, { remainingAmount: event.target.value })}
                    />
                  </label>
                )}

                <label>
                  <span>Due day</span>
                  <input
                    inputMode="numeric"
                    value={item.dueDay}
                    placeholder="1-31"
                    onChange={(event) => onUpdateItem(item.id, { dueDay: normalizeDebtRadarDueDay(event.target.value) })}
                  />
                </label>

                <label>
                  <span>Priority</span>
                  <select
                    value={item.priority}
                    onChange={(event) => onUpdateItem(item.id, { priority: event.target.value as DebtRadarPriority })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>

              {item.kind === "debt" && (
                <div className="debt-payment-tracker">
                  <div className="debt-payment-actions">
                    <input
                      inputMode="decimal"
                      value={paymentDraft}
                      placeholder={`Payment in ${item.remainingCurrency || item.currency || settings.currency}`}
                      onChange={(event) =>
                        setPaymentDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onAddPayment(item.id, paymentDraft);
                        setPaymentDrafts((current) => ({ ...current, [item.id]: "" }));
                      }}
                    >
                      Partial pay
                    </button>
                    <button type="button" onClick={() => onMarkFullPaid(item.id)}>
                      Full pay
                    </button>
                  </div>

                  {(item.paymentHistory || []).length > 0 && (
                    <div className="debt-receipt-log">
                      <span>Receipt history</span>
                      {(item.paymentHistory || []).slice(0, 4).map((entry) => (
                        <div key={entry.id}>
                          <strong>{money(entry.amount, entry.currency || item.remainingCurrency || item.currency || settings.currency)}</strong>
                          <small>
                            {new Date(entry.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <button
        type="button"
        className="debt-radar-add"
        onClick={() => onAddItem("bill", "Custom silent killer")}
      >
        + Add custom silent killer
      </button>
    </section>
  );
}

function SurvivalModePanel({
  settings,
  forecast,
  exchangeRates,
  adjustedDailyPace,
  daysSaved,
  totalMonthlySavings,
  nextPaydayDate,
  onPaydayDateChange,
  shareCardRef,
  sharing,
  onShare,
}: {
  settings: Settings;
  forecast: SurvivalForecast;
  exchangeRates: ExchangeRateMap;
  adjustedDailyPace: number;
  daysSaved: number;
  totalMonthlySavings: number;
  nextPaydayDate: string;
  onPaydayDateChange: (value: string) => void;
  shareCardRef: React.RefObject<HTMLDivElement | null>;
  sharing: boolean;
  onShare: () => void;
}) {
  const realBalanceUsdNote = settings.privacy.publicProofMode
    ? ""
    : usdReferenceNote(forecast.realBalance, settings.currency, settings, exchangeRates);
  const safeDailyUsdNote = settings.privacy.publicProofMode
    ? ""
    : usdReferenceNote(forecast.safeDailyBudget, settings.currency, settings, exchangeRates);
  const currentPaceUsdNote = settings.privacy.publicProofMode
    ? ""
    : usdReferenceNote(forecast.currentDailyPace, settings.currency, settings, exchangeRates);
  const totalSavingsUsdNote = usdReferenceNote(totalMonthlySavings, settings.currency, settings, exchangeRates);
  const adjustedPaceUsdNote = usdReferenceNote(adjustedDailyPace, settings.currency, settings, exchangeRates);
  const publicIdentityName = getPublicIdentityName(settings);
  const publicIdentityAvatar = getPublicProfileAvatarImage(settings);
  const statusClass =
    forecast.status === "surviving"
      ? "surviving"
      : forecast.status === "danger"
        ? "danger"
        : "critical";

  return (
    <section className={`survival-mode-card ${statusClass}`}>
      <div className="section-title">
        <span>Survival Mode</span>
        <small>Can you survive until payday?</small>
      </div>

      <div className="survival-hero">
        <img
          src={PREMIUM_VISUAL_PACK.survivalMascot}
          alt=""
          onError={(event) => {
            event.currentTarget.src = A.walletMascot;
          }}
        />
        <div>
          <strong>{forecast.statusLabel}</strong>
          <p>{forecast.dangerLabel}</p>
        </div>
      </div>

      <label className="survival-payday-field">
        <span>Next payday date</span>
        <input
          type="date"
          value={nextPaydayDate}
          onChange={(event) => onPaydayDateChange(event.target.value)}
        />
        <small>Used for Survival Mode. Change it anytime after payday.</small>
      </label>

      <div className="survival-main-grid">
        <div>
          <span>Real balance</span>
          <strong>{publicProofMoney(settings, forecast.realBalance)}</strong>
          {realBalanceUsdNote && <small className="share-usd-reference-note">{realBalanceUsdNote}</small>}
        </div>
        <div>
          <span>Payday date</span>
          <strong>{settings.privacy.publicProofMode ? "hidden" : forecast.nextPaydayDate}</strong>
        </div>
        <div>
          <span>Days until income</span>
          <strong>{forecast.daysUntilIncome}</strong>
        </div>
        <div>
          <span>Safe daily budget</span>
          <strong>{settings.privacy.publicProofMode ? "hidden" : `${money(forecast.safeDailyBudget, settings.currency)}/day`}</strong>
          {safeDailyUsdNote && <small className="share-usd-reference-note">{safeDailyUsdNote}/day</small>}
        </div>
        <div>
          <span>Current pace</span>
          <strong>{settings.privacy.publicProofMode ? "hidden" : `${money(forecast.currentDailyPace, settings.currency)}/day`}</strong>
          {currentPaceUsdNote && <small className="share-usd-reference-note">{currentPaceUsdNote}/day</small>}
        </div>
      </div>

      <div className="survival-forecast-bar">
        <span>Wallet HP forecast</span>
        <div>
          <i style={{ width: `${forecast.walletHpForecast}%` }} />
        </div>
        <strong>{forecast.walletHpForecast}/100</strong>
      </div>

      <div className="survival-danger-card">
        <span>Survival forecast</span>
        <strong>
          {forecast.diesBeforePaydayBy > 0
            ? `Danger: ${forecast.diesBeforePaydayBy} days short`
            : "Safe at current pace"}
        </strong>
        <p>
          If you reduce leaks by {money(totalMonthlySavings, settings.currency)}/month{totalSavingsUsdNote ? ` (${totalSavingsUsdNote}/month)` : ""},
          your pace could become {money(adjustedDailyPace, settings.currency)}/day{adjustedPaceUsdNote ? ` (${adjustedPaceUsdNote}/day)` : ""}.
          {daysSaved > 0 ? ` That may save about ${daysSaved} day${daysSaved === 1 ? "" : "s"}.` : ""}
        </p>
      </div>

      <div className="survival-share-card premium-share-card" ref={shareCardRef}>
        <img
          className="premium-share-card-art"
          src={PREMIUM_VISUAL_PACK.shareCleanBackground}
          alt=""
          onError={(event) => {
            event.currentTarget.src = SHARE_CARD_PUBLIC_ASSETS.background;
          }}
        />
        <div className="survival-share-top share-card-identity-top">
          <div className="share-card-identity-line">
            <img className="share-card-avatar" src={publicIdentityAvatar} alt="" />
            <div>
              <span>$BROKE SURVIVAL MODE</span>
              <strong>Can I survive until payday?</strong>
              <small>{publicIdentityName}</small>
            </div>
          </div>
          <img
            className="share-card-signal-icon"
            src={PREMIUM_VISUAL_PACK.survivalMascot}
            alt=""
            onError={(event) => {
              event.currentTarget.src = A.walletMascot;
            }}
          />
        </div>

        <div className="survival-share-status">
          <span>{forecast.statusLabel}</span>
          <strong>{forecast.dangerLabel}</strong>
        </div>

        <div className="survival-share-grid">
          <div>
            <span>Real balance</span>
            <strong>{publicProofMoney(settings, forecast.realBalance)}</strong>
            {realBalanceUsdNote && <small className="share-usd-reference-note">{realBalanceUsdNote}</small>}
          </div>
          <div>
            <span>Days left</span>
            <strong>{forecast.daysUntilIncome}</strong>
          </div>
          <div>
            <span>Safe/day</span>
            <strong>{publicProofMoney(settings, forecast.safeDailyBudget)}</strong>
            {safeDailyUsdNote && <small className="share-usd-reference-note">{safeDailyUsdNote}/day</small>}
          </div>
          <div>
            <span>Current/day</span>
            <strong>{publicProofMoney(settings, forecast.currentDailyPace)}</strong>
            {currentPaceUsdNote && <small className="share-usd-reference-note">{currentPaceUsdNote}/day</small>}
          </div>
        </div>

        <div className="survival-share-footer">
          <strong>See future damage before it happens.</strong>
          <span>$BROKE Life Tracker · Survival Mode</span>
        </div>
      </div>

      <button type="button" className="survival-share-button" onClick={onShare} disabled={sharing}>
        {sharing ? "Creating survival card..." : "Share survival card"}
      </button>
    </section>
  );
}

function HomeHabitLeaksPanel({
  items,
  insight,
  onLogLeak,
  onRemoveLeak,
}: {
  items: HomeHabitLeakEntry[];
  insight: HomeHabitLeakInsight;
  onLogLeak: (preset: { type: HomeHabitLeakType; label: string }) => void;
  onRemoveLeak: (id: string) => void;
}) {
  const latestItems = items.slice(0, 5);
  const [customHomeHabitName, setCustomHomeHabitName] = useState("");
  const customHomeHabitLabel = cleanHomeHabitLeakLabel(customHomeHabitName, "");

  const weeklyStacks = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const counts = items
      .filter((item) => new Date(item.createdAt).getTime() >= weekAgo.getTime())
      .reduce<Record<string, { label: string; count: number }>>((acc, item) => {
        const stackKey = item.stackKey || homeHabitLeakStackKey(item.label);
        if (!acc[stackKey]) {
          acc[stackKey] = { label: item.label, count: 0 };
        }
        acc[stackKey].count += 1;
        return acc;
      }, {});

    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [items]);

  function logCustomHomeHabit() {
    if (!customHomeHabitLabel) return;

    onLogLeak({ type: "custom", label: customHomeHabitLabel });
    setCustomHomeHabitName("");
  }

  return (
    <section className="home-habit-leaks-panel">
      <div className="home-habit-hero">
        <div>
          <span>Home Habit Leaks</span>
          <strong>Awareness first. Exact money later.</strong>
          <p>
            Log small household drains like lights, fan, TV, water, chargers or AC. $BROKE tracks the habit pattern before trying to estimate the bill.
          </p>
        </div>
        <aside>
          <b>{insight.weeklyCount}</b>
          <small>logged this week</small>
        </aside>
      </div>

      <div className="home-habit-insight-grid">
        <article>
          <span>Biggest home leak</span>
          <strong>{insight.topLabel}</strong>
          <small>{insight.topCount > 0 ? `${insight.topCount}x this week` : "no pattern yet"}</small>
        </article>
        <article>
          <span>Timing signal</span>
          <strong>{insight.lateNightCount > insight.weekendCount ? "Late night" : insight.weekendCount > 0 ? "Weekend" : "Building"}</strong>
          <small>{insight.lateNightCount} late · {insight.weekendCount} weekend</small>
        </article>
        <article>
          <span>Repeat read</span>
          <strong>{insight.activeDays} active days</strong>
          <small>{insight.repeatLabel}</small>
        </article>
      </div>

      <div className="home-habit-quick-row">
        {HOME_HABIT_LEAK_PRESETS.filter((preset) => preset.type !== "custom").map((preset) => (
          <button type="button" key={preset.type} onClick={() => onLogLeak(preset)}>
            <span>{preset.label}</span>
            <small>{preset.hint}</small>
          </button>
        ))}
      </div>

      <div className="home-habit-custom-form">
        <div>
          <span>Custom home leak</span>
          <small>Write your own habit. Same names stack together.</small>
        </div>
        <input
          value={customHomeHabitName}
          onChange={(event) => setCustomHomeHabitName(event.target.value)}
          placeholder="Example: garage light, long shower, laptop left on"
          maxLength={42}
        />
        <button type="button" onClick={logCustomHomeHabit} disabled={!customHomeHabitLabel}>
          Log custom
        </button>
      </div>

      {weeklyStacks.length > 0 && (
        <div className="home-habit-stack-list">
          <span>This week stacks</span>
          {weeklyStacks.map((stack) => (
            <article key={homeHabitLeakStackKey(stack.label)}>
              <strong>{stack.label}</strong>
              <small>{stack.count}x</small>
            </article>
          ))}
        </div>
      )}

      {latestItems.length > 0 ? (
        <div className="home-habit-log">
          <span>Recent home leaks</span>
          {latestItems.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.label}</strong>
                <small>
                  {new Date(item.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {new Date(item.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </small>
              </div>
              <button type="button" onClick={() => onRemoveLeak(item.id)} aria-label={`Remove ${item.label}`}>
                ×
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="home-habit-empty">
          <strong>No home habit leaks logged yet.</strong>
          <p>Tap one chip when you notice a household drain. The pattern gets useful after a few real logs.</p>
        </div>
      )}
    </section>
  );
}


const LEAK_SCORE_DRAFT_KEY = "broke-leak-score-local-draft-v1";
const LEAK_SCORE_SAVED_DRAFTS_KEY = "broke-leak-score-saved-drafts-v1";
const LEAK_SCORE_MAX_SAVED_DRAFTS = 5;

type LeakScoreSavedDraft = LeakScoreProjectDraft & {
  id: string;
  savedAt: string;
  score: number;
  tierLabel: string;
};

function readLeakScoreDraft(): LeakScoreProjectDraft {
  if (typeof window === "undefined") return normalizeLeakScoreDraft();

  try {
    const raw = window.localStorage.getItem(LEAK_SCORE_DRAFT_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LeakScoreProjectDraft>) : null;

    return normalizeLeakScoreDraft(parsed);
  } catch {
    return normalizeLeakScoreDraft();
  }
}

function writeLeakScoreDraft(draft: LeakScoreProjectDraft) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LEAK_SCORE_DRAFT_KEY, JSON.stringify(normalizeLeakScoreDraft(draft)));
  } catch {
    // Leak Score drafts are local-only and optional.
  }
}

function normalizeLeakScoreSavedDraft(input: unknown): LeakScoreSavedDraft | null {
  if (!input || typeof input !== "object") return null;

  const record = input as Partial<LeakScoreSavedDraft>;
  const draft = normalizeLeakScoreDraft(record);
  const score = calculateProjectLeakScore(draft.selectedSignals);
  const savedAt = String(record.savedAt || draft.updatedAt || new Date().toISOString());
  const savedAtTime = new Date(savedAt).getTime();

  return {
    ...draft,
    id: String(record.id || `leak-score-${savedAtTime || Date.now()}`).slice(0, 80),
    savedAt: Number.isFinite(savedAtTime) ? new Date(savedAtTime).toISOString() : new Date().toISOString(),
    score: score.score,
    tierLabel: score.tier.label,
  };
}

function readLeakScoreSavedDrafts(): LeakScoreSavedDraft[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LEAK_SCORE_SAVED_DRAFTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeLeakScoreSavedDraft)
      .filter((item): item is LeakScoreSavedDraft => Boolean(item))
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      .slice(0, LEAK_SCORE_MAX_SAVED_DRAFTS);
  } catch {
    return [];
  }
}

function writeLeakScoreSavedDrafts(drafts: LeakScoreSavedDraft[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LEAK_SCORE_SAVED_DRAFTS_KEY, JSON.stringify(drafts.slice(0, LEAK_SCORE_MAX_SAVED_DRAFTS)));
  } catch {
    // Saved Leak Score snapshots are local-only and optional.
  }
}

function buildLeakScoreSavedDraft(draft: LeakScoreProjectDraft): LeakScoreSavedDraft {
  const normalized = normalizeLeakScoreDraft({ ...draft, updatedAt: new Date().toISOString() });
  const score = calculateProjectLeakScore(normalized.selectedSignals);
  const savedAt = new Date().toISOString();

  return {
    ...normalized,
    id: `leak-score-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt,
    score: score.score,
    tierLabel: score.tier.label,
  };
}

function upsertLeakScoreSavedDraft(draft: LeakScoreProjectDraft, currentDrafts: LeakScoreSavedDraft[]) {
  const savedDraft = buildLeakScoreSavedDraft(draft);
  const nextDrafts = [savedDraft, ...currentDrafts].slice(0, LEAK_SCORE_MAX_SAVED_DRAFTS);
  writeLeakScoreSavedDrafts(nextDrafts);
  return nextDrafts;
}


function LeakScoreScreen({
  shareInitData,
  onBack,
  onHelp,
}: {
  shareInitData: string;
  onBack: () => void;
  onHelp: () => void;
}) {
  const [draft, setDraft] = useState<LeakScoreProjectDraft>(() => readLeakScoreDraft());
  const [savedDrafts, setSavedDrafts] = useState<LeakScoreSavedDraft[]>(() => readLeakScoreSavedDrafts());
  const [shareCopied, setShareCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("Draft saves on this device only.");
  const [clearArmed, setClearArmed] = useState(false);
  const [cardSharing, setCardSharing] = useState(false);
  const leakScoreCardRef = useRef<HTMLDivElement | null>(null);

  const projectName = draft.projectName;
  const chain = draft.chain;
  const contractAddress = draft.contractAddress;
  const selectedSignals = draft.selectedSignals;
  const score = useMemo(() => calculateProjectLeakScore(selectedSignals), [selectedSignals]);
  const selectedSet = useMemo(() => new Set(selectedSignals), [selectedSignals]);
  const selectedLabels = LEAK_SCORE_SIGNALS
    .filter((signal) => selectedSet.has(signal.id))
    .map((signal) => signal.label);
  const shareText = useMemo(() => buildProjectLeakScoreShareText(draft), [draft]);

  useEffect(() => {
    writeLeakScoreDraft(draft);
  }, [draft]);

  function updateDraft(patch: Partial<LeakScoreProjectDraft>) {
    setShareCopied(false);
    setClearArmed(false);
    setDraft((current) => normalizeLeakScoreDraft({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  }

  function toggleSignal(id: LeakScoreSignalId) {
    triggerHaptic("light");
    setShareCopied(false);
    setClearArmed(false);
    setDraft((current) => {
      const selected = current.selectedSignals.includes(id)
        ? current.selectedSignals.filter((signalId) => signalId !== id)
        : [...current.selectedSignals, id];

      return normalizeLeakScoreDraft({
        ...current,
        selectedSignals: selected,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  function saveLeakScoreSnapshot() {
    triggerHaptic("light");
    setShareCopied(false);
    setClearArmed(false);
    const nextDrafts = upsertLeakScoreSavedDraft(draft, savedDrafts);
    setSavedDrafts(nextDrafts);
    setShareMessage(`Saved local snapshot. ${nextDrafts.length}/${LEAK_SCORE_MAX_SAVED_DRAFTS} stored on this device.`);
    notifyApp("Leak Score saved", "Local snapshot saved on this device only.", "info");
  }

  function loadLeakScoreSnapshot(item: LeakScoreSavedDraft) {
    triggerHaptic("light");
    setShareCopied(false);
    setClearArmed(false);
    setDraft(normalizeLeakScoreDraft(item));
    setShareMessage("Loaded a local Leak Score snapshot. Nothing was published.");
  }

  function deleteLeakScoreSnapshot(id: string) {
    triggerHaptic("light");
    const nextDrafts = savedDrafts.filter((item) => item.id !== id);
    setSavedDrafts(nextDrafts);
    writeLeakScoreSavedDrafts(nextDrafts);
    setShareMessage("Local snapshot deleted from this device.");
  }

  function clearDraft() {
    triggerHaptic("light");
    setShareCopied(false);

    if (!clearArmed) {
      setClearArmed(true);
      setShareMessage("Tap Confirm clear to erase the active draft. Saved snapshots stay untouched.");
      return;
    }

    setClearArmed(false);
    setShareMessage("Active draft cleared locally. Saved snapshots were not deleted.");
    setDraft(normalizeLeakScoreDraft({ chain: "Solana", selectedSignals: [] }));
  }

  async function copyLeakScoreText() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareCopied(true);
        setShareMessage("Share text copied. Paste it anywhere you want to discuss the risk signals.");
        notifyApp("Leak Score copied", "Manual DYOR text copied without public posting.", "info");
      } else {
        setShareMessage("Clipboard is blocked here. Select the preview text and copy manually.");
        notifyApp("Copy blocked", "Select the preview text and copy manually.", "info");
      }
    } catch {
      setShareMessage("Clipboard is blocked here. Select the preview text and copy manually.");
      notifyApp("Copy blocked", "Select the preview text and copy manually.", "info");
    }
  }

  async function shareLeakScoreText() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "BROKE Leak Score draft",
          text: shareText,
        });
        setShareMessage("Share sheet opened. Keep the note as DYOR, not an accusation.");
        return;
      }

      await copyLeakScoreText();
    } catch {
      setShareMessage("Sharing was cancelled or blocked. You can still copy the preview text manually.");
    }
  }

  async function createLeakScoreCardFile() {
    if (!leakScoreCardRef.current) {
      throw new Error("Leak Score card preview is not ready.");
    }

    return createShareImageFileFromElement(leakScoreCardRef.current, LEAK_SCORE_SHARE_CARD_FILE_NAME);
  }

  async function shareLeakScoreCard() {
    if (cardSharing) return;

    try {
      triggerHaptic("light");
      setCardSharing(true);
      const imageFile = await createLeakScoreCardFile();
      const nativeShared = await tryNativeImageShare(imageFile);

      if (nativeShared) {
        setShareMessage("Leak Score card shared. Keep the caption as DYOR, not an accusation.");
        return;
      }

      downloadImageFile(imageFile);
      setShareMessage("Image sharing is blocked here, so the Leak Score card was saved as a PNG.");
      notifyApp("Leak Score PNG saved", "Native image sharing is not available in this browser.", "info");
    } catch {
      setShareMessage("Card sharing is blocked or was cancelled. Try copying the text instead.");
      notifyApp("Card share blocked", "Try copying the Leak Score text instead.", "info");
    } finally {
      setCardSharing(false);
    }
  }

  async function sendLeakScoreCardToBot() {
    if (cardSharing) return;

    let imageFile: File | null = null;

    try {
      triggerHaptic("light");
      setCardSharing(true);
      imageFile = await createLeakScoreCardFile();

      if (!shareInitData) {
        downloadImageFile(imageFile);
        setShareMessage("Open inside Telegram to send the Leak Score card to the bot. The PNG was saved locally instead.");
        notifyApp("Telegram needed", "Open inside Telegram to send the Leak Score card to the bot.", "info");
        return;
      }

      await sendShareImageViaBot(imageFile, shareInitData, shareText);
      setShareMessage("Leak Score card was sent to your Telegram bot chat. Open the bot and forward it anywhere.");
      notifyApp("Sent to Telegram bot", "Leak Score card delivered to your bot chat.", "info");
    } catch {
      if (imageFile) downloadImageFile(imageFile);
      setShareMessage("Bot delivery failed. The Leak Score card was saved as a PNG fallback.");
      notifyApp("Bot delivery failed", "PNG fallback saved locally.", "info");
    } finally {
      setCardSharing(false);
    }
  }

  async function downloadLeakScoreCard() {
    if (cardSharing) return;

    try {
      triggerHaptic("light");
      setCardSharing(true);
      const imageFile = await createLeakScoreCardFile();
      downloadImageFile(imageFile);
      setShareMessage("Leak Score card saved as a local PNG.");
    } catch {
      setShareMessage("PNG export is blocked in this browser. Try a screenshot or copy the text.");
    } finally {
      setCardSharing(false);
    }
  }

  const updatedAtLabel = useMemo(() => {
    const timestamp = new Date(draft.updatedAt).getTime();
    if (!Number.isFinite(timestamp)) return "Saved locally";

    return `Saved locally · ${new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [draft.updatedAt]);

  return (
    <div className="screen leak-score-screen">
      <Header title="BROKE Leak Score" showBack onBack={onBack} rightIcon={A.help} onRight={onHelp} />

      <section className="leak-score-hero">
        <div>
          <span>Experimental Research Mode</span>
          <h1>Detect project leaks before they drain the wallet.</h1>
          <p>
            A manual DYOR checklist for project, wallet, hype and liquidity signals. It does not call projects scams. It shows leak signals.
          </p>
        </div>
        <div className={`leak-score-meter leak-score-meter-${score.tier.id}`}>
          <small>Leak Score</small>
          <strong>{score.score}</strong>
          <b>{score.tier.shortLabel}</b>
        </div>
      </section>

      <section className="leak-score-disclaimer">
        <strong>Safety rule</strong>
        <p>
          This version is local and educational only. Drafts stay on this device. No API calls, no public database, no accusations, no investment advice.
        </p>
      </section>

      <section className="leak-score-card">
        <div className="leak-score-section-head">
          <div>
            <span>Step 1</span>
            <strong>Project draft</strong>
            <small>{updatedAtLabel}</small>
          </div>
          <button type="button" onClick={clearDraft}>{clearArmed ? "Confirm clear" : "Clear"}</button>
        </div>

        <label className="leak-score-input-line">
          <span>Project / token name</span>
          <input
            value={projectName}
            onChange={(event) => updateDraft({ projectName: event.target.value })}
            placeholder="Example: Smoke Is BROKE"
          />
        </label>

        <label className="leak-score-input-line">
          <span>Chain</span>
          <select value={chain} onChange={(event) => updateDraft({ chain: event.target.value })}>
            <option>Solana</option>
            <option>Ethereum</option>
            <option>Base</option>
            <option>BSC</option>
            <option>Other</option>
          </select>
        </label>

        <label className="leak-score-input-line">
          <span>Contract / mint address</span>
          <input
            value={contractAddress}
            onChange={(event) => updateDraft({ contractAddress: event.target.value })}
            placeholder="Optional local note"
          />
        </label>

        <div className="leak-score-saved-drafts">
          <div className="leak-score-saved-drafts-head">
            <div>
              <strong>Saved local snapshots</strong>
              <small>{savedDrafts.length}/{LEAK_SCORE_MAX_SAVED_DRAFTS} stored on this device only</small>
            </div>
            <button type="button" onClick={saveLeakScoreSnapshot}>Save snapshot</button>
          </div>

          {savedDrafts.length > 0 ? (
            <div className="leak-score-saved-draft-list">
              {savedDrafts.map((item) => {
                const savedTime = new Date(item.savedAt).getTime();
                const savedLabel = Number.isFinite(savedTime)
                  ? new Date(savedTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "Saved locally";

                return (
                  <article key={item.id}>
                    <div>
                      <strong>{item.projectName || "Unnamed draft"}</strong>
                      <small>{item.chain} · {item.score}/100 · {item.tierLabel} · {savedLabel}</small>
                    </div>
                    <div>
                      <button type="button" onClick={() => loadLeakScoreSnapshot(item)}>Load</button>
                      <button type="button" onClick={() => deleteLeakScoreSnapshot(item.id)}>Delete</button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>Save a snapshot before testing another project. Snapshots stay local and never publish anything.</p>
          )}
        </div>
      </section>

      <section className="leak-score-card">
        <div className="leak-score-section-head">
          <div>
            <span>Step 2</span>
            <strong>Visible leak signals</strong>
          </div>
          <em>{score.selectedCount}/{score.totalSignals}</em>
        </div>

        <div className="leak-score-signal-grid">
          {LEAK_SCORE_SIGNALS.map((signal) => {
            const selected = selectedSet.has(signal.id);

            return (
              <button
                key={signal.id}
                type="button"
                className={`leak-score-signal ${selected ? "selected" : ""}`}
                onClick={() => toggleSignal(signal.id)}
              >
                <strong>{signal.label}</strong>
                <span>{signal.helper}</span>
                <small>+{signal.weight}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`leak-score-result leak-score-result-${score.tier.id}`}>
        <span>Step 3 · Result preview</span>
        <strong>{score.tier.label}</strong>
        <p>{score.tier.helper}</p>
        <div className="leak-score-result-line">
          <small>Project</small>
          <b>{projectName.trim() || "Unnamed draft"}</b>
        </div>
        <div className="leak-score-result-line">
          <small>Chain</small>
          <b>{chain}</b>
        </div>
        <div className="leak-score-result-line">
          <small>Signals</small>
          <b>{selectedLabels.length ? selectedLabels.slice(0, 3).join(", ") : "No signals selected"}</b>
        </div>
      </section>

      <section className="leak-score-card leak-score-visual-share-section">
        <div className="leak-score-section-head">
          <div>
            <span>Step 4</span>
            <strong>Shareable card</strong>
          </div>
          <em>PNG</em>
        </div>

        <div className={`leak-score-public-card premium-share-card leak-score-public-card-${score.tier.id}`} ref={leakScoreCardRef}>
          <img className="premium-share-card-art" src={SHARE_CARD_PUBLIC_ASSETS.background} alt="" />
          <div className="leak-score-public-card-top">
            <div>
              <span>$BROKE LEAK SCORE</span>
              <strong>{projectName.trim() || "Unnamed draft"}</strong>
              <small>{chain}{contractAddress ? ` · ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : ""}</small>
            </div>
            <b>DYOR</b>
          </div>

          <div className="leak-score-public-score-row">
            <div>
              <span>Manual score</span>
              <strong>{score.score}<small>/100</small></strong>
            </div>
            <div>
              <span>Visible tier</span>
              <strong>{score.tier.shortLabel}</strong>
            </div>
          </div>

          <div className="leak-score-public-signals">
            <span>Visible leak signals</span>
            {selectedLabels.length ? (
              <div>
                {selectedLabels.slice(0, 5).map((label) => <b key={label}>{label}</b>)}
                {selectedLabels.length > 5 && <b>+{selectedLabels.length - 5} more</b>}
              </div>
            ) : (
              <p>No visible leak signals selected yet.</p>
            )}
          </div>

          <footer className="leak-score-public-footer">
            <span>Manual checklist · not an accusation · not financial advice</span>
            <b>SmokeIsBroke</b>
          </footer>
        </div>

        <p>
          Export a clean visual card. The card is generated locally from this screen and keeps the same neutral DYOR framing.
        </p>
        <div className="leak-score-share-actions leak-score-card-actions">
          <button type="button" onClick={() => void sendLeakScoreCardToBot()} disabled={cardSharing}>
            {cardSharing ? "Preparing..." : "Send to TG bot"}
          </button>
          <button type="button" onClick={() => void shareLeakScoreCard()} disabled={cardSharing}>
            Share card
          </button>
          <button type="button" onClick={() => void downloadLeakScoreCard()} disabled={cardSharing}>
            Save PNG
          </button>
        </div>
      </section>

      <section className="leak-score-card leak-score-share-card">
        <div className="leak-score-section-head">
          <div>
            <span>Step 5</span>
            <strong>Share text</strong>
          </div>
          <em>{shareCopied ? "Copied" : "Local"}</em>
        </div>
        <p>
          Copy a neutral DYOR note. It says “leak signals”, not “scam”, and it keeps the result framed as a manual checklist.
        </p>
        <textarea readOnly value={shareText} aria-label="Leak Score share text preview" />
        <div className="leak-score-share-actions">
          <button type="button" onClick={() => void copyLeakScoreText()}>{shareCopied ? "Copied" : "Copy text"}</button>
          <button type="button" onClick={() => void shareLeakScoreText()}>Share text</button>
        </div>
        <small>{shareMessage}</small>
      </section>

      <section className="leak-score-roadmap-card">
        <span>What comes next</span>
        <strong>Share card now. Signal fetch later.</strong>
        <p>
          v59.45.4 adds saved local snapshots and safer reset flow. Later versions can add basic Solana signal fetch while staying neutral and educational.
        </p>
      </section>
    </div>
  );
}

function WhatIfScreen({
  settings,
  setSettings,
  expenses,
  challengeTemplates,
  activeChallenge,
  challengeProgress,
  challengeLoading,
  weeklyPatternSummary,
  leaderboard,
  leaderboardLoading,
  shareInitData,
  onToggleLeaderboard,
  onStartChallenge,
  activeProofStatus,
  onMarkCleanDay,
  onCompleteOneFix,
  onDailyChallengeProof,
  onBack,
  onHelp,
  onOpenAdd,
  onOpenChart,
  onOpenProfile,
  onAppStateChange,
}: {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  expenses: Expense[];
  challengeTemplates: ChallengeTemplate[];
  activeChallenge: UserChallenge | null;
  challengeProgress: ChallengeProgress | null;
  challengeLoading: boolean;
  weeklyPatternSummary: WeeklyPatternSummary;
  leaderboard: LeaderboardState | null;
  leaderboardLoading: boolean;
  shareInitData: string;
  onToggleLeaderboard: (nextValue: boolean) => void;
  onStartChallenge: (challengeId: string) => void;
  activeProofStatus: ActiveStreakProofStatus;
  onMarkCleanDay: () => void;
  onCompleteOneFix: () => void;
  onDailyChallengeProof: () => void;
  onBack: () => void;
  onHelp: () => void;
  onOpenAdd: () => void;
  onOpenChart: () => void;
  onOpenProfile: () => void;
  onAppStateChange?: () => void;
}) {
  const [reductions, setReductions] = useState<Record<string, number>>({});
  const [survivalSharing, setSurvivalSharing] = useState(false);
  const [debtRadarItems, setDebtRadarItems] = useState<DebtRadarItem[]>(() =>
    readDebtRadarItems()
  );
  const [homeHabitLeaks, setHomeHabitLeaks] = useState<HomeHabitLeakEntry[]>(() =>
    readHomeHabitLeaks()
  );
  const [rewardNotificationPrefs, setRewardNotificationPrefs] = useState<RewardNotificationPrefs>(() =>
    readRewardNotificationPrefs()
  );
  const debtRadarCurrencySources = useMemo(
    () => debtRadarItems.flatMap((item) => [item.currency, item.remainingCurrency]),
    [debtRadarItems]
  );
  const debtRadarRateState = useExchangeRates(settings, debtRadarCurrencySources);
  const survivalCardRef = useRef<HTMLDivElement | null>(null);
  const challengeSectionRef = useRef<HTMLDetailsElement | null>(null);

  const categorySummaries = useMemo(() => {
    return getCategoryLeakSummaries(expenses).slice(0, 6);
  }, [expenses]);

  const hasRealData = categorySummaries.length > 0;
  const patternChallengeRecommendation = useMemo(
    () =>
      buildPatternChallengeRecommendation(
        weeklyPatternSummary,
        challengeTemplates.length ? challengeTemplates : defaultChallengeTemplates,
        categorySummaries
      ),
    [weeklyPatternSummary, challengeTemplates, categorySummaries]
  );

  useEffect(() => {
    writeDebtRadarItems(debtRadarItems);
    onAppStateChange?.();
  }, [debtRadarItems]);

  useEffect(() => {
    writeHomeHabitLeaks(homeHabitLeaks);
    onAppStateChange?.();
  }, [homeHabitLeaks]);

  useEffect(() => {
    writeRewardNotificationPrefs(rewardNotificationPrefs);
    onAppStateChange?.();
  }, [rewardNotificationPrefs]);

  useEffect(() => {
    function applySyncedAppState() {
      setDebtRadarItems(readDebtRadarItems());
      setHomeHabitLeaks(readHomeHabitLeaks());
      setRewardNotificationPrefs(readRewardNotificationPrefs());
    }

    window.addEventListener(CLOUD_APP_STATE_SYNC_EVENT, applySyncedAppState);

    return () => {
      window.removeEventListener(CLOUD_APP_STATE_SYNC_EVENT, applySyncedAppState);
    };
  }, []);

  const debtRadarTotals = useMemo(
    () => getDebtRadarTotals(debtRadarItems, settings, debtRadarRateState.rates),
    [debtRadarItems, settings, debtRadarRateState.rates]
  );
  const homeHabitLeakInsight = useMemo(
    () => buildHomeHabitLeakInsight(homeHabitLeaks),
    [homeHabitLeaks]
  );

  const cards = useMemo<CategorySummary[]>(() => {
    if (hasRealData) return categorySummaries;

    return [
      { category: "Coffee", amount: 84, trackedAmount: 84, leakAmount: 84, count: 0, icon: A.coffee },
      { category: "Smoking", amount: 120, trackedAmount: 120, leakAmount: 120, count: 0, icon: A.smoking },
      { category: "Takeouts", amount: 160, trackedAmount: 160, leakAmount: 160, count: 0, icon: A.takeouts },
      { category: "Shopping", amount: 98, trackedAmount: 98, leakAmount: 98, count: 0, icon: A.shopping },
    ];
  }, [categorySummaries, hasRealData]);

  const totalMonthlySavings = cards.reduce((acc, item) => {
    const reduction = reductions[item.category] ?? defaultReduction(item.category);
    return acc + item.amount * reduction;
  }, 0);

  const survivalForecast = useMemo(
    () => buildSurvivalForecast(settings, expenses),
    [settings, expenses]
  );

  const survivalAdjustedPace = Math.max(
    survivalForecast.currentDailyPace - totalMonthlySavings / 30,
    0
  );
  const survivalAdjustedDays =
    survivalForecast.realBalance <= 0
      ? 0
      : survivalAdjustedPace <= 0
        ? survivalForecast.daysUntilIncome
        : Math.floor(survivalForecast.realBalance / Math.max(survivalAdjustedPace, 1));
  const survivalDaysSaved = Math.max(
    survivalAdjustedDays - survivalForecast.surviveDays,
    0
  );
  const survivalRealBalanceUsdNote = settings.privacy.publicProofMode
    ? ""
    : usdReferenceNote(survivalForecast.realBalance, settings.currency, settings, debtRadarRateState.rates);
  const survivalSafeDailyUsdNote = settings.privacy.publicProofMode
    ? ""
    : usdReferenceNote(survivalForecast.safeDailyBudget, settings.currency, settings, debtRadarRateState.rates);
  const survivalCurrentPaceUsdNote = settings.privacy.publicProofMode
    ? ""
    : usdReferenceNote(survivalForecast.currentDailyPace, settings.currency, settings, debtRadarRateState.rates);

  const walletVerified = Boolean(settings.wallet.isVerified);
  const verifiedHolderBalance = walletVerified ? settings.wallet.brokeBalance : 0;
  const holderHasVerifiedBalance = verifiedHolderBalance > 0;
  const holderMeetsFutureRewardMinimum = verifiedHolderBalance >= FUTURE_HOLDER_REWARD_MIN_BALANCE;
  const activeStreakReady = activeProofStatus.eligible;
  const rewardFoundationReady = walletVerified && holderMeetsFutureRewardMinimum && activeStreakReady;
  const holderRewardWeight = !walletVerified
    ? "Verify wallet before balance-share."
    : holderHasVerifiedBalance
      ? "Share = your verified BROKE / total eligible BROKE"
      : "No eligible balance yet";
  const rewardChecklist = [
    {
      label: "Verified wallet",
      detail: walletVerified ? "Ownership proof active" : "Verify ownership in Profile",
      done: walletVerified,
    },
    {
      label: "100K+ $BROKE hold",
      detail: holderMeetsFutureRewardMinimum
        ? `${formatTokenAmount(settings.wallet.brokeBalance)} BROKE`
        : `Planned minimum: ${formatTokenAmount(FUTURE_HOLDER_REWARD_MIN_BALANCE)}`,
      done: holderMeetsFutureRewardMinimum,
    },
    {
      label: "7+ day active streak",
      detail: activeStreakReady ? `${activeProofStatus.currentStreak}d live streak` : `${activeProofStatus.progressDays}/${ACTIVE_STREAK_ELIGIBILITY_DAYS} days built`,
      done: activeStreakReady,
    },
    {
      label: "Reward epoch",
      detail: "Locked until Creator Fee pool opens",
      done: false,
    },
  ];

  function openChallengeArea() {
    triggerHaptic("light");
    challengeSectionRef.current?.setAttribute("open", "true");
    challengeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function completeDailyChallengeProof() {
    onDailyChallengeProof();
    window.setTimeout(() => openChallengeArea(), 0);
  }

  function openDailyRoutineFromRewards() {
    onBack();

    window.setTimeout(() => {
      const element = document.getElementById("daily-routine-panel") as HTMLDetailsElement | null;

      if (element) {
        element.open = true;
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  }

  const survivalShareText = [
    "$BROKE Survival Mode",
    "",
    `Status: ${survivalForecast.statusLabel}`,
    `Real balance: ${publicProofMoney(settings, survivalForecast.realBalance)}`,
    survivalRealBalanceUsdNote ? `Real balance USD reference: ${survivalRealBalanceUsdNote}` : "",
    `Next payday: ${settings.privacy.publicProofMode ? "hidden" : survivalForecast.nextPaydayDate}`,
    `Days until income: ${survivalForecast.daysUntilIncome}`,
    `Safe daily budget: ${settings.privacy.publicProofMode ? "hidden" : `${money(survivalForecast.safeDailyBudget, settings.currency)}/day`}`,
    survivalSafeDailyUsdNote ? `Safe daily USD reference: ${survivalSafeDailyUsdNote}/day` : "",
    `Current pace: ${settings.privacy.publicProofMode ? "hidden" : `${money(survivalForecast.currentDailyPace, settings.currency)}/day`}`,
    survivalCurrentPaceUsdNote ? `Current pace USD reference: ${survivalCurrentPaceUsdNote}/day` : "",
    `Forecast: ${survivalForecast.dangerLabel}`,
    "",
    settings.privacy.publicProofMode ? "Public Proof Mode: exact private numbers hidden." : "Can you survive until payday?",
    "Smoke is broke.",
  ].filter(Boolean).join("\n");

  async function shareSurvivalCard() {
    if (!survivalCardRef.current || survivalSharing) return;

    triggerHaptic("light");
    setSurvivalSharing(true);

    try {
      const imageFile = await createShareImageFileFromElement(survivalCardRef.current);
      const nativeShared = await tryNativeImageShare(imageFile);

      if (nativeShared) return;

      if (!shareInitData) {
        downloadImageFile(imageFile);
        notifyApp("Survival card downloaded", "Open inside Telegram next time to send it to the bot.");
        return;
      }

      try {
        await sendShareImageViaBot(imageFile, shareInitData, survivalShareText);
        notifyApp("Survival card sent", "Open your Telegram bot chat and forward it anywhere.");
      } catch {
        downloadImageFile(imageFile);
        notifyApp("PNG downloaded", "Bot delivery failed, so the Survival card was saved as a file.");
      }
    } catch {
      notifyApp("Sharing unavailable", "Survival card sharing is not supported by this browser.");
    } finally {
      setSurvivalSharing(false);
    }
  }

  function defaultReduction(category: string) {
    if (category === "Smoking") return 0.5;
    return 1;
  }

  function setReduction(category: string, value: number) {
    setReductions((prev) => ({
      ...prev,
      [category]: value,
    }));
  }

  function updateSurvivalPaydayDate(value: string) {
    setSettings((prev) => ({
      ...prev,
      survival: {
        ...prev.survival,
        nextPaydayDate: value,
      },
    }));
  }

  function updatePublicProofMode(value: boolean) {
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        publicProofMode: value,
      },
    }));
  }

  function logHomeHabitLeak(preset: { type: HomeHabitLeakType; label: string }) {
    setHomeHabitLeaks((current) => [
      normalizeHomeHabitLeakEntry({
        id: uid(),
        type: preset.type,
        label: preset.label,
        createdAt: new Date().toISOString(),
      }),
      ...current,
    ].slice(0, 80));
    triggerHaptic("light");
  }

  function removeHomeHabitLeak(id: string) {
    setHomeHabitLeaks((current) => current.filter((item) => item.id !== id));
    triggerHaptic("light");
  }

  function updateDebtRadarItem(id: string, patch: Partial<DebtRadarItem>) {
    setDebtRadarItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        const shouldStampMonthlyCurrency =
          "monthlyAmount" in patch && String(patch.monthlyAmount ?? "").trim().length > 0 && !item.currency;
        const shouldStampRemainingCurrency =
          "remainingAmount" in patch &&
          String(patch.remainingAmount ?? "").trim().length > 0 &&
          !item.remainingCurrency;

        return {
          ...item,
          ...(shouldStampMonthlyCurrency ? { currency: settings.currency } : {}),
          ...(shouldStampRemainingCurrency ? { remainingCurrency: settings.currency } : {}),
          ...patch,
        };
      })
    );
  }

  function addDebtRadarItem(kind: DebtRadarKind, name: string) {
    setDebtRadarItems((current) => [buildDebtRadarItem(kind, name, settings.currency), ...current].slice(0, 12));
    triggerHaptic("light");
  }

  function addDebtPayment(id: string, amountValue: string) {
    const amount = Math.max(0, safeNumber(amountValue));
    if (amount <= 0) {
      triggerHaptic("error");
      return;
    }

    setDebtRadarItems((current) =>
      current.map((item) => {
        if (item.id !== id || item.kind !== "debt") return item;

        const remainingBefore = Math.max(0, safeNumber(item.remainingAmount));
        const paid = Math.min(amount, remainingBefore > 0 ? remainingBefore : amount);
        const nextRemaining = Math.max(0, remainingBefore - paid);
        const paymentCurrency = item.remainingCurrency || item.currency || settings.currency;
        const entry: DebtPaymentEntry = {
          id: uid(),
          amount: paid,
          currency: paymentCurrency,
          createdAt: new Date().toISOString(),
          note: "Partial pay",
        };

        return normalizeDebtRadarItem({
          ...item,
          remainingAmount: String(nextRemaining),
          remainingCurrency: paymentCurrency,
          paymentHistory: [entry, ...(item.paymentHistory || [])],
        });
      })
    );

    triggerHaptic("success");
  }

  function markDebtFullPaid(id: string) {
    setDebtRadarItems((current) =>
      current.map((item) => {
        if (item.id !== id || item.kind !== "debt") return item;

        const remaining = Math.max(0, safeNumber(item.remainingAmount));
        const paymentCurrency = item.remainingCurrency || item.currency || settings.currency;
        const entry =
          remaining > 0
            ? {
                id: uid(),
                amount: remaining,
                currency: paymentCurrency,
                createdAt: new Date().toISOString(),
                note: "Full pay",
              } satisfies DebtPaymentEntry
            : null;

        return normalizeDebtRadarItem({
          ...item,
          remainingAmount: "0",
          remainingCurrency: paymentCurrency,
          paymentHistory: entry ? [entry, ...(item.paymentHistory || [])] : item.paymentHistory || [],
        });
      })
    );

    triggerHaptic("success");
  }

  function removeDebtRadarItem(id: string) {
    setDebtRadarItems((current) =>
      current.length <= 1 ? current : current.filter((item) => item.id !== id)
    );
  }

  return (
    <div className="screen rewards-screen">
      <Header title="Rewards" showBack rightIcon={A.help} onBack={onBack} onRight={onHelp} />

      <RewardsLaunchOverviewCard
        status={activeProofStatus}
        settings={settings}
        onTrackLeak={openDailyRoutineFromRewards}
        onOpenProfile={onOpenProfile}
      />

      <details className="clean-details rewards-core-details">
        <summary>
          <div>
            <span>Today’s proof</span>
            <small>Only full Daily Routine completion protects the streak.</small>
          </div>
          <b>{activeProofStatus.activeToday ? "Protected" : activeProofStatus.recoveryAvailable ? "Recovery" : "Open"}</b>
        </summary>
        <RewardsStatusHero
          status={activeProofStatus}
          settings={settings}
          onOpenDailyRoutine={openDailyRoutineFromRewards}
        />
        <DailyProofChecklist
          status={activeProofStatus}
          onOpenDailyRoutine={openDailyRoutineFromRewards}
        />
      </details>

      <details className="clean-details rewards-core-details">
        <summary>
          <div>
            <span>Streak & recovery</span>
            <small>7+ Daily Routine days must stay live.</small>
          </div>
          <b>{activeProofStatus.currentStreak}d</b>
        </summary>
        <ActiveStreakProofCard
          status={activeProofStatus}
          onOpenDailyRoutine={openDailyRoutineFromRewards}
        />
      </details>

      <details className="clean-details rewards-core-details">
        <summary>
          <div>
            <span>Future Holder Rewards</span>
            <small>100K+ hold, wallet proof, 7+ Daily Routine days.</small>
          </div>
          <b>{rewardFoundationReady ? "Ready" : "Prep"}</b>
        </summary>
        <section className="rewards-hub-grid rewards-readiness-grid">
          <article className={rewardFoundationReady ? "ready" : "building"}>
            <span>Reward foundation</span>
            <strong>{rewardFoundationReady ? "Ready" : "Building"}</strong>
            <small>Verified wallet + 100K+ $BROKE + live 7+ Daily Routine streak.</small>
          </article>
          <article>
            <span>Reward share</span>
            <strong>{holderHasVerifiedBalance ? "Balance based" : walletVerified ? "No balance" : "Verify first"}</strong>
            <small>{holderRewardWeight}</small>
          </article>
          <article>
            <span>Today proof</span>
            <strong>{activeProofStatus.activeToday ? "Protected" : activeProofStatus.recoveryMode ? "Recovery" : "Needs action"}</strong>
            <small>{activeProofStatus.activeToday ? "Daily Routine completed." : "Daily Routine not completed yet."}</small>
          </article>
          <article>
            <span>Recovery</span>
            <strong>{activeProofStatus.recoveryAvailable ? "Available" : activeProofStatus.recoveryUsedRecently ? "Used" : "Ready"}</strong>
            <small>Recovery also requires today’s full Daily Routine.</small>
          </article>
        </section>

        <FutureRewardsExplainerCard />

        <RewardSnapshotLedgerCard
          settings={settings}
          status={activeProofStatus}
        />

        <section className="future-reward-pool-card">
          <div>
            <span>Creator Fee Reward Pool</span>
            <strong>Coming later after volume trigger</strong>
            <p>
              Planned: after the volume trigger, up to 50% of Creator Fee may go to eligible verified holders. Split is based on each holder’s eligible $BROKE balance share at snapshot time.
            </p>
          </div>
          <b>Locked</b>
        </section>

        <section className="reward-eligibility-checklist">
          {rewardChecklist.map((item) => (
            <article key={item.label} className={item.done ? "done" : "pending"}>
              <b>{item.done ? "✓" : "—"}</b>
              <div>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </div>
            </article>
          ))}
        </section>
      </details>

      <details className="clean-details rewards-core-details">
        <summary>
          <div>
            <span>Share Active Streak Card</span>
            <small>Public proof card without income, balance, payday, or debt details.</small>
          </div>
          <b>Share</b>
        </summary>
        <ActiveStreakShareCard
          settings={settings}
          status={activeProofStatus}
          shareInitData={shareInitData}
        />
      </details>

      <details className="clean-details rewards-core-details">
        <summary>
          <div>
            <span>Notifications prep</span>
            <small>Local reminder settings for future alerts.</small>
          </div>
          <b>{rewardNotificationPrefs.reminderTime}</b>
        </summary>
        <RewardsNotificationPrepCard
          status={activeProofStatus}
          prefs={rewardNotificationPrefs}
          onChange={setRewardNotificationPrefs}
        />
      </details>

      <details className="clean-details rewards-tool-details rewards-survival-details">
        <summary>
          <div>
            <span>Survival Mode</span>
            <small>Check pressure before payday and export a safe Survival card.</small>
          </div>
          <b>{survivalForecast.statusLabel}</b>
        </summary>
        <SurvivalModePanel
          settings={settings}
          forecast={survivalForecast}
          exchangeRates={debtRadarRateState.rates}
          adjustedDailyPace={survivalAdjustedPace}
          daysSaved={survivalDaysSaved}
          totalMonthlySavings={totalMonthlySavings}
          nextPaydayDate={settings.survival.nextPaydayDate || survivalForecast.nextPaydayDate}
          onPaydayDateChange={updateSurvivalPaydayDate}
          shareCardRef={survivalCardRef}
          sharing={survivalSharing}
          onShare={shareSurvivalCard}
        />
      </details>

      <details className="clean-details rewards-tool-details debt-radar-details">
        <summary>
          <div>
            <span>Debt & Bills Radar</span>
            <small>Find the ultimate silent leak before daily spending starts.</small>
          </div>
          <b>{money(debtRadarTotals.totalMonthly, settings.currency)}/mo</b>
        </summary>
        <DebtBillsRadarPanel
          items={debtRadarItems}
          totals={debtRadarTotals}
          settings={settings}
          exchangeRates={debtRadarRateState.rates}
          onUpdateItem={updateDebtRadarItem}
          onAddItem={addDebtRadarItem}
          onRemoveItem={removeDebtRadarItem}
          onAddPayment={addDebtPayment}
          onMarkFullPaid={markDebtFullPaid}
        />
      </details>

      <details className="clean-details rewards-tool-details home-habit-leaks-details">
        <summary>
          <div>
            <span>Home Habit Leaks</span>
            <small>Track household drains before exact bill math.</small>
          </div>
          <b>{homeHabitLeakInsight.weeklyCount}/week</b>
        </summary>
        <HomeHabitLeaksPanel
          items={homeHabitLeaks}
          insight={homeHabitLeakInsight}
          onLogLeak={logHomeHabitLeak}
          onRemoveLeak={removeHomeHabitLeak}
        />
      </details>

      {!hasRealData && (
        <section className="v58-empty-card v58-save-empty">
          <div className="v58-empty-head">
            <img src={A.whatIfFrog} alt="" />
            <div>
              <span>Rewards tools are in demo mode</span>
              <strong>No real leak-cut scenarios yet.</strong>
              <p>
                Add expenses first. Then $BROKE will connect Rewards, streak proof,
                survival pressure, and real leak cuts.
              </p>
            </div>
          </div>
          <button type="button" className="v58-empty-primary" onClick={onOpenAdd}>
            Add expense to unlock Rewards
          </button>
        </section>
      )}

      <PatternChallengeCoachCard
        recommendation={patternChallengeRecommendation}
        activeChallenge={activeChallenge}
        progress={challengeProgress}
        loading={challengeLoading}
        currency={settings.currency}
        onStartChallenge={onStartChallenge}
        onOpenAdd={onOpenAdd}
      />

      <details ref={challengeSectionRef} className="clean-details rewards-tool-details" open={Boolean(activeChallenge || challengeProgress)}>
        <summary>
          <div>
            <span>Challenges</span>
            <small>Pick a leak-control mission when you are ready.</small>
          </div>
          <b>{activeChallenge ? "Active" : "Choose"}</b>
        </summary>
        <ChallengesPanel
          templates={challengeTemplates.length ? challengeTemplates : defaultChallengeTemplates}
          activeChallenge={activeChallenge}
          progress={challengeProgress}
          loading={challengeLoading}
          currency={settings.currency}
          onStartChallenge={onStartChallenge}
        />
      </details>

      <details className="clean-details rewards-tool-details">
        <summary>
          <div>
            <span>Public Leaderboard</span>
            <small>Only public progress. No income or balance exposed.</small>
          </div>
          <b>Optional</b>
        </summary>
        <LeaderboardPanel
          leaderboard={leaderboard}
          loading={leaderboardLoading}
          onToggleLeaderboard={onToggleLeaderboard}
        />
      </details>

      <details className="clean-details rewards-tool-details">
        <summary>
          <div>
            <span>Leak Cut Scenarios</span>
            <small>Test what changes if you reduce one real leak.</small>
          </div>
          <b>{cards.length} ideas</b>
        </summary>
        <section className="whatif-list">
        {cards.map((item) => {
          const reduction = reductions[item.category] ?? defaultReduction(item.category);
          const monthlySave = item.amount * reduction;
          const hpBonus = clamp(Math.round((monthlySave / 25) * 2), 2, 24);

          return (
            <div className="whatif-card dynamic" key={item.category}>
              <img src={item.icon} alt="" />

              <div>
                <strong>
                  {reduction === 1
                    ? `Cut ${item.category}`
                    : `Reduce ${item.category}`}
                </strong>
                <span>
                  {hasRealData
                    ? `${item.count} tracked · ${Math.round(reduction * 100)}% reduction`
                    : `${Math.round(reduction * 100)}% demo reduction`}
                </span>

                <b>
                  {money(monthlySave, settings.currency)}
                  <small>/month</small>
                </b>
                <em>{money(monthlySave * 12, settings.currency)}/year</em>

                <div className="reduction-row">
                  {[0.25, 0.5, 1].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={reduction === value ? "active" : ""}
                      onClick={() => setReduction(item.category, value)}
                    >
                      {Math.round(value * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              <aside>
                <strong>+{hpBonus}</strong>
                <span>Wallet HP</span>
              </aside>
            </div>
          );
        })}
      </section>
      </details>

      <section className="savings-card">
        <img src={A.walletMascot} alt="" />
        <div>
          <span>Yearly leak reduction</span>
          <strong>{money(totalMonthlySavings * 12, settings.currency)}</strong>
          <small>/year</small>
        </div>
        <aside>
          <b>+{clamp(Math.round(totalMonthlySavings / 20), 3, 30)}</b>
          <span>Wallet HP</span>
        </aside>
      </section>
    </div>
  );
}

function AdminPanelModal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-label="Private admin panel">
      <div className="admin-modal-shell">
        <div className="admin-modal-head">
          <div>
            <span>Rewards admin</span>
            <strong>Legitimate holders + distribution</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
          >
            Close
          </button>
        </div>
        <div className="admin-modal-scroll">{children}</div>
      </div>
    </div>
  );
}


function AdminTreasuryPanel({
  access,
  wallet,
  activeProofStatus,
}: {
  access: AdminAccessState;
  wallet: WalletLinkSettings;
  activeProofStatus: ActiveStreakProofStatus;
}) {
  const [adminReadKey, setAdminReadKey] = useState("");
  const [holderIntel, setHolderIntel] = useState<AdminHoldersResponse | null>(null);
  const [holderIntelLoading, setHolderIntelLoading] = useState(false);
  const [holderIntelError, setHolderIntelError] = useState("");
  const [rewardPoolAmount, setRewardPoolAmount] = useState("");
  const [rewardPoolToken, setRewardPoolToken] = useState("$BROKE");
  const [distributionMessage, setDistributionMessage] = useState("");
  const [distributionSaving, setDistributionSaving] = useState(false);
  const [distributionRecord, setDistributionRecord] = useState<AdminDistributionSaveResponse["distribution"] | null>(null);
  const [distributionMode, setDistributionMode] = useState<"test" | "real_manual">("test");
  const [realDistributionConfirm, setRealDistributionConfirm] = useState("");
  const [manualSignatureText, setManualSignatureText] = useState("");
  const [manualSignatureSaving, setManualSignatureSaving] = useState(false);
  const [sendQueueMessage, setSendQueueMessage] = useState("");
  const [batchSending, setBatchSending] = useState(false);
  const [batchSenderProgress, setBatchSenderProgress] = useState("");
  const [serverAutoSending, setServerAutoSending] = useState(false);
  const [serverAutoConfirm, setServerAutoConfirm] = useState("");
  const [adminEmbeddedView, setAdminEmbeddedView] = useState(false);
  const [eligibilityMinHold, setEligibilityMinHold] = useState("100000");
  const [eligibilityMinStreak, setEligibilityMinStreak] = useState("7");
  const [distributionSmokeStatus, setDistributionSmokeStatus] = useState<AdminDistributionSmokeStatus>("idle");
  const [distributionSmokeMessage, setDistributionSmokeMessage] = useState("");
  const [distributionSmokeCheckedAt, setDistributionSmokeCheckedAt] = useState("");

  useEffect(() => {
    setAdminEmbeddedView(isEmbeddedAppView());
  }, []);

  const treasuryStatus = !access.treasuryConfigured
    ? "Treasury address not configured"
    : access.treasuryMatched
      ? "Treasury matched"
      : access.connectedWallet
        ? "Different wallet connected"
        : "Connect treasury wallet";
  const treasuryDetail = !access.treasuryConfigured
    ? "Set NEXT_PUBLIC_TREASURY_WALLET_ADDRESS in Vercel to show the expected treasury address here."
    : access.treasuryMatched
      ? "This verified wallet matches the configured treasury address."
      : access.connectedWallet
        ? "Admin panel is visible, but future payout signing should require the configured treasury wallet."
        : "Admin panel is visible by Telegram/admin access. Connect and verify the treasury wallet before future payout signing.";
  const readinessItems = [
    { label: "Panel visibility", value: "Admin only", detail: `Unlocked by ${access.sourceLabel}.` },
    { label: "Treasury status", value: treasuryStatus, detail: treasuryDetail },
    { label: "Connected wallet", value: access.connectedWallet ? compactWalletAddress(access.connectedWallet) : "Not connected", detail: wallet.isVerified ? "Verified message signature proof." : "Wallet must be verified before it can be treated as treasury-ready." },
    { label: "Reward payouts", value: "Beta payout wallet", detail: "Admin-only distribution can use the dedicated payout wallet when BROKE_PAYOUT_AUTO_SEND_ENABLED is enabled. Main treasury seed is never used here." },
  ];

  async function loadHolderIntel() {
    const key = adminReadKey.trim();

    if (!key) {
      setHolderIntel(null);
      setHolderIntelError("Enter the Admin key first.");
      setDistributionMessage("");
      return;
    }

    setHolderIntelLoading(true);
    setHolderIntelError("");
    setDistributionMessage("");
    setDistributionRecord(null);
    setManualSignatureText("");

    try {
      const params = new URLSearchParams({
        minHold: eligibilityMinHold.trim() || "100000",
        minStreak: eligibilityMinStreak.trim() || "7",
      });
      const response = await fetch(`/api/admin/holders?${params.toString()}`, {
        method: "GET",
        headers: key ? { Authorization: `Bearer ${key}` } : undefined,
        cache: "no-store",
      });
      const data = (await response.json()) as AdminHoldersResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Could not load holder intelligence.");
      }

      setHolderIntel(data);
      const loadedCount = data.summary?.totalEligibleHolders ?? (data.eligiblePayoutCandidates || data.topLegitimateHolders || []).length;
      setDistributionMessage(`Preview loaded: ${loadedCount} eligible holder(s). Nothing has been sent yet.`);
    } catch (error) {
      setHolderIntel(null);
      setHolderIntelError(error instanceof Error ? error.message : "Could not load holder intelligence.");
    } finally {
      setHolderIntelLoading(false);
    }
  }

  async function runDistributionSmokeCheck() {
    const key = adminReadKey.trim();

    if (!key) {
      setDistributionSmokeStatus("failed");
      setDistributionSmokeMessage("Enter the Admin key first, then run smoke-check.");
      return;
    }

    setDistributionSmokeStatus("checking");
    setDistributionSmokeMessage("Running Admin distribution smoke-check...");
    setDistributionSmokeCheckedAt("");

    try {
      const response = await fetch("/api/admin/distributions?smoke=1", {
        method: "GET",
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      const data = (await response.json()) as AdminDistributionSmokeResponse;

      if (!response.ok || !data.ok || !data.smoke?.ok) {
        const failed = typeof data.smoke?.failed === "number" ? ` Failed checks: ${data.smoke.failed}.` : "";
        throw new Error(`${data.error || "Smoke-check failed."}${failed}`);
      }

      setDistributionSmokeStatus("passed");
      setDistributionSmokeCheckedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDistributionSmokeMessage(`Smoke-check passed: ${data.smoke.passed}/${data.smoke.total} checks · build ${data.buildVersion || BROKE_APP_BUILD_VERSION}.`);
      triggerHaptic("success");
    } catch (error) {
      setDistributionSmokeStatus("failed");
      setDistributionSmokeMessage(error instanceof Error ? error.message : "Smoke-check failed.");
      triggerHaptic("error");
    }
  }

  const rewardPoolValue = Number(rewardPoolAmount.replace(",", "."));
  const eligiblePayoutCandidates = holderIntel?.eligiblePayoutCandidates || holderIntel?.topLegitimateHolders || [];
  const payoutRows = calculateAdminPayoutRows(eligiblePayoutCandidates, rewardPoolValue);
  const payoutTotal = payoutRows.reduce((total, row) => total + row.rewardAmount, 0);
  const payoutPreviewReady = payoutRows.length > 0 && rewardPoolValue > 0;
  const distributionSmokePassed = distributionSmokeStatus === "passed";
  const safetyRecipientCount = payoutRows.length || eligiblePayoutCandidates.length;
  const safetyBlockedReason = !adminReadKey.trim()
    ? "Enter Admin key."
    : !distributionSmokePassed
      ? "Run smoke-check first."
      : !holderIntel
        ? "Press Check eligible first."
        : !Number.isFinite(rewardPoolValue) || rewardPoolValue <= 0
          ? "Enter a valid reward amount."
          : payoutRows.filter((row) => row.rewardAmount > 0).length === 0
            ? "No payout rows for the current rules and amount."
            : "";
  const safetySummaryItems = [
    {
      label: "Smoke",
      value: distributionSmokeStatus === "passed" ? "Passed" : distributionSmokeStatus === "checking" ? "Checking" : distributionSmokeStatus === "failed" ? "Failed" : "Not run",
      detail: distributionSmokeCheckedAt ? `Last check ${distributionSmokeCheckedAt}` : "Required before Distribute rewards unlocks.",
    },
    {
      label: "Recipients",
      value: safetyRecipientCount > 0 ? `${safetyRecipientCount}` : "—",
      detail: holderIntel ? "Loaded from legitimate holder preview." : "Press Check eligible to load recipients.",
    },
    {
      label: "Pool",
      value: rewardPoolValue > 0 ? formatRewardTokenAmount(rewardPoolValue, rewardPoolToken) : "—",
      detail: `Calculated payout total: ${payoutTotal > 0 ? formatRewardTokenAmount(payoutTotal, rewardPoolToken) : "—"}.`,
    },
    {
      label: "Rules",
      value: `${eligibilityMinHold || "0"}+ hold · ${eligibilityMinStreak || "0"}+ streak`,
      detail: "Current Admin eligibility filters for this preview.",
    },
    {
      label: "Mode",
      value: "Server payout wallet",
      detail: "Dedicated payout wallet only. Main treasury seed is not used here.",
    },
  ];
  const realDistributionConfirmPhrase = REAL_DISTRIBUTION_CONFIRM_PHRASE;
  const realDistributionReady = distributionMode === "real_manual" && payoutPreviewReady && access.treasuryMatched && realDistributionConfirm.trim() === realDistributionConfirmPhrase;

  function buildPayoutPaymentLink(row: { walletAddress: string; rewardAmount: number; rank: number }) {
    return buildAdminPayoutPaymentLink({
      row,
      rewardPoolToken,
      distributionId: distributionRecord?.id,
    });
  }

  async function copyPayoutText(text: string, successMessage: string) {
    try {
      await navigator.clipboard?.writeText(text);
      setSendQueueMessage(successMessage);
      triggerHaptic("success");
    } catch {
      setSendQueueMessage("Copy was blocked by the browser. Long-press the text/link and copy manually.");
      triggerHaptic("error");
    }
  }

  function openPayoutPayment(row: { walletAddress: string; rewardAmount: number; rank: number }) {
    const paymentLink = buildPayoutPaymentLink(row);
    setSendQueueMessage(`Opening wallet payment for rank #${row.rank}. Confirm inside your treasury wallet, then paste the tx signature below.`);
    triggerHaptic("light");
    openExternalUrl(paymentLink);
  }

  function copySinglePayoutPayment(row: { walletAddress: string; rewardAmount: number; rank: number; balanceSharePercent: number }) {
    const paymentLink = buildPayoutPaymentLink(row);
    const text = [
      `rank: ${row.rank}`,
      `wallet: ${row.walletAddress}`,
      `amount: ${row.rewardAmount} ${rewardPoolToken}`,
      `share: ${row.balanceSharePercent}%`,
      `payment: ${paymentLink}`,
    ].join("\n");

    void copyPayoutText(text, `Payout row #${row.rank} copied.`);
  }

  function copyAllPayoutPaymentLinks() {
    if (payoutRows.length === 0) {
      setSendQueueMessage("No payout rows to copy yet.");
      return;
    }

    void copyPayoutText(
      buildAdminPayoutPaymentLinksCsv({
        rows: payoutRows,
        rewardPoolToken,
        distributionId: distributionRecord?.id,
      }),
      `Copied ${payoutRows.length} wallet payment link(s).`
    );
  }

  function buildDistributionManifestFromRows(
    mode: "test" | "real_manual",
    rows: Array<AdminLegitimateHolderRow & { rewardAmount: number }>,
    poolValue: number
  ) {
    return buildAdminDistributionManifest({
      mode,
      rows,
      poolValue,
      rewardPoolToken,
      treasuryWallet: access.treasuryWallet,
      connectedWallet: access.connectedWallet,
      confirmRealDistribution: realDistributionConfirmPhrase,
      minHold: Number(eligibilityMinHold.replace(",", ".")) || 0,
      minStreak: Number(eligibilityMinStreak) || 0,
    });
  }

  function buildDistributionManifest(mode: "test" | "real_manual" = distributionMode) {
    return buildDistributionManifestFromRows(mode, payoutRows, rewardPoolValue);
  }

  function buildDistributionSendSheet() {
    return buildAdminDistributionSendSheet(payoutRows, rewardPoolToken);
  }

  function prepareDistributionDraft() {
    if (!payoutPreviewReady) {
      setDistributionMessage("Load legitimate holders and enter a reward pool amount first.");
      return;
    }

    const payload = distributionMode === "real_manual" ? buildDistributionSendSheet() : JSON.stringify(buildDistributionManifest("test"), null, 2);

    try {
      void navigator.clipboard?.writeText(payload);
      setDistributionMessage(
        distributionMode === "real_manual"
          ? `Manual send sheet copied for ${payoutRows.length} holders. Paste it into your payout workflow; no tokens were sent by the app.`
          : `Distribution test manifest copied for ${payoutRows.length} holders. No tokens were sent.`
      );
    } catch {
      setDistributionMessage(
        distributionMode === "real_manual"
          ? `Manual send sheet prepared for ${payoutRows.length} holders. No tokens were sent by the app.`
          : `Distribution test manifest prepared for ${payoutRows.length} holders. No tokens were sent.`
      );
    }
  }

  async function saveDistributionBatch(mode: "test" | "real_manual") {
    if (!payoutPreviewReady) {
      setDistributionMessage("Load legitimate holders and enter a reward pool amount first.");
      return;
    }

    if (mode === "real_manual" && !realDistributionReady) {
      setDistributionMessage(
        !access.treasuryMatched
          ? "Connect and verify the configured treasury wallet before preparing a real distribution."
          : `Type ${realDistributionConfirmPhrase} to unlock real distribution preparation.`
      );
      return;
    }

    setDistributionSaving(true);
    setDistributionMessage("");

    try {
      const key = adminReadKey.trim();
      const response = await fetch("/api/admin/distributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(key ? { Authorization: `Bearer ${key}` } : {}),
        },
        body: JSON.stringify(buildDistributionManifest(mode)),
      });
      const data = (await response.json()) as AdminDistributionSaveResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Could not save distribution batch.");
      }

      setDistributionRecord(data.distribution || null);
      setSendQueueMessage("");
      setDistributionMessage(
        mode === "real_manual"
          ? `Real distribution prepared for ${data.distribution?.recipientCount || payoutRows.length} recipients. Use the payout queue below to open wallet payment links, then paste tx signatures.`
          : `Test batch saved for ${data.distribution?.recipientCount || payoutRows.length} recipients. Manual payouts still need wallet confirmation outside this button.`
      );
    } catch (error) {
      setDistributionRecord(null);
      setDistributionMessage(error instanceof Error ? error.message : "Could not save distribution batch.");
    } finally {
      setDistributionSaving(false);
    }
  }

  async function recordManualSendSignatures() {
    if (!distributionRecord?.id) {
      setDistributionMessage("Prepare or save a distribution batch first.");
      return;
    }

    if (!manualSignatureText.trim()) {
      setDistributionMessage("Paste rank/signature or wallet/signature rows first.");
      return;
    }

    setManualSignatureSaving(true);
    setDistributionMessage("");

    try {
      const key = adminReadKey.trim();
      const response = await fetch("/api/admin/distributions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(key ? { Authorization: `Bearer ${key}` } : {}),
        },
        body: JSON.stringify({
          action: "record_manual_sends",
          distributionId: distributionRecord.id,
          signaturesText: manualSignatureText,
        }),
      });
      const data = (await response.json()) as AdminDistributionUpdateResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Could not record manual send signatures.");
      }

      setDistributionRecord((prev) => prev ? { ...prev, status: data.status || prev.status } : prev);
      setDistributionMessage(
        `Recorded ${data.updated || 0} tx signature(s). Sent ${data.sentCount || 0}/${data.totalCount || 0}. Status: ${data.status || "prepared"}.`
      );
    } catch (error) {
      setDistributionMessage(error instanceof Error ? error.message : "Could not record manual send signatures.");
    } finally {
      setManualSignatureSaving(false);
    }
  }

  async function recordBatchSendSignatures(records: Array<{ rank: number; walletAddress: string; txSignature: string }>) {
    if (!distributionRecord?.id || records.length === 0) return;

    const key = adminReadKey.trim();
    const response = await fetch("/api/admin/distributions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({
        action: "record_manual_sends",
        distributionId: distributionRecord.id,
        records,
      }),
    });
    const data = (await response.json()) as AdminDistributionUpdateResponse;

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Batch sent, but ledger signature recording failed.");
    }

    setDistributionRecord((prev) => prev ? { ...prev, status: data.status || prev.status } : prev);
  }


  async function sendAllWithTreasuryWallet() {
    if (!distributionRecord?.id || distributionRecord.mode !== "real_manual") {
      setSendQueueMessage("Prepare a real distribution batch first.");
      return;
    }

    if (!access.treasuryMatched || !access.treasuryWallet) {
      setSendQueueMessage("Connect and verify the configured treasury wallet first.");
      return;
    }

    if (payoutRows.length === 0) {
      setSendQueueMessage("No payout rows to send.");
      return;
    }

    if (isEmbeddedAppView()) {
      setAdminEmbeddedView(true);
      setSendQueueMessage("Batch wallet signing is blocked inside the embedded/site preview. Open the app as a full standalone tab, then press Send all with treasury wallet again.");
      triggerHaptic("error");
      return;
    }

    setBatchSending(true);
    setBatchSenderProgress("Opening treasury wallet signer...");
    setSendQueueMessage("");

    try {
      const signer = await adminGetWalletStandardSigner(access.treasuryWallet);
      const transactions = await buildAdminBatchTransactions({
        rows: payoutRows,
        treasuryWallet: access.treasuryWallet,
        rewardPoolToken,
        onProgress: setBatchSenderProgress,
      });
      const sentRecords: Array<{ rank: number; walletAddress: string; txSignature: string }> = [];

      for (let index = 0; index < transactions.length; index += 1) {
        const item = transactions[index];
        setBatchSenderProgress(`Treasury signing transaction ${index + 1}/${transactions.length} for ${item.rows.length} recipient(s)...`);
        const txSignature = await adminSignAndSendSerializedTransaction(signer, item.transaction);
        item.rows.forEach((row) => {
          sentRecords.push({ rank: row.rank, walletAddress: row.walletAddress, txSignature });
        });

        await recordBatchSendSignatures(sentRecords.slice(-item.rows.length));
      }

      setManualSignatureText(sentRecords.map((record) => `${record.rank},${record.txSignature}`).join("\n"));
      setBatchSenderProgress("");
      setSendQueueMessage(`Batch sender completed ${sentRecords.length}/${payoutRows.length} recipient(s). Ledger was updated automatically.`);
      triggerHaptic("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Treasury batch sender failed.";
      const cleanMessage = /access forbidden/i.test(message)
        ? "Wallet blocked batch signing in this browser. Use the full standalone app tab, not the embedded site preview. On desktop, open the app directly in Chrome with Phantom/Solflare extension connected, then try Send all again."
        : message;
      setSendQueueMessage(`${cleanMessage} Payment links and manual tx paste remain as fallback.`);
      setBatchSenderProgress("");
      triggerHaptic("error");
    } finally {
      setBatchSending(false);
    }
  }

  async function sendAllWithPayoutWalletServer() {
    if (!distributionRecord?.id || distributionRecord.mode !== "real_manual") {
      setSendQueueMessage("Prepare a real distribution batch first.");
      return;
    }

    if (!adminReadKey.trim()) {
      setSendQueueMessage("Enter the Admin read key first. Server auto-send is admin-secret protected.");
      return;
    }

    if (serverAutoConfirm.trim() !== SERVER_AUTO_SEND_CONFIRM_PHRASE) {
      setSendQueueMessage(`Type ${SERVER_AUTO_SEND_CONFIRM_PHRASE} to unlock dedicated payout wallet auto-send.`);
      return;
    }

    setServerAutoSending(true);
    setBatchSenderProgress("Server payout wallet is sending prepared rows...");
    setSendQueueMessage("");

    try {
      const response = await fetch("/api/admin/distributions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminReadKey.trim()}`,
        },
        body: JSON.stringify({
          action: "server_auto_send",
          distributionId: distributionRecord.id,
          confirmPhrase: SERVER_AUTO_SEND_CONFIRM_PHRASE,
        }),
      });
      const data = (await response.json()) as AdminDistributionUpdateResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Server auto-send failed.");
      }

      setDistributionRecord((prev) => prev ? { ...prev, status: data.status || prev.status } : prev);
      const signatureRows = (data.records || []).map((record) => `${record.rank},${record.txSignature}`);
      if (signatureRows.length > 0) setManualSignatureText(signatureRows.join("\n"));
      setBatchSenderProgress("");
      setSendQueueMessage(
        `Server auto-send completed ${data.updated || 0} recipient(s) from ${data.payoutWallet ? compactWalletAddress(data.payoutWallet) : "payout wallet"}. Sent ${data.sentCount || 0}/${data.totalCount || 0}. Status: ${data.status || "prepared"}.`
      );
      triggerHaptic("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server auto-send failed.";
      setBatchSenderProgress("");
      setSendQueueMessage(`${message} Fund/configure the dedicated payout wallet or use payment links as fallback.`);
      triggerHaptic("error");
    } finally {
      setServerAutoSending(false);
    }
  }


  async function distributeRewardsOneClick() {
    const key = adminReadKey.trim();
    const poolValue = Number(rewardPoolAmount.replace(",", "."));

    if (!key) {
      setDistributionMessage("Enter the Admin read key first.");
      return;
    }

    if (!distributionSmokePassed) {
      setDistributionMessage("Run the Admin distribution smoke-check first. Real distribution stays locked until smoke-check passes.");
      return;
    }

    if (!Number.isFinite(poolValue) || poolValue <= 0) {
      setDistributionMessage("Enter the amount to distribute first.");
      return;
    }

    if (!holderIntel) {
      setDistributionMessage("Press Check eligible first, review the recipient list, then distribute.");
      return;
    }

    const rows = payoutRows.filter((row) => row.rewardAmount > 0);

    if (rows.length === 0) {
      setDistributionMessage("No legitimate recipients for the current rules and amount. Press Check eligible again or change the rules.");
      return;
    }

    setDistributionSaving(true);
    setServerAutoSending(true);
    setHolderIntelError("");
    setDistributionMessage("");
    setSendQueueMessage("");
    setBatchSenderProgress(`Preparing distribution for ${rows.length} recipient(s)...`);

    try {
      setDistributionMode("real_manual");
      setRealDistributionConfirm(realDistributionConfirmPhrase);
      setServerAutoConfirm(SERVER_AUTO_SEND_CONFIRM_PHRASE);

      const manifest = {
        ...buildDistributionManifestFromRows("real_manual", rows, poolValue),
        serverAutoSend: true,
        serverAutoConfirm: SERVER_AUTO_SEND_CONFIRM_PHRASE,
      };

      const saveResponse = await fetch("/api/admin/distributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(manifest),
      });
      const saveData = (await saveResponse.json()) as AdminDistributionSaveResponse;

      if (!saveResponse.ok || !saveData.ok || !saveData.distribution?.id) {
        throw new Error(saveData.error || "Could not distribute rewards.");
      }

      setDistributionRecord(saveData.distribution);
      const signatureRows = (saveData.records || saveData.autoSend?.records || []).map((record) => `${record.rank},${record.txSignature}`);
      setManualSignatureText(signatureRows.join("\n"));
      setBatchSenderProgress("");
      setDistributionMessage(`Done. Sent ${saveData.sentCount || saveData.updated || saveData.autoSend?.sentCount || saveData.autoSend?.updated || 0}/${saveData.totalCount || saveData.autoSend?.totalCount || rows.length} payout(s).`);
      triggerHaptic("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Distribution failed.";
      const cleanMessage = message.includes("BROKE_PAYOUT_AUTO_SEND_ENABLED")
        ? "Auto-send is not enabled in Vercel. Set BROKE_PAYOUT_AUTO_SEND_ENABLED=true and configure the payout wallet."
        : message.includes("BROKE_PAYOUT_WALLET_SECRET_KEY")
          ? "Payout wallet is not configured in Vercel. Add BROKE_PAYOUT_WALLET_SECRET_KEY for a separate funded payout wallet."
          : message;
      setBatchSenderProgress("");
      setDistributionMessage(cleanMessage);
      triggerHaptic("error");
    } finally {
      setHolderIntelLoading(false);
      setDistributionSaving(false);
      setServerAutoSending(false);
    }
  }


  return (
    <section className="admin-clean-panel">
      <div className="admin-clean-hero">
        <div>
          <span>Private admin</span>
          <strong>Reward distribution</strong>
          <small>Build {BROKE_APP_BUILD_VERSION} · {BROKE_APP_BUILD_NOTE} Check eligible first, review recipients, then distribute.</small>
        </div>
        <b>{access.sourceLabel}</b>
      </div>

      <label className="admin-clean-secret">
        <span>Admin key</span>
        <input
          type="password"
          value={adminReadKey}
          onChange={(event) => {
            setAdminReadKey(event.target.value);
            setDistributionSmokeStatus("idle");
            setDistributionSmokeMessage("");
            setDistributionSmokeCheckedAt("");
          }}
          placeholder="REWARDS_ADMIN_SECRET"
        />
      </label>

      <div className="admin-clean-grid">
        <label>
          <span>Minimum hold</span>
          <input
            inputMode="decimal"
            value={eligibilityMinHold}
            onChange={(event) => {
              setEligibilityMinHold(event.target.value.replace(/[^0-9.,]/g, ""));
              setHolderIntel(null);
              setDistributionMessage("");
            }}
            placeholder="100000"
          />
        </label>
        <label>
          <span>Minimum streak days</span>
          <small className="admin-field-help">7 means 7+ days. Users with 8, 9, 10+ remain eligible.</small>
          <input
            inputMode="numeric"
            value={eligibilityMinStreak}
            onChange={(event) => {
              setEligibilityMinStreak(event.target.value.replace(/[^0-9]/g, ""));
              setHolderIntel(null);
              setDistributionMessage("");
            }}
            placeholder="7"
          />
        </label>
        <label>
          <span>Token</span>
          <select value={rewardPoolToken} onChange={(event) => setRewardPoolToken(event.target.value)}>
            <option value="$BROKE">$BROKE</option>
          </select>
        </label>
        <label>
          <span>Amount</span>
          <input
            inputMode="decimal"
            value={rewardPoolAmount}
            onChange={(event) => setRewardPoolAmount(event.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="1000"
          />
        </label>
      </div>

      <div className={`admin-safety-panel ${distributionSmokeStatus === "passed" ? "passed" : distributionSmokeStatus === "failed" ? "failed" : ""}`}>
        <div className="admin-safety-head">
          <div>
            <span>Safety check</span>
            <strong>Smoke-check required before distribution</strong>
            <small>Runs the protected Admin distribution smoke path. It performs no Supabase writes and sends no tokens.</small>
          </div>
          <button
            type="button"
            onClick={runDistributionSmokeCheck}
            disabled={distributionSmokeStatus === "checking" || distributionSaving || serverAutoSending}
          >
            {distributionSmokeStatus === "checking" ? "Checking..." : distributionSmokePassed ? "Re-check" : "Run smoke-check"}
          </button>
        </div>

        {distributionSmokeMessage && <p className="admin-safety-message">{distributionSmokeMessage}</p>}

        <div className="admin-safety-grid">
          {safetySummaryItems.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
            </article>
          ))}
        </div>

        {safetyBlockedReason && (
          <div className="admin-safety-lock">
            Locked: {safetyBlockedReason}
          </div>
        )}
      </div>

      <div className="admin-clean-actions">
        <button
          type="button"
          className="admin-clean-preview-button"
          onClick={loadHolderIntel}
          disabled={holderIntelLoading || distributionSaving || serverAutoSending}
        >
          {holderIntelLoading ? "Checking..." : "Check eligible"}
        </button>
        <button
          type="button"
          className="admin-clean-distribute-button"
          onClick={distributeRewardsOneClick}
          disabled={distributionSaving || serverAutoSending || holderIntelLoading || Boolean(safetyBlockedReason)}
          title={safetyBlockedReason || "Distribute rewards"}
        >
          {distributionSaving || serverAutoSending ? "Distributing..." : "Distribute rewards"}
        </button>
      </div>

      {(batchSenderProgress || distributionMessage || holderIntelError) && (
        <div className={distributionMessage && /done|sent/i.test(distributionMessage) ? "admin-clean-status success" : "admin-clean-status"}>
          {batchSenderProgress || distributionMessage || holderIntelError}
        </div>
      )}

      <div className="admin-clean-summary">
        <article>
          <span>Eligible</span>
          <strong>{holderIntel?.summary ? holderIntel.summary.totalEligibleHolders : "—"}</strong>
        </article>
        <article>
          <span>Pool</span>
          <strong>{rewardPoolValue > 0 ? formatRewardTokenAmount(rewardPoolValue, rewardPoolToken) : "—"}</strong>
        </article>
        <article>
          <span>Status</span>
          <strong>{distributionRecord?.status || "Ready"}</strong>
        </article>
      </div>

      {holderIntel && (
        <div className="admin-clean-recipients">
          <div>
            <span>Recipients</span>
            <strong>{eligiblePayoutCandidates.length} legitimate holder(s) shown</strong>
          </div>
          {(payoutRows.length > 0 ? payoutRows : eligiblePayoutCandidates.map((holder) => ({ ...holder, rewardAmount: 0 }))).map((row) => (
            <article key={`${row.rank}-${row.telegramId}-${row.walletAddress}`}>
              <div>
                <b>#{row.rank} {row.username ? `@${row.username}` : row.displayName || compactWalletAddress(row.walletAddress)}</b>
                <small>{compactWalletAddress(row.walletAddress)} · {formatHolderPercent(row.balanceSharePercent)}</small>
              </div>
              <em>{row.rewardAmount > 0 ? formatRewardTokenAmount(row.rewardAmount, rewardPoolToken) : formatTokenAmount(row.verifiedBalance)}</em>
            </article>
          ))}
        </div>
      )}

      <p className="admin-clean-footnote">
        Uses the dedicated payout wallet configured in Vercel. Do not use the main treasury seed there; fund a separate payout wallet only with the intended distribution amount.
      </p>
    </section>
  );
}

function SettingsScreen({
  settings,
  setSettings,
  expenses,
  rawExpenses,
  currentMonthExpenses,
  exchangeRateStatus,
  exchangeRateError,
  exchangeRates,
  conversionSourceCount,
  onReset,
  onDeleteExpense,
  onRepairOldCurrency,
  telegram,
  webAuth,
  cloudStatus,
  cloudError,
  streak,
  activeProofStatus,
  badges,
  leaderboard,
  leaderboardLoading,
  onToggleLeaderboard,
  onBack,
  onHelp,
}: {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  expenses: Expense[];
  rawExpenses: Expense[];
  currentMonthExpenses: Expense[];
  exchangeRateStatus: ExchangeRateStatus;
  exchangeRateError: string;
  exchangeRates: ExchangeRateMap;
  conversionSourceCount: number;
  onReset: () => void;
  onDeleteExpense: (id: string) => void;
  onRepairOldCurrency: (currency: Currency, repairScope?: CurrencyRepairScope) => Promise<CurrencyRepairResult>;
  telegram: TelegramState;
  webAuth: WebAuthState;
  cloudStatus: CloudStatus;
  cloudError: string;
  streak: Streak;
  activeProofStatus: ActiveStreakProofStatus;
  badges: BadgeItem[];
  leaderboard: LeaderboardState | null;
  leaderboardLoading: boolean;
  onToggleLeaderboard: (nextValue: boolean) => void;
  onBack: () => void;
  onHelp: () => void;
}) {
  const displaySettings = useMemo(
    () => displaySettingsForMoney(settings, exchangeRates),
    [settings, exchangeRates]
  );
  const totalIncome = getTotalIncome(displaySettings);
  const fixedCosts = getFixedCosts(displaySettings);
  const monthSpent = sumTrackedExpenses(currentMonthExpenses);
  const categorySummaries = getCategorySummaries(currentMonthExpenses);
  const latestExpenses = expenses.slice(0, 8);
  const publicLeaderboard = Boolean(leaderboard?.me?.publicLeaderboard);
  const oldExpenseCount = rawExpenses.filter((expense) => !expense.currency).length;
  const [repairCurrency, setRepairCurrency] = useState<Currency>(settings.currency);
  const [repairScope, setRepairScope] = useState<CurrencyRepairScope>("missing");
  const [repairBusy, setRepairBusy] = useState(false);
  const [repairMessage, setRepairMessage] = useState("");
  const [profileShareCardOpen, setProfileShareCardOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [walletAddressDraft, setWalletAddressDraft] = useState(settings.wallet.walletAddress);
  const [walletChecking, setWalletChecking] = useState(false);
  const [walletVerifying, setWalletVerifying] = useState(false);
  const [walletMessage, setWalletMessage] = useState("");
  const [, setWalletProviderHelpOpen] = useState(false);
  const [walletProviderName, setWalletProviderName] = useState("Browser check pending");
  const [walletProviderDetected, setWalletProviderDetected] = useState(false);
  const [walletProviderOptions, setWalletProviderOptions] = useState<Array<{ id: string; label: string; ready: boolean }>>([]);
  const [selectedWalletProviderId, setSelectedWalletProviderId] = useState("");
  const [walletStatusRefreshing, setWalletStatusRefreshing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");
  const adminAccess = useMemo(
    () => getAdminAccessState(telegram, webAuth, settings),
    [telegram.user?.id, webAuth.user?.id, settings.wallet.walletAddress, settings.wallet.isVerified]
  );

  useEffect(() => {
    setRepairCurrency(settings.currency);
  }, [settings.currency]);

  useEffect(() => {
    setWalletAddressDraft(settings.wallet.walletAddress);
  }, [settings.wallet.walletAddress]);

  useEffect(() => {
    if (!settings.wallet.walletAddress) return;
    if (!telegram.isTelegram && !webAuth.user) return;

    void refreshWalletVerificationStatus(true);
  }, [settings.wallet.walletAddress, telegram.isTelegram, telegram.initData, webAuth.user?.id]);

  useEffect(() => {
    function syncWalletProviderState() {
      const providers = getDetectedSolanaWalletProviders();
      const detected = getDetectedSolanaWalletProvider();
      const options = providers.map((item) => ({ id: item.id, label: item.label, ready: item.ready }));

      setWalletProviderOptions(options);
      setWalletProviderName(detected.label);
      setWalletProviderDetected(detected.ready);

      if (!selectedWalletProviderId && detected.id) {
        setSelectedWalletProviderId(detected.id);
      } else if (selectedWalletProviderId && options.length > 0 && !options.some((item) => item.id === selectedWalletProviderId)) {
        setSelectedWalletProviderId(detected.id || options[0]?.id || "");
      }
    }

    syncWalletProviderState();
    const timers = [250, 850, 1600, 3000].map((delay) => window.setTimeout(syncWalletProviderState, delay));
    window.addEventListener("focus", syncWalletProviderState);
    window.addEventListener("visibilitychange", syncWalletProviderState);
    window.addEventListener("wallet-standard:register-wallet", syncWalletProviderState as EventListener);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("focus", syncWalletProviderState);
      window.removeEventListener("visibilitychange", syncWalletProviderState);
      window.removeEventListener("wallet-standard:register-wallet", syncWalletProviderState as EventListener);
    };
  }, [selectedWalletProviderId]);

  function incomeClarityNote(key: keyof Settings["income"]) {
    return settingsMoneyClarityNote(
      settings.income[key],
      settings.incomeCurrencies[key] || settings.currency,
      settings,
      exchangeRates
    );
  }

  function fixedCostClarityNote(key: keyof Settings["fixedCosts"]) {
    return settingsMoneyClarityNote(
      settings.fixedCosts[key],
      settings.fixedCostCurrencies[key] || settings.currency,
      settings,
      exchangeRates
    );
  }

  function settingsTotalClarityNote(label: string) {
    return settings.currencyMode === "convert"
      ? `${label} total uses converted display values. Field inputs show the stored/original currency and are not rewritten.`
      : `${label} total uses stored numbers. Display-only mode does not convert saved values.`;
  }

  function updateIncome(key: keyof Settings["income"], value: string) {
    setSettings((prev) => ({
      ...prev,
      income: {
        ...prev.income,
        [key]: safeNumber(value),
      },
      incomeCurrencies: {
        ...prev.incomeCurrencies,
        [key]: prev.currency,
      },
    }));
  }

  function updateFixedCost(key: keyof Settings["fixedCosts"], value: string) {
    setSettings((prev) => ({
      ...prev,
      fixedCosts: {
        ...prev.fixedCosts,
        [key]: safeNumber(value),
      },
      fixedCostCurrencies: {
        ...prev.fixedCostCurrencies,
        [key]: prev.currency,
      },
    }));
  }

  function updateSurvivalPaydayDate(value: string) {
    setSettings((prev) => ({
      ...prev,
      survival: {
        ...prev.survival,
        nextPaydayDate: value,
      },
    }));
  }

  function updatePublicProofMode(value: boolean) {
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        publicProofMode: value,
      },
    }));
  }

  function updateCategoryName(category: string, value: string) {
    setSettings((prev) => ({
      ...prev,
      categoryNames: {
        ...prev.categoryNames,
        [category]: value,
      },
    }));
  }

  function resetCategoryNames() {
    setSettings((prev) => ({
      ...prev,
      categoryNames: defaultCategoryNames,
    }));
  }

  const settingsWalletPressureBase = Math.max(totalIncome - fixedCosts, 1);
  const settingsTotalLeaks = sumLeakExpenses(currentMonthExpenses);
  const settingsWalletHp = clamp(
    100 - Math.round((settingsTotalLeaks / settingsWalletPressureBase) * 100),
    5,
    100
  );
  const settingsSurvivalScore = clamp(
    100 - Math.round((monthSpent / settingsWalletPressureBase) * 70),
    1,
    100
  );
  const settingsRealBalance = totalIncome - fixedCosts - monthSpent;
  const settingsStatusLabel = settingsWalletHp >= 80 ? "Stable" : settingsWalletHp >= 55 ? "Watch zone" : "Pressure";
  const telegramProfileUser = telegram.user || webAuth.user;
  const fallbackProfileName = telegramProfileUser?.username
    ? `@${telegramProfileUser.username}`
    : [telegramProfileUser?.first_name, telegramProfileUser?.last_name].filter(Boolean).join(" ") || "Broke survivor";
  const profileNickname = settings.identity.nickname.trim() || fallbackProfileName;
  const profileStatusText = settings.identity.statusText.trim() || "Broke, but self-aware";
  const profileAvatarOptions: Array<{ id: Settings["identity"]["avatarPreset"]; label: string; image: string }> = [
    { id: "default", label: "Default frog", image: A.appFrog },
    { id: "wallet", label: "Wallet frog", image: A.walletMascot },
    { id: "survivor", label: "Survivor", image: A.streakFrog },
    { id: "degen", label: "Degen", image: A.homeMascot },
    { id: "stealth", label: "Private", image: A.walletHp },
  ];
  const selectedProfileAvatar =
    profileAvatarOptions.find((item) => item.id === settings.identity.avatarPreset) || profileAvatarOptions[0];
  const selectedProfileAvatarImage = getPublicProfileAvatarImage(settings);
  const customAvatarBalanceReady = settings.wallet.brokeBalance >= CUSTOM_AVATAR_UNLOCK_BALANCE;
  const customAvatarUnlocked = settings.wallet.isVerified && customAvatarBalanceReady;
  const customAvatarUnlockGap = Math.max(0, CUSTOM_AVATAR_UNLOCK_BALANCE - settings.wallet.brokeBalance);
  const profileIdentityStyles: Array<{
    id: Settings["identity"]["identityStyle"];
    label: string;
    badge: string;
    description: string;
  }> = [
    { id: "classic", label: "Classic BROKE", badge: "Self-aware", description: "Default public identity for most users." },
    { id: "clean", label: "Clean profile", badge: "Low noise", description: "Minimal profile look with less visual pressure." },
    { id: "proof", label: "Proof mode", badge: "Progress", description: "For users who want stats and proof to stand out." },
    { id: "stealth", label: "Private mode", badge: "Quiet", description: "Keeps the identity feeling more private and controlled." },
    { id: "builder", label: "Builder mode", badge: "Fixing leaks", description: "For users treating $BROKE like a personal improvement system." },
  ];
  const selectedIdentityStyle =
    profileIdentityStyles.find((item) => item.id === settings.identity.identityStyle) || profileIdentityStyles[0];
  const profileConnectionLabel = telegram.isTelegram
    ? "Telegram Mini App"
    : webAuth.authenticated
      ? "Web linked"
      : "Local profile";
  const shareSlotLimit = getProfileShareSlotLimit(settingsWalletHp, settings.wallet);
  const enabledShareProfileItems = normalizeProfileShareSettings(settings.shareProfile).enabledItems;
  const visibleShareProfileItems = getEnabledProfileShareItems(settings, settingsWalletHp);
  const earnedBadgeCount = badges.filter((badge) => badge.earned).length;
  const profileSharePreviewStats = {
    weeklySurvivalScore: settingsSurvivalScore,
    biggestLeakCategory: categorySummaries[0]?.category || "none",
    biggestLeakAmount: categorySummaries[0]?.amount || 0,
    weeklyLeaks: settingsTotalLeaks,
    monthlyLeaks: settingsTotalLeaks,
    lifeHoursLost: Math.round(
      settingsTotalLeaks /
        Math.max(1, getTotalIncome(settings) / Math.max(1, settings.profile.workHoursPerMonth || 160))
    ),
    status: settingsStatusLabel,
    statusDetail: "Profile share preview",
    doomAlertTitle: "",
    doomAlertBody: "",
    selfRoast: "",
  } satisfies V2IdentityStats;
  const profileSharePreviewMetrics = visibleShareProfileItems.map((id) =>
    buildProfileShareMetric({
      id,
      settings,
      walletHp: settingsWalletHp,
      identityStats: profileSharePreviewStats,
      leaderboard,
      badgeCount: earnedBadgeCount,
    })
  );
  const normalizedWalletAddressDraft = walletAddressDraft.trim();
  const walletDraftHasValue = normalizedWalletAddressDraft.length > 0;
  const walletDraftLooksValid = isLikelySolanaWalletAddress(normalizedWalletAddressDraft);
  const walletDraftIsLinked = Boolean(
    settings.wallet.walletAddress && settings.wallet.walletAddress === normalizedWalletAddressDraft
  );
  const walletReadyStateLabel = !walletDraftHasValue
    ? walletProviderDetected
      ? `${walletProviderName} detected. Verify can connect and fill the address automatically.`
      : "Paste your public wallet address or open the app inside a Solana wallet browser. Never paste a seed phrase."
    : walletDraftLooksValid
      ? walletDraftIsLinked
        ? "Wallet linked. You can recheck the latest $BROKE balance."
        : "Address ready to check, or press Verify to use the connected wallet instead."
      : "This does not look like a Solana address yet.";
  const walletPrimaryCta = walletChecking
    ? "Checking..."
    : walletDraftIsLinked
      ? "Recheck $BROKE balance"
      : "Check $BROKE balance";
  const walletProviderStatusText = walletProviderDetected
    ? walletProviderOptions.length > 1
      ? `${walletProviderOptions.length} wallets detected · ${walletProviderName} selected.`
      : `${walletProviderName} detected · message signing should be available.`
    : walletProviderOptions.length > 0
      ? `${walletProviderOptions.length} wallet provider${walletProviderOptions.length === 1 ? "" : "s"} detected, but this one cannot sign messages here.`
      : telegram.isTelegram
        ? "Telegram browser usually cannot sign. Open the app inside a Solana wallet browser, then rescan."
        : "No injected Solana wallet detected in this browser yet.";
  const walletVerificationFlowText = settings.wallet.isVerified
    ? "This wallet is ownership-verified. Holder rewards can use this balance."
    : walletProviderDetected
      ? "Choose a wallet, press Verify wallet, then sign one text message. The address fills automatically."
      : settings.wallet.walletAddress
        ? "Watch-only balance is saved. Verification needs one message signature from the matching wallet."
        : "Connect a detected wallet to verify directly, or paste an address for watch-only balance.";
  const holderRewardState = getHolderProfileRewardState(settings.wallet);
  const nextHolderRewardGap = holderRewardState.next
    ? Math.max(0, holderRewardState.next.minBalance - settings.wallet.brokeBalance)
    : 0;
  const holderRewardSummary = settings.wallet.isVerified
    ? `${holderRewardState.unlockedCount}/${holderRewardState.totalCount} holder rewards unlocked`
    : "Verify wallet to unlock holder rewards";
  const walletProofLabel = settings.wallet.isVerified
    ? "Verified holder"
    : settings.wallet.walletAddress
      ? "Watched wallet · verify to unlock holder perks"
      : "No wallet linked";
  const holderProofStatusLabel = getHolderProofLabel(settings.wallet);
  const holderNextTierProgress = getNextHolderTierProgress(settings.wallet);
  const holderCoachState = !settings.wallet.walletAddress
    ? {
        badge: "Step 1",
        title: "Link a public wallet",
        body: "Paste a Solana address to watch $BROKE balance. Unlocks stay closed until ownership is verified.",
        tone: "empty",
      }
    : !settings.wallet.isVerified
      ? {
          badge: "Step 2",
          title: "Verify ownership",
          body: "Watched wallets can show balance, but profile rewards, holder proof and custom avatar need a signed message.",
          tone: "watched",
        }
      : holderRewardState.next
        ? {
            badge: "Next unlock",
            title: holderRewardState.next.label,
            body: `Need ${formatTokenAmount(nextHolderRewardGap)} more BROKE for the next verified-holder profile reward.`,
            tone: "verified",
          }
        : {
            badge: "Max path",
            title: "All current holder rewards unlocked",
            body: "Use Share Studio to decide which proof, stats and identity items appear publicly.",
            tone: "verified",
          };
  const shareSlotCoachText = visibleShareProfileItems.length >= shareSlotLimit
    ? "Your public slots are full. Raise Wallet HP or verified holder balance to unlock more display space."
    : `You can add ${shareSlotLimit - visibleShareProfileItems.length} more public item${shareSlotLimit - visibleShareProfileItems.length === 1 ? "" : "s"}.`;

  function updateIdentityField<K extends keyof Settings["identity"]>(key: K, value: Settings["identity"][K]) {
    setSettings((prev) => ({
      ...prev,
      identity: {
        ...prev.identity,
        [key]: value,
      },
    }));
  }

  function toggleProfileShareItem(id: ProfileShareItemId) {
    setSettings((prev) => {
      const current = normalizeProfileShareSettings(prev.shareProfile).enabledItems;
      const exists = current.includes(id);
      const nextItems = exists
        ? current.filter((item) => item !== id)
        : [...current, id];

      return {
        ...prev,
        shareProfile: normalizeProfileShareSettings({
          enabledItems: nextItems.length > 0 ? nextItems : ["survival"],
        }),
      };
    });
  }

  function updateWalletSettings(next: Partial<WalletLinkSettings>) {
    setSettings((prev) => ({
      ...prev,
      wallet: normalizeWalletLinkSettings({
        ...prev.wallet,
        ...next,
      }),
    }));
  }

  async function refreshWalletVerificationStatus(silent = false) {
    const walletAddress = (settings.wallet.walletAddress || walletAddressDraft).trim();

    if (!isLikelySolanaWalletAddress(walletAddress) || walletStatusRefreshing) return;
    if (!telegram.isTelegram && !webAuth.user) return;

    setWalletStatusRefreshing(true);

    try {
      const response = await fetch("/api/wallet/verify/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          initData: telegram.isTelegram ? telegram.initData : "",
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        walletAddress?: string;
        verified?: boolean;
        balance?: number;
        percentOfSupply?: number;
        holderTier?: HolderTier | null;
        checkedAt?: string;
        verifiedAt?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Could not sync wallet verification status.");
      }

      if (data.verified) {
        updateWalletSettings({
          walletAddress: data.walletAddress || walletAddress,
          brokeBalance: Math.max(0, safeNumber(String(data.balance ?? settings.wallet.brokeBalance))),
          percentOfSupply: Math.max(0, safeNumber(String(data.percentOfSupply ?? settings.wallet.percentOfSupply))),
          holderTier: normalizeHolderTier(data.holderTier || settings.wallet.holderTier),
          lastCheckedAt: data.checkedAt || settings.wallet.lastCheckedAt || new Date().toISOString(),
          isVerified: true,
          provider: "verified",
          verifiedAt: data.verifiedAt || settings.wallet.verifiedAt || new Date().toISOString(),
        });

        if (!silent) {
          setWalletMessage("Verified wallet status synced. Holder unlocks are active.");
          notifyApp("Wallet synced", "Verified holder status is active in this app.", "info");
          triggerHaptic("success");
        }
      } else if (!silent) {
        setWalletMessage("This wallet is still watch-only in your account. Verify ownership to unlock holder perks.");
        notifyApp("Watch-only wallet", "Balance is visible, but holder unlocks need wallet verification.", "info");
      }
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : "Could not sync wallet verification status.";
        setWalletMessage(message);
        notifyApp("Sync failed", message, "info");
      }
    } finally {
      setWalletStatusRefreshing(false);
    }
  }

  async function pasteWalletAddressFromClipboard() {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const nextAddress = clipboardText.trim();

      if (!nextAddress) {
        setWalletMessage("Clipboard is empty.");
        return;
      }

      setWalletAddressDraft(nextAddress);
      setWalletProviderHelpOpen(false);
      setWalletMessage(
        isLikelySolanaWalletAddress(nextAddress)
          ? "Address ready to check."
          : "Pasted text does not look like a Solana wallet address yet."
      );
      triggerHaptic("light");
    } catch {
      setWalletMessage("Clipboard access is blocked. Paste the address manually.");
    }
  }

  function clearWalletAddressDraft() {
    setWalletAddressDraft("");
    setWalletProviderHelpOpen(false);
    setWalletMessage("");
    triggerHaptic("light");
  }

  async function checkBrokeWalletBalance() {
    const walletAddress = walletAddressDraft.trim();

    if (!isLikelySolanaWalletAddress(walletAddress)) {
      setWalletMessage("Paste a valid Solana wallet address first.");
      notifyApp("Invalid wallet", "Paste a valid Solana address. No seed phrase is ever needed.");
      return;
    }

    setWalletChecking(true);
    setWalletProviderHelpOpen(false);
    setWalletMessage("");

    try {
      const response = await fetch("/api/wallet/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        walletAddress?: string;
        balance?: number;
        percentOfSupply?: number;
        holderTier?: HolderTier;
        checkedAt?: string;
        verified?: boolean;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Could not check $BROKE balance.");
      }

      updateWalletSettings({
        walletAddress: data.walletAddress || walletAddress,
        brokeBalance: Math.max(0, safeNumber(String(data.balance ?? 0))),
        percentOfSupply: Math.max(0, safeNumber(String(data.percentOfSupply ?? 0))),
        holderTier: normalizeHolderTier(data.holderTier),
        lastCheckedAt: data.checkedAt || new Date().toISOString(),
        isVerified: walletAddress === settings.wallet.walletAddress ? settings.wallet.isVerified : Boolean(data.verified),
        provider: walletAddress === settings.wallet.walletAddress && settings.wallet.isVerified ? "verified" : data.verified ? "verified" : "watch",
        verifiedAt: walletAddress === settings.wallet.walletAddress ? settings.wallet.verifiedAt : "",
      });
      void refreshWalletVerificationStatus(true);
      setWalletMessage("$BROKE balance updated. This is read-only tracking.");
      notifyApp("Wallet checked", "Read-only $BROKE balance updated.", "info");
      triggerHaptic("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not check $BROKE balance.";
      setWalletMessage(message);
      notifyApp("Wallet check failed", message, "info");
    } finally {
      setWalletChecking(false);
    }
  }

  function unlinkWallet() {
    setWalletAddressDraft("");
    setWalletProviderHelpOpen(false);
    updateWalletSettings(defaultWalletLinkSettings);
    setWalletMessage("Wallet removed from this profile.");
    triggerHaptic("light");
  }

  type SolanaWalletProvider = {
    name?: string;
    isPhantom?: boolean;
    isSolflare?: boolean;
    isBackpack?: boolean;
    isGlow?: boolean;
    isExodus?: boolean;
    isBraveWallet?: boolean;
    isCoinbaseWallet?: boolean;
    isOKXWallet?: boolean;
    isOkxWallet?: boolean;
    isBitKeep?: boolean;
    isBitget?: boolean;
    isTrust?: boolean;
    isMagicEden?: boolean;
    isJupiter?: boolean;
    isJupiterWallet?: boolean;
    providers?: SolanaWalletProvider[];
    connect?: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey?: { toString: () => string } }>;
    publicKey?: { toString: () => string };
    signMessage?: (message: Uint8Array, encoding?: string) => Promise<Uint8Array | { signature?: Uint8Array }>;
  };

  type DetectedSolanaWalletProvider = {
    id: string;
    label: string;
    provider: SolanaWalletProvider | null;
    ready: boolean;
    publicKey: string;
  };

  type SolanaStandardWalletAccount = {
    address?: string;
    publicKey?: Uint8Array;
    chains?: string[];
    features?: string[];
  };

  type SolanaStandardWallet = {
    name?: string;
    icon?: string;
    chains?: string[];
    accounts?: SolanaStandardWalletAccount[];
    features?: Record<string, unknown>;
  };

  type SolanaStandardWalletRegistry = {
    wallets: SolanaStandardWallet[];
    api: { register: (...wallets: SolanaStandardWallet[]) => void };
    ready: boolean;
  };

  function getStandardAccountAddress(account: SolanaStandardWalletAccount | null | undefined) {
    if (!account) return "";
    return account.address || "";
  }

  function getStandardSolanaAccount(wallet: SolanaStandardWallet | null | undefined) {
    const accounts = wallet?.accounts || [];
    return accounts.find((account) => account.chains?.some((chain) => chain.startsWith("solana:"))) || accounts[0] || null;
  }

  function getStandardFeature<T>(wallet: SolanaStandardWallet | null | undefined, key: string) {
    return wallet?.features?.[key] as T | undefined;
  }

  function getSolanaStandardWallets() {
    if (typeof window === "undefined") return [] as SolanaStandardWallet[];

    const candidateWindow = window as unknown as Window & {
      __brokeWalletStandardRegistry?: SolanaStandardWalletRegistry;
      navigator: Navigator & {
        wallets?: { push?: (...callbacks: Array<(api: SolanaStandardWalletRegistry["api"]) => void>) => void };
      };
    };

    if (!candidateWindow.__brokeWalletStandardRegistry) {
      const registry: SolanaStandardWalletRegistry = {
        wallets: [],
        ready: false,
        api: {
          register: (...wallets: SolanaStandardWallet[]) => {
            wallets.forEach((wallet) => {
              if (!wallet) return;
              const alreadyRegistered = registry.wallets.some((item) => item === wallet || item.name === wallet.name);
              if (!alreadyRegistered) registry.wallets.push(wallet);
            });
          },
        },
      };
      candidateWindow.__brokeWalletStandardRegistry = registry;
    }

    const registry = candidateWindow.__brokeWalletStandardRegistry;

    if (!registry.ready) {
      registry.ready = true;

      try {
        window.addEventListener("wallet-standard:register-wallet", ((event: Event) => {
          const detail = (event as CustomEvent<(api: SolanaStandardWalletRegistry["api"]) => void>).detail;
          if (typeof detail === "function") detail(registry.api);
        }) as EventListener);
      } catch {
        // Wallet Standard is optional. Legacy injected providers still work without it.
      }

      try {
        const navigatorWithWallets = candidateWindow.navigator;
        if (!navigatorWithWallets.wallets) {
          Object.defineProperty(navigatorWithWallets, "wallets", {
            configurable: false,
            enumerable: false,
            value: Object.freeze({
              push: (...callbacks: Array<(api: SolanaStandardWalletRegistry["api"]) => void>) => {
                callbacks.forEach((callback) => {
                  try {
                    callback(registry.api);
                  } catch {
                    // Ignore wallet registration callbacks that throw.
                  }
                });
              },
            }),
          });
        }
      } catch {
        // Some in-app browsers lock navigator properties. This is safe to ignore.
      }
    }

    try {
      window.dispatchEvent(new CustomEvent("wallet-standard:app-ready", { detail: registry.api }));
    } catch {
      // Some webviews block custom events. Direct injected providers are checked below.
    }

    return registry.wallets.filter((wallet) =>
      (wallet.chains || []).some((chain) => chain.startsWith("solana:")) ||
      Boolean(wallet.features?.["solana:signMessage"] || wallet.features?.["solana:signTransaction"])
    );
  }

  function createSolanaStandardProvider(wallet: SolanaStandardWallet): SolanaWalletProvider | null {
    const connectFeature = getStandardFeature<{
      connect?: (input?: { silent?: boolean }) => Promise<{ accounts?: SolanaStandardWalletAccount[] } | void>;
    }>(wallet, "standard:connect");
    const signMessageFeature = getStandardFeature<{
      signMessage?: (input: { account: SolanaStandardWalletAccount; message: Uint8Array }) => Promise<
        | Uint8Array
        | { signature?: Uint8Array }
        | Array<{ signature?: Uint8Array }>
      >;
    }>(wallet, "solana:signMessage");

    if (!connectFeature?.connect || !signMessageFeature?.signMessage) return null;

    let activeAccount = getStandardSolanaAccount(wallet);
    const provider = {
      name: wallet.name || "Solana Wallet Standard",
      isJupiter: /jupiter/i.test(wallet.name || ""),
      get publicKey() {
        const address = getStandardAccountAddress(activeAccount || getStandardSolanaAccount(wallet));
        return address ? { toString: () => address } : undefined;
      },
      async connect() {
        const result = await connectFeature.connect?.({ silent: false });
        activeAccount = result?.accounts?.[0] || getStandardSolanaAccount(wallet) || activeAccount;
        const address = getStandardAccountAddress(activeAccount);
        return { publicKey: address ? { toString: () => address } : undefined };
      },
      async signMessage(message: Uint8Array) {
        if (!activeAccount) {
          const result = await connectFeature.connect?.({ silent: false });
          activeAccount = result?.accounts?.[0] || getStandardSolanaAccount(wallet);
        }

        if (!activeAccount) throw new Error("Wallet Standard did not return a Solana account.");

        const result = await signMessageFeature.signMessage?.({ account: activeAccount, message });
        const signatureResult = Array.isArray(result) ? result[0] : result;

        if (signatureResult instanceof Uint8Array) return signatureResult;
        if (signatureResult?.signature) return { signature: signatureResult.signature };
        throw new Error("Wallet Standard did not return a message signature.");
      },
    } satisfies SolanaWalletProvider;

    return provider;
  }

  function getProviderPublicKey(provider: SolanaWalletProvider | null) {
    return provider?.publicKey?.toString?.() || "";
  }

  function providerCanSign(provider: SolanaWalletProvider | null) {
    return Boolean(provider?.connect && provider.signMessage);
  }

  function pushSolanaWalletProvider(
    providers: DetectedSolanaWalletProvider[],
    seen: Set<SolanaWalletProvider>,
    id: string,
    label: string,
    provider: SolanaWalletProvider | null | undefined
  ) {
    if (!provider || seen.has(provider)) return;

    seen.add(provider);
    providers.push({
      id,
      label,
      provider,
      ready: providerCanSign(provider),
      publicKey: getProviderPublicKey(provider),
    });
  }

  function getProviderLabel(provider: SolanaWalletProvider | null | undefined, fallback = "Solana wallet") {
    if (!provider) return fallback;
    if (provider.isPhantom) return "Phantom";
    if (provider.isSolflare) return "Solflare";
    if (provider.isBackpack) return "Backpack";
    if (provider.isOKXWallet || provider.isOkxWallet) return "OKX Wallet";
    if (provider.isBitKeep) return "Bitget / BitKeep";
    if (provider.isBitget) return "Bitget Wallet";
    if (provider.isGlow) return "Glow";
    if (provider.isExodus) return "Exodus";
    if (provider.isBraveWallet) return "Brave Wallet";
    if (provider.isCoinbaseWallet) return "Coinbase Wallet";
    if (provider.isTrust) return "Trust Wallet";
    if (provider.isMagicEden) return "Magic Eden Wallet";
    if (provider.isJupiter || provider.isJupiterWallet || /jupiter/i.test(provider.name || "")) return "Jupiter Wallet";
    return provider.name || fallback;
  }

  function getDetectedSolanaWalletProviders() {
    if (typeof window === "undefined") return [] as DetectedSolanaWalletProvider[];

    const candidateWindow = window as unknown as {
      solana?: SolanaWalletProvider;
      phantom?: { solana?: SolanaWalletProvider };
      solflare?: SolanaWalletProvider;
      backpack?: { solana?: SolanaWalletProvider };
      okxwallet?: { solana?: SolanaWalletProvider } | SolanaWalletProvider;
      bitkeep?: { solana?: SolanaWalletProvider } | SolanaWalletProvider;
      bitgetWallet?: { solana?: SolanaWalletProvider } | SolanaWalletProvider;
      coinbaseSolana?: SolanaWalletProvider;
      coinbaseWalletSolana?: SolanaWalletProvider;
      coinbaseWallet?: { solana?: SolanaWalletProvider };
      glowSolana?: SolanaWalletProvider;
      glow?: { solana?: SolanaWalletProvider } | SolanaWalletProvider;
      exodus?: { solana?: SolanaWalletProvider };
      braveSolana?: SolanaWalletProvider;
      trustwallet?: { solana?: SolanaWalletProvider };
      trustWallet?: { solana?: SolanaWalletProvider };
      magicEden?: { solana?: SolanaWalletProvider } | SolanaWalletProvider;
      jupiter?: { solana?: SolanaWalletProvider } | SolanaWalletProvider;
      jupiterWallet?: { solana?: SolanaWalletProvider } | SolanaWalletProvider;
      jupiterSolana?: SolanaWalletProvider;
    };
    const providers: DetectedSolanaWalletProvider[] = [];
    const seen = new Set<SolanaWalletProvider>();
    function unwrapSolanaProvider(value: { solana?: SolanaWalletProvider } | SolanaWalletProvider | undefined): SolanaWalletProvider | undefined {
      if (!value) return undefined;
      const wrapped = value as { solana?: SolanaWalletProvider };
      return wrapped.solana || (value as SolanaWalletProvider);
    }

    pushSolanaWalletProvider(providers, seen, "phantom", "Phantom", candidateWindow.phantom?.solana);
    pushSolanaWalletProvider(providers, seen, "solflare", "Solflare", candidateWindow.solflare);
    pushSolanaWalletProvider(providers, seen, "backpack", "Backpack", candidateWindow.backpack?.solana);
    pushSolanaWalletProvider(providers, seen, "okx", "OKX Wallet", unwrapSolanaProvider(candidateWindow.okxwallet));
    pushSolanaWalletProvider(providers, seen, "bitkeep", "Bitget / BitKeep", unwrapSolanaProvider(candidateWindow.bitkeep));
    pushSolanaWalletProvider(providers, seen, "bitget", "Bitget Wallet", unwrapSolanaProvider(candidateWindow.bitgetWallet));
    pushSolanaWalletProvider(providers, seen, "coinbase", "Coinbase Wallet", candidateWindow.coinbaseSolana || candidateWindow.coinbaseWalletSolana || candidateWindow.coinbaseWallet?.solana);
    pushSolanaWalletProvider(providers, seen, "glow", "Glow", unwrapSolanaProvider(candidateWindow.glow) || candidateWindow.glowSolana);
    pushSolanaWalletProvider(providers, seen, "exodus", "Exodus", candidateWindow.exodus?.solana);
    pushSolanaWalletProvider(providers, seen, "brave", "Brave Wallet", candidateWindow.braveSolana);
    pushSolanaWalletProvider(providers, seen, "trust", "Trust Wallet", candidateWindow.trustwallet?.solana || candidateWindow.trustWallet?.solana);
    pushSolanaWalletProvider(providers, seen, "magiceden", "Magic Eden Wallet", unwrapSolanaProvider(candidateWindow.magicEden));
    pushSolanaWalletProvider(providers, seen, "jupiter", "Jupiter Wallet", unwrapSolanaProvider(candidateWindow.jupiter));
    pushSolanaWalletProvider(providers, seen, "jupiter-wallet", "Jupiter Wallet", unwrapSolanaProvider(candidateWindow.jupiterWallet));
    pushSolanaWalletProvider(providers, seen, "jupiter-solana", "Jupiter Wallet", candidateWindow.jupiterSolana);

    getSolanaStandardWallets().forEach((wallet, index) => {
      const provider = createSolanaStandardProvider(wallet);
      pushSolanaWalletProvider(
        providers,
        seen,
        `wallet-standard-${(wallet.name || "solana").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
        wallet.name || "Solana Wallet Standard",
        provider
      );
    });

    candidateWindow.solana?.providers?.forEach((provider, index) => {
      pushSolanaWalletProvider(providers, seen, `standard-${index}`, getProviderLabel(provider), provider);
    });
    pushSolanaWalletProvider(providers, seen, "window-solana", getProviderLabel(candidateWindow.solana), candidateWindow.solana);

    return providers.sort((a, b) => Number(b.ready) - Number(a.ready) || a.label.localeCompare(b.label));
  }

  function getDetectedSolanaWalletProvider(preferredId = selectedWalletProviderId) {
    const providers = getDetectedSolanaWalletProviders();
    const selectedProvider = preferredId ? providers.find((item) => item.id === preferredId) : null;
    const provider = selectedProvider || providers.find((item) => item.ready) || providers[0] || null;

    if (!provider) {
      return {
        id: "",
        provider: null as SolanaWalletProvider | null,
        label: "No wallet provider detected",
        ready: false,
        publicKey: "",
      };
    }

    return provider;
  }

  function syncDetectedWalletProviderState(preferredId = selectedWalletProviderId) {
    const providers = getDetectedSolanaWalletProviders();
    const detected = getDetectedSolanaWalletProvider(preferredId);
    const options = providers.map((item) => ({ id: item.id, label: item.label, ready: item.ready }));

    setWalletProviderOptions(options);
    setWalletProviderName(detected.label);
    setWalletProviderDetected(detected.ready);

    if (!preferredId && detected.id) {
      setSelectedWalletProviderId(detected.id);
    } else if (preferredId && options.length > 0 && !options.some((item) => item.id === preferredId)) {
      setSelectedWalletProviderId(detected.id || options[0]?.id || "");
    }

    return detected;
  }

  function rescanWalletProvider() {
    const detected = syncDetectedWalletProviderState();
    setWalletProviderHelpOpen(false);
    setWalletMessage(
      detected.ready
        ? `${detected.label} detected. Press Verify wallet to connect and sign the ownership message.`
        : walletProviderOptions.length > 0
          ? "Wallet found, but this browser did not expose message signing. Use a wallet browser or paste the public address for watch-only balance."
          : telegram.isTelegram
            ? "No signing wallet inside Telegram. Use Open in Phantom/Solflare or copy the app link into your wallet browser."
            : "No signing wallet was exposed by this browser. Press Rescan; if Jupiter still does not appear, use Phantom/Solflare until WalletConnect support is added."
    );
    notifyApp(
      detected.ready ? "Wallet provider ready" : "Wallet needed",
      detected.ready ? "Message signing should be available now." : "Telegram can show the app, but verification needs a wallet browser.",
      "info"
    );
    triggerHaptic("light");
  }

  async function connectSelectedWalletProviderForOwnership() {
    const detected = syncDetectedWalletProviderState(selectedWalletProviderId);
    const provider = detected.provider;

    if (!provider?.connect || !provider.signMessage) {
      throw new Error("No message-signing Solana wallet was detected in this browser.");
    }

    const connected = await provider.connect();
    const connectedAddress = connected.publicKey?.toString() || provider.publicKey?.toString() || "";

    if (!connectedAddress || !isLikelySolanaWalletAddress(connectedAddress)) {
      throw new Error("Wallet connected but did not return a valid Solana address.");
    }

    return { detected, provider, connectedAddress };
  }

  async function useConnectedWalletAddress() {
    setWalletProviderHelpOpen(false);
    setWalletMessage("Connecting selected wallet...");

    try {
      const { detected, connectedAddress } = await connectSelectedWalletProviderForOwnership();

      setWalletAddressDraft(connectedAddress);
      setWalletMessage(`${detected.label} connected. Address inserted automatically. You can check balance or verify ownership.`);
      notifyApp("Wallet address ready", `${detected.label} address inserted into Profile.`, "info");
      triggerHaptic("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet connect failed.";
      setWalletProviderHelpOpen(false);
      setWalletMessage(`${message} Use Open in Phantom/Solflare or copy the app link into your wallet browser.`);
      notifyApp("Wallet not connected", "Open the app inside a wallet browser, then press Verify wallet again.", "info");
    }
  }

  function getSolanaWalletProvider() {
    return getDetectedSolanaWalletProvider().provider;
  }

  function signatureToBase64(signatureResult: Uint8Array | { signature?: Uint8Array }) {
    const signatureBytes = signatureResult instanceof Uint8Array ? signatureResult : signatureResult.signature;

    if (!signatureBytes) {
      throw new Error("Wallet did not return a signature.");
    }

    let binary = "";
    signatureBytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return window.btoa(binary);
  }

  function getCurrentAppUrlForWalletBrowser() {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }

  function openWalletBrowser(provider: "phantom" | "solflare") {
    const currentUrl = getCurrentAppUrlForWalletBrowser();

    if (!currentUrl) return;

    triggerHaptic("light");

    if (provider === "phantom") {
      const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(window.location.origin)}`;
      openExternalUrl(phantomUrl);
      return;
    }

    const solflareUrl = `https://solflare.com/ul/v1/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(window.location.origin)}`;
    openExternalUrl(solflareUrl);
  }

  async function copyWalletVerifyLink() {
    try {
      await navigator.clipboard.writeText(getCurrentAppUrlForWalletBrowser());
      setWalletMessage("App link copied. Open it inside a Solana wallet browser, then press Verify wallet again.");
      notifyApp("Link copied", "Open the app link inside a Solana wallet browser to verify ownership.", "info");
      triggerHaptic("success");
    } catch {
      setWalletMessage("Could not copy the app link. Open this app inside a Solana wallet browser to verify ownership.");
      notifyApp("Copy blocked", "Open this app inside a Solana wallet browser to verify ownership.", "info");
    }
  }

  async function verifyWalletOwnership() {
    const typedWalletAddress = walletAddressDraft.trim();
    const detected = syncDetectedWalletProviderState(selectedWalletProviderId);
    const provider = detected.provider;

    if (!provider?.connect || !provider.signMessage) {
      setWalletProviderName(detected.label);
      setWalletProviderDetected(false);
      setWalletProviderHelpOpen(false);
      setWalletMessage(
        telegram.isTelegram
          ? "Telegram cannot verify directly. Open the app in a Solana wallet browser, or paste a public address for watch-only balance."
          : "This browser did not expose a signing wallet. Press Rescan; if Jupiter still is not detected, use Phantom/Solflare for now or add WalletConnect/Reown support next."
      );
      notifyApp(
        telegram.isTelegram ? "Open in wallet browser" : "Wallet signer not exposed",
        telegram.isTelegram
          ? "Tap Open Phantom/Solflare or copy the app link. No seed phrase is needed."
          : "No signer was exposed to the app in this browser session.",
        "info"
      );

      if (telegram.isTelegram && typeof window !== "undefined") {
        window.setTimeout(() => openWalletBrowser("phantom"), 50);
      }

      return;
    }

    setWalletProviderHelpOpen(false);
    setWalletVerifying(true);
    setWalletMessage(`Opening ${detected.label} for ownership signature. No transaction will be sent.`);

    try {
      const { connectedAddress } = await connectSelectedWalletProviderForOwnership();
      const walletAddress = connectedAddress || typedWalletAddress;

      if (!isLikelySolanaWalletAddress(walletAddress)) {
        throw new Error("Wallet did not return a valid Solana address.");
      }

      if (typedWalletAddress && typedWalletAddress !== connectedAddress) {
        setWalletAddressDraft(connectedAddress);
        setWalletMessage(`${detected.label} returned ${compactWalletAddress(connectedAddress)}. Using the connected wallet for verification.`);
      } else if (!typedWalletAddress) {
        setWalletAddressDraft(connectedAddress);
      }

      const nonceResponse = await fetch("/api/wallet/verify/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          initData: telegram.isTelegram ? telegram.initData : "",
        }),
      });
      const nonceData = (await nonceResponse.json()) as {
        ok?: boolean;
        error?: string;
        nonce?: string;
        message?: string;
      };

      if (!nonceResponse.ok || !nonceData.ok || !nonceData.message || !nonceData.nonce) {
        throw new Error(nonceData.error || "Could not start wallet verification.");
      }

      const encodedMessage = new TextEncoder().encode(nonceData.message);
      const signatureResult = await provider.signMessage(encodedMessage, "utf8");
      const signature = signatureToBase64(signatureResult);

      const confirmResponse = await fetch("/api/wallet/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          nonce: nonceData.nonce,
          message: nonceData.message,
          signature,
          initData: telegram.isTelegram ? telegram.initData : "",
        }),
      });
      const confirmData = (await confirmResponse.json()) as {
        ok?: boolean;
        error?: string;
        walletAddress?: string;
        balance?: number;
        percentOfSupply?: number;
        holderTier?: HolderTier;
        checkedAt?: string;
        verifiedAt?: string;
        verified?: boolean;
      };

      if (!confirmResponse.ok || !confirmData.ok || !confirmData.verified) {
        throw new Error(confirmData.error || "Could not verify wallet ownership.");
      }

      updateWalletSettings({
        walletAddress: confirmData.walletAddress || walletAddress,
        brokeBalance: Math.max(0, safeNumber(String(confirmData.balance ?? settings.wallet.brokeBalance))),
        percentOfSupply: Math.max(0, safeNumber(String(confirmData.percentOfSupply ?? settings.wallet.percentOfSupply))),
        holderTier: normalizeHolderTier(confirmData.holderTier || settings.wallet.holderTier),
        lastCheckedAt: confirmData.checkedAt || new Date().toISOString(),
        isVerified: true,
        provider: "verified",
        verifiedAt: confirmData.verifiedAt || new Date().toISOString(),
      });
      void refreshWalletVerificationStatus(true);
      setWalletMessage("Wallet verified. Holder unlocks are now available for this wallet.");
      notifyApp("Wallet verified", "Holder status is now ownership-verified.", "info");
      triggerHaptic("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet verification failed.";
      setWalletMessage(message);
      notifyApp("Verification failed", message, "info");
    } finally {
      setWalletVerifying(false);
    }
  }

  async function uploadCustomAvatar(file: File | null) {
    if (!file || avatarUploading) return;

    if (!customAvatarUnlocked) {
      setAvatarMessage(
        settings.wallet.isVerified
          ? `Custom avatar unlocks at ${formatTokenAmount(CUSTOM_AVATAR_UNLOCK_BALANCE)}. Need ${formatTokenAmount(customAvatarUnlockGap)} more.`
          : "Verify wallet ownership before uploading a custom avatar."
      );
      notifyApp("Avatar locked", "Verify a 500K+ BROKE wallet to unlock custom avatar upload.", "info");
      return;
    }

    if (!settings.wallet.walletAddress) {
      setAvatarMessage("Link and check a wallet first.");
      notifyApp("Wallet required", "Check your $BROKE balance before uploading a custom avatar.", "info");
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setAvatarMessage("Use PNG, JPG or WebP only.");
      return;
    }

    if (file.size > CUSTOM_AVATAR_MAX_BYTES) {
      setAvatarMessage("Avatar image must be 2 MB or less.");
      return;
    }

    setAvatarUploading(true);
    setAvatarMessage("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("walletAddress", settings.wallet.walletAddress);
      formData.append("initData", telegram.isTelegram ? telegram.initData : "");

      const response = await fetch("/api/avatar/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        avatarUrl?: string;
        checkedAt?: string;
        balance?: number;
        percentOfSupply?: number;
        holderTier?: HolderTier;
      };

      if (!response.ok || !data.ok || !data.avatarUrl) {
        throw new Error(data.error || "Avatar upload failed.");
      }

      setSettings((prev) => ({
        ...prev,
        identity: {
          ...prev.identity,
          customAvatarUrl: data.avatarUrl || "",
          customAvatarUpdatedAt: data.checkedAt || new Date().toISOString(),
        },
        wallet: normalizeWalletLinkSettings({
          ...prev.wallet,
          brokeBalance: Math.max(0, safeNumber(String(data.balance ?? prev.wallet.brokeBalance))),
          percentOfSupply: Math.max(0, safeNumber(String(data.percentOfSupply ?? prev.wallet.percentOfSupply))),
          holderTier: normalizeHolderTier(data.holderTier || prev.wallet.holderTier),
          lastCheckedAt: data.checkedAt || prev.wallet.lastCheckedAt,
        }),
      }));
      setAvatarMessage("Custom avatar uploaded. It will be used on profile and share cards.");
      notifyApp("Avatar updated", "Your custom avatar is now active.", "info");
      triggerHaptic("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Avatar upload failed.";
      setAvatarMessage(message);
      notifyApp("Avatar upload failed", message, "info");
    } finally {
      setAvatarUploading(false);
    }
  }

  function removeCustomAvatar() {
    setSettings((prev) => ({
      ...prev,
      identity: {
        ...prev.identity,
        customAvatarUrl: "",
        customAvatarUpdatedAt: "",
      },
    }));
    setAvatarMessage("Custom avatar removed. Preset avatar is active again.");
    triggerHaptic("light");
  }

  async function runOldDataCurrencyRepair() {
    const confirmed = window.confirm(
      repairScope === "all"
        ? `Force-mark ALL current money records as ${repairCurrency}? This does not convert or rewrite amounts. Use this only if the visible old numbers were originally entered in ${repairCurrency}.`
        : `Mark older numbers as ${repairCurrency}? This does not convert or rewrite amounts. It only tags old data with the currency it was originally entered in.`
    );

    if (!confirmed) return;

    setRepairBusy(true);
    setRepairMessage("");

    try {
      const result = await onRepairOldCurrency(repairCurrency, repairScope);
      const touched =
        result.expensesUpdated +
        result.incomeFieldsUpdated +
        result.fixedCostFieldsUpdated +
        result.growthTargetsUpdated +
        result.debtItemsUpdated;

      setRepairMessage(
        touched > 0
          ? `Marked ${touched} money fields as ${repairCurrency}. Original amounts stayed unchanged. Refresh or reopen Telegram if old cloud rows were already loaded.`
          : `No missing currency fields found. ${repairCurrency} is still ready for new entries.`
      );
    } catch {
      setRepairMessage("Currency repair failed. Try again after the app syncs.");
    } finally {
      setRepairBusy(false);
    }
  }

  return (
    <div className="screen">
      <Header
        title="Profile"
        showBack
        rightIcon={A.help}
        onBack={onBack}
        onRight={onHelp}
        extraRight={
          adminAccess.canSeePanel ? (
            <button
              type="button"
              className="header-button admin-header-button"
              onClick={() => {
                triggerHaptic("light");
                setAdminPanelOpen(true);
              }}
              aria-label="Open admin panel"
            >
              Admin
            </button>
          ) : undefined
        }
      />

      <section className={`profile-cabinet-card identity-style-${settings.identity.identityStyle || "classic"}`}>
        <div className="profile-cabinet-top">
          <div className="profile-avatar-frame">
            <img src={selectedProfileAvatarImage} alt="Profile avatar" />
          </div>
          <div className="profile-cabinet-copy">
            <span>Personal Cabinet</span>
            <strong>{profileNickname}</strong>
            <p>{profileStatusText}</p>
            <em className="profile-style-pill">{selectedIdentityStyle.label} · {selectedIdentityStyle.badge}</em>
          </div>
          <b>{settingsStatusLabel}</b>
        </div>

        <details className="profile-identity-editor">
          <summary>
            <span>Identity setup</span>
            <b>{profileConnectionLabel}</b>
          </summary>

          <label>
            <span>Nickname</span>
            <input
              value={settings.identity.nickname}
              placeholder={fallbackProfileName}
              onChange={(event) => updateIdentityField("nickname", event.target.value)}
            />
          </label>

          <label>
            <span>Status line</span>
            <input
              value={settings.identity.statusText}
              placeholder="Broke, but self-aware"
              onChange={(event) => updateIdentityField("statusText", event.target.value)}
            />
          </label>

          <div className="profile-avatar-options">
            {profileAvatarOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={settings.identity.avatarPreset === option.id && !settings.identity.customAvatarUrl ? "active" : ""}
                onClick={() => {
                  updateIdentityField("avatarPreset", option.id);
                  if (settings.identity.customAvatarUrl) {
                    removeCustomAvatar();
                  }
                }}
              >
                <img src={option.image} alt="" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          <section className={`custom-avatar-unlock-card ${customAvatarUnlocked ? "unlocked" : "locked"}`}>
            <div className="custom-avatar-unlock-head">
              <div>
                <span>Custom avatar</span>
                <strong>
                  {customAvatarUnlocked
                    ? "Unlocked by verified holder balance"
                    : settings.wallet.isVerified
                      ? "Unlocks at 500K BROKE"
                      : "Verify wallet ownership"}
                </strong>
                <small>
                  {customAvatarUnlocked
                    ? "Upload your own profile image for Profile and share cards."
                    : settings.wallet.isVerified
                      ? `Need ${formatTokenAmount(customAvatarUnlockGap)} more to unlock custom upload.`
                      : "A watched wallet can show balance. Custom avatar unlocks only after ownership proof."}
                </small>
              </div>
              <b>{customAvatarUnlocked ? "Unlocked" : settings.wallet.isVerified ? "Locked" : "Verify"}</b>
            </div>

            {settings.identity.customAvatarUrl && (
              <div className="custom-avatar-current">
                <img src={settings.identity.customAvatarUrl} alt="Custom avatar" />
                <div>
                  <strong>Custom avatar active</strong>
                  <small>{settings.identity.customAvatarUpdatedAt ? `Updated ${new Date(settings.identity.customAvatarUpdatedAt).toLocaleDateString()}` : "Used on public profile and share cards."}</small>
                </div>
              </div>
            )}

            <div className="custom-avatar-actions">
              <label className={customAvatarUnlocked && !avatarUploading ? "primary" : "disabled"}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={!customAvatarUnlocked || avatarUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    void uploadCustomAvatar(file);
                    event.currentTarget.value = "";
                  }}
                />
                <span>{avatarUploading ? "Uploading..." : "Upload avatar"}</span>
              </label>
              {settings.identity.customAvatarUrl && (
                <button type="button" onClick={removeCustomAvatar}>
                  Use preset instead
                </button>
              )}
            </div>

            <p>PNG, JPG or WebP · max 2 MB · verified 500K+ holder only · no transaction.</p>
            {avatarMessage && <small className="custom-avatar-message">{avatarMessage}</small>}
          </section>

          <div className="profile-identity-style-panel">
            <div>
              <span>Identity style</span>
              <strong>Choose how your $BROKE profile should feel.</strong>
            </div>
            <div className="profile-identity-style-options">
              {profileIdentityStyles.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={settings.identity.identityStyle === style.id ? "active" : ""}
                  onClick={() => updateIdentityField("identityStyle", style.id)}
                >
                  <b>{style.badge}</b>
                  <strong>{style.label}</strong>
                  <small>{style.description}</small>
                </button>
              ))}
            </div>
          </div>
        </details>

        <div className="profile-cabinet-stats">
          <article>
            <span>Wallet HP</span>
            <strong>{settingsWalletHp}/100</strong>
          </article>
          <article>
            <span>Survival</span>
            <strong>{settingsSurvivalScore}/100</strong>
          </article>
          <article>
            <span>Streak</span>
            <strong>{streak.currentStreak}d</strong>
          </article>
        </div>

        <ActiveHolderEligibilityStrip status={activeProofStatus} wallet={settings.wallet} />

        <div className="profile-public-preview profile-share-identity-preview">
          <img className="profile-public-preview-avatar" src={selectedProfileAvatarImage} alt="Public identity avatar" />
          <div>
            <span>Public identity preview</span>
            <strong>{profileNickname}</strong>
            <small>{profileStatusText}</small>
          </div>
          <b>{selectedIdentityStyle.badge}</b>
        </div>

        <div className="profile-share-safety-row">
          <span><b>Shows</b> avatar, nickname, identity style, HP/status and safe patterns.</span>
          <span><b>Hides</b> income, real balance, payday and private debt details by default.</span>
        </div>

        <details className={`wallet-balance-foundation-card profile-compact-details holder-tier-${settings.wallet.holderTier.id}`}>
          <summary className="profile-compact-summary wallet-compact-summary">
            <div>
              <span>Wallet & $BROKE balance</span>
              <strong>{settings.wallet.walletAddress ? settings.wallet.holderTier.label : "Read-only holder check"}</strong>
              <small>{settings.wallet.isVerified ? "Verified wallet · rewards-ready proof" : settings.wallet.walletAddress ? "Watched wallet · tap to manage verification" : "Paste wallet · verify ownership later"}</small>
            </div>
            <b>{settings.wallet.walletAddress ? formatHolderPercent(settings.wallet.percentOfSupply) : "Setup"}</b>
          </summary>
          <div className="profile-compact-body wallet-compact-body">

          <div
            className={`wallet-address-control ${
              !walletDraftHasValue ? "empty" : walletDraftLooksValid ? "ready" : "needs-fix"
            }`}
          >
            <label className="wallet-address-field">
              <span>Solana wallet address</span>
              <input
                value={walletAddressDraft}
                placeholder={walletProviderDetected ? "Press Verify wallet to connect automatically" : "Example: 8x3...Kp9"}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onChange={(event) => {
                  setWalletAddressDraft(event.target.value);
                  setWalletMessage("");
                }}
              />
            </label>

            <div className="wallet-address-helper-row">
              <span>{walletReadyStateLabel}</span>
              <div className="wallet-address-mini-actions">
                <button type="button" onClick={pasteWalletAddressFromClipboard}>Paste</button>
                <button type="button" onClick={clearWalletAddressDraft} disabled={!walletDraftHasValue}>Clear</button>
              </div>
            </div>
          </div>

          {settings.wallet.walletAddress && (
            <section className={`wallet-linked-result-card ${settings.wallet.isVerified ? "verified" : "watched"}`}>
              <div>
                <span>{settings.wallet.isVerified ? "Verified wallet" : "Watched wallet"}</span>
                <strong>{compactWalletAddress(settings.wallet.walletAddress)}</strong>
                <small>
                  {settings.wallet.isVerified && settings.wallet.verifiedAt
                    ? `Verified ${new Date(settings.wallet.verifiedAt).toLocaleString()}`
                    : settings.wallet.lastCheckedAt
                      ? `Last checked ${new Date(settings.wallet.lastCheckedAt).toLocaleString()} · verify for holder unlocks`
                      : "Saved as read-only watch wallet."}
                </small>
              </div>
              <b>{settings.wallet.isVerified ? "Verified" : settings.wallet.holderTier.label}</b>
            </section>
          )}

          <div className="wallet-balance-actions wallet-primary-actions">
            <button
              type="button"
              className={`primary ${walletDraftLooksValid ? "ready" : ""}`}
              onClick={checkBrokeWalletBalance}
              disabled={!walletDraftLooksValid || walletChecking || walletVerifying}
            >
              {walletPrimaryCta}
            </button>
            <button
              type="button"
              className={`wallet-verify-cta ${settings.wallet.isVerified ? "verified" : ""}`}
              onClick={verifyWalletOwnership}
              disabled={walletChecking || walletVerifying || walletStatusRefreshing}
            >
              {walletVerifying
                ? "Verifying..."
                : walletStatusRefreshing
                  ? "Syncing..."
                  : settings.wallet.isVerified
                    ? "Verified"
                    : walletProviderDetected
                      ? "Connect & verify"
                      : telegram.isTelegram
                        ? "Open wallet app"
                        : "Verify wallet"}
            </button>
            {settings.wallet.walletAddress && !settings.wallet.isVerified && (
              <button
                type="button"
                onClick={() => refreshWalletVerificationStatus(false)}
                disabled={walletChecking || walletVerifying || walletStatusRefreshing}
              >
                {walletStatusRefreshing ? "Syncing..." : "Sync verification"}
              </button>
            )}
            {settings.wallet.walletAddress && (
              <button type="button" onClick={unlinkWallet}>
                Remove wallet
              </button>
            )}
          </div>

          <div className={`wallet-proof-status ${settings.wallet.isVerified ? "verified" : "watched"}`}>
            <strong>{walletProofLabel}</strong>
            <small>
              {settings.wallet.isVerified
                ? "Holder unlocks can use this wallet. Signature proof does not move tokens."
                : "Balance display is watch-only. Custom avatar and future holder perks require verification."}
            </small>
          </div>

          <section className={`wallet-provider-readiness-card compact-wallet-connect-card ${walletProviderDetected ? "ready" : "missing"}`}>
            <div>
              <span>{walletProviderDetected ? "Wallet ready" : telegram.isTelegram ? "Telegram mode" : "Wallet not detected"}</span>
              <strong>
                {walletProviderDetected
                  ? walletProviderStatusText
                  : "Telegram can show the app, but wallet signing must happen inside a wallet browser."}
              </strong>
              <small>
                {walletProviderDetected
                  ? walletVerificationFlowText
                  : telegram.isTelegram
                    ? "Use one wallet button below, or copy the app link and open it inside a wallet browser. Never paste a seed phrase."
                    : "This browser has not exposed a signer yet. Rescan after the page loads; if Jupiter still is not detected, Phantom/Solflare are the current reliable mobile path."}
              </small>
              {walletProviderOptions.length > 1 && (
                <label className="wallet-provider-select">
                  <span>Selected wallet</span>
                  <select
                    value={selectedWalletProviderId}
                    onChange={(event) => {
                      setSelectedWalletProviderId(event.target.value);
                      const selected = syncDetectedWalletProviderState(event.target.value);
                      setWalletMessage(`${selected.label} selected for wallet verification.`);
                    }}
                  >
                    {walletProviderOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}{option.ready ? "" : " · no signing"}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className="wallet-provider-readiness-actions">
              {walletProviderDetected ? (
                <>
                  <button type="button" onClick={rescanWalletProvider} disabled={walletVerifying || walletStatusRefreshing}>
                    Rescan
                  </button>
                  <button type="button" onClick={useConnectedWalletAddress} disabled={walletVerifying || walletStatusRefreshing}>
                    Use wallet address
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="primary" onClick={() => openWalletBrowser("phantom")}>
                    Open Phantom
                  </button>
                  <button type="button" onClick={() => openWalletBrowser("solflare")}>
                    Open Solflare
                  </button>
                  <button type="button" onClick={copyWalletVerifyLink}>
                    Copy link
                  </button>
                  <button type="button" onClick={rescanWalletProvider} disabled={walletVerifying || walletStatusRefreshing}>
                    Rescan
                  </button>
                </>
              )}
            </div>
          </section>

          <section className={`holder-proof-dashboard ${settings.wallet.isVerified ? "verified" : "watched"}`}>
            <div className="holder-proof-dashboard-head">
              <div>
                <span>Holder proof</span>
                <strong>{holderProofStatusLabel}</strong>
                <small>
                  {settings.wallet.isVerified
                    ? "This wallet can unlock holder identity features."
                    : "Public holder perks stay locked until ownership is verified."}
                </small>
              </div>
              <b>{settings.wallet.holderTier.label}</b>
            </div>

            <div className="holder-tier-progress-card">
              <div>
                <span>{holderNextTierProgress.label}</span>
                <small>{holderNextTierProgress.detail}</small>
              </div>
              <strong>{holderNextTierProgress.progress}%</strong>
              <div className="holder-tier-progress-bar" aria-hidden="true">
                <i style={{ width: `${holderNextTierProgress.progress}%` }} />
              </div>
            </div>
          </section>

          <section className={`holder-rewards-card ${settings.wallet.isVerified ? "verified" : "locked"}`}>
            <div className="holder-rewards-head">
              <div>
                <span>Holder rewards</span>
                <strong>{holderRewardSummary}</strong>
                <small>
                  {settings.wallet.isVerified
                    ? holderRewardState.next
                      ? `Next unlock: ${holderRewardState.next.label} at ${formatTokenAmount(holderRewardState.next.minBalance)}.`
                      : "All current holder profile rewards are unlocked."
                    : "Watching a wallet can show balance. Rewards require ownership proof."}
                </small>
              </div>
              <b>{holderRewardState.slotBonus > 0 ? `+${holderRewardState.slotBonus} slots` : "Proof first"}</b>
            </div>

            <div className="holder-reward-grid">
              {holderProfileRewards.map((reward) => {
                const unlocked = settings.wallet.isVerified && settings.wallet.brokeBalance >= reward.minBalance;

                return (
                  <article className={unlocked ? "unlocked" : "locked"} key={reward.id}>
                    <span>{unlocked ? "Unlocked" : formatTokenAmount(reward.minBalance)}</span>
                    <strong>{reward.label}</strong>
                    <small>{reward.detail}</small>
                  </article>
                );
              })}
            </div>

            {holderRewardState.next && (
              <p>
                {settings.wallet.isVerified
                  ? `Need ${formatTokenAmount(nextHolderRewardGap)} more BROKE for the next holder profile unlock.`
                  : "Verify wallet ownership before public holder perks, custom avatar, or extra display slots activate."}
              </p>
            )}
          </section>

          <section className={`holder-next-move-card ${holderCoachState.tone}`}>
            <div>
              <span>{holderCoachState.badge}</span>
              <strong>{holderCoachState.title}</strong>
              <small>{holderCoachState.body}</small>
            </div>
            <div className="holder-next-move-steps" aria-label="Holder reward path">
              <i className={settings.wallet.walletAddress ? "done" : ""}>Link</i>
              <i className={settings.wallet.isVerified ? "done" : ""}>Verify</i>
              <i className={customAvatarUnlocked ? "done" : ""}>500K+</i>
              <i className={settings.wallet.isVerified && settings.wallet.brokeBalance >= 1_000_000 ? "done" : ""}>1M+</i>
              <i className={settings.wallet.isVerified && settings.wallet.brokeBalance >= 5_000_000 ? "done" : ""}>5M+</i>
            </div>
          </section>

          <div className="wallet-security-note-grid">
            <span>Read-only balance</span>
            <span>Message signature only</span>
            <span>No transaction</span>
          </div>

          <div className="wallet-balance-status-grid">
            <article>
              <span>$BROKE balance</span>
              <strong>{formatTokenAmount(settings.wallet.brokeBalance)}</strong>
            </article>
            <article>
              <span>Holder tier</span>
              <strong>{settings.wallet.holderTier.label}</strong>
              <small>{settings.wallet.holderTier.range}</small>
            </article>
            <article>
              <span>Supply share</span>
              <strong>{formatHolderPercent(settings.wallet.percentOfSupply)}</strong>
              <small>{settings.wallet.walletAddress ? "Based on checked balance." : "Link a wallet first."}</small>
            </article>
          </div>

          <div className="wallet-holder-privacy-toggles">
            <label>
              <input
                type="checkbox"
                checked={settings.wallet.showHolderStatus}
                onChange={(event) => updateWalletSettings({ showHolderStatus: event.target.checked })}
              />
              <span>Allow holder tier on profile/share cards</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.wallet.showTokenBalance}
                onChange={(event) => updateWalletSettings({ showTokenBalance: event.target.checked })}
              />
              <span>Allow exact token balance publicly</span>
            </label>
          </div>

          {walletMessage && <p className="wallet-balance-message">{walletMessage}</p>}
          </div>
        </details>

        {adminAccess.canSeePanel && adminPanelOpen && (
          <AdminPanelModal onClose={() => setAdminPanelOpen(false)}>
            <AdminTreasuryPanel
              access={adminAccess}
              wallet={settings.wallet}
              activeProofStatus={activeProofStatus}
            />
          </AdminPanelModal>
        )}

        <details className="profile-share-studio-card profile-compact-details">
          <summary className="profile-compact-summary share-studio-compact-summary">
            <div>
              <span>Share Studio</span>
              <strong>Public card setup</strong>
              <small>{visibleShareProfileItems.length}/{shareSlotLimit} selected · tap to edit public items</small>
            </div>
            <b>{visibleShareProfileItems.length}/{shareSlotLimit} slots</b>
          </summary>
          <div className="profile-compact-body share-studio-compact-body">

          <div className="profile-share-slot-coach">
            <div>
              <span>Public display space</span>
              <strong>{visibleShareProfileItems.length}/{shareSlotLimit} selected</strong>
              <small>{shareSlotCoachText}</small>
            </div>
            <b>{holderRewardState.slotBonus > 0 ? `Verified holder +${holderRewardState.slotBonus}` : "Wallet HP path"}</b>
          </div>

          <div className="profile-share-preview-grid">
            {profileSharePreviewMetrics.map((metric) => (
              <article key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>

          <div className="profile-share-picker-grid">
            {profileShareItemIds.map((id) => {
              const meta = getProfileShareItemMeta(id);
              const checked = enabledShareProfileItems.includes(id);
              const lockedBySlots = !checked && visibleShareProfileItems.length >= shareSlotLimit;

              return (
                <label className={checked ? "active" : lockedBySlots ? "locked" : ""} key={id}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={lockedBySlots}
                    onChange={() => toggleProfileShareItem(id)}
                  />
                  <span>{meta.label}</span>
                  <small>{lockedBySlots ? "Raise Wallet HP or verify holder balance to unlock more slots." : meta.detail}</small>
                </label>
              );
            })}
          </div>

          <div className="profile-share-studio-actions">
            <button
              type="button"
              className="primary"
              onClick={() => {
                setProfileShareCardOpen(true);
                triggerHaptic("light");
              }}
            >
              Open share card
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileShareCardOpen((value) => !value);
                triggerHaptic("light");
              }}
            >
              {profileShareCardOpen ? "Hide preview" : "Preview here"}
            </button>
          </div>

          <p className="profile-share-studio-note">
            This is the main place to choose and open your public profile card. You do not need to search for it on Home.
          </p>

          {profileShareCardOpen && (
            <div className="profile-share-studio-inline-card">
              <ShareResultCard
                settings={settings}
                walletHp={settingsWalletHp}
                totalLeaks={settingsTotalLeaks}
                realBalance={settingsRealBalance}
                potentialYearlySavings={settingsTotalLeaks * 12}
                leaderboard={leaderboard}
                identityStats={profileSharePreviewStats}
                exchangeRates={exchangeRates}
                shareInitData={telegram.isTelegram ? telegram.initData : ""}
              />
            </div>
          )}
          </div>
        </details>

        <div className="profile-cabinet-note compact-profile-note">
          <span>More settings below</span>
          <small>Collapsed by default to keep Profile easier to scan.</small>
        </div>
      </section>

      <section className="profile-settings-hub" aria-label="Profile settings sections">
        <div className="profile-settings-hub-heading compact-settings-heading">
          <div>
            <span>Profile settings</span>
            <strong>Wallet setup, privacy, sync and data.</strong>
          </div>
          <b>Everything kept</b>
        </div>

        <details className="profile-settings-section quick-setup">
          <summary className="profile-section-summary">
            <div>
              <span>Quick Setup</span>
              <small>Language, region, life mode, currency mode and basic profile rules.</small>
            </div>
            <b>{settings.language.toUpperCase()} · {settings.currency}</b>
          </summary>
          <div className="profile-section-body">
      <LifeProfileEditor
        settings={settings}
        setSettings={setSettings}
        exchangeRateStatus={exchangeRateStatus}
        exchangeRateError={exchangeRateError}
        conversionSourceCount={conversionSourceCount}
        oldCurrencyRepairCount={oldExpenseCount}
      />
          </div>
        </details>

        <details className="profile-settings-section money-setup">
          <summary className="profile-section-summary">
            <div>
              <span>Money Setup</span>
              <small>Income, payday and fixed life costs that power Wallet HP.</small>
            </div>
            <b>{money(totalIncome - fixedCosts, settings.currency)} free</b>
          </summary>
          <div className="profile-section-body profile-section-stack">
      <details className="clean-details settings-clean-details">
        <summary>
          <div>
            <span>Income Setup</span>
            <small>Adjust income without exposing private data publicly.</small>
          </div>
          <b>{money(totalIncome, settings.currency)}</b>
        </summary>
        <section className="settings-group">
          <h3>{getIncomePeriodLabel(settings)}</h3>
          <div className="currency-repair-warning">
            <strong>Stored value vs converted display</strong>
            <span>
              The input number stays in the currency shown inside the field.
              Changing display currency only changes converted totals and previews.
            </span>
          </div>

        <EditableMoneyLine
          label={getPrimaryIncomeLabel(settings)}
          value={settings.income.salary}
          currency={settings.incomeCurrencies.salary || settings.currency}
          helper={incomeClarityNote("salary")}
          onChange={(value) => updateIncome("salary", value)}
        />

        <EditableMoneyLine
          label="Side hustle / extra"
          value={settings.income.side}
          currency={settings.incomeCurrencies.side || settings.currency}
          helper={incomeClarityNote("side")}
          onChange={(value) => updateIncome("side", value)}
        />

        <EditableMoneyLine
          label="Other / support"
          value={settings.income.other}
          currency={settings.incomeCurrencies.other || settings.currency}
          helper={incomeClarityNote("other")}
          onChange={(value) => updateIncome("other", value)}
        />

        <SettingLine
          label="Estimated monthly income"
          value={money(totalIncome, settings.currency)}
          strong
          good
        />
        <small className="currency-foundation-note">
          {settingsTotalClarityNote("Income")}
        </small>

        <label className="settings-date-field">
          <span>Next payday date</span>
          <input
            type="date"
            value={settings.survival.nextPaydayDate || getNextPaydayDate(settings)}
            onChange={(event) => updateSurvivalPaydayDate(event.target.value)}
          />
          <small>Survival Mode uses this exact date instead of assuming the 1st of the month.</small>
        </label>
        </section>
      </details>
      <details className="clean-details settings-clean-details">
        <summary>
          <div>
            <span>Fixed Life Costs</span>
            <small>Rent, food, transport, internet, and basics.</small>
          </div>
          <b>{money(fixedCosts, settings.currency)}</b>
        </summary>
        <section className="settings-group">
          <h3>Fixed Life Costs</h3>
          <div className="currency-repair-warning">
            <strong>These are stored as original values.</strong>
            <span>
              Convert mode shows their display value, but it does not replace the
              rent, food, transport, phone, data, or school numbers you entered.
            </span>
          </div>

        {settings.profile.hasRent && (
          <EditableMoneyLine
            label="Rent"
            value={settings.fixedCosts.rent}
            currency={settings.fixedCostCurrencies.rent || settings.currency}
            helper={fixedCostClarityNote("rent")}
            onChange={(value) => updateFixedCost("rent", value)}
          />
        )}

        <EditableMoneyLine
          label="Utilities"
          value={settings.fixedCosts.utilities}
          currency={settings.fixedCostCurrencies.utilities || settings.currency}
          helper={fixedCostClarityNote("utilities")}
          onChange={(value) => updateFixedCost("utilities", value)}
        />

        <EditableMoneyLine
          label="Food basics"
          value={settings.fixedCosts.food}
          currency={settings.fixedCostCurrencies.food || settings.currency}
          helper={fixedCostClarityNote("food")}
          onChange={(value) => updateFixedCost("food", value)}
        />

        <EditableMoneyLine
          label="Transport"
          value={settings.fixedCosts.transport}
          currency={settings.fixedCostCurrencies.transport || settings.currency}
          helper={fixedCostClarityNote("transport")}
          onChange={(value) => updateFixedCost("transport", value)}
        />

        <EditableMoneyLine
          label="Phone"
          value={settings.fixedCosts.phone}
          currency={settings.fixedCostCurrencies.phone || settings.currency}
          helper={fixedCostClarityNote("phone")}
          onChange={(value) => updateFixedCost("phone", value)}
        />

        <EditableMoneyLine
          label="Data / Internet"
          value={settings.fixedCosts.data}
          currency={settings.fixedCostCurrencies.data || settings.currency}
          helper={fixedCostClarityNote("data")}
          onChange={(value) => updateFixedCost("data", value)}
        />

        <EditableMoneyLine
          label="School / study"
          value={settings.fixedCosts.education}
          currency={settings.fixedCostCurrencies.education || settings.currency}
          helper={fixedCostClarityNote("education")}
          onChange={(value) => updateFixedCost("education", value)}
        />

        <SettingLine
          label="Total Fixed Costs"
          value={money(fixedCosts, settings.currency)}
          strong
          bad
        />
        <small className="currency-foundation-note">
          {settingsTotalClarityNote("Fixed costs")}
        </small>
        </section>
      </details>
          </div>
        </details>

        <details className="profile-settings-section currency-tools">
          <summary className="profile-section-summary">
            <div>
              <span>Currency & Repair</span>
              <small>Display currency, conversion helpers and old data repair tools.</small>
            </div>
            <b>{settings.currencyMode === "convert" ? "Convert" : "Display"}</b>
          </summary>
          <div className="profile-section-body">
            <section className="settings-menu profile-section-menu">
        <div className="menu-line">
          <img src={A.currency} alt="" />
          <div>
            <strong>Display Currency</strong>
            <select
              className="settings-select"
              value={settings.currency}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  currency: event.target.value as Currency,
                }))
              }
            >
              {currencyOptions.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
          <b>›</b>
        </div>
        <details className="clean-details settings-clean-details currency-repair-details">
          <summary>
            <div>
              <span>Old Data Currency Repair</span>
              <small>Mark older values with the currency they were originally entered in.</small>
            </div>
            <b>{oldExpenseCount ? `${oldExpenseCount} old records` : "Optional"}</b>
          </summary>

          <section className="settings-group currency-repair-panel">
            <div className="currency-repair-warning">
              <strong>This does not convert amounts.</strong>
              <span>
                Use it only if older expenses, income, fixed costs, Growth targets,
                and Debt Radar values were originally entered in the selected currency.
              </span>
            </div>

            <label className="currency-repair-select-row">
              <span>Old data was entered in</span>
              <select
                className="settings-select"
                value={repairCurrency}
                onChange={(event) => setRepairCurrency(normalizeCurrency(event.target.value, settings.currency))}
              >
                {supportedCurrencies.map((currency) => (
                  <option value={currency} key={currency}>
                    {currency} ({getCurrencySymbol(currency)})
                  </option>
                ))}
              </select>
            </label>

            <div className="currency-repair-warning">
              <strong>Repair scope</strong>
              <span>
                Use missing-only for blank old rows. Use force-all if old rows were already tagged as the wrong currency and still show as huge USD values.
              </span>
            </div>

            <div className="currency-mode-options currency-repair-scope-options">
              <button
                type="button"
                className={repairScope === "missing" ? "active" : ""}
                onClick={() => setRepairScope("missing")}
              >
                Missing only
              </button>
              <button
                type="button"
                className={repairScope === "all" ? "active" : ""}
                onClick={() => setRepairScope("all")}
              >
                Force all current data
              </button>
            </div>

            <div className="currency-repair-stats">
              <div>
                <span>Old expense rows</span>
                <strong>{oldExpenseCount}</strong>
              </div>
              <div>
                <span>Income fields</span>
                <strong>{incomeKeys.length}</strong>
              </div>
              <div>
                <span>Fixed cost fields</span>
                <strong>{fixedCostKeys.length}</strong>
              </div>
            </div>

            <button
              type="button"
              className="currency-repair-button"
              onClick={runOldDataCurrencyRepair}
              disabled={repairBusy}
            >
              {repairBusy ? "Repairing..." : repairScope === "all" ? `Force mark all as ${repairCurrency}` : `Mark old data as ${repairCurrency}`}
            </button>

            {repairMessage && <p className="currency-repair-result">{repairMessage}</p>}

            <small className="currency-repair-note">
              New entries already remember their currency automatically. Missing-only fixes blank old rows. Force-all is only for old data that was already tagged as the wrong currency.
            </small>
          </section>
        </details>
            </section>
          </div>
        </details>

        <details className="profile-settings-section privacy-tools">
          <summary className="profile-section-summary">
            <div>
              <span>Privacy & Public Proof</span>
              <small>Control what public cards and leaderboards can show.</small>
            </div>
            <b>{settings.privacy.publicProofMode ? "Protected" : "Exact"}</b>
          </summary>
          <div className="profile-section-body profile-section-stack">
      <details className="clean-details settings-clean-details" open>
        <summary>
          <div>
            <span>Public Proof Mode</span>
            <small>Hide sensitive numbers on public cards.</small>
          </div>
          <b>{settings.privacy.publicProofMode ? "ON" : "OFF"}</b>
        </summary>

        <section className="settings-group public-proof-settings">
          <div className="public-proof-switch-row">
            <img
              src={PREMIUM_VISUAL_PACK.publicProofLock}
              alt=""
              onError={(event) => {
                event.currentTarget.src = A.export;
              }}
            />
            <div>
              <strong>Public Proof Mode</strong>
              <span>
                When ON, share cards hide exact private numbers like real balance,
                payday date, safe budget and private savings estimates.
              </span>
            </div>

            <button
              type="button"
              className={settings.privacy.publicProofMode ? "active" : ""}
              onClick={() => updatePublicProofMode(!settings.privacy.publicProofMode)}
            >
              {settings.privacy.publicProofMode ? "ON" : "OFF"}
            </button>
          </div>

          <div className="public-proof-info-grid">
            <div>
              <span>Still visible</span>
              <strong>Status, HP, score, patterns</strong>
            </div>
            <div>
              <span>Hidden</span>
              <strong>Balance, payday, exact private amounts</strong>
            </div>
          </div>
        </section>
      </details>
            <section className="settings-menu profile-section-menu">
        <button
          className="menu-line menu-button"
          disabled={leaderboardLoading}
          onClick={() => onToggleLeaderboard(!publicLeaderboard)}
        >
          <img src={A.challengeTrophy} alt="" />
          <div>
            <strong>Public Leaderboard</strong>
            <span>{publicLeaderboard ? "Visible" : "Private"}</span>
          </div>
          <i className={publicLeaderboard ? "toggle" : "toggle off"} />
        </button>
            </section>
          </div>
        </details>

        <details className="profile-settings-section identity-tools">
          <summary className="profile-section-summary">
            <div>
              <span>Personalization</span>
              <small>Category names and labels that make the tracker feel like yours.</small>
            </div>
            <b>Labels</b>
          </summary>
          <div className="profile-section-body profile-section-stack">
            <section className="identity-style-summary-card">
              <div>
                <span>Current identity style</span>
                <strong>{selectedIdentityStyle.label}</strong>
                <small>{selectedIdentityStyle.description}</small>
              </div>
              <b>{selectedIdentityStyle.badge}</b>
            </section>
      <details className="clean-details settings-clean-details">
        <summary>
          <div>
            <span>Smart Category Names</span>
            <small>Rename categories without breaking history.</small>
          </div>
          <b>Personal</b>
        </summary>

        <section className="settings-group smart-category-settings">
          <div className="smart-category-explain">
            <strong>Labels only</strong>
            <span>
              This changes how categories look in the app. Old expenses stay connected
              to the same category key, so history and patterns do not break.
            </span>
          </div>

          <div className="smart-category-list">
            {categories.map((cat) => (
              <label className="smart-category-row" key={cat.name}>
                <img src={cat.icon} alt="" />
                <div>
                  <span>{cat.name}</span>
                  <input
                    value={settings.categoryNames[cat.name] ?? cat.name}
                    placeholder={cat.name}
                    onChange={(event) => updateCategoryName(cat.name, event.target.value)}
                  />
                </div>
              </label>
            ))}
          </div>

          <button type="button" className="smart-category-reset" onClick={resetCategoryNames}>
            Reset category names
          </button>
        </section>
      </details>
          </div>
        </details>

        <details className="profile-settings-section reminder-sync-tools">
          <summary className="profile-section-summary">
            <div>
              <span>Notifications & Sync</span>
              <small>Daily reminder, Telegram connection and cloud status.</small>
            </div>
            <b>{settings.dailyReminder ? "Reminder on" : profileConnectionLabel}</b>
          </summary>
          <div className="profile-section-body profile-section-stack">
            <section className="settings-menu profile-section-menu">
        <button
          className="menu-line menu-button"
          onClick={() =>
            setSettings((prev) => ({
              ...prev,
              dailyReminder: !prev.dailyReminder,
            }))
          }
        >
          <img src={A.reminder} alt="" />
          <div>
            <strong>Daily Reminder</strong>
            <span>{settings.dailyReminder ? "On" : "Off"}</span>
          </div>
          <i className={settings.dailyReminder ? "toggle" : "toggle off"} />
        </button>
            </section>
      <details className="tech-details">
        <summary>Sync & connection details</summary>
        <TelegramMiniStatus
          telegram={telegram}
          webAuth={webAuth}
          cloudStatus={cloudStatus}
          cloudError={cloudError}
        />
      </details>
          </div>
        </details>

        <details className="profile-settings-section progress-vault-tools">
          <summary className="profile-section-summary">
            <div>
              <span>Progress Vault</span>
              <small>Streak progress and badges earned from real activity.</small>
            </div>
            <b>{badges.filter((badge) => badge.earned).length}/{badges.length}</b>
          </summary>
          <div className="profile-section-body profile-section-stack">
      <details className="clean-details settings-clean-details">
        <summary>
          <span>Streak Progress</span>
          <b>{streak.currentStreak} days</b>
        </summary>
        <StreakSettingsPanel streak={streak} />
      </details>
      <details className="clean-details settings-clean-details">
        <summary>
          <span>Badge Vault</span>
          <b>{badges.filter((badge) => badge.earned).length}/{badges.length}</b>
        </summary>
        <BadgeVaultPanel badges={badges} />
      </details>
          </div>
        </details>

        <details className="profile-settings-section data-security-tools">
          <summary className="profile-section-summary">
            <div>
              <span>Data & Records</span>
              <small>Tracked records, latest activity and delete-data controls.</small>
            </div>
            <b>{expenses.length} records</b>
          </summary>
          <div className="profile-section-body profile-section-stack">
            <section className="settings-menu profile-section-menu">
        <MenuLine
          icon={A.categories}
          label="Tracked Expenses"
          value={`${expenses.length} total · ${currentMonthExpenses.length} this month`}
        />
        <button className="menu-line menu-button danger" onClick={onReset}>
          <img src={A.deleteData} alt="" />
          <div>
            <strong>Delete My Data</strong>
            <span>Permanent</span>
          </div>
          <b>›</b>
        </button>
            </section>
      <details className="clean-details settings-clean-details">
        <summary>
          <span>Tracked Expenses</span>
          <b>{currentMonthExpenses.length} month</b>
        </summary>
        <section className="tracked-panel">
          <div className="section-title">
            <span>Tracked Expenses</span>
            <small>{money(monthSpent, settings.currency)} this month</small>
          </div>

          <div className="tracked-stats">
            <div>
              <span>Total records</span>
              <strong>{expenses.length}</strong>
            </div>
            <div>
              <span>This month</span>
              <strong>{currentMonthExpenses.length}</strong>
            </div>
            <div>
              <span>Month spent</span>
              <strong>{money(monthSpent, settings.currency)}</strong>
            </div>
          </div>

          <CategorySummaryList
            summaries={categorySummaries}
            currency={settings.currency}
          />
        </section>
      </details>
      <details className="clean-details settings-clean-details">
        <summary>
          <span>Latest Records</span>
          <b>{latestExpenses.length ? `${latestExpenses.length} latest` : "No records"}</b>
        </summary>
        <section className="recent-card">
          <div className="section-title">
            <span>Latest Records</span>
            <small>{latestExpenses.length ? `${latestExpenses.length} latest` : "No records"}</small>
          </div>

          <LatestRecordsList
            expenses={latestExpenses}
            currency={settings.currency}
            onDeleteExpense={onDeleteExpense}
          />
        </section>
      </details>
          </div>
        </details>
      </section>
    </div>
  );
}

function CategorySummaryList({
  summaries,
  currency,
}: {
  summaries: CategorySummary[];
  currency: Currency;
}) {
  if (summaries.length === 0) {
    return (
      <div className="empty-expenses">
        <img src={A.addFrog} alt="" />
        <p>No tracked expenses this month.</p>
      </div>
    );
  }

  return (
    <div className="category-summary-list">
      {summaries.slice(0, 6).map((item) => {
        return (
          <div className="category-summary-row" key={item.category}>
            <img src={item.icon} alt="" />
            <div>
              <strong>{item.category}</strong>
              <span>{item.count} records</span>
            </div>
            <b>{money(item.amount, currency)}</b>
          </div>
        );
      })}
    </div>
  );
}

function LatestRecordsList({
  expenses,
  currency,
  onDeleteExpense,
}: {
  expenses: Expense[];
  currency: Currency;
  onDeleteExpense: (id: string) => void;
}) {
  if (expenses.length === 0) {
    return (
      <div className="empty-expenses">
        <img src={A.addFrog} alt="" />
        <p>No records yet.</p>
      </div>
    );
  }

  return (
    <div className="expense-list">
      {expenses.map((expense) => {
        return (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            currency={currency}
            onDeleteExpense={onDeleteExpense}
          />
        );
      })}    </div>
  );
}

function EditableMoneyLine({
  label,
  value,
  currency,
  onChange,
  plainNumber = false,
  helper = "",
}: {
  label: string;
  value: number;
  currency: Currency;
  onChange: (value: string) => void;
  plainNumber?: boolean;
  helper?: string;
}) {
  const [draftValue, setDraftValue] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!focused) {
        setDraftValue(String(value));
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [focused, value]);

  return (
    <div className="setting-input-line">
      <span>{label}</span>
      <div>
        <small>{plainNumber ? "#" : currencySymbol(currency)}</small>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={focused ? draftValue : value}
          onFocus={(event) => {
            setFocused(true);
            setDraftValue(value === 0 ? "" : String(value));
            window.setTimeout(() => event.currentTarget.select(), 0);
          }}
          onBlur={() => {
            setFocused(false);
            if (draftValue.trim() === "") {
              setDraftValue("0");
              onChange("0");
            }
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setDraftValue(nextValue);
            onChange(nextValue.trim() === "" ? "0" : nextValue);
          }}
        />
      </div>
      {helper && (
        <small className="currency-foundation-note" style={{ gridColumn: "1 / -1" }}>
          {helper}
        </small>
      )}
    </div>
  );
}

function SettingLine({
  label,
  value,
  strong,
  good,
  bad,
}: {
  label: string;
  value: string;
  strong?: boolean;
  good?: boolean;
  bad?: boolean;
}) {
  return (
    <div className={`setting-line ${strong ? "strong" : ""}`}>
      <span>{label}</span>
      <b className={good ? "good" : bad ? "bad" : ""}>{value}</b>
    </div>
  );
}

function MenuLine({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="menu-line">
      <img src={icon} alt="" />
      <div>
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
      <b>›</b>
    </div>
  );
}

function MiniChart({ chartDays }: { chartDays: ChartPoint[] }) {
  const max = Math.max(...chartDays.map((day) => day.pressure), 1);

  return (
    <div className="mini-chart">
      {chartDays.map((day) => {
        const height = clamp(18 + (day.pressure / max) * 62, 14, 80);

        return (
          <i
            key={day.key}
            className={getChartPointClassName(day)}
            style={{ height: `${height}%` }}
            title={`${day.label}: ${getChartPointStatusLabel(day)} · ${day.pressure}% pressure`}
          />
        );
      })}
    </div>
  );
}

function BottomNav({
  activeTab,
  setActiveTab,
  appMode,
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  appMode: AppMode;
}) {
  const visibleItems = appMode === "standard"
    ? navItems.filter((item) => !item.proOnly)
    : navItems;

  return (
    <nav className={`bottom-nav ${appMode === "standard" ? "standard-mode-nav" : "pro-mode-nav"}`}>
      {visibleItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            triggerHaptic("light");
            if (item.id === "chart") markDailyRoutineAction("checkedChart");
            if (item.id === "whatif") markDailyRoutineAction("checkedSave");
            setActiveTab(item.id);
          }}
          className={activeTab === item.id ? "active" : ""}
        >
          <img src={item.icon} alt="" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
