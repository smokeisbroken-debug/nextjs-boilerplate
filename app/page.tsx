"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

type Tab = "home" | "add" | "chart" | "whatif" | "settings";
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
  "Find the leak before it becomes lifestyle.": "Найди утечку, пока она не стала образом жизни.",
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
};

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
    .replace(/C\$([\d,.]+)\s+this week\b/g, "C$$1 на этой неделе")
    .replace(/(\$[\d,.]+)\s+this week\b/g, "$1 на этой неделе")
    .replace(/C\$([\d,.]+)\/year\b/g, "C$$1/год")
    .replace(/C\$([\d,.]+)\/год\b/g, "C$$1/год")
    .replace(/C\$([\d,.]+)\/month\b/g, "C$$1/мес")
    .replace(/C\$([\d,.]+)\/мес\b/g, "C$$1/мес")
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
    .replace(/\btakeout\b/g, "еда на заказ");
    // V52_MISSION_RULES
    .replace(/Avoid biggest leak:\s*([A-Za-zА-Яа-яёЁ _/-]+)/g, "Избегай главной утечки: $1")
    .replace(/(\d+)\/3 active/g, "$1/3 активно")
    .replace(/(Coffee|Taxi|Smoking|Takeout|Custom) tracked\./g, "$1 записано.")
    .replace(/C\$([\d,.]+) looks small once\. Repeated daily, it becomes a real wallet leak\./g, "C$$1 один раз выглядит мелочью. Каждый день — это уже реальная утечка кошелька.")
    .replace(/(\$[\d,.]+) looks small once\. Repeated daily, it becomes a real wallet leak\./g, "$1 один раз выглядит мелочью. Каждый день — это уже реальная утечка кошелька.")

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
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const openAppTrackedRef = useRef(false);
  const badgesReadyRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);

  const [amount, setAmount] = useState("25.00");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Coffee");
  const [expenseType, setExpenseType] = useState<NeedType>("Needed");
  const [lastTrackedExpense, setLastTrackedExpense] = useState<Expense | null>(null);

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

    triggerHaptic("success");
    setExpenses((prev) => [expense, ...prev]);
    setLastTrackedExpense(expense);
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

    triggerHaptic("success");
    setExpenses((prev) => [expense, ...prev]);
    setLastTrackedExpense(expense);
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
            onDeleteExpense={deleteExpense}
            onQuickLeak={addQuickExpense}
            onOpenAdd={() => setActiveTab("add")}
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
            webAuth={webAuth}
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

        {helpOpen && <HelpGuideModal onClose={() => setHelpOpen(false)} />}

        {toast && <AppToastView toast={toast} />}
      </section>

      {loaded && onboardingCompleted && <CommunityLiveSidebar />}
    </main>
  );
}





function HelpGuideModal({ onClose }: { onClose: () => void }) {
  const sections = [
    {
      title: "1. Set your Life Profile",
      body:
        "Choose your country or type your own, set currency, life mode, income style, rent mode and work/study hours. This makes the app fit your real life.",
      icon: A.walletMascot,
    },
    {
      title: "2. Add real expenses",
      body:
        "Go to Add, enter the amount, choose a category, and mark if it was Needed, Maybe, or Not needed.",
      icon: A.addFrog,
    },
    {
      title: "3. Mark leaks honestly",
      body:
        "Needed does not count as a leak. Maybe counts as half. Not needed counts as a full wallet leak.",
      icon: A.leaks,
    },
    {
      title: "4. Use Daily Routine",
      body:
        "Complete 7 real daily actions: open app, track expense, mark a leak, add context, check chart, check Save, and share public proof.",
      icon: A.dailyCheck,
    },
    {
      title: "5. Read Wallet Survival",
      body:
        "Survival Score, Biggest Leak, Hours Lost, Status and Doomspending Alert show what is draining your wallet this week.",
      icon: A.challengeTrophy,
    },
    {
      title: "6. Check the $BROKE Chart",
      body:
        "The chart shows how your balance moves like a trading chart. Green days are controlled. Red days show damage.",
      icon: A.navChart,
    },
    {
      title: "7. Share safely",
      body:
        "Share cards hide income and real balance. They only show safe public progress like Wallet HP, status, score, rank, streak and badges.",
      icon: A.export,
    },
  ];

  return (
    <div
      className="help-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="$BROKE Life Tracker guide"
    >
      <div className="help-modal">
        <div className="help-modal-head">
          <div>
            <span>Guide</span>
            <strong>How to use $BROKE</strong>
          </div>

          <button type="button" onClick={onClose} aria-label="Close guide">
            ×
          </button>
        </div>

        <p className="help-modal-intro">
          $BROKE is not a normal expense tracker. It helps you find wallet leaks,
          build discipline, and share safe progress.
        </p>

        <div className="help-modal-list">
          {sections.map((section) => (
            <article key={section.title}>
              <img src={section.icon} alt="" />
              <div>
                <strong>{section.title}</strong>
                <span>{section.body}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="help-modal-footer">
          <strong>Simple rule:</strong>
          <span>Track honestly. Fix one leak at a time. Protect Wallet HP.</span>
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
  const [draft, setDraft] = useState<Settings>(() => normalizeSettings(settings));

  const totalSteps = 5;
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
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
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
          <span>Step {step + 1} / {totalSteps}</span>
          <strong>Life Setup</strong>
        </div>
      </div>

      <div className="onboarding-progress">
        <i style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>

      {step === 0 && (
        <section className="onboarding-card intro">
          <img src={A.walletMascot} alt="" />
          <h1>Welcome, {firstName}.</h1>
          <p>
            $BROKE adapts to your real life: student, worker, freelancer, local
            currency, rent or no rent. No one-size-fits-all finance notebook.
          </p>

          <div className="onboarding-points">
            <div>
              <b>01</b>
              <span>Choose region</span>
            </div>
            <div>
              <b>02</b>
              <span>Set life mode</span>
            </div>
            <div>
              <b>03</b>
              <span>Find local leaks</span>
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <LifeProfileEditor settings={draft} setSettings={setDraft} />
      )}

      {step === 2 && (
        <section className="onboarding-card">
          <h2>{getIncomePeriodLabel(draft)}</h2>
          <p>Use the way money actually comes to you: salary, allowance, daily, weekly, or irregular.</p>

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

          <div className="onboarding-total">
            <span>Estimated monthly income</span>
            <strong>{money(totalIncome, draft.currency)}</strong>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="onboarding-card">
          <h2>Fixed life costs</h2>
          <p>Only add what applies. If you live with family or you are a student, rent can stay off.</p>

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

          <div className="onboarding-total">
            <span>Total fixed costs</span>
            <strong>{money(totalFixedCosts, draft.currency)}</strong>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="onboarding-card final">
          <img src={A.homeMascot} alt="" />
          <h2>Your tracker fits your life.</h2>

          <div className="onboarding-summary">
            <div>
              <span>Profile</span>
              <strong>{draft.profile.lifeMode}</strong>
            </div>
            <div>
              <span>Region</span>
              <strong>{draft.profile.country}</strong>
            </div>
            <div>
              <span>Real balance</span>
              <strong>{money(realBalance, draft.currency)}</strong>
            </div>
          </div>

          <p>
            Next step: add one real local leak. Data, transport, snacks, smoking,
            takeout, gaming, or anything that quietly drains the wallet.
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

        {step < totalSteps - 1 ? (
          <button type="button" className="primary-btn onboarding-next" onClick={next}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="primary-btn onboarding-next"
            onClick={() => onComplete(draft)}
          >
            Add first leak
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
  routineExpenses,
  allExpenses,
  onDeleteExpense,
  onQuickLeak,
  onOpenAdd,
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
  onDeleteExpense: (id: string) => void;
  onQuickLeak: (category: string, value: number, needType?: NeedType) => void;
  onOpenAdd: () => void;
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

      <TodayMissionPanel
        settings={settings}
        summary={summary}
        identityStats={identityStats}
        onOpenAdd={onOpenAdd}
      />

      <LifeProfileSummaryCard settings={settings} />

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

      <V2IdentityPanel settings={settings} identityStats={identityStats} />

      <DailyRoutinePanel
        settings={settings}
        summary={summary}
        expenses={routineExpenses}
        cloudReady={cloudAuthReady}
        onRoutineComplete={onRoutineComplete}
      />

      <WebTelegramSyncCard telegram={telegram} webAuth={webAuth} />

      {expenses.length === 0 && (
        <FirstLeakOnboardingCard
          settings={settings}
          onQuickLeak={onQuickLeak}
          onOpenAdd={onOpenAdd}
        />
      )}

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
          ? categoryLabel(identityStats.biggestLeakCategory)
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
        <img src={A.challengeTrophy} alt="" />

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
  const targetLeak =
    identityStats.biggestLeakAmount > 0
      ? categoryLabel(identityStats.biggestLeakCategory)
      : "first leak";

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

        <div className={identityStats.biggestLeakAmount > 0 ? "danger" : ""}>
          <b>2</b>
          <span>Avoid biggest leak: {targetLeak}</span>
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
        ? `${categoryLabel(identityStats.biggestLeakCategory)} (${money(
            identityStats.biggestLeakAmount,
            settings.currency
          )})`
        : "none"
    }`,
    `Life hours lost: ${identityStats.lifeHoursLost}h`,
    `$BROKE Score: ${shareStats.xp.toLocaleString("en-US")} XP`,
    rankLine,
    "",
    `Potential yearly savings: ${money(potentialYearlySavings, settings.currency)}`,
    "",
    "Find the leak before it becomes your lifestyle.",
  ].join("\n");
}

async function createShareImageFileFromElement(element: HTMLElement) {
  const html2canvasModule = await import("html2canvas");
  const html2canvas = html2canvasModule.default;

  const canvas = await html2canvas(element, {
    backgroundColor: "#020402",
    scale: Math.min(window.devicePixelRatio || 2, 3),
    useCORS: true,
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

      <div className="public-share-image-card" ref={shareCardRef}>
        <div className="public-share-top">
          <div>
            <span>$BROKE RESULT</span>
            <strong>Public share card</strong>
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
              ? categoryLabel(identityStats.biggestLeakCategory)
              : "none"}
          </strong>
          <strong>Hours lost: {identityStats.lifeHoursLost}h</strong>
        </div>

        <div className="public-share-savings">
          <span>Potential yearly savings</span>
          <strong>{money(potentialYearlySavings, settings.currency)}</strong>
          <small>Find the leak before it becomes lifestyle.</small>
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
              <span>{preset.label}</span>
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

      <ExpenseImpactCard settings={settings} expense={lastTrackedExpense} />

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
  webAuth,
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
  webAuth: WebAuthState;
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

      <LifeProfileEditor settings={settings} setSettings={setSettings} />

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
      </section>

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
    if (!focused) {
      setDraftValue(String(value));
    }
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
