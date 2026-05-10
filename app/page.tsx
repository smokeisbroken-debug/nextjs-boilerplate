"use client";

import { useEffect, useMemo, useState } from "react";
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

type CloudStatus = "local" | "syncing" | "cloud" | "error";

type BrokeApiResponse = {
  ok: boolean;
  settings?: Settings;
  expenses?: Expense[];
  expense?: Expense;
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

const emptyTelegramState: TelegramState = {
  isTelegram: false,
  user: null,
  platform: "browser",
  version: "-",
  colorScheme: "dark",
  startParam: "",
  initData: "",
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

const categories = [
  { name: "Coffee", icon: A.coffee },
  { name: "Smoking", icon: A.smoking },
  { name: "Takeouts", icon: A.takeouts },
  { name: "Shopping", icon: A.shopping },
  { name: "Subscriptions", icon: A.subscriptions },
  { name: "Taxi", icon: A.taxi },
  { name: "Custom", icon: A.custom },
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
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("local");
  const [cloudError, setCloudError] = useState("");
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const [amount, setAmount] = useState("25.00");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Coffee");
  const [expenseType, setExpenseType] = useState<NeedType>("Needed");

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
    if (!loaded || !telegram.isTelegram || !telegram.initData) return;

    let cancelled = false;

    async function syncCloudData() {
      try {
        setCloudStatus("syncing");
        setCloudError("");

        const data = await callBrokeApi(telegram.initData, "sync", {
          localData: {
            settings,
            expenses,
          },
        });

        if (cancelled) return;

        if (data.settings) setSettings(data.settings);
        if (data.expenses) setExpenses(data.expenses);

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
  }, [loaded, telegram.isTelegram, telegram.initData]);

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
    if (!loaded || cloudStatus !== "cloud" || !telegram.initData) return;

    const timeout = window.setTimeout(async () => {
      try {
        await callBrokeApi(telegram.initData, "saveSettings", {
          settings,
        });
      } catch (error) {
        setCloudStatus("error");
        setCloudError(error instanceof Error ? error.message : "Settings cloud save failed");
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [loaded, cloudStatus, telegram.initData, settings]);

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

    if (telegram.isTelegram && telegram.initData) {
      try {
        const data = await callBrokeApi(telegram.initData, "addExpense", {
          expense,
        });

        if (data.expense) {
          setExpenses((prev) =>
            prev.map((item) => (item.id === expense.id ? data.expense! : item))
          );
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

    if (telegram.isTelegram && telegram.initData) {
      try {
        await callBrokeApi(telegram.initData, "deleteExpense", { id });
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

    if (telegram.isTelegram && telegram.initData) {
      try {
        await callBrokeApi(telegram.initData, "reset");
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
    setSettings(nextSettings);
    setOnboardingCompleted(true);
    localStorage.setItem(ONBOARDING_KEY, "true");
    setActiveTab("home");
  }

  const summary = {
    totalIncome,
    fixedCosts,
    spentThisMonth,
    totalLeaks,
    realBalance,
    walletHp,
    todaySpent,
  };

  return (
    <main className="app-shell">
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

        {loaded && !onboardingCompleted && (
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
            chartDays={chartDays}
            expenses={currentMonthExpenses.slice(0, 6)}
            onDeleteExpense={deleteExpense}
            telegram={telegram}
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
            onBack={goHome}
            onExport={openExportHelp}
          />
        )}

        {loaded && onboardingCompleted && activeTab === "whatif" && (
          <WhatIfScreen
            settings={settings}
            expenses={currentMonthExpenses}
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
            onBack={goHome}
          />
        )}

        {loaded && onboardingCompleted && (
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </section>
    </main>
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
  chartDays,
  expenses,
  onDeleteExpense,
  telegram,
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
  };
  chartDays: ChartPoint[];
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  telegram: TelegramState;
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

      <ShareResultCard
        settings={settings}
        walletHp={summary.walletHp}
        totalLeaks={summary.totalLeaks}
        realBalance={summary.realBalance}
        potentialYearlySavings={summary.totalLeaks * 12}
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



function TelegramMiniStatus({
  telegram,
  cloudStatus,
  cloudError,
  compact = false,
}: {
  telegram: TelegramState;
  cloudStatus: CloudStatus;
  cloudError: string;
  compact?: boolean;
}) {
  const username = telegram.user?.username
    ? `@${telegram.user.username}`
    : telegram.user?.first_name || "Telegram user";

  const cloudLabel =
    cloudStatus === "cloud"
      ? "Cloud synced"
      : cloudStatus === "syncing"
        ? "Syncing..."
        : cloudStatus === "error"
          ? "Sync error"
          : "Local only";

  return (
    <section className={compact ? "tg-status tg-status-compact" : "tg-status"}>
      <div>
        <span>Telegram Mini App</span>
        <strong>{telegram.isTelegram ? "Connected" : "Browser preview"}</strong>
      </div>

      <div>
        <span>Data</span>
        <strong>{cloudLabel}</strong>
      </div>

      {!compact && (
        <>
          <div>
            <span>User</span>
            <strong>{telegram.user ? username : "Not detected"}</strong>
          </div>
          <div>
            <span>User ID</span>
            <strong>{telegram.user?.id ?? "-"}</strong>
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
            <strong>{cloudStatus === "error" ? cloudError || "Check Vercel logs" : "Ready"}</strong>
          </div>
        </>
      )}
    </section>
  );
}

function buildShareText({
  settings,
  walletHp,
  totalLeaks,
  realBalance,
  potentialYearlySavings,
}: {
  settings: Settings;
  walletHp: number;
  totalLeaks: number;
  realBalance: number;
  potentialYearlySavings: number;
}) {
  return [
    `My $BROKE Wallet HP: ${walletHp}/100`,
    `Money leaks this month: ${money(totalLeaks, settings.currency)}`,
    `Real balance: ${money(realBalance, settings.currency)}`,
    `Potential yearly savings: ${money(potentialYearlySavings, settings.currency)}`,
    "",
    "Track your leaks. Fix your life.",
    PROJECT_X_URL,
    PROJECT_TG_URL,
  ].join("\n");
}

function ShareResultCard({
  settings,
  walletHp,
  totalLeaks,
  realBalance,
  potentialYearlySavings,
}: {
  settings: Settings;
  walletHp: number;
  totalLeaks: number;
  realBalance: number;
  potentialYearlySavings: number;
}) {
  const [copied, setCopied] = useState(false);

  const shareText = buildShareText({
    settings,
    walletHp,
    totalLeaks,
    realBalance,
    potentialYearlySavings,
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

      if (localStorage.getItem(ONBOARDING_KEY) === "true") {
        setOnboardingCompleted(true);
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

      <div className="share-preview">
        <div>
          <span>Wallet HP</span>
          <strong>{walletHp}/100</strong>
        </div>
        <div>
          <span>Leaks</span>
          <strong>{money(totalLeaks, settings.currency)}</strong>
        </div>
        <div>
          <span>Balance</span>
          <strong>{money(realBalance, settings.currency)}</strong>
        </div>
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
  onBack,
  onExport,
}: {
  settings: Settings;
  expenses: Expense[];
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
    </div>
  );
}

function WhatIfScreen({
  settings,
  expenses,
  onBack,
  onHelp,
}: {
  settings: Settings;
  expenses: Expense[];
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
  onBack: () => void;
}) {
  const totalIncome = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);
  const monthSpent = sum(currentMonthExpenses.map((item) => item.amount));
  const categorySummaries = getCategorySummaries(currentMonthExpenses);
  const latestExpenses = expenses.slice(0, 8);

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

        <button className="menu-line menu-button danger" onClick={onReset}>
          <img src={A.deleteData} alt="" />
          <div>
            <strong>Delete My Data</strong>
            <span>Permanent</span>
          </div>
          <b>›</b>
        </button>
      </section>

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
          value={value}
          onChange={(event) => onChange(event.target.value)}
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
