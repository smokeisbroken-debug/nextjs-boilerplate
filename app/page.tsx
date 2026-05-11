"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

type Tab = "home" | "add" | "chart" | "whatif" | "settings";
type NeedType = "Needed" | "Not needed" | "Maybe";
type Currency = "USD" | "EUR" | "MDL";
type ChartRange = "day" | "week" | "month";

type Expense = {
  id: string;
  amount: number;
  category: string;
  needType: NeedType;
  note: string;
  createdAt: string;
};

type Settings = {
  currency: Currency;
  dailyReminder: boolean;
  onboardingCompleted?: boolean;
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
  };
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
  | "check_challenge";

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

const defaultSettings: Settings = {
  currency: "USD",
  dailyReminder: true,
  onboardingCompleted: false,
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
  },
};

const categories = [
  { name: "Coffee", icon: A.coffee },
  { name: "Smoking", icon: A.smoking },
  { name: "Takeouts", icon: A.takeouts },
  { name: "Shopping", icon: A.shopping },
  { name: "Subscriptions", icon: A.subscriptions },
  { name: "Taxi", icon: A.taxi },
  { name: "Custom", icon: A.custom },
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
  { id: "home", label: "Home", icon: A.navHome },
  { id: "add", label: "Add", icon: A.navAdd },
  { id: "chart", label: "Chart", icon: A.navChart },
  { id: "whatif", label: "Save", icon: A.navWhatIf },
  { id: "settings", label: "Settings", icon: A.navSettings },
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

function currencySymbol(currency: Currency) {
  if (currency === "EUR") return "€";
  if (currency === "MDL") return "L";
  return "$";
}

function money(value: number, currency: Currency) {
  const symbol = currencySymbol(currency);
  const abs = Math.abs(Math.round(value)).toLocaleString("en-US");
  return value < 0 ? `-${symbol}${abs}` : `${symbol}${abs}`;
}

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function getTotalIncome(settings: Settings) {
  return sum([
    settings.income.salary,
    settings.income.side,
    settings.income.other,
  ]);
}

function getFixedCosts(settings: Settings) {
  return sum([
    settings.fixedCosts.rent,
    settings.fixedCosts.utilities,
    settings.fixedCosts.food,
    settings.fixedCosts.transport,
    settings.fixedCosts.phone,
  ]);
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

  return insights.slice(0, 6);
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
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const openAppTrackedRef = useRef(false);
  const badgesReadyRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);

  const [amount, setAmount] = useState("25.00");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Coffee");
  const [expenseType, setExpenseType] = useState<NeedType>("Needed");

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
          setSettings({
            ...defaultSettings,
            ...parsed.settings,
            income: {
              ...defaultSettings.income,
              ...parsed.settings.income,
            },
            fixedCosts: {
              ...defaultSettings.fixedCosts,
              ...parsed.settings.fixedCosts,
            },
          });
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

        if (data.settings) setSettings(data.settings);
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

    triggerHaptic("success");
    setExpenses((prev) => [expense, ...prev]);
    setAmount("");
    setNote("");
    setExpenseType("Needed");
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
          applyApiFeedback(data, "Expense tracked");
          setCloudStatus("cloud");
        }
      } catch (error) {
        setCloudStatus("error");
        setCloudError(error instanceof Error ? error.message : "Expense cloud save failed");
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
    window.alert(
      "$BROKE Life Tracker\n\nAdd expenses, mark them as Needed / Not needed / Maybe, then check your Wallet HP, chart, and savings scenarios."
    );
  }

  function openExportHelp() {
    window.alert("Share and export options are available on the Home dashboard.");
  }

  function completeOnboarding(nextSettings: Settings) {
    triggerHaptic("success");

    const completedSettings: Settings = {
      ...nextSettings,
      onboardingCompleted: true,
    };

    setSettings(completedSettings);
    setOnboardingCompleted(true);
    localStorage.setItem(ONBOARDING_KEY, "true");
    setActiveTab("home");

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

  async function trackXpAction(xpAction: XpAction) {
    if (!cloudAuthReady) return;

    try {
      const data = await callBrokeApi(cloudInitData, "trackXp", {
        xpAction,
      });

      applyApiFeedback(data);
    } catch {
      // XP tracking must never block the app.
    }
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
            onDeleteExpense={deleteExpense}
            telegram={telegram}
            webAuth={webAuth}
            cloudStatus={cloudStatus}
            cloudError={cloudError}
            onBellClick={openProjectTelegram}
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
            onBack={goHome}
            onExport={openExportHelp}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "whatif" && (
          <WhatIfScreen
            settings={settings}
            expenses={currentMonthExpenses}
            challengeTemplates={challengeTemplates}
            activeChallenge={activeChallenge}
            challengeProgress={challengeProgress}
            challengeLoading={challengeLoading}
            leaderboard={leaderboard}
            leaderboardLoading={leaderboardLoading}
            onToggleLeaderboard={toggleLeaderboardPublic}
            onStartChallenge={startChallenge}
            onBack={goHome}
            onHelp={openHelp}
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
            cloudStatus={cloudStatus}
            cloudError={cloudError}
            streak={activeStreak}
            badges={badges}
            leaderboard={leaderboard}
            leaderboardLoading={leaderboardLoading}
            onToggleLeaderboard={toggleLeaderboardPublic}
            onBack={goHome}
          />
        )}

        {loaded && onboardingCompleted && (
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {toast && <AppToastView toast={toast} />}
      </section>

      {loaded && onboardingCompleted && <CommunityLiveSidebar />}
    </main>
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
  onComplete: (settings: Settings) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Settings>(settings);

  const firstName = telegram.user?.first_name || "there";
  const totalIncome = getTotalIncome(draft);
  const totalFixedCosts = getFixedCosts(draft);
  const realBalance = totalIncome - totalFixedCosts;

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

  function next() {
    triggerHaptic("light");
    setStep((prev) => Math.min(prev + 1, 3));
  }

  function back() {
    triggerHaptic("light");
    setStep((prev) => Math.max(prev - 1, 0));
  }

  return (
    <div className="screen onboarding-screen">
      <div className="onboarding-top">
        <img src={A.appFrog} alt="$BROKE" />
        <div>
          <span>Step {step + 1} / 4</span>
          <strong>$BROKE Setup</strong>
        </div>
      </div>

      <div className="onboarding-progress">
        <i style={{ width: `${((step + 1) / 4) * 100}%` }} />
      </div>

      {step === 0 && (
        <section className="onboarding-card intro">
          <img src={A.walletMascot} alt="" />
          <h1>Welcome, {firstName}.</h1>
          <p>
            This tracker is not about being rich. It is about seeing where your
            money leaks before the month disappears.
          </p>

          <div className="onboarding-points">
            <div>
              <b>01</b>
              <span>Track expenses</span>
            </div>
            <div>
              <b>02</b>
              <span>Find money leaks</span>
            </div>
            <div>
              <b>03</b>
              <span>Build Wallet HP</span>
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="onboarding-card">
          <h2>Monthly income</h2>
          <p>Enter realistic numbers. You can edit them later in Settings.</p>

          <div className="onboarding-fields">
            <EditableMoneyLine
              label="Salary"
              value={draft.income.salary}
              currency={draft.currency}
              onChange={(value) => updateIncome("salary", value)}
            />

            <EditableMoneyLine
              label="Side income"
              value={draft.income.side}
              currency={draft.currency}
              onChange={(value) => updateIncome("side", value)}
            />

            <EditableMoneyLine
              label="Other income"
              value={draft.income.other}
              currency={draft.currency}
              onChange={(value) => updateIncome("other", value)}
            />
          </div>

          <div className="onboarding-total">
            <span>Total income</span>
            <strong>{money(totalIncome, draft.currency)}</strong>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="onboarding-card">
          <h2>Fixed life costs</h2>
          <p>These are the costs you expect every month before random spending.</p>

          <div className="onboarding-fields">
            <EditableMoneyLine
              label="Rent"
              value={draft.fixedCosts.rent}
              currency={draft.currency}
              onChange={(value) => updateFixedCost("rent", value)}
            />

            <EditableMoneyLine
              label="Utilities"
              value={draft.fixedCosts.utilities}
              currency={draft.currency}
              onChange={(value) => updateFixedCost("utilities", value)}
            />

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
              label="Phone / Internet"
              value={draft.fixedCosts.phone}
              currency={draft.currency}
              onChange={(value) => updateFixedCost("phone", value)}
            />
          </div>

          <div className="onboarding-total">
            <span>Total fixed costs</span>
            <strong>{money(totalFixedCosts, draft.currency)}</strong>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="onboarding-card final">
          <img src={A.homeMascot} alt="" />
          <h2>Your tracker is ready.</h2>

          <div className="onboarding-summary">
            <div>
              <span>Income</span>
              <strong>{money(totalIncome, draft.currency)}</strong>
            </div>
            <div>
              <span>Life cost</span>
              <strong>{money(totalFixedCosts, draft.currency)}</strong>
            </div>
            <div>
              <span>Real balance</span>
              <strong>{money(realBalance, draft.currency)}</strong>
            </div>
          </div>

          <p>
            Start with small daily expenses. Coffee, taxis, takeouts, smoking,
            subscriptions. That is where the leaks become visible.
          </p>
        </section>
      )}

      <div className="onboarding-actions">
        {step > 0 ? (
          <button type="button" className="secondary-btn" onClick={back}>
            Back
          </button>
        ) : (
          <button type="button" className="secondary-btn ghost" onClick={() => onComplete(draft)}>
            Skip
          </button>
        )}

        {step < 3 ? (
          <button type="button" className="primary-btn onboarding-next" onClick={next}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="primary-btn onboarding-next"
            onClick={() => onComplete(draft)}
          >
            Start Tracking
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

function DashboardScreen({
  settings,
  summary,
  badges,
  walletInsights,
  chartDays,
  leaderboard,
  expenses,
  onDeleteExpense,
  telegram,
  webAuth,
  cloudStatus,
  cloudError,
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
  onDeleteExpense: (id: string) => void;
  telegram: TelegramState;
  webAuth: WebAuthState;
  cloudStatus: CloudStatus;
  cloudError: string;
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

  return (
    <div className="screen">
      <Header title="$BROKE Life Tracker" onRight={onBellClick} />

      <section className="hero">
        <div>
          <h1>
            Your wallet
            <br />
            is not broken.
            <span>It is leaking.</span>
          </h1>
        </div>

        <img className="home-mascot" src={A.homeMascot} alt="Mascot" />
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

      <StreakCard streak={summary.streak} />
      <BadgeMiniStrip badges={badges} />

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

      <WalletInsightsPanel insights={walletInsights} />

      <WebTelegramSyncCard telegram={telegram} webAuth={webAuth} />

      <ShareResultCard
        settings={settings}
        walletHp={summary.walletHp}
        totalLeaks={summary.totalLeaks}
        realBalance={summary.realBalance}
        potentialYearlySavings={summary.totalLeaks * 12}
        leaderboard={leaderboard}
      />

      <section className="chart-preview">
        <div className="section-title">
          <span>$BROKE Chart</span>
          <small>7D Preview</small>
        </div>

        <MiniChart chartDays={chartDays} />

        <div className="damage-card">
          <div>
            <small>Today's Damage</small>
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

      <RecentExpenses
        settings={settings}
        expenses={expenses}
        onDeleteExpense={onDeleteExpense}
      />
    </div>
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
    setIndex(0);
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
}: {
  settings: Settings;
  walletHp: number;
  totalLeaks: number;
  potentialYearlySavings: number;
  leaderboard: LeaderboardState | null;
}) {
  const shareStats = getShareLeaderboardStats(leaderboard);
  const rankLine =
    shareStats.rank || shareStats.publicLeaderboard
      ? `Leaderboard: ${shareStats.rankLabel}`
      : "Leaderboard: private";

  return [
    "My wallet is not broken.",
    "It is leaking.",
    "",
    `Wallet HP: ${walletHp}/100`,
    `Leaks found: ${money(totalLeaks, settings.currency)}`,
    `$BROKE Score: ${shareStats.xp.toLocaleString("en-US")} XP`,
    rankLine,
    `Streak: ${shareStats.currentStreak} days`,
    `Badges: ${shareStats.badgeCount}/45`,
    "",
    `Potential yearly savings: ${money(potentialYearlySavings, settings.currency)}`,
    "",
    "$BROKE Life Tracker made the leaks visible.",
  ].join("\n");
}

function ShareResultCard({
  settings,
  walletHp,
  totalLeaks,
  realBalance,
  potentialYearlySavings,
  leaderboard,
}: {
  settings: Settings;
  walletHp: number;
  totalLeaks: number;
  realBalance: number;
  potentialYearlySavings: number;
  leaderboard: LeaderboardState | null;
}) {
  const [copied, setCopied] = useState(false);
  const shareStats = getShareLeaderboardStats(leaderboard);

  const shareText = buildShareText({
    settings,
    walletHp,
    totalLeaks,
    potentialYearlySavings,
    leaderboard,
  });

  function openXShare() {
    triggerHaptic("light");
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

  return (
    <section className="share-card">
      <div className="section-title">
        <span>Share Result</span>
        <small>Telegram / X ready</small>
      </div>

      <div className="share-preview share-preview-social">
        <div>
          <span>Wallet HP</span>
          <strong>{walletHp}/100</strong>
        </div>
        <div>
          <span>Leaks</span>
          <strong>{money(totalLeaks, settings.currency)}</strong>
        </div>
        <div>
          <span>XP</span>
          <strong>{shareStats.xp.toLocaleString("en-US")}</strong>
        </div>
        <div>
          <span>Top</span>
          <strong>{shareStats.rankLabel}</strong>
        </div>
      </div>

      <div className="share-privacy-note">
        <span>Public share hides income and real balance.</span>
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
    </section>
  );
}

function RecentExpenses({
  settings,
  expenses,
  onDeleteExpense,
}: {
  settings: Settings;
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}) {
  return (
    <section className="recent-card">
      <div className="section-title">
        <span>Recent Expenses</span>
        <small>{expenses.length ? `${expenses.length} latest` : "No records"}</small>
      </div>

      {expenses.length === 0 ? (
        <div className="empty-expenses">
          <img src={A.addFrog} alt="" />
          <p>No leaks tracked yet. Add your first expense.</p>
        </div>
      ) : (
        <div className="expense-list">
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              currency={settings.currency}
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
  currency,
  onDeleteExpense,
}: {
  expense: Expense;
  currency: Currency;
  onDeleteExpense: (id: string) => void;
}) {
  return (
    <div className="expense-row">
      <img src={getCategoryIcon(expense.category)} alt="" />

      <div>
        <strong>{expense.category}</strong>
        <span>
          {expense.needType}
          {expense.note ? ` · ${expense.note}` : ""}
        </span>
      </div>

      <b>{money(expense.amount, currency)}</b>

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
              <span>{cat.name}</span>
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

      <div className="tiny-note">
        <img src={A.addFrog} alt="" />
        <span>Track daily leaks. Small leaks sink big wallets.</span>
      </div>
    </form>
  );
}

function ChartScreen({
  settings,
  expenses,
  walletInsights,
  onBack,
  onExport,
}: {
  settings: Settings;
  expenses: Expense[];
  walletInsights: WalletInsight[];
  onBack: () => void;
  onExport: () => void;
}) {
  const [range, setRange] = useState<ChartRange>("week");

  const chartData = useMemo(() => {
    return buildChartData(range, expenses, settings);
  }, [range, expenses, settings]);

  const maxSpent = Math.max(...chartData.map((point) => point.spent), 1);
  const selectedPoint = chartData[chartData.length - 1];

  const periodOpen = chartData[0]?.open ?? 0;
  const periodSpent = sum(chartData.map((point) => point.spent));
  const periodClose = periodOpen - periodSpent;

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

      <WalletInsightsPanel insights={walletInsights} compact />
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

function WhatIfScreen({
  settings,
  expenses,
  challengeTemplates,
  activeChallenge,
  challengeProgress,
  challengeLoading,
  leaderboard,
  leaderboardLoading,
  onToggleLeaderboard,
  onStartChallenge,
  onBack,
  onHelp,
}: {
  settings: Settings;
  expenses: Expense[];
  challengeTemplates: ChallengeTemplate[];
  activeChallenge: UserChallenge | null;
  challengeProgress: ChallengeProgress | null;
  challengeLoading: boolean;
  leaderboard: LeaderboardState | null;
  leaderboardLoading: boolean;
  onToggleLeaderboard: (nextValue: boolean) => void;
  onStartChallenge: (challengeId: string) => void;
  onBack: () => void;
  onHelp: () => void;
}) {
  const [reductions, setReductions] = useState<Record<string, number>>({});

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

      <ChallengesPanel
        templates={challengeTemplates.length ? challengeTemplates : defaultChallengeTemplates}
        activeChallenge={activeChallenge}
        progress={challengeProgress}
        loading={challengeLoading}
        currency={settings.currency}
        onStartChallenge={onStartChallenge}
      />

      <LeaderboardPanel
        leaderboard={leaderboard}
        loading={leaderboardLoading}
        onToggleLeaderboard={onToggleLeaderboard}
      />

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
  cloudStatus,
  cloudError,
  streak,
  badges,
  leaderboard,
  leaderboardLoading,
  onToggleLeaderboard,
  onBack,
}: {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  expenses: Expense[];
  currentMonthExpenses: Expense[];
  onReset: () => void;
  onDeleteExpense: (id: string) => void;
  telegram: TelegramState;
  cloudStatus: CloudStatus;
  cloudError: string;
  streak: Streak;
  badges: BadgeItem[];
  leaderboard: LeaderboardState | null;
  leaderboardLoading: boolean;
  onToggleLeaderboard: (nextValue: boolean) => void;
  onBack: () => void;
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

  return (
    <div className="screen">
      <Header title="Settings" showBack onBack={onBack} />

      <section className="settings-group">
        <h3>Income (Monthly)</h3>

        <EditableMoneyLine
          label="Salary"
          value={settings.income.salary}
          currency={settings.currency}
          onChange={(value) => updateIncome("salary", value)}
        />

        <EditableMoneyLine
          label="Side income"
          value={settings.income.side}
          currency={settings.currency}
          onChange={(value) => updateIncome("side", value)}
        />

        <EditableMoneyLine
          label="Other income"
          value={settings.income.other}
          currency={settings.currency}
          onChange={(value) => updateIncome("other", value)}
        />

        <SettingLine
          label="Total Income"
          value={money(totalIncome, settings.currency)}
          strong
          good
        />
      </section>

      <section className="settings-group">
        <h3>Fixed Life Costs (Monthly)</h3>

        <EditableMoneyLine
          label="Rent"
          value={settings.fixedCosts.rent}
          currency={settings.currency}
          onChange={(value) => updateFixedCost("rent", value)}
        />

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
          label="Phone / Internet"
          value={settings.fixedCosts.phone}
          currency={settings.currency}
          onChange={(value) => updateFixedCost("phone", value)}
        />

        <SettingLine
          label="Total Fixed Costs"
          value={money(fixedCosts, settings.currency)}
          strong
          bad
        />
      </section>

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

      <StreakSettingsPanel streak={streak} />
      <BadgeVaultPanel badges={badges} />

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

      <details className="tech-details">
        <summary>Technical status</summary>
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
}: {
  label: string;
  value: number;
  currency: Currency;
  onChange: (value: string) => void;
}) {
  const [draftValue, setDraftValue] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraftValue(String(value));
    }
  }, [focused, value]);

  return (
    <div className="setting-input-line">
      <span>{label}</span>
      <div>
        <small>{currencySymbol(currency)}</small>
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
