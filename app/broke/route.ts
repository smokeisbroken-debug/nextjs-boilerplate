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

function supabaseUrl(path: string) {
  return `${getEnv("SUPABASE_URL").replace(/\/$/, "")}/rest/v1/${path}`;
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

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/broke",
    env: {
      TELEGRAM_BOT_TOKEN: hasEnv("TELEGRAM_BOT_TOKEN"),
      SUPABASE_URL: hasEnv("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: hasEnv("SUPABASE_SERVICE_ROLE_KEY"),
    },
  });
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

      return NextResponse.json({
        ok: true,
        settings,
        expenses,
      });
    }

    if (action === "addExpense") {
      const expense = await addExpense(telegramId, body.expense as Expense);

      return NextResponse.json({
        ok: true,
        expense,
      });
    }

    if (action === "deleteExpense") {
      await deleteExpense(telegramId, String(body.id));

      return NextResponse.json({
        ok: true,
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

      return NextResponse.json({
        ok: true,
        settings: defaultSettings,
        expenses: [],
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
