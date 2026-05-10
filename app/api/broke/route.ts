import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

type Currency = "USD" | "EUR" | "MDL";
type NeedType = "Needed" | "Not needed" | "Maybe";

type Settings = {
  currency: Currency;
  dailyReminder: boolean;
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

  await saveSettings(telegramId, defaultSettings);
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

      return NextResponse.json({
        ok: true,
        settings,
        expenses,
        streak,
      });
    }

    if (action === "addExpense") {
      const expense = await addExpense(telegramId, body.expense as Expense);
      const expenses = await getExpenses(telegramId);
      const streak = await getAndUpdateStreak(telegramId, expenses);

      return NextResponse.json({
        ok: true,
        expense,
        streak,
      });
    }

    if (action === "deleteExpense") {
      await deleteExpense(telegramId, String(body.id));
      const expenses = await getExpenses(telegramId);
      const streak = await getAndUpdateStreak(telegramId, expenses);

      return NextResponse.json({
        ok: true,
        streak,
      });
    }

    if (action === "saveSettings") {
      await saveSettings(telegramId, body.settings as Settings);

      return NextResponse.json({
        ok: true,
      });
    }

    if (action === "reset") {
      await resetData(telegramId);
      const streak = await resetStreak(telegramId);

      return NextResponse.json({
        ok: true,
        settings: defaultSettings,
        expenses: [],
        streak,
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
