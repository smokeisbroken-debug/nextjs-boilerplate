import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

type Currency = "USD" | "EUR" | "MDL";
type NeedType = "Needed" | "Not needed" | "Maybe";

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

type Expense = {
  id: string;
  amount: number;
  category: string;
  needType: NeedType;
  note: string;
  createdAt: string;
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

type BadgeDefinition = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

type UserBadge = {
  badgeId: string;
  earnedAt: string | null;
};

type BadgeItem = BadgeDefinition & {
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
  | "start_challenge"
  | "daily_streak"
  | "complete_challenge"
  | "unlock_badge";

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

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
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

const emptyStreak: Streak = {
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  updatedAt: null,
};

const defaultChallengeTemplates: ChallengeTemplate[] = [
  {
    id: "no_takeout_3",
    title: "No Takeout 3 Days",
    description: "Keep takeout spending under the limit for 3 days.",
    category: "Takeouts",
    durationDays: 3,
    maxSpend: 30,
    rewardHp: 10,
    icon: "/40_challenge_takeout.png",
  },
  {
    id: "coffee_control_7",
    title: "Coffee Control",
    description: "Keep coffee leaks under control for one week.",
    category: "Coffee",
    durationDays: 7,
    maxSpend: 25,
    rewardHp: 8,
    icon: "/42_challenge_coffee.png",
  },
  {
    id: "smoking_cut_7",
    title: "Smoking Cut 7 Days",
    description: "Reduce smoking spend for one week.",
    category: "Smoking",
    durationDays: 7,
    maxSpend: 60,
    rewardHp: 12,
    icon: "/41_challenge_smoking.png",
  },
  {
    id: "shopping_freeze_7",
    title: "Shopping Freeze",
    description: "Avoid random shopping leaks for 7 days.",
    category: "Shopping",
    durationDays: 7,
    maxSpend: 40,
    rewardHp: 12,
    icon: "/43_challenge_shopping.png",
  },
  {
    id: "subscription_killer",
    title: "Subscription Killer",
    description: "Control subscriptions and recurring costs.",
    category: "Subscriptions",
    durationDays: 7,
    maxSpend: 20,
    rewardHp: 10,
    icon: "/44_challenge_subscriptions.png",
  },
  {
    id: "wallet_recovery_7",
    title: "Wallet HP Recovery",
    description: "Keep total leaks low and rebuild Wallet HP.",
    category: "All",
    durationDays: 7,
    maxSpend: 120,
    rewardHp: 15,
    icon: "/45_challenge_wallet_recovery.png",
  },
];

const defaultBadges: BadgeDefinition[] = [
  {
    id: "stable_wallet",
    title: "Stable Wallet",
    description: "Keep Wallet HP high and leaks low.",
    icon: "/badge_stable_wallet.png",
  },
  {
    id: "small_leak",
    title: "Small Leak",
    description: "Track a month with only small leaks.",
    icon: "/badge_small_leak.png",
  },
  {
    id: "pressure_mode",
    title: "Pressure Mode",
    description: "Leaks are starting to pressure the wallet.",
    icon: "/badge_pressure_mode.png",
  },
  {
    id: "heavy_leak",
    title: "Heavy Leak",
    description: "A large share of your free money is leaking away.",
    icon: "/badge_heavy_leak.png",
  },
  {
    id: "full_broke_mode",
    title: "Full $BROKE Mode",
    description: "Real balance dropped to danger zone.",
    icon: "/badge_full_broke_mode.png",
  },
  {
    id: "saving_mode",
    title: "Saving Mode",
    description: "You kept leaks tight and protected your balance.",
    icon: "/badge_saving_mode.png",
  },
  {
    id: "good_month",
    title: "Good Month",
    description: "A strong month with healthy balance and discipline.",
    icon: "/badge_good_month.png",
  },
  {
    id: "overspending",
    title: "Overspending",
    description: "You spent more than your post-life-cost budget.",
    icon: "/badge_overspending.png",
  },
  {
    id: "recovery_mode",
    title: "Recovery Mode",
    description: "A streak and better habits pushed the wallet back up.",
    icon: "/badge_recovery_mode.png",
  },
  {
    id: "streak",
    title: "Streak",
    description: "Reach a 7-day tracking streak.",
    icon: "/badge_streak.png",
  },
];

const XP_RULES: Record<
  XpAction,
  { xp: number; cooldownMinutes: number; dailyActionMax: number }
> = {
  open_app: { xp: 5, cooldownMinutes: 15, dailyActionMax: 80 },
  add_expense: { xp: 10, cooldownMinutes: 2, dailyActionMax: 200 },
  add_note: { xp: 5, cooldownMinutes: 2, dailyActionMax: 80 },
  mark_need_type: { xp: 5, cooldownMinutes: 2, dailyActionMax: 100 },
  open_chart: { xp: 5, cooldownMinutes: 15, dailyActionMax: 60 },
  check_challenge: { xp: 10, cooldownMinutes: 15, dailyActionMax: 100 },
  start_challenge: { xp: 50, cooldownMinutes: 0, dailyActionMax: 200 },
  daily_streak: { xp: 50, cooldownMinutes: 0, dailyActionMax: 50 },
  complete_challenge: { xp: 150, cooldownMinutes: 0, dailyActionMax: 300 },
  unlock_badge: { xp: 75, cooldownMinutes: 0, dailyActionMax: 750 },
};

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function hasEnv(name: string) {
  return Boolean(process.env[name]);
}

function getSupabaseHeaders() {
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
}

function getSupabaseBaseUrl() {
  return getEnv("SUPABASE_URL")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

function supabaseUrl(path: string) {
  return `${getSupabaseBaseUrl()}/rest/v1/${path}`;
}

function verifyTelegramInitData(initData: string) {
  const botToken = getEnv("TELEGRAM_BOT_TOKEN");

  if (!initData) {
    throw new Error("Missing Telegram initData");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new Error("Missing Telegram hash");
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash !== hash) {
    throw new Error("Invalid Telegram initData hash. Check TELEGRAM_BOT_TOKEN in Vercel.");
  }

  const userRaw = params.get("user");

  if (!userRaw) {
    throw new Error("Telegram user not found in initData");
  }

  return JSON.parse(userRaw) as TelegramUser;
}

function settingsToDb(telegramId: number, settings: Settings) {
  return {
    telegram_id: telegramId,
    currency: settings.currency,
    daily_reminder: settings.dailyReminder,
    onboarding_completed: Boolean(settings.onboardingCompleted),
    income_salary: settings.income.salary,
    income_side: settings.income.side,
    income_other: settings.income.other,
    fixed_rent: settings.fixedCosts.rent,
    fixed_utilities: settings.fixedCosts.utilities,
    fixed_food: settings.fixedCosts.food,
    fixed_transport: settings.fixedCosts.transport,
    fixed_phone: settings.fixedCosts.phone,
    updated_at: new Date().toISOString(),
  };
}

function dbToSettings(row: Record<string, unknown>): Settings {
  return {
    currency: (row.currency as Currency) || "USD",
    dailyReminder: Boolean(row.daily_reminder),
    onboardingCompleted: Boolean(row.onboarding_completed),
    income: {
      salary: Number(row.income_salary ?? 0),
      side: Number(row.income_side ?? 0),
      other: Number(row.income_other ?? 0),
    },
    fixedCosts: {
      rent: Number(row.fixed_rent ?? 0),
      utilities: Number(row.fixed_utilities ?? 0),
      food: Number(row.fixed_food ?? 0),
      transport: Number(row.fixed_transport ?? 0),
      phone: Number(row.fixed_phone ?? 0),
    },
  };
}

function dbToExpense(row: Record<string, unknown>): Expense {
  return {
    id: String(row.id),
    amount: Number(row.amount ?? 0),
    category: String(row.category ?? "Custom"),
    needType: String(row.need_type ?? "Needed") as NeedType,
    note: String(row.note ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function dateKey(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function calculateStreakFromExpenses(expenses: Expense[]): Streak {
  const dates = Array.from(
    new Set(expenses.map((expense) => dateKey(new Date(expense.createdAt))))
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
    const time = new Date(`${key}T00:00:00Z`).getTime();

    if (previousTime && time - previousTime === 24 * 60 * 60 * 1000) {
      rollingStreak += 1;
    } else {
      rollingStreak = 1;
    }

    bestStreak = Math.max(bestStreak, rollingStreak);
    previousTime = time;
  }

  const today = dateKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = dateKey(yesterdayDate);

  let currentStreak = 0;

  if (dateSet.has(today) || dateSet.has(yesterday)) {
    const startKey = dateSet.has(today) ? today : yesterday;
    const cursor = new Date(`${startKey}T00:00:00Z`);

    while (dateSet.has(dateKey(cursor))) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  return {
    currentStreak,
    bestStreak,
    lastActiveDate,
    updatedAt: new Date().toISOString(),
  };
}

function dbToStreak(row: Record<string, unknown>): Streak {
  return {
    currentStreak: Number(row.current_streak ?? 0),
    bestStreak: Number(row.best_streak ?? 0),
    lastActiveDate: row.last_active_date ? String(row.last_active_date) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

async function getSavedStreak(telegramId: number) {
  const rows = (await supabaseFetch(
    `broke_streaks?telegram_id=eq.${telegramId}&select=*`
  )) as Record<string, unknown>[];

  return rows.length > 0 ? dbToStreak(rows[0]) : emptyStreak;
}

async function saveStreak(telegramId: number, streak: Streak) {
  await supabaseFetch("broke_streaks?on_conflict=telegram_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      telegram_id: telegramId,
      current_streak: streak.currentStreak,
      best_streak: streak.bestStreak,
      last_active_date: streak.lastActiveDate,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function getAndUpdateStreak(telegramId: number, expenses: Expense[]) {
  const calculated = calculateStreakFromExpenses(expenses);
  const saved = await getSavedStreak(telegramId);

  const streak: Streak = {
    currentStreak: calculated.currentStreak,
    bestStreak: Math.max(saved.bestStreak, calculated.bestStreak),
    lastActiveDate: calculated.lastActiveDate,
    updatedAt: new Date().toISOString(),
  };

  await saveStreak(telegramId, streak);
  return streak;
}

async function resetStreak(telegramId: number) {
  await saveStreak(telegramId, emptyStreak);
  return emptyStreak;
}


function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function monthKey(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getCurrentMonthExpenses(expenses: Expense[]) {
  const current = monthKey(new Date());
  return expenses.filter((expense) => monthKey(new Date(expense.createdAt)) === current);
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

function dbToUserBadge(row: Record<string, unknown>): UserBadge {
  return {
    badgeId: String(row.badge_id ?? ""),
    earnedAt: row.earned_at ? String(row.earned_at) : null,
  };
}

async function getUserBadges(telegramId: number) {
  try {
    const rows = (await supabaseFetch(
      `broke_user_badges?telegram_id=eq.${telegramId}&select=badge_id,earned_at`
    )) as Record<string, unknown>[];

    return rows.map(dbToUserBadge);
  } catch {
    return [] as UserBadge[];
  }
}

function getDisplayName(user: TelegramUser) {
  if (user.username) return `@${user.username}`;
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || "Broke User";
}

function getWeekKey(date: Date) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return dateKey(copy);
}

function getTrustLevel(streak: Streak) {
  if (streak.bestStreak >= 14) return 3;
  if (streak.bestStreak >= 7) return 2;
  if (streak.bestStreak >= 3) return 1;
  return 0;
}

function getTrustCaps(level: number) {
  if (level >= 3) return { dailyCap: 500, weeklyCap: 2500 };
  if (level === 2) return { dailyCap: 400, weeklyCap: 2000 };
  if (level === 1) return { dailyCap: 250, weeklyCap: 1250 };
  return { dailyCap: 150, weeklyCap: 750 };
}

function dbToLeaderboardProfile(row: Record<string, unknown>, rank?: number): LeaderboardProfile {
  const today = dateKey(new Date());
  const week = getWeekKey(new Date());
  const dailyKey = String(row.daily_key ?? "");
  const weeklyKey = String(row.weekly_key ?? "");

  return {
    telegramId: Number(row.telegram_id),
    displayName: String(row.display_name ?? "Broke User"),
    username: row.username ? String(row.username) : null,
    publicLeaderboard: Boolean(row.public_leaderboard),
    brokeScore: Number(row.total_xp ?? 0),
    dailyXp: dailyKey === today ? Number(row.daily_xp ?? 0) : 0,
    weeklyXp: weeklyKey === week ? Number(row.weekly_xp ?? 0) : 0,
    totalXp: Number(row.total_xp ?? 0),
    trustLevel: Number(row.trust_level ?? 0),
    currentStreak: Number(row.current_streak ?? 0),
    bestStreak: Number(row.best_streak ?? 0),
    badgeCount: Number(row.badge_count ?? 0),
    challengesCompleted: Number(row.challenges_completed ?? 0),
    updatedAt: row.updated_at ? String(row.updated_at) : null,
    rank,
  };
}

async function getCompletedChallengeCount(telegramId: number) {
  try {
    const rows = (await supabaseFetch(
      `broke_user_challenges?telegram_id=eq.${telegramId}&status=eq.completed&select=id`
    )) as Record<string, unknown>[];

    return rows.length;
  } catch {
    return 0;
  }
}

async function getRawLeaderboardProfile(telegramId: number) {
  try {
    const rows = (await supabaseFetch(
      `broke_leaderboard_profiles?telegram_id=eq.${telegramId}&select=*`
    )) as Record<string, unknown>[];

    return rows.length ? rows[0] : null;
  } catch {
    return null;
  }
}

async function saveLeaderboardProfile(row: Record<string, unknown>) {
  try {
    await supabaseFetch("broke_leaderboard_profiles?on_conflict=telegram_id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(row),
    });
  } catch {
    // Leaderboard SQL may not be applied yet.
  }
}

async function refreshLeaderboardProfile(
  telegramId: number,
  user: TelegramUser,
  streak: Streak,
  addXp = 0
) {
  const now = new Date();
  const today = dateKey(now);
  const week = getWeekKey(now);
  const existing = await getRawLeaderboardProfile(telegramId);
  const badgeCount = (await getUserBadges(telegramId)).length;
  const challengesCompleted = await getCompletedChallengeCount(telegramId);

  const previousDailyKey = String(existing?.daily_key ?? today);
  const previousWeeklyKey = String(existing?.weekly_key ?? week);

  const dailyXp =
    previousDailyKey === today ? Number(existing?.daily_xp ?? 0) + addXp : addXp;
  const weeklyXp =
    previousWeeklyKey === week ? Number(existing?.weekly_xp ?? 0) + addXp : addXp;
  const totalXp = Number(existing?.total_xp ?? 0) + addXp;

  const row = {
    telegram_id: telegramId,
    display_name: getDisplayName(user),
    username: user.username ?? null,
    public_leaderboard: Boolean(existing?.public_leaderboard),
    total_xp: totalXp,
    daily_xp: dailyXp,
    weekly_xp: weeklyXp,
    daily_key: today,
    weekly_key: week,
    trust_level: getTrustLevel(streak),
    current_streak: streak.currentStreak,
    best_streak: streak.bestStreak,
    badge_count: badgeCount,
    challenges_completed: challengesCompleted,
    last_seen_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  await saveLeaderboardProfile(row);
  return dbToLeaderboardProfile(row);
}

async function getXpSum(path: string) {
  try {
    const rows = (await supabaseFetch(path)) as Record<string, unknown>[];
    return rows.reduce((acc, row) => acc + Number(row.xp ?? 0), 0);
  } catch {
    return 0;
  }
}

async function hasXpEvent(path: string) {
  try {
    const rows = (await supabaseFetch(path)) as Record<string, unknown>[];
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function awardXp(
  telegramId: number,
  user: TelegramUser,
  action: XpAction,
  streak: Streak,
  sourceKey?: string
) {
  const rule = XP_RULES[action];
  if (!rule) return 0;

  const now = new Date();
  const today = dateKey(now);
  const week = getWeekKey(now);
  const profile = await refreshLeaderboardProfile(telegramId, user, streak, 0);
  const caps = getTrustCaps(profile.trustLevel);

  if (sourceKey) {
    const duplicate = await hasXpEvent(
      `broke_xp_events?telegram_id=eq.${telegramId}&action=eq.${action}&source_key=eq.${encodeURIComponent(
        sourceKey
      )}&select=id&limit=1`
    );

    if (duplicate) return 0;
  }

  if (rule.cooldownMinutes > 0) {
    const since = new Date(now.getTime() - rule.cooldownMinutes * 60 * 1000).toISOString();
    const recent = await hasXpEvent(
      `broke_xp_events?telegram_id=eq.${telegramId}&action=eq.${action}&created_at=gte.${encodeURIComponent(
        since
      )}&select=id&limit=1`
    );

    if (recent) return 0;
  }

  const dayStart = `${today}T00:00:00.000Z`;
  const weekStart = `${week}T00:00:00.000Z`;

  const actionToday = await getXpSum(
    `broke_xp_events?telegram_id=eq.${telegramId}&action=eq.${action}&created_at=gte.${encodeURIComponent(
      dayStart
    )}&select=xp`
  );

  const totalToday = await getXpSum(
    `broke_xp_events?telegram_id=eq.${telegramId}&created_at=gte.${encodeURIComponent(
      dayStart
    )}&select=xp`
  );

  const totalWeek = await getXpSum(
    `broke_xp_events?telegram_id=eq.${telegramId}&created_at=gte.${encodeURIComponent(
      weekStart
    )}&select=xp`
  );

  const available = Math.min(
    rule.xp,
    Math.max(0, rule.dailyActionMax - actionToday),
    Math.max(0, caps.dailyCap - totalToday),
    Math.max(0, caps.weeklyCap - totalWeek)
  );

  if (available <= 0) return 0;

  try {
    await supabaseFetch("broke_xp_events", {
      method: "POST",
      body: JSON.stringify({
        telegram_id: telegramId,
        action,
        xp: available,
        source_key: sourceKey ?? null,
        created_at: now.toISOString(),
      }),
    });
  } catch {
    return 0;
  }

  await refreshLeaderboardProfile(telegramId, user, streak, available);
  return available;
}

async function getLeaderboardState(
  telegramId: number,
  user: TelegramUser,
  streak: Streak
): Promise<LeaderboardState> {
  await refreshLeaderboardProfile(telegramId, user, streak, 0);

  const today = dateKey(new Date());
  const week = getWeekKey(new Date());

  async function list(path: string) {
    try {
      const rows = (await supabaseFetch(path)) as Record<string, unknown>[];
      return rows.map((row, index) => dbToLeaderboardProfile(row, index + 1));
    } catch {
      return [] as LeaderboardProfile[];
    }
  }

  const meRaw = await getRawLeaderboardProfile(telegramId);
  const me = meRaw ? dbToLeaderboardProfile(meRaw) : null;

  const [daily, weekly, allTime] = await Promise.all([
    list(
      `broke_leaderboard_profiles?public_leaderboard=eq.true&daily_key=eq.${today}&select=*&order=daily_xp.desc&limit=25`
    ),
    list(
      `broke_leaderboard_profiles?public_leaderboard=eq.true&weekly_key=eq.${week}&select=*&order=weekly_xp.desc&limit=25`
    ),
    list(
      "broke_leaderboard_profiles?public_leaderboard=eq.true&select=*&order=total_xp.desc&limit=25"
    ),
  ]);

  return { me, daily, weekly, allTime };
}

async function setLeaderboardOptIn(
  telegramId: number,
  user: TelegramUser,
  streak: Streak,
  publicLeaderboard: boolean
) {
  const profile = await refreshLeaderboardProfile(telegramId, user, streak, 0);

  await saveLeaderboardProfile({
    telegram_id: telegramId,
    display_name: profile.displayName,
    username: profile.username,
    public_leaderboard: publicLeaderboard,
    total_xp: profile.totalXp,
    daily_xp: profile.dailyXp,
    weekly_xp: profile.weeklyXp,
    daily_key: dateKey(new Date()),
    weekly_key: getWeekKey(new Date()),
    trust_level: profile.trustLevel,
    current_streak: profile.currentStreak,
    best_streak: profile.bestStreak,
    badge_count: profile.badgeCount,
    challenges_completed: profile.challengesCompleted,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

async function awardChallengeCompletionXp(
  telegramId: number,
  user: TelegramUser,
  streak: Streak,
  challengeState: {
    activeChallenge: UserChallenge | null;
    challengeProgress: ChallengeProgress | null;
  }
) {
  if (
    challengeState.activeChallenge &&
    challengeState.challengeProgress?.status === "completed"
  ) {
    await awardXp(
      telegramId,
      user,
      "complete_challenge",
      streak,
      challengeState.activeChallenge.id
    );
  }
}

async function awardBadges(telegramId: number, badgeIds: string[]) {
  if (!badgeIds.length) return;

  try {
    await supabaseFetch("broke_user_badges?on_conflict=telegram_id,badge_id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(
        badgeIds.map((badgeId) => ({
          telegram_id: telegramId,
          badge_id: badgeId,
          earned_at: new Date().toISOString(),
        }))
      ),
    });
  } catch {
    // Badge table may not exist yet. SQL file must be applied first.
  }
}

function shouldUnlockBadge(
  badgeId: string,
  settings: Settings,
  expenses: Expense[],
  streak: Streak
) {
  const monthExpenses = getCurrentMonthExpenses(expenses);
  const totalIncome = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);
  const monthSpent = sum(monthExpenses.map((item) => item.amount));
  const moneyLeaks = sum(
    monthExpenses.filter((item) => item.needType === "Not needed").map((item) => item.amount)
  );
  const maybeLeaks = sum(
    monthExpenses.filter((item) => item.needType === "Maybe").map((item) => item.amount * 0.5)
  );
  const totalLeaks = moneyLeaks + maybeLeaks;
  const availableAfterLifeCost = Math.max(totalIncome - fixedCosts, 1);
  const realBalance = totalIncome - fixedCosts - monthSpent;
  const walletHp = clamp(
    100 - Math.round((totalLeaks / availableAfterLifeCost) * 100),
    5,
    100
  );
  const trackedCount = monthExpenses.length;

  switch (badgeId) {
    case "stable_wallet":
      return trackedCount >= 3 && walletHp >= 85 && totalLeaks <= availableAfterLifeCost * 0.1;
    case "small_leak":
      return trackedCount >= 1 && totalLeaks > 0 && totalLeaks <= availableAfterLifeCost * 0.15;
    case "pressure_mode":
      return trackedCount >= 2 && totalLeaks >= availableAfterLifeCost * 0.2;
    case "heavy_leak":
      return trackedCount >= 3 && totalLeaks >= availableAfterLifeCost * 0.35;
    case "full_broke_mode":
      return trackedCount >= 3 && (realBalance <= 0 || walletHp <= 10);
    case "saving_mode":
      return trackedCount >= 5 && totalLeaks <= availableAfterLifeCost * 0.08 && realBalance > 0;
    case "good_month":
      return trackedCount >= 5 && realBalance >= availableAfterLifeCost * 0.5 && totalLeaks <= availableAfterLifeCost * 0.12;
    case "overspending":
      return trackedCount >= 1 && monthSpent > availableAfterLifeCost;
    case "recovery_mode":
      return trackedCount >= 5 && streak.currentStreak >= 3 && walletHp >= 70 && totalLeaks <= availableAfterLifeCost * 0.2;
    case "streak":
      return streak.bestStreak >= 7;
    default:
      return false;
  }
}

async function getBadgeState(
  telegramId: number,
  user: TelegramUser,
  settings: Settings,
  expenses: Expense[],
  streak: Streak
) {
  const existing = await getUserBadges(telegramId);
  const earnedSet = new Set(existing.map((item) => item.badgeId));

  const unlockedNow = defaultBadges
    .filter((badge) => !earnedSet.has(badge.id) && shouldUnlockBadge(badge.id, settings, expenses, streak))
    .map((badge) => badge.id);

  if (unlockedNow.length) {
    await awardBadges(telegramId, unlockedNow);

    for (const badgeId of unlockedNow) {
      await awardXp(telegramId, user, "unlock_badge", streak, badgeId);
    }
  }

  const fresh = await getUserBadges(telegramId);
  const freshMap = new Map(fresh.map((item) => [item.badgeId, item.earnedAt]));

  return defaultBadges.map((badge) => ({
    ...badge,
    earned: freshMap.has(badge.id),
    earnedAt: freshMap.get(badge.id) ?? null,
  })) as BadgeItem[];
}

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(supabaseUrl(path), {
    ...options,
    headers: {
      ...getSupabaseHeaders(),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

async function upsertUser(user: TelegramUser) {
  await supabaseFetch("broke_users?on_conflict=telegram_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      telegram_id: user.id,
      username: user.username ?? null,
      first_name: user.first_name ?? null,
      last_name: user.last_name ?? null,
      language_code: user.language_code ?? null,
      photo_url: user.photo_url ?? null,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function getSettings(telegramId: number) {
  const rows = (await supabaseFetch(
    `broke_settings?telegram_id=eq.${telegramId}&select=*`
  )) as Record<string, unknown>[];

  if (rows.length > 0) {
    return dbToSettings(rows[0]);
  }

  await saveSettings(telegramId, defaultSettings);
  return defaultSettings;
}

async function saveSettings(telegramId: number, settings: Settings) {
  await supabaseFetch("broke_settings?on_conflict=telegram_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(settingsToDb(telegramId, settings)),
  });
}

async function getExpenses(telegramId: number) {
  const rows = (await supabaseFetch(
    `broke_expenses?telegram_id=eq.${telegramId}&select=*&order=created_at.desc&limit=500`
  )) as Record<string, unknown>[];

  return rows.map(dbToExpense);
}

async function importLocalExpensesIfEmpty(telegramId: number, expenses: Expense[]) {
  if (!expenses.length) return;

  const existing = (await supabaseFetch(
    `broke_expenses?telegram_id=eq.${telegramId}&select=id&limit=1`
  )) as Record<string, unknown>[];

  if (existing.length > 0) return;

  const rows = expenses.slice(0, 200).map((expense) => ({
    telegram_id: telegramId,
    amount: expense.amount,
    category: expense.category,
    need_type: expense.needType,
    note: expense.note || "",
    created_at: expense.createdAt || new Date().toISOString(),
  }));

  await supabaseFetch("broke_expenses", {
    method: "POST",
    body: JSON.stringify(rows),
  });
}

async function addExpense(telegramId: number, expense: Expense) {
  const rows = (await supabaseFetch("broke_expenses?select=*", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      telegram_id: telegramId,
      amount: expense.amount,
      category: expense.category,
      need_type: expense.needType,
      note: expense.note || "",
      created_at: expense.createdAt || new Date().toISOString(),
    }),
  })) as Record<string, unknown>[];

  return dbToExpense(rows[0]);
}

async function deleteExpense(telegramId: number, id: string) {
  await supabaseFetch(`broke_expenses?id=eq.${id}&telegram_id=eq.${telegramId}`, {
    method: "DELETE",
  });
}

async function resetData(telegramId: number) {
  await supabaseFetch(`broke_expenses?telegram_id=eq.${telegramId}`, {
    method: "DELETE",
  });

  try {
    await supabaseFetch(`broke_user_challenges?telegram_id=eq.${telegramId}`, {
      method: "DELETE",
    });
  } catch {
    // ignore if table not ready
  }

  try {
    await supabaseFetch(`broke_user_badges?telegram_id=eq.${telegramId}`, {
      method: "DELETE",
    });
  } catch {
    // ignore if table not ready
  }

  try {
    await supabaseFetch(`broke_xp_events?telegram_id=eq.${telegramId}`, {
      method: "DELETE",
    });
  } catch {
    // ignore if table not ready
  }

  try {
    await supabaseFetch(`broke_leaderboard_profiles?telegram_id=eq.${telegramId}`, {
      method: "DELETE",
    });
  } catch {
    // ignore if table not ready
  }

  await saveSettings(telegramId, defaultSettings);
}


function dbToChallengeTemplate(row: Record<string, unknown>): ChallengeTemplate {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    category: String(row.category ?? "All"),
    durationDays: Number(row.duration_days ?? 7),
    maxSpend: Number(row.max_spend ?? 0),
    rewardHp: Number(row.reward_hp ?? 0),
    icon: String(row.icon ?? "/49_challenge_trophy.png"),
  };
}

function dbToUserChallenge(row: Record<string, unknown>): UserChallenge {
  return {
    id: String(row.id),
    challengeId: String(row.challenge_id),
    status: String(row.status ?? "active") as ChallengeStatus,
    startedAt: String(row.started_at),
    endsAt: String(row.ends_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
  };
}

async function getChallengeTemplates() {
  try {
    const rows = (await supabaseFetch(
      "broke_challenges?is_active=eq.true&select=*&order=sort_order.asc"
    )) as Record<string, unknown>[];

    if (!rows.length) return defaultChallengeTemplates;

    return rows.map(dbToChallengeTemplate);
  } catch {
    return defaultChallengeTemplates;
  }
}

async function getLatestUserChallenge(telegramId: number) {
  const rows = (await supabaseFetch(
    `broke_user_challenges?telegram_id=eq.${telegramId}&select=*&order=started_at.desc&limit=1`
  )) as Record<string, unknown>[];

  return rows.length ? dbToUserChallenge(rows[0]) : null;
}

function getChallengeSpent(
  template: ChallengeTemplate,
  challenge: UserChallenge,
  expenses: Expense[]
) {
  const startedAt = new Date(challenge.startedAt).getTime();
  const endsAt = new Date(challenge.endsAt).getTime();

  return expenses
    .filter((expense) => {
      const expenseTime = new Date(expense.createdAt).getTime();
      const categoryMatch =
        template.category === "All" || expense.category === template.category;

      return categoryMatch && expenseTime >= startedAt && expenseTime <= endsAt;
    })
    .reduce((acc, expense) => acc + expense.amount, 0);
}

function buildChallengeProgress(
  template: ChallengeTemplate,
  challenge: UserChallenge,
  expenses: Expense[]
): ChallengeProgress {
  const now = Date.now();
  const endsAt = new Date(challenge.endsAt).getTime();
  const spent = getChallengeSpent(template, challenge, expenses);
  const daysLeft = Math.max(
    0,
    Math.ceil((endsAt - now) / (24 * 60 * 60 * 1000))
  );

  let status = challenge.status;

  if (status === "active" && now > endsAt) {
    status = spent <= template.maxSpend ? "completed" : "failed";
  }

  return {
    title: template.title,
    description: template.description,
    category: template.category,
    icon: template.icon,
    status,
    spent,
    maxSpend: template.maxSpend,
    rewardHp: template.rewardHp,
    durationDays: template.durationDays,
    daysLeft,
    percentUsed: template.maxSpend > 0 ? (spent / template.maxSpend) * 100 : 0,
  };
}

async function updateChallengeStatus(id: string, status: ChallengeStatus) {
  await supabaseFetch(`broke_user_challenges?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      completed_at: status === "active" ? null : new Date().toISOString(),
    }),
  });
}

async function getChallengeState(telegramId: number, expenses?: Expense[]) {
  const challengeTemplates = await getChallengeTemplates();
  const activeChallenge = await getLatestUserChallenge(telegramId);

  if (!activeChallenge) {
    return {
      challengeTemplates,
      activeChallenge: null,
      challengeProgress: null,
    };
  }

  const template =
    challengeTemplates.find((item) => item.id === activeChallenge.challengeId) ??
    defaultChallengeTemplates.find((item) => item.id === activeChallenge.challengeId);

  if (!template) {
    return {
      challengeTemplates,
      activeChallenge: null,
      challengeProgress: null,
    };
  }

  const allExpenses = expenses ?? (await getExpenses(telegramId));
  const challengeProgress = buildChallengeProgress(template, activeChallenge, allExpenses);

  if (activeChallenge.status === "active" && challengeProgress.status !== "active") {
    await updateChallengeStatus(activeChallenge.id, challengeProgress.status);
  }

  return {
    challengeTemplates,
    activeChallenge: {
      ...activeChallenge,
      status: challengeProgress.status,
      completedAt:
        challengeProgress.status === "active"
          ? activeChallenge.completedAt
          : activeChallenge.completedAt ?? new Date().toISOString(),
    },
    challengeProgress,
  };
}

async function startChallenge(telegramId: number, challengeId: string) {
  const challengeTemplates = await getChallengeTemplates();
  const template = challengeTemplates.find((item) => item.id === challengeId);

  if (!template) {
    throw new Error("Challenge not found");
  }

  const latest = await getLatestUserChallenge(telegramId);

  if (latest?.status === "active" && new Date(latest.endsAt).getTime() > Date.now()) {
    throw new Error("You already have an active challenge");
  }

  const startedAt = new Date();
  const endsAt = new Date(startedAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + template.durationDays);

  const rows = (await supabaseFetch("broke_user_challenges?select=*", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      telegram_id: telegramId,
      challenge_id: template.id,
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "active",
    }),
  })) as Record<string, unknown>[];

  return dbToUserChallenge(rows[0]);
}

async function checkSupabaseTable(tableName: string) {
  try {
    const response = await fetch(supabaseUrl(`${tableName}?select=*&limit=1`), {
      method: "GET",
      headers: getSupabaseHeaders(),
      cache: "no-store",
    });

    const text = await response.text();

    return {
      table: tableName,
      ok: response.ok,
      status: response.status,
      body: text.slice(0, 600),
    };
  } catch (error) {
    return {
      table: tableName,
      ok: false,
      status: 0,
      body: error instanceof Error ? error.message : "Unknown check error",
    };
  }
}

export async function GET(request: NextRequest) {
  const check = request.nextUrl.searchParams.get("check");

  const base = {
    ok: true,
    route: "/api/broke",
    env: {
      TELEGRAM_BOT_TOKEN: hasEnv("TELEGRAM_BOT_TOKEN"),
      SUPABASE_URL: hasEnv("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: hasEnv("SUPABASE_SERVICE_ROLE_KEY"),
    },
  };

  if (check !== "supabase") {
    return NextResponse.json(base);
  }

  try {
    const tables = await Promise.all([
      checkSupabaseTable("broke_users"),
      checkSupabaseTable("broke_settings"),
      checkSupabaseTable("broke_expenses"),
      checkSupabaseTable("broke_streaks"),
      checkSupabaseTable("broke_challenges"),
      checkSupabaseTable("broke_user_challenges"),
      checkSupabaseTable("broke_user_badges"),
      checkSupabaseTable("broke_xp_events"),
      checkSupabaseTable("broke_leaderboard_profiles"),
    ]);

    return NextResponse.json({
      ...base,
      supabase: {
        originalUrl: getEnv("SUPABASE_URL").replace(/\?.*$/, ""),
        normalizedBaseUrl: getSupabaseBaseUrl(),
        urlHost: new URL(getSupabaseBaseUrl()).host,
        tables,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ...base,
        ok: false,
        supabaseError: error instanceof Error ? error.message : "Unknown diagnostic error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || "");
    const user = verifyTelegramInitData(String(body.initData || ""));
    const telegramId = user.id;

    await upsertUser(user);

    if (action === "sync") {
      const localData = body.localData as
        | { settings?: Settings; expenses?: Expense[] }
        | undefined;

      const settings = await getSettings(telegramId);

      if (localData?.expenses?.length) {
        await importLocalExpensesIfEmpty(telegramId, localData.expenses);
      }

      const expenses = await getExpenses(telegramId);
      const streak = await getAndUpdateStreak(telegramId, expenses);
      const challengeState = await getChallengeState(telegramId, expenses);
      await awardChallengeCompletionXp(telegramId, user, streak, challengeState);
      const badges = await getBadgeState(telegramId, user, settings, expenses, streak);

      if (streak.lastActiveDate === dateKey(new Date())) {
        await awardXp(telegramId, user, "daily_streak", streak, dateKey(new Date()));
      }

      const leaderboard = await getLeaderboardState(telegramId, user, streak);

      return NextResponse.json({
        ok: true,
        settings,
        expenses,
        streak,
        badges,
        leaderboard,
        ...challengeState,
      });
    }

    if (action === "addExpense") {
      const expense = await addExpense(telegramId, body.expense as Expense);
      const settings = await getSettings(telegramId);
      const expenses = await getExpenses(telegramId);
      const streak = await getAndUpdateStreak(telegramId, expenses);
      const challengeState = await getChallengeState(telegramId, expenses);
      await awardChallengeCompletionXp(telegramId, user, streak, challengeState);
      await awardXp(telegramId, user, "add_expense", streak);

      if (expense.note.trim()) {
        await awardXp(telegramId, user, "add_note", streak);
      }

      await awardXp(telegramId, user, "mark_need_type", streak);

      if (streak.lastActiveDate === dateKey(new Date())) {
        await awardXp(telegramId, user, "daily_streak", streak, dateKey(new Date()));
      }

      const badges = await getBadgeState(telegramId, user, settings, expenses, streak);
      const leaderboard = await getLeaderboardState(telegramId, user, streak);

      return NextResponse.json({
        ok: true,
        expense,
        streak,
        badges,
        leaderboard,
        ...challengeState,
      });
    }

    if (action === "deleteExpense") {
      await deleteExpense(telegramId, String(body.id));
      const settings = await getSettings(telegramId);
      const expenses = await getExpenses(telegramId);
      const streak = await getAndUpdateStreak(telegramId, expenses);
      const challengeState = await getChallengeState(telegramId, expenses);
      await awardChallengeCompletionXp(telegramId, user, streak, challengeState);
      const badges = await getBadgeState(telegramId, user, settings, expenses, streak);
      const leaderboard = await getLeaderboardState(telegramId, user, streak);

      return NextResponse.json({
        ok: true,
        streak,
        badges,
        leaderboard,
        ...challengeState,
      });
    }

    if (action === "startChallenge") {
      await startChallenge(telegramId, String(body.challengeId));
      const settings = await getSettings(telegramId);
      const expenses = await getExpenses(telegramId);
      const streak = await getAndUpdateStreak(telegramId, expenses);
      const challengeState = await getChallengeState(telegramId, expenses);
      await awardXp(telegramId, user, "start_challenge", streak, String(body.challengeId));
      await awardChallengeCompletionXp(telegramId, user, streak, challengeState);
      const badges = await getBadgeState(telegramId, user, settings, expenses, streak);
      const leaderboard = await getLeaderboardState(telegramId, user, streak);

      return NextResponse.json({
        ok: true,
        badges,
        leaderboard,
        ...challengeState,
      });
    }

    if (action === "trackXp") {
      const settings = await getSettings(telegramId);
      const expenses = await getExpenses(telegramId);
      const streak = await getAndUpdateStreak(telegramId, expenses);
      const xpAction = String(body.xpAction || "") as XpAction;

      if (!XP_RULES[xpAction]) {
        return NextResponse.json(
          { ok: false, error: "Unknown XP action" },
          { status: 400 }
        );
      }

      const xpAwarded = await awardXp(telegramId, user, xpAction, streak);
      const badges = await getBadgeState(telegramId, user, settings, expenses, streak);
      const leaderboard = await getLeaderboardState(telegramId, user, streak);

      return NextResponse.json({
        ok: true,
        xpAwarded,
        badges,
        leaderboard,
      });
    }

    if (action === "setLeaderboardOptIn") {
      const expenses = await getExpenses(telegramId);
      const streak = await getAndUpdateStreak(telegramId, expenses);
      await setLeaderboardOptIn(
        telegramId,
        user,
        streak,
        Boolean(body.publicLeaderboard)
      );

      const leaderboard = await getLeaderboardState(telegramId, user, streak);

      return NextResponse.json({
        ok: true,
        leaderboard,
      });
    }

    if (action === "saveSettings") {
      const settings = body.settings as Settings;
      await saveSettings(telegramId, settings);
      const expenses = await getExpenses(telegramId);
      const streak = await getAndUpdateStreak(telegramId, expenses);
      const badges = await getBadgeState(telegramId, user, settings, expenses, streak);
      const leaderboard = await getLeaderboardState(telegramId, user, streak);

      return NextResponse.json({
        ok: true,
        badges,
        leaderboard,
      });
    }

    if (action === "reset") {
      await resetData(telegramId);
      const streak = await resetStreak(telegramId);
      const challengeState = await getChallengeState(telegramId, []);
      const badges = defaultBadges.map((badge) => ({
        ...badge,
        earned: false,
        earnedAt: null,
      })) as BadgeItem[];
      const leaderboard = await getLeaderboardState(telegramId, user, streak);

      return NextResponse.json({
        ok: true,
        settings: defaultSettings,
        expenses: [],
        streak,
        badges,
        leaderboard,
        ...challengeState,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Unknown action",
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
