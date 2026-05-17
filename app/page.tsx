"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

type Tab = "home" | "add" | "chart" | "growth" | "whatif" | "settings";
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
};

type OnboardingStarterExpense = {
  category: string;
  amount: number;
  needType: NeedType;
  note: string;
};

type Settings = {
  currency: Currency;
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
  fixedCosts: {
    rent: number;
    utilities: number;
    food: number;
    transport: number;
    phone: number;
    data: number;
    education: number;
  };
  survival: {
    nextPaydayDate: string;
  };
  privacy: {
    publicProofMode: boolean;
  };
  categoryNames: Record<string, string>;
};

type ChartPoint = {
  label: string;
  key: string;
  spent: number;
  open: number;
  close: number;
};

type CategorySummary = {
  category: string;
  amount: number;
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
  | "checkedChart"
  | "checkedSave"
  | "sharedProgress";

type DailyRoutineActions = {
  date: string;
  openedApp: boolean;
  checkedChart: boolean;
  checkedSave: boolean;
  sharedProgress: boolean;
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

type LeakReflectionTone = "needed" | "maybe" | "leak" | "pattern" | "heavy";

type LeakReflection = {
  id: number;
  title: string;
  body: string;
  insight: string;
  amountLabel: string;
  categoryLabel: string;
  needType: NeedType;
  categoryCount: number;
  categoryTotalLabel: string;
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
  openLink?: (url: string) => void;
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
const PROJECT_X_URL = "https://x.com/SmokeIsBroke";
const PROJECT_TG_URL = "https://t.me/SmokeIsBrokeSol";
const TELEGRAM_WEB_APP_SCRIPT = "https://telegram.org/js/telegram-web-app.js";
const TELEGRAM_LOGIN_SCRIPT = "https://telegram.org/js/telegram-widget.js?22";
const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "BrokeLifeTrackerBot";

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

const defaultSettings: Settings = {
  currency: "USD",
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
  fixedCosts: {
    rent: 1200,
    utilities: 200,
    food: 350,
    transport: 150,
    phone: 80,
    data: 0,
    education: 0,
  },
  survival: {
    nextPaydayDate: "",
  },
  privacy: {
    publicProofMode: true,
  },
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
  "Add Expense": "Добавить расход",
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
  "7 real tasks per day.": "7 реальных заданий в день.",
  "Complete the routine through real actions. Finish 7/7 to unlock the daily XP reward.": "Выполняй рутину реальными действиями. Закрой 7/7, чтобы получить дневной XP.",
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
  "Check Save plan": "Проверить план экономии",
  "Open Save and review one What If scenario.": "Открой Экономию и проверь один сценарий What If.",
  "Share public proof": "Поделиться публичным прогрессом",
  "Share or copy a safe progress card. No private money data.": "Поделись или скопируй безопасную карточку прогресса. Без личных финансовых данных.",
  "Discipline rule:": "Правило дисциплины:",
  "you cannot tap tasks complete. Complete the action, then the checkmark appears.": "нельзя просто нажать и закрыть задание. Сделай действие — тогда появится галочка.",
  "Daily XP unlocked": "Дневной XP открыт",
  "+50 XP claimed": "+50 XP получено",
  "XP claimed": "XP получен",
  "7/7 complete": "7/7 выполнено",
  "7/7 real tasks can reward daily XP once per day.": "7/7 реальных заданий дают дневной XP один раз в день.",
  "Connect Telegram to claim routine XP.": "Подключи Telegram, чтобы получить XP за рутину.",
  "Daily routine complete": "Ежедневная рутина выполнена",
  "XP already claimed or daily cap reached.": "XP уже получен или достигнут дневной лимит.",
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
  "Small changes.": "Маленькие изменения.",
  "Big wins.": "Большая разница.",
  "Potential savings": "Потенциальная экономия",
  "Total Potential Savings": "Общая потенциальная экономия",
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
  "Connection details": "Детали подключения",
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
  "Complete 7 real daily actions: open app, track expense, mark a leak, add context, check chart, check Save, and share public proof.": "Выполни 7 реальных действий в день: открыть app, записать расход, отметить утечку, добавить контекст, проверить график, проверить экономию и поделиться безопасным прогрессом.",
  "Survival Score, Biggest Leak, Hours Lost, Status and Doomspending Alert show what is draining your wallet this week.": "Оценка выживания, главная утечка, потерянные часы, статус и тревога импульсивных трат показывают, что сливает кошелёк на этой неделе.",
  "The chart shows how your balance moves like a trading chart. Green days are controlled. Red days show damage.": "График показывает движение баланса как торговый chart. Зелёные дни — контроль. Красные — урон.",
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
  "Add one expense and this screen turns into your wallet movement chart.": "Добавь один расход, и этот экран превратится в график движения кошелька.",
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
  "What If Scenarios": "Сценарии What If",
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
  "Use my leaks": "Использовать мои утечки",
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
  "Create one monthly leak plan and save it here.": "Создай симуляцию и сохрани её здесь.",
  "Growth card saved. Share text copied.": "Карточка роста сохранена. Текст скопирован.",
  "Growth plan copied.": "План роста скопирован.",
  "Leak to Growth Plan": "План утечки в рост",
  "Simulation only. No guaranteed returns.": "Только симуляция. Доход не гарантируется.",
  "Find the leak. Redirect it into growth.": "Найди утечку. Перенаправь её в рост.",
  "Generate share card": "Создать карточку",
  "Creating card...": "Создаём карточку...",
  "Saving goal card ready": "Карточка роста готова",
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
  "It is completed when the user really opens the app, tracks expenses, marks leaks, checks charts, checks Save, and shares progress.": "Она выполняется, когда пользователь реально открывает app, записывает расходы, отмечает утечки, смотрит график, проверяет Save и делится прогрессом.",
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
  "Honest marking makes Wallet HP, Save, Chart, and Growth Lab much more accurate.": "Честная отметка делает Wallet HP, Save, Chart и Growth Lab намного точнее.",
  "4. Add notes when context matters": "4. Добавляй заметки, когда важен контекст",
  "Notes explain why the expense happened.": "Заметки объясняют, почему случилась трата.",
  "This helps users notice emotional spending, boredom spending, stress spending, or routine habits.": "Это помогает замечать эмоциональные траты, траты от скуки, стрессовые покупки или привычки.",
  "A short note is enough. The goal is awareness, not paperwork.": "Короткой заметки достаточно. Цель — осознанность, а не бюрократия.",
  "5. Use quick add carefully": "5. Используй Quick Add аккуратно",
  "Quick Add is for repeated expenses.": "Quick Add нужен для повторяющихся расходов.",
  "It is fast, but the amount should still be checked.": "Это быстро, но сумму всё равно нужно проверять.",
  "If the quick amount is wrong, edit it before saving the record.": "Если быстрая сумма неправильная, измени её перед сохранением.",
  "Chart Guide": "Гайд Chart",
  "$BROKE Chart: Wallet Movement": "$BROKE Chart: движение кошелька",
  "Chart turns spending into a visual movement system. It helps users see red days, pressure, spending volume, and the habits that move the wallet down.": "Chart превращает расходы в визуальное движение. Он помогает видеть красные дни, давление, объём расходов и привычки, которые тянут кошелёк вниз.",
  "Chart rule": "Правило Chart",
  "Do not only watch crypto charts. Watch your own wallet chart and find the day where the leak started.": "Смотри не только crypto-чарты. Смотри свой график кошелька и находи день, где началась утечка.",
  "1. Choose the right range": "1. Выбери правильный период",
  "Day shows the current daily damage.": "Day показывает текущий дневной урон.",
  "Week shows the last seven days and is best for habits.": "Week показывает последние семь дней и лучше всего подходит для привычек.",
  "Month shows the larger pressure across the current month.": "Month показывает большее давление за текущий месяц.",
  "Switch ranges to understand whether a leak is temporary or becoming normal.": "Переключай периоды, чтобы понять, утечка временная или уже становится нормой.",
  "2. Read spending volume": "2. Читай spending volume",
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
  "2. Use my leaks": "2. Используй Use my leaks",
  "Use my leaks reads the tracked Not needed and Maybe expenses.": "Use my leaks берёт записанные расходы Not needed и Maybe.",
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
  "Save Guide": "Гайд Save",
  "Save: What If Scenarios": "Save: сценарии What If",
  "Save shows what could be saved if one leak was reduced. It is the practical side of $BROKE: stop one leak, protect Wallet HP, and build proof of progress.": "Save показывает, сколько можно сохранить, если уменьшить одну утечку. Это практическая часть $BROKE: остановить утечку, защитить Wallet HP и создать proof of progress.",
  "Save rule": "Правило Save",
  "Pick one realistic reduction. A small reduction that actually happens is stronger than a perfect plan that nobody follows.": "Выбери одно реалистичное сокращение. Маленькое сокращение, которое реально выполняется, сильнее идеального плана, которого никто не придерживается.",
  "1. Read potential savings": "1. Читай potential savings",
  "Potential savings shows how much could be protected if spending is reduced.": "Potential savings показывает, сколько можно защитить, если уменьшить расходы.",
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
  "5. Use Save with Growth Lab": "5. Используй Save вместе с Growth Lab",
  "Save shows what can be reduced.": "Save показывает, что можно уменьшить.",
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
  "Track one real expense to unlock Wallet HP, Chart movement, Save scenarios, Growth Lab and share cards.": "Запиши один реальный расход, чтобы открыть Wallet HP, движение графика, Save-сценарии, Growth Lab и share-карточки.",
  "Add first expense": "Добавь первый расход",
  "Use a real spend, not a fake test.": "Используй реальную трату, не фейковый тест.",
  "Mark the leak": "Отметь утечку",
  "Needed, Maybe or Not needed.": "Needed, Maybe или Not needed.",
  "Unlock the system": "Открой систему",
  "Chart, Save, Growth and reports become real.": "Chart, Save, Growth и отчёты станут реальными.",
  "No leaks tracked yet.": "Утечки пока не записаны.",
  "Add your first expense to make Wallet HP, Chart and Growth Lab real.": "Добавь первый расход, чтобы Wallet HP, Chart и Growth Lab стали реальными.",
  "$BROKE Chart is waiting": "$BROKE Chart ждёт",
  "No wallet movement yet.": "Пока нет движения кошелька.",
  "Track one expense to create the first candle, spending volume and leak pressure.": "Запиши один расход, чтобы создать первую свечу, spending volume и leak pressure.",
  "Track first expense": "Записать первый расход",
  "Growth Lab needs a real leak": "Growth Lab нужна реальная утечка",
  "No leaks detected yet.": "Утечки пока не найдены.",
  "Add one Not needed or Maybe expense first. Then Growth Lab can turn that leak into a realistic simulation.": "Сначала добавь один расход Not needed или Maybe. Затем Growth Lab сможет превратить эту утечку в реалистичную симуляцию.",
  "Add first leak": "Добавить первую утечку",
  "Save is in demo mode": "Save в демо-режиме",
  "No real scenarios yet.": "Пока нет реальных сценариев.",
  "Add expenses first. Then $BROKE will show what you could save by reducing your real leaks.": "Сначала добавь расходы. Затем $BROKE покажет, сколько можно сохранить, уменьшая реальные утечки.",
  "Add expense to unlock Save": "Добавить расход, чтобы открыть Save",
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
  "One real expense unlocks Wallet HP, Chart, Save, Growth Lab and public share cards.": "Один реальный расход открывает Wallet HP, Chart, Save, Growth Lab и публичные share-карточки.",
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
  "Analysis Lab": "Лаборатория анализа",
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
  "Add bills or planned expenses. Each row has its own 1m / 12m switch.": "Добавь счета или плановые расходы. У каждой строки свой переключатель 1m / 12m.",
  "Cost name": "Название расхода",
  "Planned cost name": "Название планового расхода",
  "Planned cost monthly amount": "Месячная сумма планового расхода",
  "Remove planned cost": "Удалить плановый расход",
  "What are you saving for?": "На что ты копишь?",
  "Choose a name or type your own. The amount is always yours.": "Выбери название или введи своё. Сумму всегда вводишь сам.",
  "Buy a laptop": "Купить ноутбук",
  "+ Add planned cost": "+ Добавить плановый расход",
  "Share Saving Goal card": "Поделиться карточкой цели",
  "Monthly leaks into a personal saving goal": "Месячные утечки в личную цель накопления",
  "Monthly Leak Plan": "Месячный план утечек",
  "Turn this month’s leaks into a real goal plan.": "Преврати утечки этого месяца в реальный план цели.",
  "Create monthly leak plan": "Создать месячный план утечек",
  "Plan name": "Название плана",
  "Redirected amount": "Перенаправленная сумма",
  "Planner": "Планировщик",
  "Total redirected": "Всего перенаправлено",
  "Plan value": "Сумма плана",
  "Saved plans": "Сохранённые планы",
  "No investment assumptions here. This plan simply redirects monthly leaks toward costs or a saving goal.": "Здесь нет инвестиционных предположений. План просто перенаправляет месячные утечки в расходы или цель накопления.",
  "Growth Lab: Monthly Leak Plan": "Growth Lab: месячный план утечек",
  "Growth Lab uses Monthly leaks from the current month and turns them into a simple plan. It does not talk about investing. It does not hold money. It only shows what monthly leaks could cover or help you save toward.": "Growth Lab берёт утечки этого месяца и превращает их в простой план. Он не про инвестиции и не хранит деньги. Он показывает, что месячные утечки могли бы покрыть или к какой цели помочь двигаться.",
  "This is planning only: no deposits, no custody, no staking, no investments, no guaranteed returns, and no financial advice.": "Это только планирование: без депозитов, хранения средств, стейкинга, инвестиций, гарантированной доходности и финансового совета.",
  "1. Use Monthly leaks": "1. Используй месячные утечки",
  "Growth Lab reads the current month’s Not needed and Maybe expenses.": "Growth Lab читает расходы Not needed и Maybe за текущий месяц.",
  "Use my leaks turns the monthly leak amount into a monthly redirected amount.": "Use my leaks превращает сумму месячных утечек в месячную перенаправленную сумму.",
  "This keeps the plan connected to real tracked app data, not random numbers.": "Так план связан с реальными данными приложения, а не случайными цифрами.",
  "2. Planned costs": "2. Плановые расходы",
  "Planned costs are bills or future expenses the user wants to cover.": "Плановые расходы — это счета или будущие траты, которые пользователь хочет покрыть.",
  "Examples: insurance, rent, school fees, repairs, family support, or any planned cost.": "Примеры: страховка, аренда, учёба, ремонт, поддержка семьи или любой плановый расход.",
  "Each row has its own 1m / 12m switch because some costs are monthly and some are yearly.": "У каждой строки свой переключатель 1m / 12m, потому что одни расходы месячные, а другие годовые.",
  "3. Saving goal": "3. Цель накопления",
  "Saving goal is the thing the user is actually building toward.": "Цель накопления — это то, к чему пользователь реально идёт.",
  "The user can choose a quick name or type their own goal.": "Пользователь может выбрать быстрое название или ввести свою цель.",
  "The target amount is always entered manually by the user.": "Целевая сумма всегда вводится пользователем вручную.",
  "The app shows how long it may take if monthly leaks are redirected into that goal.": "Приложение показывает, сколько времени может занять цель, если перенаправить месячные утечки.",
  "4. Share Saving Goal card": "4. Поделись карточкой цели",
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



function normalizeSettings(input?: Partial<Settings> | null): Settings {
  return {
    ...defaultSettings,
    ...(input || {}),
    profile: {
      ...defaultSettings.profile,
      ...(input?.profile || {}),
    },
    income: {
      ...defaultSettings.income,
      ...(input?.income || {}),
    },
    fixedCosts: {
      ...defaultSettings.fixedCosts,
      ...(input?.fixedCosts || {}),
    },
    survival: {
      ...defaultSettings.survival,
      ...(input?.survival || {}),
    },
    privacy: {
      ...defaultSettings.privacy,
      ...(input?.privacy || {}),
    },
    categoryNames: {
      ...defaultCategoryNames,
      ...(input?.categoryNames || {}),
    },
  };
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
    currency: preset.currency,
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
}[] = [
  { id: "home", label: "Home", icon: "/nav-home.png" },
  { id: "add", label: "Add", icon: "/nav-add.png" },
  { id: "chart", label: "Chart", icon: "/nav-chart.png" },
  { id: "growth", label: "Growth", icon: "/nav-growth.png" },
  { id: "whatif", label: "Save", icon: "/nav-save.png" },
  { id: "settings", label: "Settings", icon: "/nav-settings.png" },
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

function writeDailyRoutineActions(actions: DailyRoutineActions) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DAILY_ROUTINE_ACTIONS_KEY, JSON.stringify(actions));
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

function writeDailyRoutineReward(date = dayKey(new Date()), claimed = true) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      DAILY_ROUTINE_REWARD_KEY,
      JSON.stringify({
        date,
        claimed,
      })
    );
  } catch {
    // XP reward marker is optional. Ignore storage errors.
  }
}


function currencySymbol(currency: Currency) {
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

function money(value: number, currency: Currency) {
  const symbol = currencySymbol(currency);
  const abs = Math.abs(Math.round(value)).toLocaleString("en-US");
  return value < 0 ? `-${symbol}${abs}` : `${symbol}${abs}`;
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
  const spentThisMonth = sum(expenses.map((expense) => expense.amount));
  const realBalance = totalIncome - fixedCosts - spentThisMonth;
  const daysUntilIncome = getDaysUntilIncome(settings);
  const nextPaydayDate = getNextPaydayDate(settings);
  const safeDailyBudget = Math.max(realBalance, 0) / Math.max(daysUntilIncome, 1);
  const elapsedDays = getElapsedMonthDays();
  const currentDailyPace = spentThisMonth > 0 ? spentThisMonth / elapsedDays : 0;
  const leakDailyPace =
    sum(
      expenses
        .filter((expense) => expense.needType !== "Needed")
        .map((expense) => (expense.needType === "Maybe" ? expense.amount * 0.5 : expense.amount))
    ) / elapsedDays;

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

function getCategorySummaries(expenses: Expense[]): CategorySummary[] {
  const map = new Map<string, { amount: number; count: number }>();

  for (const expense of expenses) {
    const current = map.get(expense.category) || { amount: 0, count: 0 };

    map.set(expense.category, {
      amount: current.amount + expense.amount,
      count: current.count + 1,
    });
  }

  return Array.from(map.entries())
    .map(([category, value]) => ({
      category,
      amount: value.amount,
      count: value.count,
      icon: getCategoryIcon(category),
    }))
    .sort((a, b) => b.amount - a.amount);
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

function getExpenseLeakValue(expense: Expense) {
  if (expense.needType === "Needed") return 0;
  if (expense.needType === "Maybe") return expense.amount * 0.5;
  return expense.amount;
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
  const categoryText = sentenceCase(categoryLabel(expense.category));
  const tenTimes = money(expense.amount * 10, settings.currency);
  const monthlyPace = money(categoryTotal, settings.currency);
  const icon = getCategoryIcon(expense.category);

  let tone: LeakReflectionTone = "leak";
  let title = "Leak recorded";
  let body = "This expense is now part of your wallet history.";
  let insight = "Small actions are only small until they repeat.";

  if (expense.needType === "Needed") {
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
    categoryLabel: categoryText,
    needType: expense.needType,
    categoryCount,
    categoryTotalLabel: monthlyPace,
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
  const totalSpent = sum(expenses.map((expense) => expense.amount));
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
    const amountLabel = money(item.total, settings.currency);
    const averageLabel = money(item.average, settings.currency);

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
        total: item.total,
        average: item.average,
        severity: item.count >= 10 || item.sharePercent >= 30 ? "high" : "medium",
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
        total: item.total,
        average: item.average,
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
        total: item.total,
        average: item.average,
        severity: "medium",
        tag: "Weekend leak",
      });
    }

    if (item.count <= 3 && item.total >= archive.totalSpent * 0.28 && item.total > 0) {
      patterns.push({
        id: `${item.category}-heavy`,
        category: item.category,
        icon: item.icon,
        title: `${label} is a heavy-hit leak`,
        body: `${item.count} purchase${item.count === 1 ? "" : "s"} created ${amountLabel} in pressure.`,
        why: "This is not frequent, but each hit is large enough to move the month.",
        fix: `Before the next ${label} purchase, wait 24 hours or set a hard cap.`,
        count: item.count,
        total: item.total,
        average: item.average,
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
        average: item.average,
        severity: notNeededCount >= maybeCount ? "high" : "medium",
        tag: "Decision leak",
      });
    }

    if (item.count >= 4 && item.average <= Math.max(5, archive.totalSpent * 0.04)) {
      patterns.push({
        id: `${item.category}-small`,
        category: item.category,
        icon: item.icon,
        title: `${label} is a small-leak pattern`,
        body: `${item.count} purchases with an average of ${averageLabel}.`,
        why: "The single purchase feels harmless. The pattern is what makes it expensive.",
        fix: `Reduce the number of repeats, not only the price.`,
        count: item.count,
        total: item.total,
        average: item.average,
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
  const totalSpent = sum(weekExpenses.map((expense) => expense.amount));
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

  const leakCategories = getCategorySummaries(
    monthExpenses.filter((expense) => expense.needType !== "Needed")
  );
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
    webApp.openLink(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
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

function writeLocalLeakMission(mission: LocalLeakMission | null) {
  if (typeof window === "undefined") return;

  try {
    if (!mission) {
      window.localStorage.removeItem(LEAK_MISSION_KEY);
      return;
    }

    window.localStorage.setItem(LEAK_MISSION_KEY, JSON.stringify(mission));
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

  const spent = sum(
    expenses
      .filter((expense) => {
        const created = new Date(expense.createdAt);
        return (
          created >= start &&
          created <= end &&
          expense.category === mission.category &&
          expense.needType !== "Needed"
        );
      })
      .map((expense) => (expense.needType === "Maybe" ? expense.amount * 0.5 : expense.amount))
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

function buildWalletInsights(expenses: Expense[], settings: Settings): WalletInsight[] {
  const insights: WalletInsight[] = [];
  const todayExpenses = getTodayExpenses(expenses);
  const weekExpenses = getLastSevenDaysExpenses(expenses);
  const monthExpenses = getCurrentMonthExpenses(expenses);

  const todayCategories = getCategorySummaries(todayExpenses)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const weekCategories = getCategorySummaries(weekExpenses)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const monthCategories = getCategorySummaries(monthExpenses)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalIncome = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);
  const availableAfterLifeCost = Math.max(totalIncome - fixedCosts, 1);

  const notNeededWeek = sum(
    weekExpenses.filter((item) => item.needType === "Not needed").map((item) => item.amount)
  );
  const maybeWeek = sum(
    weekExpenses.filter((item) => item.needType === "Maybe").map((item) => item.amount * 0.5)
  );
  const weekLeaks = notNeededWeek + maybeWeek;

  const notNeededMonth = sum(
    monthExpenses.filter((item) => item.needType === "Not needed").map((item) => item.amount)
  );
  const maybeMonth = sum(
    monthExpenses.filter((item) => item.needType === "Maybe").map((item) => item.amount * 0.5)
  );
  const monthLeaks = notNeededMonth + maybeMonth;

  const monthSpent = sum(monthExpenses.map((item) => item.amount));
  const realBalance = totalIncome - fixedCosts - monthSpent;
  const walletHp = clamp(
    100 - Math.round((monthLeaks / availableAfterLifeCost) * 100),
    5,
    100
  );

  const todayTop = todayCategories[0];

  if (todayTop) {
    insights.push({
      id: "daily_projection",
      title: "Today’s leak",
      body: `You spent ${money(todayTop.amount, settings.currency)} on ${categoryLabel(todayTop.category)} today.`,
      detail: `That becomes ${money(todayTop.amount * 30, settings.currency)}/month if this rhythm repeats.`,
      icon: getCategoryIcon(todayTop.category),
      tone: todayTop.amount >= availableAfterLifeCost * 0.06 ? "red" : "orange",
    });
  }

  const weekTop = weekCategories[0];

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

  const repeating = weekCategories.find((item) => item.count >= 3);

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
  const monthTop = monthCategories[0];
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
  const smallLeaks = monthExpenses.filter(
    (expense) => expense.needType !== "Needed" && expense.amount <= smallLeakLimit
  );

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

  const neededWeek = sum(weekExpenses.filter((item) => item.needType === "Needed").map((item) => item.amount));

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


  const challengeCategory = weekCategories.find((item) =>
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
  const weekLeakExpenses = weekExpenses.filter((expense) => expense.needType !== "Needed");
  const monthLeakExpenses = monthExpenses.filter((expense) => expense.needType !== "Needed");

  const weeklyLeaks = sum(
    weekLeakExpenses.map((expense) =>
      expense.needType === "Maybe" ? expense.amount * 0.5 : expense.amount
    )
  );

  const monthlyLeaks = sum(
    monthLeakExpenses.map((expense) =>
      expense.needType === "Maybe" ? expense.amount * 0.5 : expense.amount
    )
  );

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

  const biggestLeak = getCategorySummaries(weekLeakExpenses)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0];

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


function buildChartData(
  range: ChartRange,
  expenses: Expense[],
  settings: Settings
): ChartPoint[] {
  const totalIncome = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);
  const baseBalance = totalIncome - fixedCosts;
  const now = new Date();

  if (range === "day") {
    const points: ChartPoint[] = [];
    const today = dayKey(now);
    let runningBalance = baseBalance;

    for (let hour = 0; hour < 24; hour++) {
      const spent = sum(
        expenses
          .filter((expense) => {
            const date = new Date(expense.createdAt);
            return dayKey(date) === today && date.getHours() === hour;
          })
          .map((expense) => expense.amount)
      );

      const open = runningBalance;
      const close = runningBalance - spent;

      points.push({
        label: `${String(hour).padStart(2, "0")}:00`,
        key: `${today}-${hour}`,
        spent,
        open,
        close,
      });

      runningBalance = close;
    }

    return points;
  }

  if (range === "week") {
    const points: ChartPoint[] = [];
    let runningBalance = baseBalance;

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const key = dayKey(date);

      const spent = sum(
        expenses
          .filter((expense) => dayKey(new Date(expense.createdAt)) === key)
          .map((expense) => expense.amount)
      );

      const open = runningBalance;
      const close = runningBalance - spent;

      points.push({
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        key,
        spent,
        open,
        close,
      });

      runningBalance = close;
    }

    return points;
  }

  const points: ChartPoint[] = [];
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();
  let runningBalance = baseBalance;

  for (let day = 1; day <= todayDate; day++) {
    const date = new Date(year, month, day);
    const key = dayKey(date);

    const spent = sum(
      expenses
        .filter((expense) => dayKey(new Date(expense.createdAt)) === key)
        .map((expense) => expense.amount)
    );

    const open = runningBalance;
    const close = runningBalance - spent;

    points.push({
      label: String(day),
      key,
      spent,
      open,
      close,
    });

    runningBalance = close;
  }

  return points;
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
  const [toast, setToast] = useState<AppToast | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [leakMission, setLeakMission] = useState<LocalLeakMission | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const openAppTrackedRef = useRef(false);
  const badgesReadyRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);

  const [amount, setAmount] = useState("25.00");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Coffee");
  const [expenseType, setExpenseType] = useState<NeedType>("Needed");
  const [lastTrackedExpense, setLastTrackedExpense] = useState<Expense | null>(null);
  const [leakReflection, setLeakReflection] = useState<LeakReflection | null>(null);

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
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
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
        };

        if (parsed.settings) {
          setSettings(normalizeSettings(parsed.settings));
        }

        if (Array.isArray(parsed.expenses)) {
          setExpenses(parsed.expenses);
        }

        if (parsed.onboardingCompleted === true) {
          setOnboardingCompleted(true);
        }
      }

      if (localStorage.getItem(ONBOARDING_KEY) === "true") {
        setOnboardingCompleted(true);
      }

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
          },
        });

        if (cancelled) return;

        if (data.settings) setSettings(normalizeSettings(data.settings));
        if (data.expenses) setExpenses(data.expenses);
        if (data.streak) setStreak(data.streak);
        if (data.challengeTemplates) setChallengeTemplates(data.challengeTemplates);
        if ("activeChallenge" in data) setActiveChallenge(data.activeChallenge ?? null);
        if ("challengeProgress" in data) setChallengeProgress(data.challengeProgress ?? null);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.badges) applyBadges(data.badges, true);

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
      })
    );
  }, [loaded, settings, expenses, onboardingCompleted]);

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

  const currentMonthExpenses = useMemo(() => {
    return getCurrentMonthExpenses(expenses);
  }, [expenses]);

  const totalIncome = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);
  const spentThisMonth = sum(currentMonthExpenses.map((e) => e.amount));

  const moneyLeaks = sum(
    currentMonthExpenses
      .filter((e) => e.needType === "Not needed")
      .map((e) => e.amount)
  );

  const maybeLeaks = sum(
    currentMonthExpenses
      .filter((e) => e.needType === "Maybe")
      .map((e) => e.amount * 0.5)
  );

  const totalLeaks = moneyLeaks + maybeLeaks;
  const realBalance = totalIncome - fixedCosts - spentThisMonth;
  const availableAfterLifeCost = Math.max(totalIncome - fixedCosts, 1);

  const walletHp = clamp(
    100 - Math.round((totalLeaks / availableAfterLifeCost) * 100),
    5,
    100
  );

  const todaySpent = useMemo(() => {
    const today = dayKey(new Date());

    return sum(
      expenses
        .filter((e) => dayKey(new Date(e.createdAt)) === today)
        .map((e) => e.amount)
    );
  }, [expenses]);

  const chartDays = useMemo(() => {
    return buildChartData("week", expenses, settings);
  }, [expenses, settings]);

  const localStreak = useMemo(() => {
    return calculateStreakFromExpenses(expenses);
  }, [expenses]);

  const activeStreak = cloudAuthReady && cloudStatus === "cloud" ? streak : localStreak;

  const walletInsights = useMemo(() => {
    return buildWalletInsights(expenses, settings);
  }, [expenses, settings]);

  async function addExpense() {
    const value = safeNumber(amount);

    if (value <= 0) return;

    const expense: Expense = {
      id: uid(),
      amount: value,
      category: selectedCategory,
      needType: expenseType,
      note,
      createdAt: new Date().toISOString(),
    };

    const nextExpenses = [expense, ...expenses];

    triggerHaptic("success");
    setExpenses((prev) => [expense, ...prev]);
    setLastTrackedExpense(expense);
    setLeakReflection(buildLeakReflection(expense, nextExpenses, settings));
    setAmount("");
    setNote("");
    setExpenseType("Needed");
    setActiveTab("add");

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
    };

    const nextExpenses = [expense, ...expenses];

    triggerHaptic("success");
    setExpenses((prev) => [expense, ...prev]);
    setLastTrackedExpense(expense);
    setLeakReflection(buildLeakReflection(expense, nextExpenses, settings));
    setAmount("");
    setNote("");
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
      window.alert("Connect Telegram to sync your account and start challenges.");
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

  async function claimDailyRoutineReward() {
    const today = dayKey(new Date());
    const reward = readDailyRoutineReward(today);

    if (reward.claimed) {
      return true;
    }

    if (!cloudAuthReady) {
      showToast("Daily routine complete", "Connect Telegram to claim XP.", "info");
      return false;
    }

    const data = await trackXpAction("daily_streak", "Daily routine complete");

    if (data?.ok) {
      writeDailyRoutineReward(today, true);

      if (!data.xpAwarded || data.xpAwarded <= 0) {
        showToast("Daily routine complete", "XP already claimed or daily cap reached.", "info");
      }

      return true;
    }

    return false;
  }

  async function toggleLeaderboardPublic(nextValue: boolean) {
    if (!cloudAuthReady) {
      window.alert("Connect Telegram to use the public leaderboard.");
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
            settings={settings}
            summary={summary}
            badges={badges}
            walletInsights={walletInsights}
            chartDays={chartDays}
            leaderboard={leaderboard}
            expenses={currentMonthExpenses.slice(0, 6)}
            routineExpenses={currentMonthExpenses}
            allExpenses={expenses}
            leakMission={leakMission}
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
            onRoutineComplete={claimDailyRoutineReward}
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
            lastTrackedExpense={lastTrackedExpense}
            onAdd={addExpense}
            onBack={goHome}
            onHelp={openHelp}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "chart" && (
          <ChartScreen
            settings={settings}
            expenses={expenses}
            walletInsights={walletInsights}
            shareInitData={telegram.isTelegram ? telegram.initData : ""}
            onBack={goHome}
            onExport={openExportHelp}
            onOpenAdd={() => setActiveTab("add")}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "growth" && (
          <GrowthLabScreen
            settings={settings}
            expenses={currentMonthExpenses}
            shareInitData={telegram.isTelegram ? telegram.initData : ""}
            onBack={goHome}
            onHelp={openHelp}
            onOpenAdd={() => setActiveTab("add")}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "whatif" && (
          <WhatIfScreen
            settings={settings}
            setSettings={setSettings}
            expenses={currentMonthExpenses}
            challengeTemplates={challengeTemplates}
            activeChallenge={activeChallenge}
            challengeProgress={challengeProgress}
            challengeLoading={challengeLoading}
            leaderboard={leaderboard}
            leaderboardLoading={leaderboardLoading}
            shareInitData={telegram.isTelegram ? telegram.initData : ""}
            onToggleLeaderboard={toggleLeaderboardPublic}
            onStartChallenge={startChallenge}
            onBack={goHome}
            onHelp={openHelp}
            onOpenAdd={() => setActiveTab("add")}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "settings" && (
          <SettingsScreen
            settings={settings}
            setSettings={setSettings}
            expenses={expenses}
            currentMonthExpenses={currentMonthExpenses}
            onReset={resetData}
            onDeleteExpense={deleteExpense}
            telegram={telegram}
            webAuth={webAuth}
            cloudStatus={cloudStatus}
            cloudError={cloudError}
            streak={activeStreak}
            badges={badges}
            leaderboard={leaderboard}
            leaderboardLoading={leaderboardLoading}
            onToggleLeaderboard={toggleLeaderboardPublic}
            onBack={goHome}
            onHelp={openHelp}
          />
        )}

        {loaded && onboardingCompleted && (
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
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
      eyebrow: "Home Guide",
      title: "Home: Wallet Command Center",
      intro:
        "Home is the daily command center. Use it to track one honest expense, read Wallet HP, follow today’s focus, and continue without digging through every report.",
      icon: "/nav-home.png",
      footerTitle: "Daily Home rule",
      footerBody:
        "Home should answer one question: what should I do right now? Track honestly, then move to Chart only when you want analysis.",
      sections: [
        {
          title: "1. Read the four main numbers",
          body: [
            "Income shows the money you planned for the period.",
            "Life Cost shows fixed costs like rent, bills, transport, food basics, and required expenses.",
            "Money Leaks shows optional or questionable spending that can quietly drain the wallet.",
            "Real Balance shows what is left after costs and tracked spending.",
          ],
          icon: A.walletHp,
        },
        {
          title: "2. Understand Wallet HP",
          body: [
            "Wallet HP is the health score of the wallet.",
            "High HP means the wallet is stable.",
            "Low HP means leaks are putting pressure on the month.",
            "The goal is not perfection. The goal is to keep HP alive by reducing the loudest leak.",
          ],
          icon: A.walletMascot,
        },
        {
          title: "3. Use Next Best Action",
          body: [
            "Next Best Action tells the user what to do now.",
            "It can suggest adding the first record, controlling the biggest leak, checking the chart, or sharing safe progress.",
            "This keeps the app from feeling like a notebook and turns it into a daily discipline tool.",
          ],
          icon: A.progressFlame,
        },
        {
          title: "4. Check reports and cards",
          body: [
            "Share Reports summarize what happened without exposing private income.",
            "Share cards are safe for Telegram or X because they focus on status, Wallet HP, score, leaks, and public progress.",
            "Use reports when you want community proof without showing sensitive numbers.",
          ],
          icon: A.export,
        },
        {
          title: "5. Complete the daily routine",
          body: [
            "The routine is not a fake one-click task.",
            "It is completed when the user really opens the app, tracks expenses, marks leaks, checks charts, checks Save, and shares progress.",
            "This makes $BROKE feel like discipline, not just finance tracking.",
          ],
          icon: A.dailyCheck,
        },
      ],
    },
    add: {
      label: "Add",
      eyebrow: "Add Guide",
      title: "Add: Track Expenses Correctly",
      intro:
        "Add is where the app becomes honest. Every useful chart, leak score, Growth simulation, and report depends on real records here.",
      icon: "/nav-add.png",
      footerTitle: "Add rule",
      footerBody:
        "Track the expense immediately, choose the real category, and mark Needed / Maybe / Not needed honestly.",
      sections: [
        {
          title: "1. Enter the real amount",
          body: [
            "Use the amount field for the exact spending amount.",
            "Small expenses matter because repeated small leaks become monthly damage.",
            "Do not wait until the end of the week if you can track the expense now.",
          ],
          icon: A.addFrog,
        },
        {
          title: "2. Choose the right category",
          body: [
            "Categories make the biggest leak visible.",
            "Coffee, smoking, takeout, shopping, transport, subscriptions, and custom categories should be used consistently.",
            "If the same habit is tracked under different names, the app cannot detect the leak properly.",
          ],
          icon: A.categories,
        },
        {
          title: "3. Mark Needed / Maybe / Not needed",
          body: [
            "Needed means the expense was necessary and does not count as a leak.",
            "Maybe means the expense was questionable and counts as half pressure.",
            "Not needed means it was a full money leak.",
            "Honest marking makes Wallet HP, Save, Chart, and Growth Lab much more accurate.",
          ],
          icon: A.leaks,
        },
        {
          title: "4. Add notes when context matters",
          body: [
            "Notes explain why the expense happened.",
            "This helps users notice emotional spending, boredom spending, stress spending, or routine habits.",
            "A short note is enough. The goal is awareness, not paperwork.",
          ],
          icon: A.pencil,
        },
        {
          title: "5. Use quick add carefully",
          body: [
            "Quick Add is for repeated expenses.",
            "It is fast, but the amount should still be checked.",
            "If the quick amount is wrong, edit it before saving the record.",
          ],
          icon: A.navAdd,
        },
      ],
    },
    chart: {
      label: "Chart",
      eyebrow: "Chart Guide",
      title: "$BROKE Chart: Analysis Center",
      intro:
        "Chart is wallet memory and analysis. It shows movement first, then one fix, Analysis Lab, Leak Streaks, Weekly Review, and Monthly History.",
      icon: "/nav-chart.png",
      footerTitle: "Chart rule",
      footerBody:
        "Start with the chart, follow One Fix, then open Analysis Lab or History only when you need deeper detail.",
      sections: [
        {
          title: "1. Choose the right range",
          body: [
            "Day shows the current daily damage.",
            "Week shows the last seven days and is best for habits.",
            "Month shows the larger pressure across the current month.",
            "Switch ranges to understand whether a leak is temporary or becoming normal.",
          ],
          icon: A.navChart,
        },
        {
          title: "2. Read spending volume",
          body: [
            "Spending volume shows how heavy the outgoing money was.",
            "A high volume day is not always bad if it was needed.",
            "A high volume day with Not needed or Maybe expenses is a warning signal.",
          ],
          icon: A.chartFrog,
        },
        {
          title: "3. Find the top category",
          body: [
            "Top category shows the strongest spending movement in the selected period.",
            "If the same category keeps appearing, it is probably a lifestyle leak.",
            "This is the category to control first.",
          ],
          icon: A.leaks,
        },
        {
          title: "4. Use Analysis Lab",
          body: [
            "Analysis Lab explains patterns, repeated leaks, and category streaks in plain language.",
            "It turns repeated records into one clear action.",
            "Use One Fix when you do not know what to fix next.",
          ],
          icon: A.walletMascot,
        },
        {
          title: "5. Share only safe chart context",
          body: [
            "Chart data can be emotional and personal.",
            "Public sharing should avoid private income and real balance.",
            "Use clean share cards or public summaries instead of raw personal numbers.",
          ],
          icon: A.export,
        },
      ],
    },
    growth: {
      label: "Growth",
      eyebrow: "Growth Guide",
      title: "Growth Lab: Monthly Leak Plan",
      intro:
        "Growth Lab uses Monthly leaks from the current month and turns them into a simple plan. It does not talk about investing. It does not hold money. It only shows what monthly leaks could cover or help you save toward.",
      icon: "/nav-growth.png",
      footerTitle: "Growth Lab rule",
      footerBody:
        "This is planning only: no deposits, no custody, no staking, no investments, no guaranteed returns, and no financial advice.",
      sections: [
        {
          title: "1. Use Monthly leaks",
          body: [
            "Growth Lab reads the current month’s Not needed and Maybe expenses.",
            "Use my leaks turns the monthly leak amount into a monthly redirected amount.",
            "This keeps the plan connected to real tracked app data, not random numbers.",
          ],
          icon: GROWTH_PUBLIC_ASSETS.leak,
        },
        {
          title: "2. Planned costs",
          body: [
            "Planned costs are bills or future expenses the user wants to cover.",
            "Examples: insurance, rent, school fees, repairs, family support, or any planned cost.",
            "Each row has its own 1m / 12m switch because some costs are monthly and some are yearly.",
          ],
          icon: GROWTH_PUBLIC_ASSETS.lab,
        },
        {
          title: "3. Saving goal",
          body: [
            "Saving goal is the thing the user is actually building toward.",
            "The user can choose a quick name or type their own goal.",
            "The target amount is always entered manually by the user.",
            "The app shows how long it may take if monthly leaks are redirected into that goal.",
          ],
          icon: GROWTH_PUBLIC_ASSETS.trophy,
        },
        {
          title: "4. Share Saving Goal card",
          body: [
            "The share card is only for the Saving goal.",
            "Planned costs stay inside the app for personal planning.",
            "The card shows the goal, target, estimated time, and redirected monthly leak amount.",
            "It does not show private income or full personal budget details.",
          ],
          icon: SHARE_CARD_PUBLIC_ASSETS.growth,
        },
        {
          title: "5. What Growth Lab is not",
          body: [
            "It is not investing.",
            "It is not staking.",
            "It is not custody.",
            "It does not move real funds.",
            "It is a personal planner that shows what leaks could become if the user changes habits.",
          ],
          icon: GROWTH_PUBLIC_ASSETS.market,
        },
      ],
    },
    whatif: {
      label: "Save",
      eyebrow: "Save Guide",
      title: "Save: Survival Simulator",
      intro:
        "Save is the survival simulator. It checks payday risk, safe daily budget, current pace, and what changes if leaks are reduced.",
      icon: "/nav-save.png",
      footerTitle: "Save rule",
      footerBody:
        "Set the next payday date, compare safe budget with current pace, and share only safe public proof.",
      sections: [
        {
          title: "1. Read potential savings",
          body: [
            "Potential savings shows how much could be protected if spending is reduced.",
            "It is based on tracked expenses and selected reduction levels.",
            "If there is no real data, the app can show demo scenarios until expenses are added.",
          ],
          icon: A.whatIfFrog,
        },
        {
          title: "2. Adjust reduction levels",
          body: [
            "Each card can simulate cutting a category by a percentage.",
            "This helps the user test realistic changes before committing.",
            "The goal is not to remove life. The goal is to stop the leak that gives the least value.",
          ],
          icon: A.navWhatIf,
        },
        {
          title: "3. Start leak challenges",
          body: [
            "Challenges turn savings into a simple mission.",
            "Examples include no takeout, coffee control, smoking cut, shopping freeze, or subscription killer.",
            "Challenges should be concrete and short enough to complete.",
          ],
          icon: A.challengeTrophy,
        },
        {
          title: "4. Track public progress",
          body: [
            "Leaderboard and challenge progress are public-friendly.",
            "They show discipline without revealing private financial details.",
            "This creates community proof around the $BROKE identity.",
          ],
          icon: A.challengeTrophy,
        },
        {
          title: "5. Use Save with Growth Lab",
          body: [
            "Save shows what can be reduced.",
            "Growth Lab shows what that saved amount could become in a simulation.",
            "Together they create the full story: find the leak, stop the leak, redirect the leak.",
          ],
          icon: GROWTH_PUBLIC_ASSETS.market,
        },
      ],
    },
    settings: {
      label: "Settings",
      eyebrow: "Settings Guide",
      title: "Settings: Make the App Fit Real Life",
      intro:
        "Settings controls privacy and personalization. Public Proof Mode protects public cards, and Smart Category Names makes the app feel personal without breaking history.",
      icon: "/nav-settings.png",
      footerTitle: "Settings rule",
      footerBody:
        "Keep the profile realistic, keep Public Proof Mode on for public sharing, and rename categories only as labels, not new habits.",
      sections: [
        {
          title: "1. Life Profile",
          body: [
            "Life Profile adapts the app to the user.",
            "A student, worker, freelancer, or person living with family should not be judged by the same assumptions.",
            "Country and currency help make numbers feel real.",
          ],
          icon: A.walletMascot,
        },
        {
          title: "2. Income setup",
          body: [
            "Income should match the user's real situation.",
            "Monthly, weekly, daily, allowance, and irregular income should be entered differently.",
            "The app uses income to understand pressure, not to expose private data.",
          ],
          icon: A.income,
        },
        {
          title: "3. Fixed costs",
          body: [
            "Fixed costs are required costs like rent, bills, transport basics, food basics, school, or family support.",
            "These costs reduce available money before leaks are calculated.",
            "If fixed costs are wrong, Wallet HP will feel wrong.",
          ],
          icon: A.lifeCost,
        },
        {
          title: "4. Sync and account state",
          body: [
            "Telegram sync keeps progress connected to the user profile.",
            "Web sync allows website and Telegram usage to match.",
            "If sync shows an error, the app can still work locally until cloud sync recovers.",
          ],
          icon: A.appFrog,
        },
        {
          title: "5. Data control",
          body: [
            "Settings includes reset and data management areas.",
            "Reset should be used carefully because it can remove local progress.",
            "Public cards are safer than raw exports because they hide income and real balance.",
          ],
          icon: A.navSettings,
        },
      ],
    },
  };

  const guideTabs: Tab[] = ["home", "add", "chart", "growth", "whatif", "settings"];
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
              </div>
            </article>
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

        <div className="leak-reflection-mini-grid">
          <div>
            <span>This month</span>
            <strong>{reflection.categoryCount}x</strong>
          </div>
          <div>
            <span>Category total</span>
            <strong>{reflection.categoryTotalLabel}</strong>
          </div>
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
    }));
  }

  function updateFixedCost(key: keyof Settings["fixedCosts"], value: string) {
    setDraft((prev) => ({
      ...prev,
      fixedCosts: {
        ...prev.fixedCosts,
        [key]: safeNumber(value),
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
              This is not a boring expense tracker. It is a wallet survival system:
              find the leak, protect Wallet HP, then redirect the saved money into growth.
            </p>
          </div>

          <div className="v58-onboarding-route">
            <article>
              <img src={A.leaks} alt="" />
              <div>
                <strong>Find the leak</strong>
                <span>Track one real expense and mark if it was Needed, Maybe, or Not needed.</span>
              </div>
            </article>

            <article>
              <img src={A.walletMascot} alt="" />
              <div>
                <strong>Protect Wallet HP</strong>
                <span>Your HP shows if leaks are putting pressure on the month.</span>
              </div>
            </article>

            <article>
              <img src={GROWTH_PUBLIC_ASSETS.market} alt="" />
              <div>
                <strong>Redirect into Growth</strong>
                <span>Use Growth Lab to simulate what saved leaks could become.</span>
              </div>
            </article>
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
              currency={draft.currency}
              onChange={(value) => updateIncome("salary", value)}
            />

            <EditableMoneyLine
              label="Side hustle / extra"
              value={draft.income.side}
              currency={draft.currency}
              onChange={(value) => updateIncome("side", value)}
            />

            <EditableMoneyLine
              label="Other / support"
              value={draft.income.other}
              currency={draft.currency}
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
                currency={draft.currency}
                onChange={(value) => updateFixedCost("rent", value)}
              />
            )}

            <EditableMoneyLine
              label="Food basics"
              value={draft.fixedCosts.food}
              currency={draft.currency}
              onChange={(value) => updateFixedCost("food", value)}
            />

            <EditableMoneyLine
              label="Transport"
              value={draft.fixedCosts.transport}
              currency={draft.currency}
              onChange={(value) => updateFixedCost("transport", value)}
            />

            <EditableMoneyLine
              label="Data / Internet"
              value={draft.fixedCosts.data}
              currency={draft.currency}
              onChange={(value) => updateFixedCost("data", value)}
            />

            <EditableMoneyLine
              label="School / study"
              value={draft.fixedCosts.education}
              currency={draft.currency}
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
            Open Add and track it
          </button>
        )}
      </div>
    </div>
  );
}


function Header({
  title,
  showBack = false,
  rightIcon,
  onBack,
  onRight,
}: {
  title: string;
  showBack?: boolean;
  rightIcon?: string;
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
  summary,
  badges,
  walletInsights,
  chartDays,
  leaderboard,
  expenses,
  routineExpenses,
  allExpenses,
  leakMission,
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
  onRoutineComplete,
  onBellClick,
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
  badges: BadgeItem[];
  walletInsights: WalletInsight[];
  chartDays: ChartPoint[];
  leaderboard: LeaderboardState | null;
  expenses: Expense[];
  routineExpenses: Expense[];
  allExpenses: Expense[];
  leakMission: LocalLeakMission | null;
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
  onRoutineComplete: () => Promise<boolean>;
  onBellClick: () => void;
}) {
  const stats = [
    {
      title: "Income",
      value: money(summary.totalIncome, settings.currency),
      subtitle: "This month",
      icon: A.income,
      tone: "green",
    },
    {
      title: "Life Cost",
      value: money(summary.fixedCosts, settings.currency),
      subtitle: "This month",
      icon: A.lifeCost,
      tone: "red",
    },
    {
      title: "Money Leaks",
      value: money(summary.totalLeaks, settings.currency),
      subtitle: "This month",
      icon: A.leaks,
      tone: "orange",
    },
    {
      title: "Real Balance",
      value: money(summary.realBalance, settings.currency),
      subtitle: "Left to stack",
      icon: A.balance,
      tone: "green",
    },
  ];

  const identityStats = useMemo(() => {
    return buildV2IdentityStats(allExpenses, settings, summary.walletHp);
  }, [allExpenses, settings, summary.walletHp]);
  const comebackState = useMemo(() => {
    return buildComebackState(allExpenses, settings);
  }, [allExpenses, settings]);

  return (
    <div className="screen">
      <Header title="$BROKE Life Tracker" rightIcon={A.help} onRight={onBellClick} />

      <section className="hero">
        <div>
          <h1>
            Your wallet
            <br />
            is not broken.
            <span>It is leaking.</span>
          </h1>
        </div>

        <img
          className="home-mascot"
          src={PREMIUM_VISUAL_PACK.homeMascot}
          alt="Mascot"
          onError={(event) => {
            event.currentTarget.src = A.homeMascot;
          }}
        />
      </section>

      <section className="stats-grid">
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

      <SmartHomeFocusCard
        settings={settings}
        summary={summary}
        allExpenses={allExpenses}
        identityStats={identityStats}
        onOpenAdd={onOpenAdd}
        onOpenChart={onOpenChart}
      />

      {comebackState && (
        <ComebackModeCard
          settings={settings}
          comeback={comebackState}
          onAddMissedLeak={onOpenAdd}
          onRestartToday={onOpenAdd}
          onShowDamage={onOpenChart}
          onOpenSurvival={onOpenSurvival}
        />
      )}

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

      <details className="clean-details">
        <summary>
          <div>
            <span>Daily Routine</span>
            <small>7 actions to keep your wallet alive today.</small>
          </div>
          <b>7 real tasks</b>
        </summary>
        <DailyRoutinePanel
          settings={settings}
          summary={summary}
          expenses={routineExpenses}
          cloudReady={cloudAuthReady}
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
          shareInitData={telegram.isTelegram ? telegram.initData : ""}
        />
      </details>

      <details className="clean-details">
        <summary>
          <div>
            <span>Wallet Insights Lab</span>
            <small>More signals from habits, timing, and pressure.</small>
          </div>
          <b>{walletInsights.length} signals</b>
        </summary>
        <WalletInsightsPanel insights={walletInsights} />
      </details>

      <details className="clean-details">
        <summary>
          <span>Badges</span>
          <b>{badges.filter((badge) => badge.earned).length}/{badges.length}</b>
        </summary>
        <BadgeMiniStrip badges={badges} />
      </details>

      <details className="clean-details" id="share-result-card-panel">
        <summary>
          <div>
            <span>Share Result</span>
            <small>Create a clean public progress card.</small>
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
          shareInitData={telegram.isTelegram ? telegram.initData : ""}
        />
      </details>

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
              "One real expense unlocks Wallet HP, Chart, Save, Growth Lab and public share cards.",
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
        Home is now simplified: one main action here, extra systems below in collapsible sections.
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
            Track one real expense to unlock Wallet HP, Chart movement, Save scenarios,
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
            <span>Chart, Save, Growth and reports become real.</span>
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
          {settings.profile.country} · {settings.currency} · {settings.profile.incomeStyle}
        </small>
      </div>

      <b>{settings.profile.hasRent ? "Rent mode" : "No-rent mode"}</b>
    </section>
  );
}

function LifeProfileEditor({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
}) {
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
        <span>Currency</span>
        <select
          className="settings-select profile-select"
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
  shareInitData: string;
}) {
  const [reportSharing, setReportSharing] = useState<"daily" | "weekly" | null>(null);
  const dailyReportCardRef = useRef<HTMLDivElement | null>(null);
  const weeklyReportCardRef = useRef<HTMLDivElement | null>(null);
  const todayExpenses = useMemo(() => getTodayExpenses(expenses), [expenses]);
  const weekExpenses = useMemo(() => getLastSevenDaysExpenses(expenses), [expenses]);

  const todayLeakAmount = sum(
    todayExpenses
      .filter((expense) => expense.needType !== "Needed")
      .map((expense) => (expense.needType === "Maybe" ? expense.amount * 0.5 : expense.amount))
  );

  const weeklyLeakAmount = sum(
    weekExpenses
      .filter((expense) => expense.needType !== "Needed")
      .map((expense) => (expense.needType === "Maybe" ? expense.amount * 0.5 : expense.amount))
  );

  const todayTopCategory = getCategorySummaries(todayExpenses)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0];

  const weekTopCategory = getCategorySummaries(weekExpenses)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0];

  const todayStatus =
    todayLeakAmount <= 0
      ? "Clean day"
      : todayLeakAmount <= Math.max(summary.totalIncome - summary.fixedCosts, 1) * 0.02
        ? "Small leak"
        : "Leak warning";

  const weeklyStatus = identityStats.status;
  const dailyScore = clamp(100 - Math.round((todayLeakAmount / Math.max(summary.totalIncome - summary.fixedCosts, 1)) * 100), 0, 100);

  const dailyReportText = [
    "$BROKE Daily Wallet Report",
    "",
    `Status: ${todayStatus}`,
    `Wallet HP: ${summary.walletHp}/100`,
    `Spent today: ${money(summary.todaySpent, settings.currency)}`,
    `Leaks today: ${money(todayLeakAmount, settings.currency)}`,
    `Top category: ${todayTopCategory ? categoryLabel(todayTopCategory.category) : "none"}`,
    `Daily score: ${dailyScore}/100`,
    "",
    "Find the leak before it becomes your lifestyle.",
    "Smoke is broke.",
  ].join("\n");

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
    `Life hours lost: ${identityStats.lifeHoursLost}h`,
    "",
    "Find the leak before it becomes your lifestyle.",
    "Smoke is broke.",
  ].join("\n");

  async function copyReportText(text: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        window.alert("Report copied. Paste it in Telegram, X, or anywhere you want.");
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
    markDailyRoutineAction("sharedProgress");
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
            window.alert("Report image was sent to your Telegram bot chat.");
            return;
          } catch {
            // Continue to download fallback below.
          }
        }

        downloadImageFile(imageFile);
        window.alert("Report image downloaded. You can post it in Telegram or X.");
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
            </div>
            <div>
              <span>Leaks</span>
              <strong>{money(todayLeakAmount, settings.currency)}</strong>
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
            <div className="report-public-share-top">
              <div>
                <span>$BROKE DAILY REPORT</span>
                <strong>{todayStatus}</strong>
                <small>Wallet HP {summary.walletHp}/100</small>
              </div>
              <img src={todayTopCategory ? getCategoryIcon(todayTopCategory.category) : A.walletMascot} alt="" />
            </div>

            <div className="report-public-share-grid">
              <div>
                <span>Spent</span>
                <strong>{money(summary.todaySpent, settings.currency)}</strong>
              </div>
              <div>
                <span>Leaks</span>
                <strong>{money(todayLeakAmount, settings.currency)}</strong>
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
            <div className="report-public-share-top">
              <div>
                <span>$BROKE WEEKLY REPORT</span>
                <strong>{weeklyStatus}</strong>
                <small>Survival {identityStats.weeklySurvivalScore}/100</small>
              </div>
              <img src={identityStats.biggestLeakAmount > 0 ? getCategoryIcon(identityStats.biggestLeakCategory) : A.challengeTrophy} alt="" />
            </div>

            <div className="report-public-share-grid">
              <div>
                <span>Survival</span>
                <strong>{identityStats.weeklySurvivalScore}/100</strong>
              </div>
              <div>
                <span>Leaks</span>
                <strong>{money(weeklyLeakAmount, settings.currency)}</strong>
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
  cloudReady,
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
  cloudReady: boolean;
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

  useEffect(() => {
    markDailyRoutineAction("openedApp");
    setActions(readDailyRoutineActions(today));
    setRewardClaimed(readDailyRoutineReward(today).claimed);

    const interval = window.setInterval(() => {
      setActions(readDailyRoutineActions(today));
      setRewardClaimed(readDailyRoutineReward(today).claimed);
    }, 800);

    return () => window.clearInterval(interval);
  }, [today]);

  const todayExpenses = useMemo(() => {
    return expenses.filter((expense) => dayKey(new Date(expense.createdAt)) === today);
  }, [expenses, today]);

  const leakMarked = todayExpenses.some((expense) => expense.needType !== "Needed");
  const noteAdded = todayExpenses.some((expense) => expense.note.trim().length > 0);

  const routineItems = [
    {
      id: "openedApp",
      title: "Open the app",
      body: "Start the day with a wallet check.",
      icon: A.appFrog,
      done: actions.openedApp,
    },
    {
      id: "trackExpense",
      title: "Track 1 expense",
      body:
        todayExpenses.length > 0
          ? `${todayExpenses.length} record${todayExpenses.length === 1 ? "" : "s"} tracked today.`
          : "Add at least one real expense today.",
      icon: A.addFrog,
      done: todayExpenses.length > 0,
    },
    {
      id: "markLeak",
      title: "Mark a real leak",
      body: "Add one expense as Not needed or Maybe.",
      icon: A.leaks,
      done: leakMarked,
    },
    {
      id: "addContext",
      title: "Add context",
      body: "Add a note to one expense so the habit is visible.",
      icon: A.pencil,
      done: noteAdded,
    },
    {
      id: "checkChart",
      title: "Check $BROKE Chart",
      body: "Open the Chart tab and look at today’s damage.",
      icon: A.navChart,
      done: actions.checkedChart,
    },
    {
      id: "checkSave",
      title: "Check Save plan",
      body: "Open Save and review one What If scenario.",
      icon: A.navWhatIf,
      done: actions.checkedSave,
    },
    {
      id: "publicProof",
      title: "Share public proof",
      body: "Share or copy a safe progress card. No private money data.",
      icon: A.export,
      done: actions.sharedProgress,
    },
  ];

  const completedCount = routineItems.filter((item) => item.done).length;
  const routineScore = Math.round((completedCount / routineItems.length) * 100);
  const routineComplete = completedCount === routineItems.length;
  const routineStatus =
    routineComplete
      ? rewardClaimed
        ? "XP claimed"
        : "7/7 complete"
      : `${completedCount}/7 done`;

  useEffect(() => {
    if (!routineComplete || rewardClaimed || rewardRequestRef.current) return;

    rewardRequestRef.current = true;

    onRoutineComplete()
      .then((claimed) => {
        if (claimed) {
          setRewardClaimed(true);
        }
      })
      .finally(() => {
        rewardRequestRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineComplete, rewardClaimed, today]);

  return (
    <section className="daily-routine-card">
      <div className="section-title">
        <span>Daily Routine</span>
        <small>{routineStatus}</small>
      </div>

      <div className="routine-hero">
        <div>
          <strong>7 real tasks per day.</strong>
          <p>
            Complete the routine through real actions. Finish 7/7 to unlock the
            daily XP reward.
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
              ? rewardClaimed
                ? "+50 XP claimed"
                : "Daily XP unlocked"
              : `Complete ${routineItems.length - completedCount} more task${
                  routineItems.length - completedCount === 1 ? "" : "s"
                }`}
          </strong>
          <span>
            {cloudReady
              ? "7/7 real tasks can reward daily XP once per day."
              : "Connect Telegram to claim routine XP."}
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

            <b>{item.done ? "✓" : "—"}</b>
          </article>
        ))}
      </div>

      <div className="routine-rule">
        <strong>Discipline rule:</strong>
        <span>you cannot tap tasks complete. Complete the action, then the checkmark appears.</span>
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
        window.alert("Mission result copied. Paste it in Telegram, X, or anywhere you want.");
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
    markDailyRoutineAction("sharedProgress");
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
            window.alert("Mission image was sent to your Telegram bot chat.");
            return;
          } catch {
            // Continue to download fallback below.
          }
        }

        downloadImageFile(imageFile);
        window.alert("Mission image downloaded. You can post it in Telegram or X.");
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

                <div className="mission-public-share-top">
                  <div>
                    <span>$BROKE MISSION CARD</span>
                    <strong>{resultTitle}</strong>
                    <small>{progress.failed ? "Limit broken" : "Wallet HP protected"}</small>
                  </div>
                  <img src={progress.completed ? A.challengeCompleted : A.challengeFailed} alt="" />
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
}: {
  settings: Settings;
  walletHp: number;
  totalLeaks: number;
  potentialYearlySavings: number;
  leaderboard: LeaderboardState | null;
  identityStats: V2IdentityStats;
}) {
  const shareStats = getShareLeaderboardStats(leaderboard);
  const publicProofMode = settings.privacy.publicProofMode;
  const rankLine =
    shareStats.rank || shareStats.publicLeaderboard
      ? `Leaderboard: ${shareStats.rankLabel}`
      : "Leaderboard: private";

  return [
    "My wallet is not broken.",
    "It is leaking.",
    "",
    `$BROKE Status: ${identityStats.status}`,
    `Weekly Survival Score: ${identityStats.weeklySurvivalScore}/100`,
    `Wallet HP: ${walletHp}/100`,
    `Biggest leak: ${
      identityStats.biggestLeakAmount > 0
        ? publicProofMode
          ? categoryDisplayLabel(settings, identityStats.biggestLeakCategory)
          : `${categoryDisplayLabel(settings, identityStats.biggestLeakCategory)} (${money(
              identityStats.biggestLeakAmount,
              settings.currency
            )})`
        : "none"
    }`,
    `Life hours lost: ${identityStats.lifeHoursLost}h`,
    `$BROKE Score: ${shareStats.xp.toLocaleString("en-US")} XP`,
    rankLine,
    "",
    `Potential yearly savings: ${
      publicProofMode ? "hidden by Public Proof Mode" : money(potentialYearlySavings, settings.currency)
    }`,
    "",
    "Find the leak before it becomes your lifestyle.",
  ].join("\n");
}

async function createShareImageFileFromElement(element: HTMLElement) {
  const html2canvasModule = await import("html2canvas");
  const html2canvas = html2canvasModule.default;
  const captureId = `share-capture-${Date.now()}`;

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
      scrollX: 0,
      scrollY: 0,
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

    return new File([blob], "broke-life-tracker-result.png", {
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
  shareInitData,
}: {
  settings: Settings;
  walletHp: number;
  totalLeaks: number;
  realBalance: number;
  potentialYearlySavings: number;
  leaderboard: LeaderboardState | null;
  identityStats: V2IdentityStats;
  shareInitData: string;
}) {
  const [copied, setCopied] = useState(false);
  const shareStatusLabel =
    identityStats.status === "Leak Survivor"
      ? "Survivor"
      : identityStats.status === "Stable Wallet"
        ? "Stable"
        : identityStats.status === "Leak Pressure"
          ? "Pressure"
          : identityStats.status === "Doomspending Alert"
            ? "Alert"
            : identityStats.status;
  const [imageSharing, setImageSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const shareStats = getShareLeaderboardStats(leaderboard);

  const shareText = buildShareText({
    settings,
    walletHp,
    totalLeaks,
    potentialYearlySavings,
    leaderboard,
    identityStats,
  });

  function openXShare() {
    triggerHaptic("light");
    markDailyRoutineAction("sharedProgress");
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    openExternalUrl(url);
  }

  function openTelegramShare() {
    triggerHaptic("light");
    markDailyRoutineAction("sharedProgress");
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      PROJECT_TG_URL
    )}&text=${encodeURIComponent(shareText)}`;
    openTelegramUrl(url);
  }

  async function nativeShare() {
    try {
      triggerHaptic("light");
      markDailyRoutineAction("sharedProgress");
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
      markDailyRoutineAction("sharedProgress");
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
      markDailyRoutineAction("sharedProgress");
      setImageSharing(true);

      const imageFile = await createShareImageFileFromElement(shareCardRef.current);
      const nativeShared = await tryNativeImageShare(imageFile);

      if (nativeShared) {
        return;
      }

      try {
        await sendShareImageViaBot(imageFile, shareInitData, shareText);
        window.alert("Image was sent to your Telegram bot chat. Open the bot chat and forward it anywhere.");
        return;
      } catch {
        downloadImageFile(imageFile);
        window.alert("Telegram WebView cannot share image files directly. Bot delivery failed too, so the PNG was downloaded.");
      }
    } catch {
      window.alert("Image sharing was cancelled or is not supported by this browser.");
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

      <div className="public-share-image-card premium-share-card" ref={shareCardRef}>
        <img
          className="premium-share-card-art"
          src={SHARE_CARD_PUBLIC_ASSETS.result}
          alt=""
        />
        <div className="public-share-top">
          <div>
            <span>$BROKE IDENTITY</span>
            <strong>Premium public card</strong>
          </div>
          <img src={A.walletMascot} alt="" />
        </div>

        <div className="share-preview share-preview-social">
          <div>
            <span>Status</span>
            <strong>{shareStatusLabel}</strong>
          </div>
          <div>
            <span>Survival</span>
            <strong>{identityStats.weeklySurvivalScore}/100</strong>
          </div>
          <div>
            <span>Wallet HP</span>
            <strong>{walletHp}/100</strong>
          </div>
          <div>
            <span>Top</span>
            <strong>{shareStats.rankLabel}</strong>
          </div>
        </div>

        <div className="public-share-meta">
          <strong>
            Leak:{" "}
            {identityStats.biggestLeakAmount > 0
              ? categoryDisplayLabel(settings, identityStats.biggestLeakCategory)
              : "none"}
          </strong>
          <strong>Hours lost: {identityStats.lifeHoursLost}h</strong>
        </div>

        <div className="public-share-savings">
          <span>Potential yearly savings</span>
          <strong>{publicProofMoney(settings, potentialYearlySavings)}</strong>
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
            ? "Public Proof Mode is ON. Exact private numbers are hidden."
            : "Public share hides income and real balance."}
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
  const rowCurrency = settings?.currency ?? currency ?? "USD";
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

      <b>{money(expense.amount, rowCurrency)}</b>

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
  lastTrackedExpense: Expense | null;
  onAdd: () => void;
  onBack: () => void;
  onHelp: () => void;
}) {
  return (
    <form
      className="screen"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd();
      }}
    >
      <Header title="Add Expense" showBack rightIcon={A.help} onBack={onBack} onRight={onHelp} />

      <section className="amount-box">
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
      </section>

      <section className="quick-add-panel">
        <div className="section-title">
          <span>Quick Add</span>
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
        <label className="field-label">Category</label>
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

      <section>
        <label className="field-label">Was it needed?</label>
        <div className="choice-row">
          {(["Needed", "Not needed", "Maybe"] as NeedType[]).map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setExpenseType(type)}
              className={expenseType === type ? "choice active" : "choice"}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      <section className="note-box">
        <input
          value={note}
          placeholder="Add a quick note..."
          onChange={(event) => setNote(event.target.value)}
        />
        <img src={A.pencil} alt="" />
      </section>

      <button className="primary-btn" type="submit">
        <span>+</span>
        Add Expense
      </button>

      <ExpenseImpactCard settings={settings} expense={lastTrackedExpense} />

      <div className="tiny-note">
        <img src={A.addFrog} alt="" />
        <span>Track daily leaks. Small leaks sink big wallets.</span>
      </div>
    </form>
  );
}

// V54.6: Chart tab visual upgrade with pulse, stats, and empty state.
function PatternDetectorPanel({
  settings,
  patterns,
  onOpenAdd,
}: {
  settings: Settings;
  patterns: LeakPattern[];
  onOpenAdd: () => void;
}) {
  const topPattern = patterns[0];

  return (
    <section className="pattern-detector-panel">
      <div className="section-title">
        <span>Pattern Detector</span>
        <small>What the app sees behind your expenses.</small>
      </div>

      {topPattern ? (
        <>
          <div className={`pattern-detector-hero ${topPattern.severity}`}>
            <img src={topPattern.icon} alt="" />
            <div>
              <span>{topPattern.tag}</span>
              <strong>{topPattern.title}</strong>
              <p>{topPattern.body}</p>
            </div>
          </div>

          <div className="pattern-detector-insight">
            <strong>Why this matters</strong>
            <p>{topPattern.why}</p>
          </div>

          <div className="pattern-detector-fix">
            <strong>One fix</strong>
            <p>{topPattern.fix}</p>
          </div>

          <div className="pattern-detector-grid">
            <div>
              <span>Count</span>
              <strong>{topPattern.count}x</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{money(topPattern.total, settings.currency)}</strong>
            </div>
            <div>
              <span>Average</span>
              <strong>{money(topPattern.average, settings.currency)}</strong>
            </div>
          </div>

          <details className="pattern-more-details">
            <summary>
              <span>Detected patterns</span>
              <b>{patterns.length}</b>
            </summary>

            <div className="pattern-list">
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
                The detector needs repeated records to see habits, triggers,
                weekend leaks and decision-zone spending.
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
  shareCardRef,
  sharing,
  onShare,
}: {
  settings: Settings;
  review: WeeklyReview;
  shareCardRef: React.RefObject<HTMLDivElement | null>;
  sharing: boolean;
  onShare: () => void;
}) {
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
          </div>
          <div>
            <span>Leaks this week</span>
            <strong>{money(review.totalLeaks, settings.currency)}</strong>
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

          <div className="weekly-share-top">
            <div>
              <span>$BROKE WEEKLY REVIEW</span>
              <strong>This Week in $BROKE</strong>
            </div>
            <img src={A.chartFrog} alt="" />
          </div>

          <div className="weekly-share-grid">
            <div>
              <span>Spent</span>
              <strong>{money(review.totalSpent, settings.currency)}</strong>
            </div>
            <div>
              <span>Leaks</span>
              <strong>{money(review.totalLeaks, settings.currency)}</strong>
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
  monthOptions,
  selectedMonth,
  onMonthChange,
  shareCardRef,
  sharing,
  onShare,
}: {
  settings: Settings;
  archive: MonthlyLeakArchive;
  monthOptions: string[];
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  shareCardRef: React.RefObject<HTMLDivElement | null>;
  sharing: boolean;
  onShare: () => void;
}) {
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
        </div>
        <div>
          <span>Total leaks</span>
          <strong>{money(archive.totalLeaks, settings.currency)}</strong>
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

        <div className="monthly-share-top">
          <div>
            <span>$BROKE MONTHLY HISTORY</span>
            <strong>{archive.monthLabel}</strong>
          </div>
          <img src={A.chartFrog} alt="" />
        </div>

        <div className="monthly-share-grid">
          <div>
            <span>Total spent</span>
            <strong>{money(archive.totalSpent, settings.currency)}</strong>
          </div>
          <div>
            <span>Total leaks</span>
            <strong>{money(archive.totalLeaks, settings.currency)}</strong>
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

function ChartScreen({
  settings,
  expenses,
  walletInsights,
  shareInitData,
  onBack,
  onExport,
  onOpenAdd,
}: {
  settings: Settings;
  expenses: Expense[];
  walletInsights: WalletInsight[];
  shareInitData: string;
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
  const oneFixRecommendation = useMemo(
    () => buildOneFixRecommendation(leakPatterns, weeklyReview, settings, oneFixDifficulty),
    [leakPatterns, weeklyReview, settings, oneFixDifficulty]
  );
  const leakStreaks = useMemo(
    () => buildLeakStreaks(expenses, settings),
    [expenses, settings]
  );

  const weeklyReviewShareText = [
    "$BROKE Weekly Review",
    "",
    `Spent this week: ${money(weeklyReview.totalSpent, settings.currency)}`,
    `Leaks this week: ${money(weeklyReview.totalLeaks, settings.currency)}`,
    `Records: ${weeklyReview.totalCount}`,
    `Leak pressure: ${weeklyReview.leakPressure}%`,
    `Biggest leak: ${
      weeklyReview.biggestLeakAmount > 0
        ? `${categoryDisplayLabel(settings, weeklyReview.biggestLeakCategory)} (${money(weeklyReview.biggestLeakAmount, settings.currency)})`
        : "none"
    }`,
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
  ].join("\n");

  async function shareWeeklyReviewCard() {
    if (!weeklyReviewShareCardRef.current || weeklyReviewSharing) return;

    triggerHaptic("light");
    markDailyRoutineAction("sharedProgress");
    setWeeklyReviewSharing(true);

    try {
      const imageFile = await createShareImageFileFromElement(weeklyReviewShareCardRef.current);
      const nativeShared = await tryNativeImageShare(imageFile);

      if (nativeShared) return;

      if (!shareInitData) {
        downloadImageFile(imageFile);
        window.alert("Open the app inside Telegram to send the Weekly Review card to the bot. On web, the PNG was downloaded.");
        return;
      }

      try {
        await sendShareImageViaBot(imageFile, shareInitData, weeklyReviewShareText);
        window.alert("Weekly Review card was sent to your Telegram bot chat.");
      } catch {
        downloadImageFile(imageFile);
        window.alert("Bot delivery failed, so the Weekly Review card was downloaded as PNG.");
      }
    } catch {
      window.alert("Weekly Review sharing is not supported by this browser.");
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
    `Records: ${monthlyArchive.totalCount}`,
    `Top category: ${
      monthlyArchive.topCategory
        ? `${categoryDisplayLabel(settings, monthlyArchive.topCategory.category)} (${money(monthlyArchive.topCategory.total, settings.currency)})`
        : "none"
    }`,
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
  ].join("\n");

  async function shareMonthlyHistoryCard() {
    if (!historyShareCardRef.current || historySharing) return;

    triggerHaptic("light");
    markDailyRoutineAction("sharedProgress");
    setHistorySharing(true);

    try {
      const imageFile = await createShareImageFileFromElement(historyShareCardRef.current);
      const nativeShared = await tryNativeImageShare(imageFile);

      if (nativeShared) return;

      if (!shareInitData) {
        downloadImageFile(imageFile);
        window.alert("Open the app inside Telegram to send the Monthly Leak History card to the bot. On web, the PNG was downloaded.");
        return;
      }

      try {
        await sendShareImageViaBot(imageFile, shareInitData, monthlyHistoryShareText);
        window.alert("Monthly Leak History card was sent to your Telegram bot chat.");
      } catch {
        downloadImageFile(imageFile);
        window.alert("Bot delivery failed, so the Monthly Leak History card was downloaded as PNG.");
      }
    } catch {
      window.alert("Monthly Leak History sharing is not supported by this browser.");
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

  const maxSpent = Math.max(...chartData.map((point) => point.spent), 1);
  const selectedPoint = chartData[chartData.length - 1];

  const periodOpen = chartData[0]?.open ?? 0;
  const periodSpent = sum(chartData.map((point) => point.spent));
  const periodClose = periodOpen - periodSpent;

  const rangeLeaks = sum(
    rangeExpenses
      .filter((expense) => expense.needType !== "Needed")
      .map((expense) => (expense.needType === "Maybe" ? expense.amount * 0.5 : expense.amount))
  );

  const topRangeCategory = getCategorySummaries(rangeExpenses)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0];

  const averageDailySpend =
    range === "day"
      ? periodSpent
      : range === "week"
        ? periodSpent / 7
        : periodSpent / getCurrentDayOfMonth();

  const leakPressure = periodSpent > 0 ? Math.round((rangeLeaks / periodSpent) * 100) : 0;
  const hasRangeData = rangeExpenses.length > 0;

  const title =
    range === "day"
      ? "Today"
      : range === "week"
        ? "Last 7 days"
        : "This month";

  return (
    <div className="screen">
      <Header title="$BROKE Chart" showBack rightIcon={A.export} onBack={onBack} onRight={onExport} />

      <section className="chart-banner">
        <p>
          You watch crypto charts every day.
          <br />
          But do you watch your own <span>$BROKE Chart?</span>
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
          <span>Chart Pulse</span>
          <strong>
            {periodSpent > 0
              ? `${money(periodSpent, settings.currency)} tracked`
              : "No damage yet"}
          </strong>
          <small>
            {hasRangeData
              ? `${rangeExpenses.length} records · ${leakPressure}% leak pressure`
              : "Add expenses to make the chart alive."}
          </small>
        </div>
        <img src={A.chartFrog} alt="" />
      </section>

      <section className="chart-stats-grid">
        <div>
          <span>Damage</span>
          <strong>
            {periodSpent > 0 ? `-${money(periodSpent, settings.currency)}` : money(0, settings.currency)}
          </strong>
          <small>{title}</small>
        </div>

        <div>
          <span>Leaks</span>
          <strong>{money(rangeLeaks, settings.currency)}</strong>
          <small>{leakPressure}% pressure</small>
        </div>

        <div>
          <span>Top category</span>
          <strong>{topRangeCategory ? categoryDisplayLabel(settings, topRangeCategory.category) : "None"}</strong>
          <small>
            {topRangeCategory
              ? money(topRangeCategory.amount, settings.currency)
              : "No records"}
          </small>
        </div>

        <div>
          <span>Avg/day</span>
          <strong>{money(averageDailySpend, settings.currency)}</strong>
          <small>{range === "day" ? "today" : "daily pace"}</small>
        </div>
      </section>

      {!hasRangeData && (
        <section className="chart-empty-state v58-empty-card v58-chart-empty">
          <img src={A.chartFrog} alt="" />
          <div>
            <span>$BROKE Chart is waiting</span>
            <strong>No wallet movement yet.</strong>
            <p>
              Track one expense to create the first candle, spending volume and leak pressure.
            </p>
            <button type="button" onClick={onOpenAdd}>
              Track first expense
            </button>
          </div>
        </section>
      )}

      <section className={`big-chart ${range}`}>
        <div className="chart-lines">
          {chartData.map((point) => {
            const height = clamp(24 + (point.spent / maxSpent) * 68, 18, 92);

            return (
              <i
                key={point.key}
                className={point.spent > 0 ? "red" : "green"}
                style={{ height: `${height}%` }}
                title={`${point.label}: ${money(point.spent, settings.currency)}`}
              />
            );
          })}
        </div>

        <div className="price-line">
          <span>{money(periodClose, settings.currency)}</span>
        </div>
      </section>

      <section className="volume">
        <label>Spending Volume — {title}</label>
        <div className={range}>
          {chartData.map((point) => {
            const height = clamp(12 + (point.spent / maxSpent) * 75, 10, 90);

            return (
              <i
                key={point.key}
                className={point.spent > 0 ? "red" : "green"}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </section>

      <section className="day-card">
        <div className="day-title">
          <strong>{title}</strong>
          <img src={A.calendar} alt="" />
        </div>

        <div className="day-info">
          <div>
            <span>Open</span>
            <b>{money(periodOpen, settings.currency)}</b>
          </div>

          <div>
            <span>Close</span>
            <b>{money(periodClose, settings.currency)}</b>
          </div>

          <div>
            <span>Damage</span>
            <b className="bad">
              {periodSpent > 0
                ? `-${money(periodSpent, settings.currency)}`
                : money(0, settings.currency)}
            </b>
          </div>
        </div>

        <div className="chart-range-note">
          <span>
            Current point: {selectedPoint?.label ?? "-"} ·{" "}
            {money(selectedPoint?.spent ?? 0, settings.currency)} spent
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
            <span>Analysis Lab</span>
            <small>Patterns, streaks, and deeper wallet signals.</small>
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
            shareCardRef={weeklyReviewShareCardRef}
            sharing={weeklyReviewSharing}
            onShare={shareWeeklyReviewCard}
          />

          <MonthlyLeakHistoryPanel
            settings={settings}
            archive={monthlyArchive}
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
  period: GrowthMeaningPeriod
) {
  if (monthlyAmount <= 0) return "Set monthly amount";

  const monthsCovered = finalValue / monthlyAmount;

  if (period === "one") {
    if (monthsCovered >= 1) {
      return `could cover about ${formatCoverageNumber(monthsCovered)} month${
        monthsCovered === 1 ? "" : "s"
      }`;
    }

    return `could cover about ${Math.round(monthsCovered * 100)}% of 1 month`;
  }

  const yearlyTarget = monthlyAmount * 12;
  const yearCoverage = finalValue / yearlyTarget;

  if (yearCoverage >= 1) {
    const extraMonths = Math.max(0, Math.floor(monthsCovered - 12));

    if (extraMonths > 0) {
      return `could cover 12 months + ${extraMonths} extra month${
        extraMonths === 1 ? "" : "s"
      }`;
    }

    return "could cover about 12 months";
  }

  return `could cover about ${Math.round(yearCoverage * 100)}% of 12 months`;
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
  return expenses.reduce((acc, expense) => {
    if (expense.needType === "Not needed") return acc + expense.amount;
    if (expense.needType === "Maybe") return acc + expense.amount * 0.5;
    return acc;
  }, 0);
}

function buildGrowthShareText(
  simulation: GrowthSimulation,
  settings: Settings,
  context?: GrowthShareContext
) {
  const result = getGrowthFinal(simulation);

  return [
    "$BROKE Growth Lab",
    "",
    `Monthly leaks redirected: ${money(monthlyGrowthContribution(simulation), settings.currency)}/month`,
    `Plan value after ${simulation.durationMonths} months: ${money(result.balance, settings.currency)}`,
    "",
    context
      ? `Saving goal: ${context.activeGoalName}`
      : "Saving goal: add what you are building toward",
    context
      ? `Target: ${money(context.activeGoalTarget, settings.currency)}`
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
  context?: GrowthShareContext
): Promise<Blob> {
  const result = getGrowthFinal(simulation);
  const monthlyRedirected = monthlyGrowthContribution(simulation);
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
    `${money(monthlyRedirected, settings.currency)}/month redirected from monthly leaks`,
    94,
    432
  );

  growthFillRoundRect(ctx, 62, 510, 956, 360, 36, panel2);
  growthStrokeRoundRect(ctx, 62, 510, 956, 360, 36, "rgba(183,255,25,0.18)", 2);

  ctx.fillStyle = green;
  ctx.font = "900 30px Arial, sans-serif";
  ctx.fillText("SAVING GOAL", 94, 575);

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
}: {
  settings: Settings;
  expenses: Expense[];
  shareInitData: string;
  onBack: () => void;
  onHelp: () => void;
  onOpenAdd: () => void;
}) {
  const [savedSimulations, setSavedSimulations] = useState<GrowthSimulation[]>(() =>
    readGrowthSimulations()
  );
  const [title, setTitle] = useState("Monthly Leak Plan");
  const [startingAmount, setStartingAmount] = useState("0");
  const [contributionAmount, setContributionAmount] = useState("25");
  const [contributionFrequency, setContributionFrequency] = useState<GrowthFrequency>("weekly");
  const [durationMonths, setDurationMonths] = useState("12");
  const [expectedAnnualGrowth, setExpectedAnnualGrowth] = useState("0");
  const [riskLevel, setRiskLevel] = useState<GrowthRisk>("low");
  const [reinvest, setReinvest] = useState(false);
  const [growthShareCardUrl, setGrowthShareCardUrl] = useState("");
  const [growthShareText, setGrowthShareText] = useState("");
  const [isBuildingShareCard, setIsBuildingShareCard] = useState(false);
  const [growthPlannerTab, setGrowthPlannerTab] = useState<GrowthPlannerTab>("costs");
  const [savingGoalName, setSavingGoalName] = useState("");
  const [savingGoalAmount, setSavingGoalAmount] = useState("");
  const [realLifeTargets, setRealLifeTargets] = useState<GrowthManualTarget[]>([
    { id: "insurance", name: "Insurance", amount: "", period: "year" },
    { id: "housing", name: "Mortgage / rent", amount: "", period: "one" },
  ]);

  useEffect(() => {
    return () => {
      if (growthShareCardUrl) {
        URL.revokeObjectURL(growthShareCardUrl);
      }
    };
  }, [growthShareCardUrl]);

  const monthlyLeakExpenses = useMemo(() => getCurrentMonthExpenses(expenses), [expenses]);
  const leakAmount = useMemo(
    () => getLeakAmountForGrowth(monthlyLeakExpenses),
    [monthlyLeakExpenses]
  );
  const categorySummaries = useMemo(
    () => getCategorySummaries(monthlyLeakExpenses),
    [monthlyLeakExpenses]
  );
  const topLeak = categorySummaries[0];

  const preview = useMemo(
    () =>
      normalizeGrowthSimulation({
        title,
        startingAmount: safeNumber(startingAmount),
        contributionAmount: safeNumber(contributionAmount),
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
  const bars = points.filter((point) => point.month > 0).slice(-6);
  const maxBar = Math.max(...bars.map((point) => point.balance), 1);
  const lifeMeaningItems = useMemo(
    () => buildGrowthLifeMeaning(finalPoint.balance, settings),
    [finalPoint.balance, settings]
  );
  function getRealLifeTargetTotal(target: GrowthManualTarget) {
    const periodMonths = target.period === "year" ? 12 : 1;
    return safeNumber(target.amount) * periodMonths;
  }

  function getRealLifeTargetPeriodLabel(target: GrowthManualTarget) {
    return target.period === "year" ? "12 months" : "1 month";
  }

  function getRealLifeTargetMonthsLabel(target: GrowthManualTarget) {
    return `${formatGrowthMonthsCovered(finalPoint.balance, safeNumber(target.amount))} at ${money(
      safeNumber(target.amount),
      settings.currency
    )}/month`;
  }

  const completedRealLifeTargets = realLifeTargets.filter(
    (target) => target.name.trim() && safeNumber(target.amount) > 0
  );
  const primaryRealLifeTarget = completedRealLifeTargets[0] || realLifeTargets[0];
  const secondaryRealLifeTarget = completedRealLifeTargets[1] || realLifeTargets[1] || realLifeTargets[0];
  const activeGoalName = savingGoalName.trim() || "Your saving goal";
  const activeGoalTarget = Math.max(0, safeNumber(savingGoalAmount));
  const goalMonths = getMonthsToGrowthGoal(activeGoalTarget, monthlyContribution);
  const goalProgress =
    activeGoalTarget > 0 ? clamp((finalPoint.balance / activeGoalTarget) * 100, 0, 100) : 0;
  const savingGoalOptions = [
    "Buy a laptop",
    "Phone upgrade",
    "Emergency fund",
    "Debt payment",
    "Family support",
    "Business idea",
  ];
  const growthShareContext: GrowthShareContext = {
    primaryTargetName: primaryRealLifeTarget?.name.trim() || "Planned expense",
    primaryTargetPeriodLabel: primaryRealLifeTarget
      ? getRealLifeTargetPeriodLabel(primaryRealLifeTarget)
      : "1 month",
    primaryTargetCoverageLabel: primaryRealLifeTarget
      ? formatPlannedCostCoverage(
          finalPoint.balance,
          safeNumber(primaryRealLifeTarget.amount),
          primaryRealLifeTarget.period
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
          safeNumber(secondaryRealLifeTarget.amount),
          secondaryRealLifeTarget.period
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
      current.map((target) => (target.id === id ? { ...target, ...patch } : target))
    );
  }

  function addRealLifeTarget() {
    setRealLifeTargets((current) => [
      ...current,
      { id: uid(), name: "", amount: "", period: "one" },
    ]);
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
    setContributionAmount(String(leakAmount > 0 ? monthlyLeak : 25));
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
    writeGrowthSimulations(next);
    triggerHaptic("success");
  }

  function deleteSimulation(id: string) {
    const next = savedSimulations.filter((simulation) => simulation.id !== id);

    setSavedSimulations(next);
    writeGrowthSimulations(next);
    triggerHaptic("light");
  }

  async function copyGrowthShareText(text = growthShareText || buildGrowthShareText(preview, settings, growthShareContext)) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        window.alert("Share text copied.");
      }
    } catch {
      // Clipboard can be unavailable in some Telegram webviews.
    }
  }

  async function shareGrowthPlan(simulation = preview) {
    const text = buildGrowthShareText(simulation, settings, growthShareContext);

    setIsBuildingShareCard(true);

    try {
      const blob = await buildGrowthShareCardBlob(simulation, settings, growthShareContext);
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
        window.alert(
          "Growth card was sent to your Telegram bot chat. Open the bot chat and forward it anywhere."
        );
      } else if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "$BROKE Growth Lab",
          text,
          files: [file],
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        window.alert(
          "Telegram bot delivery needs Telegram initData. Open the app inside Telegram and try again. The card preview is ready below and share text was copied."
        );
      } else {
        window.alert(
          "Telegram bot delivery needs Telegram initData. Open the app inside Telegram and try again. The card preview is ready below."
        );
      }

      markDailyRoutineAction("sharedProgress");
      triggerHaptic("success");
    } catch {
      try {
        const blob = await buildGrowthShareCardBlob(simulation, settings, growthShareContext);
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
          window.alert(
            "Bot delivery failed. The card preview is ready below and share text was copied."
          );
        } else {
          window.alert("Bot delivery failed. The card preview is ready below.");
        }
      } catch {
        // User cancelled share or browser blocked the fallback.
      }
    } finally {
      setIsBuildingShareCard(false);
    }
  }

  return (
    <div className="screen growth-screen">
      <Header title="$BROKE Growth Lab" showBack rightIcon={A.help} onBack={onBack} onRight={onHelp} />

      <section className="growth-hero-card">
        <div>
          <span>Monthly Leak Plan</span>
          <h2>Turn this month’s leaks into a real goal plan.</h2>
          <p>
            Planning only. No real funds, no custody, no staking, and no investments.
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
              ? `Biggest leak: ${categoryLabel(topLeak.category)}`
              : "No leaks yet. Add expenses to create a real plan."}
          </p>
        </div>

        <button type="button" onClick={leakAmount > 0 ? useMyLeaks : onOpenAdd}>
          {leakAmount > 0 ? "Use my leaks" : "Track first leak"}
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
              <span>Growth Lab needs a real leak</span>
              <strong>No leaks detected yet.</strong>
              <p>
                Add one Not needed or Maybe expense first. Then Growth Lab can turn
                that leak into a realistic simulation.
              </p>
            </div>
          </div>
          <button type="button" className="v58-empty-primary" onClick={onOpenAdd}>
            Add first leak
          </button>
        </section>
      )}

      <section className="growth-form-card">
        <div className="section-title">
          <span>Create monthly leak plan</span>
          <small>{growthRiskLabel(riskLevel)}</small>
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
            <span>Redirected amount</span>
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
          No investment assumptions here. This plan simply redirects monthly leaks toward costs or a saving goal.
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
            <span>Plan value</span>
            <strong>{money(finalPoint.balance, settings.currency)}</strong>
          </div>

          <div>
            <span>Redirected/month</span>
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
            <span>Real Life Planner</span>
            <small>Costs first, goal second</small>
          </div>

          <p>
            Use this to translate the simulation into real life. Planned costs are bills
            or expenses you want to cover. Saving goal is the thing you are collecting toward.
          </p>

          <div className="growth-planner-tabs">
            <button
              type="button"
              className={growthPlannerTab === "costs" ? "active" : ""}
              onClick={() => setGrowthPlannerTab("costs")}
            >
              Planned costs
            </button>
            <button
              type="button"
              className={growthPlannerTab === "goal" ? "active" : ""}
              onClick={() => setGrowthPlannerTab("goal")}
            >
              Saving goal
            </button>
          </div>

          {growthPlannerTab === "costs" ? (
            <>
              <div className="growth-real-life-targets-head">
                <div>
                  <strong>Planned costs</strong>
                  <span>Add bills or planned expenses. Each row has its own 1m / 12m switch.</span>
                </div>
              </div>

              <div className="growth-real-life-target-list">
                {realLifeTargets.map((target) => {
                  const targetAmount = safeNumber(target.amount);
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
                          placeholder="Monthly amount"
                          onChange={(event) =>
                            updateRealLifeTarget(target.id, { amount: event.target.value })
                          }
                          aria-label="Planned cost monthly amount"
                        />

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
                          {formatPlannedCostCoverage(finalPoint.balance, targetAmount, target.period)}
                        </span>
                        <strong>{formatGoalTime(targetMonths)}</strong>
                        <small>
                          {formatGrowthMonthsCovered(finalPoint.balance, targetAmount)} at{" "}
                          {money(targetAmount, settings.currency)}/month
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
                  + Add planned cost
                </button>
              </div>
            </>
          ) : (
            <section className="growth-saving-goal-panel">
              <div className="growth-saving-goal-head">
                <div>
                  <strong>What are you saving for?</strong>
                  <span>Choose a name or type your own. The amount is always yours.</span>
                </div>
              </div>

              <div className="growth-saving-goal-options">
                {savingGoalOptions.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={savingGoalName === option ? "active" : ""}
                    onClick={() => setSavingGoalName(option)}
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
                    placeholder="Example: Buy a laptop"
                    onChange={(event) => setSavingGoalName(event.target.value)}
                  />
                </label>

                <label className="growth-field">
                  <span>Target amount</span>
                  <input
                    inputMode="decimal"
                    value={savingGoalAmount}
                    placeholder="Example: 800"
                    onChange={(event) => setSavingGoalAmount(event.target.value)}
                  />
                </label>
              </div>

              <div className="growth-goal-result">
                <div>
                  <span>Goal</span>
                  <strong>{activeGoalName}</strong>
                </div>
                <div>
                  <span>Target</span>
                  <strong>{money(activeGoalTarget, settings.currency)}</strong>
                </div>
                <div>
                  <span>Redirected/month</span>
                  <strong>{money(monthlyContribution, settings.currency)}</strong>
                </div>
              </div>

              <div className="growth-goal-progress">
                <i style={{ width: `${goalProgress}%` }} />
              </div>

              <p>
                If you redirect your leaks into this goal, you could reach it in{" "}
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
            {isBuildingShareCard ? "Sending to bot..." : "Share Saving Goal card"}
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
            <span>Saving goal card ready</span>
            <small>PNG</small>
          </div>

          <img src={growthShareCardUrl} alt="Saving goal share card preview" />

          <p>
            The main flow sends this PNG to your Telegram bot chat. If Telegram blocks
            delivery, you can still download the card, copy the text, or long-press the preview.
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

      <section className="growth-result-card">
        <div className="section-title">
          <span>Saved plans</span>
          <small>{savedSimulations.length}/8</small>
        </div>

        {savedSimulations.length === 0 && (
          <div className="growth-empty">
            <img src={A.challengeTrophy} alt="" />
            <strong>No saved plans yet.</strong>
            <span>Create one monthly leak plan and save it here.</span>
          </div>
        )}

        <div className="growth-saved-list">
          {savedSimulations.map((simulation) => {
            const result = getGrowthFinal(simulation);

            return (
              <article key={simulation.id}>
                <img src={GROWTH_PUBLIC_ASSETS.market} alt="" onError={(event) => { event.currentTarget.src = A.progressFlame; }} />
                <div>
                  <strong>{simulation.title}</strong>
                  <span>
                    {money(simulation.contributionAmount, settings.currency)}{" "}
                    {growthFrequencyLabel(simulation.contributionFrequency)} ·{" "}
                    {simulation.durationMonths} months
                  </span>
                  <small>
                    Final: {money(result.balance, settings.currency)} · Gain:{" "}
                    {money(result.gain, settings.currency)}
                  </small>
                </div>
                <button type="button" onClick={() => deleteSimulation(simulation.id)}>
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


function SurvivalModePanel({
  settings,
  forecast,
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
  adjustedDailyPace: number;
  daysSaved: number;
  totalMonthlySavings: number;
  nextPaydayDate: string;
  onPaydayDateChange: (value: string) => void;
  shareCardRef: React.RefObject<HTMLDivElement | null>;
  sharing: boolean;
  onShare: () => void;
}) {
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
        </div>
        <div>
          <span>Current pace</span>
          <strong>{settings.privacy.publicProofMode ? "hidden" : `${money(forecast.currentDailyPace, settings.currency)}/day`}</strong>
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
          If you reduce leaks by {money(totalMonthlySavings, settings.currency)}/month,
          your pace could become {money(adjustedDailyPace, settings.currency)}/day.
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
        <div className="survival-share-top">
          <div>
            <span>$BROKE SURVIVAL MODE</span>
            <strong>Can I survive until payday?</strong>
          </div>
          <img
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
          </div>
          <div>
            <span>Days left</span>
            <strong>{forecast.daysUntilIncome}</strong>
          </div>
          <div>
            <span>Safe/day</span>
            <strong>{publicProofMoney(settings, forecast.safeDailyBudget)}</strong>
          </div>
          <div>
            <span>Current/day</span>
            <strong>{publicProofMoney(settings, forecast.currentDailyPace)}</strong>
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

function WhatIfScreen({
  settings,
  setSettings,
  expenses,
  challengeTemplates,
  activeChallenge,
  challengeProgress,
  challengeLoading,
  leaderboard,
  leaderboardLoading,
  shareInitData,
  onToggleLeaderboard,
  onStartChallenge,
  onBack,
  onHelp,
  onOpenAdd,
}: {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  expenses: Expense[];
  challengeTemplates: ChallengeTemplate[];
  activeChallenge: UserChallenge | null;
  challengeProgress: ChallengeProgress | null;
  challengeLoading: boolean;
  leaderboard: LeaderboardState | null;
  leaderboardLoading: boolean;
  shareInitData: string;
  onToggleLeaderboard: (nextValue: boolean) => void;
  onStartChallenge: (challengeId: string) => void;
  onBack: () => void;
  onHelp: () => void;
  onOpenAdd: () => void;
}) {
  const [reductions, setReductions] = useState<Record<string, number>>({});
  const [survivalSharing, setSurvivalSharing] = useState(false);
  const survivalCardRef = useRef<HTMLDivElement | null>(null);

  const categorySummaries = useMemo(() => {
    return getCategorySummaries(expenses)
      .filter((item) => item.amount > 0)
      .slice(0, 6);
  }, [expenses]);

  const hasRealData = categorySummaries.length > 0;

  const cards = useMemo<CategorySummary[]>(() => {
    if (hasRealData) return categorySummaries;

    return [
      { category: "Coffee", amount: 84, count: 0, icon: A.coffee },
      { category: "Smoking", amount: 120, count: 0, icon: A.smoking },
      { category: "Takeouts", amount: 160, count: 0, icon: A.takeouts },
      { category: "Shopping", amount: 98, count: 0, icon: A.shopping },
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

  const survivalShareText = [
    "$BROKE Survival Mode",
    "",
    `Status: ${survivalForecast.statusLabel}`,
    `Real balance: ${publicProofMoney(settings, survivalForecast.realBalance)}`,
    `Next payday: ${settings.privacy.publicProofMode ? "hidden" : survivalForecast.nextPaydayDate}`,
    `Days until income: ${survivalForecast.daysUntilIncome}`,
    `Safe daily budget: ${settings.privacy.publicProofMode ? "hidden" : `${money(survivalForecast.safeDailyBudget, settings.currency)}/day`}`,
    `Current pace: ${settings.privacy.publicProofMode ? "hidden" : `${money(survivalForecast.currentDailyPace, settings.currency)}/day`}`,
    `Forecast: ${survivalForecast.dangerLabel}`,
    "",
    settings.privacy.publicProofMode ? "Public Proof Mode: exact private numbers hidden." : "Can you survive until payday?",
    "Smoke is broke.",
  ].join("\n");

  async function shareSurvivalCard() {
    if (!survivalCardRef.current || survivalSharing) return;

    triggerHaptic("light");
    markDailyRoutineAction("sharedProgress");
    setSurvivalSharing(true);

    try {
      const imageFile = await createShareImageFileFromElement(survivalCardRef.current);
      const nativeShared = await tryNativeImageShare(imageFile);

      if (nativeShared) return;

      if (!shareInitData) {
        downloadImageFile(imageFile);
        window.alert("Open the app inside Telegram to send the Survival card to the bot. On web, the PNG was downloaded.");
        return;
      }

      try {
        await sendShareImageViaBot(imageFile, shareInitData, survivalShareText);
        window.alert("Survival card was sent to your Telegram bot chat. Open the bot chat and forward it anywhere.");
      } catch {
        downloadImageFile(imageFile);
        window.alert("Bot delivery failed, so the Survival card was downloaded as PNG.");
      }
    } catch {
      window.alert("Survival card sharing is not supported by this browser.");
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

  return (
    <div className="screen">
      <Header title="Save" showBack rightIcon={A.help} onBack={onBack} onRight={onHelp} />

      <section className="whatif-hero">
        <img src={A.whatIfFrog} alt="" />
        <div>
          <h2>Small changes.</h2>
          <h2>Big wins.</h2>
          <p>
            {hasRealData
              ? "Based on your tracked expenses this month."
              : "Demo mode. Add expenses to get real scenarios."}
          </p>
        </div>
      </section>

      <section className="whatif-total-card">
        <span>Potential savings</span>
        <strong>{money(totalMonthlySavings, settings.currency)}</strong>
        <small>
          /month · {money(totalMonthlySavings * 12, settings.currency)}/year
        </small>
      </section>

      <SurvivalModePanel
        settings={settings}
        forecast={survivalForecast}
        adjustedDailyPace={survivalAdjustedPace}
        daysSaved={survivalDaysSaved}
        totalMonthlySavings={totalMonthlySavings}
        nextPaydayDate={settings.survival.nextPaydayDate || survivalForecast.nextPaydayDate}
        onPaydayDateChange={updateSurvivalPaydayDate}
        shareCardRef={survivalCardRef}
        sharing={survivalSharing}
        onShare={shareSurvivalCard}
      />

      {!hasRealData && (
        <section className="v58-empty-card v58-save-empty">
          <div className="v58-empty-head">
            <img src={A.whatIfFrog} alt="" />
            <div>
              <span>Save is in demo mode</span>
              <strong>No real scenarios yet.</strong>
              <p>
                Add expenses first. Then $BROKE will show what you could save by
                reducing your real leaks.
              </p>
            </div>
          </div>
          <button type="button" className="v58-empty-primary" onClick={onOpenAdd}>
            Add expense to unlock Save
          </button>
        </section>
      )}

      <details className="clean-details" open={Boolean(activeChallenge || challengeProgress)}>
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

      <details className="clean-details">
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

      <details className="clean-details" open>
        <summary>
          <div>
            <span>What If Scenarios</span>
            <small>Test how much you could save by reducing leaks.</small>
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
          <span>Total Potential Savings</span>
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

function SettingsScreen({
  settings,
  setSettings,
  expenses,
  currentMonthExpenses,
  onReset,
  onDeleteExpense,
  telegram,
  webAuth,
  cloudStatus,
  cloudError,
  streak,
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
  currentMonthExpenses: Expense[];
  onReset: () => void;
  onDeleteExpense: (id: string) => void;
  telegram: TelegramState;
  webAuth: WebAuthState;
  cloudStatus: CloudStatus;
  cloudError: string;
  streak: Streak;
  badges: BadgeItem[];
  leaderboard: LeaderboardState | null;
  leaderboardLoading: boolean;
  onToggleLeaderboard: (nextValue: boolean) => void;
  onBack: () => void;
  onHelp: () => void;
}) {
  const totalIncome = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);
  const monthSpent = sum(currentMonthExpenses.map((item) => item.amount));
  const categorySummaries = getCategorySummaries(currentMonthExpenses);
  const latestExpenses = expenses.slice(0, 8);
  const publicLeaderboard = Boolean(leaderboard?.me?.publicLeaderboard);

  function updateIncome(key: keyof Settings["income"], value: string) {
    setSettings((prev) => ({
      ...prev,
      income: {
        ...prev.income,
        [key]: safeNumber(value),
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

  return (
    <div className="screen">
      <Header title="Settings" showBack rightIcon={A.help} onBack={onBack} onRight={onHelp} />

      <LifeProfileEditor settings={settings} setSettings={setSettings} />

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
                    value={settings.categoryNames[cat.name] || cat.name}
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

        <EditableMoneyLine
          label={getPrimaryIncomeLabel(settings)}
          value={settings.income.salary}
          currency={settings.currency}
          onChange={(value) => updateIncome("salary", value)}
        />

        <EditableMoneyLine
          label="Side hustle / extra"
          value={settings.income.side}
          currency={settings.currency}
          onChange={(value) => updateIncome("side", value)}
        />

        <EditableMoneyLine
          label="Other / support"
          value={settings.income.other}
          currency={settings.currency}
          onChange={(value) => updateIncome("other", value)}
        />

        <SettingLine
          label="Estimated monthly income"
          value={money(totalIncome, settings.currency)}
          strong
          good
        />

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

        {settings.profile.hasRent && (
          <EditableMoneyLine
            label="Rent"
            value={settings.fixedCosts.rent}
            currency={settings.currency}
            onChange={(value) => updateFixedCost("rent", value)}
          />
        )}

        <EditableMoneyLine
          label="Utilities"
          value={settings.fixedCosts.utilities}
          currency={settings.currency}
          onChange={(value) => updateFixedCost("utilities", value)}
        />

        <EditableMoneyLine
          label="Food basics"
          value={settings.fixedCosts.food}
          currency={settings.currency}
          onChange={(value) => updateFixedCost("food", value)}
        />

        <EditableMoneyLine
          label="Transport"
          value={settings.fixedCosts.transport}
          currency={settings.currency}
          onChange={(value) => updateFixedCost("transport", value)}
        />

        <EditableMoneyLine
          label="Phone"
          value={settings.fixedCosts.phone}
          currency={settings.currency}
          onChange={(value) => updateFixedCost("phone", value)}
        />

        <EditableMoneyLine
          label="Data / Internet"
          value={settings.fixedCosts.data}
          currency={settings.currency}
          onChange={(value) => updateFixedCost("data", value)}
        />

        <EditableMoneyLine
          label="School / study"
          value={settings.fixedCosts.education}
          currency={settings.currency}
          onChange={(value) => updateFixedCost("education", value)}
        />

        <SettingLine
          label="Total Fixed Costs"
          value={money(fixedCosts, settings.currency)}
          strong
          bad
        />
        </section>
      </details>

      <section className="settings-menu">
        <div className="menu-line">
          <img src={A.currency} alt="" />
          <div>
            <strong>Currency</strong>
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
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="MDL">MDL (L)</option>
              <option value="NGN">NGN (₦)</option>
              <option value="PKR">PKR (Rs)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
          <b>›</b>
        </div>

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

        <MenuLine
          icon={A.categories}
          label="Tracked Expenses"
          value={`${expenses.length} total · ${currentMonthExpenses.length} this month`}
        />

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

      <details className="tech-details">
        <summary>Connection details</summary>
        <TelegramMiniStatus
          telegram={telegram}
          webAuth={webAuth}
          cloudStatus={cloudStatus}
          cloudError={cloudError}
        />
      </details>
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
}: {
  label: string;
  value: number;
  currency: Currency;
  onChange: (value: string) => void;
  plainNumber?: boolean;
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
  const max = Math.max(...chartDays.map((day) => day.spent), 1);

  return (
    <div className="mini-chart">
      {chartDays.map((day) => {
        const height = clamp(18 + (day.spent / max) * 62, 14, 80);

        return (
          <i
            key={day.key}
            className={day.spent > 0 ? "red" : "green"}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

function BottomNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
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
