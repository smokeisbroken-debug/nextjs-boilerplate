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

const STORAGE_KEY = "broke-life-tracker-v1";

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
  { id: "whatif", label: "What If", icon: A.navWhatIf },
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

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [amount, setAmount] = useState("25.00");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Coffee");
  const [expenseType, setExpenseType] = useState<NeedType>("Needed");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw) as {
          settings?: Settings;
          expenses?: Expense[];
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
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings,
        expenses,
      })
    );
  }, [loaded, settings, expenses]);

  const currentMonthExpenses = useMemo(() => {
    const current = monthKey(new Date());

    return expenses.filter((expense) => {
      return monthKey(new Date(expense.createdAt)) === current;
    });
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

  const whatIfCards = useMemo(() => {
    const categoryTotal = (category: string) =>
      sum(
        currentMonthExpenses
          .filter((expense) => expense.category === category)
          .map((expense) => expense.amount)
      );

    const coffee = categoryTotal("Coffee") || 84;
    const smoking = categoryTotal("Smoking")
      ? categoryTotal("Smoking") * 0.5
      : 60;
    const takeouts = categoryTotal("Takeouts") || 120;
    const shopping = categoryTotal("Shopping") || 98;

    return [
      {
        title: "If you stop coffee",
        save: coffee,
        hp: "+8",
        icon: A.coffee,
      },
      {
        title: "If you reduce smoking by 50%",
        save: smoking,
        hp: "+6",
        icon: A.smoking,
      },
      {
        title: "If you stop takeouts",
        save: takeouts,
        hp: "+10",
        icon: A.takeouts,
      },
      {
        title: "If you cut random shopping",
        save: shopping,
        hp: "+8",
        icon: A.shopping,
      },
    ];
  }, [currentMonthExpenses]);

  const totalPotentialSavings = sum(whatIfCards.map((item) => item.save)) * 12;

  function addExpense() {
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

    setExpenses((prev) => [expense, ...prev]);
    setAmount("");
    setNote("");
    setExpenseType("Needed");
    setActiveTab("home");
  }

  function deleteExpense(id: string) {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }

  function resetData() {
    const ok = window.confirm("Delete all $BROKE Life Tracker data?");
    if (!ok) return;

    setSettings(defaultSettings);
    setExpenses([]);
    localStorage.removeItem(STORAGE_KEY);
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
        {activeTab === "home" && (
          <DashboardScreen
            settings={settings}
            summary={summary}
            chartDays={chartDays}
            expenses={currentMonthExpenses.slice(0, 6)}
            onDeleteExpense={deleteExpense}
          />
        )}

        {activeTab === "add" && (
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
          />
        )}

        {activeTab === "chart" && (
          <ChartScreen settings={settings} expenses={expenses} />
        )}

        {activeTab === "whatif" && (
          <WhatIfScreen
            settings={settings}
            cards={whatIfCards}
            totalPotentialSavings={totalPotentialSavings}
          />
        )}

        {activeTab === "settings" && (
          <SettingsScreen
            settings={settings}
            setSettings={setSettings}
            expenses={expenses}
            onReset={resetData}
          />
        )}

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </section>
    </main>
  );
}

function Header({
  title,
  showBack = false,
  rightIcon,
}: {
  title: string;
  showBack?: boolean;
  rightIcon?: string;
}) {
  return (
    <div className="screen-header">
      <div className="header-side">
        {showBack ? (
          <img className="header-icon" src={A.back} alt="Back" />
        ) : (
          <img className="app-icon" src={A.appFrog} alt="$BROKE" />
        )}
      </div>

      <div className="header-title">{title}</div>

      <div className="header-side right">
        {rightIcon ? (
          <img className="header-icon" src={rightIcon} alt="" />
        ) : (
          <img className="header-icon" src={A.bell} alt="Notifications" />
        )}
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
      <Header title="$BROKE Life Tracker" />

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

function RecentExpenses({
  settings,
  expenses,
  onDeleteExpense,
}: {
  settings: Settings;
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}) {
  function getCategoryIcon(category: string) {
    return categories.find((item) => item.name === category)?.icon || A.custom;
  }

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
            <div className="expense-row" key={expense.id}>
              <img src={getCategoryIcon(expense.category)} alt="" />

              <div>
                <strong>{expense.category}</strong>
                <span>
                  {expense.needType}
                  {expense.note ? ` · ${expense.note}` : ""}
                </span>
              </div>

              <b>{money(expense.amount, settings.currency)}</b>

              <button
                type="button"
                onClick={() => onDeleteExpense(expense.id)}
                aria-label="Delete expense"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
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
}) {
  return (
    <form
      className="screen"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd();
      }}
    >
      <Header title="Add Expense" showBack rightIcon={A.help} />

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
}: {
  settings: Settings;
  expenses: Expense[];
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
      <Header title="$BROKE Chart" showBack rightIcon={A.export} />

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
  cards,
  totalPotentialSavings,
}: {
  settings: Settings;
  cards: {
    title: string;
    save: number;
    hp: string;
    icon: string;
  }[];
  totalPotentialSavings: number;
}) {
  return (
    <div className="screen">
      <Header title="What If?" showBack rightIcon={A.help} />

      <section className="whatif-hero">
        <img src={A.whatIfFrog} alt="" />
        <div>
          <h2>Small changes.</h2>
          <h2>Big wins.</h2>
        </div>
      </section>

      <section className="whatif-list">
        {cards.map((item) => (
          <div className="whatif-card" key={item.title}>
            <img src={item.icon} alt="" />

            <div>
              <strong>{item.title}</strong>
              <span>Save</span>
              <b>
                {money(item.save, settings.currency)}
                <small>/month</small>
              </b>
              <em>{money(item.save * 12, settings.currency)}/year</em>
            </div>

            <aside>
              <strong>{item.hp}</strong>
              <span>Wallet HP</span>
            </aside>
          </div>
        ))}
      </section>

      <section className="savings-card">
        <img src={A.walletMascot} alt="" />
        <div>
          <span>Total Potential Savings</span>
          <strong>{money(totalPotentialSavings, settings.currency)}</strong>
          <small>/year</small>
        </div>
        <aside>
          <b>+18</b>
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
  onReset,
}: {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  expenses: Expense[];
  onReset: () => void;
}) {
  const totalIncome = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);

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
      <Header title="Settings" showBack />

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
          value={`${expenses.length} records`}
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
    </div>
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
          onClick={() => setActiveTab(item.id)}
          className={activeTab === item.id ? "active" : ""}
        >
          <img src={item.icon} alt="" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
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

const STORAGE_KEY = "broke-life-tracker-v1";

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
  { id: "whatif", label: "What If", icon: A.navWhatIf },
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

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [amount, setAmount] = useState("25.00");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Coffee");
  const [expenseType, setExpenseType] = useState<NeedType>("Needed");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw) as {
          settings?: Settings;
          expenses?: Expense[];
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
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings,
        expenses,
      })
    );
  }, [loaded, settings, expenses]);

  const currentMonthExpenses = useMemo(() => {
    const current = monthKey(new Date());

    return expenses.filter((expense) => {
      return monthKey(new Date(expense.createdAt)) === current;
    });
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

  const whatIfCards = useMemo(() => {
    const categoryTotal = (category: string) =>
      sum(
        currentMonthExpenses
          .filter((expense) => expense.category === category)
          .map((expense) => expense.amount)
      );

    const coffee = categoryTotal("Coffee") || 84;
    const smoking = categoryTotal("Smoking")
      ? categoryTotal("Smoking") * 0.5
      : 60;
    const takeouts = categoryTotal("Takeouts") || 120;
    const shopping = categoryTotal("Shopping") || 98;

    return [
      {
        title: "If you stop coffee",
        save: coffee,
        hp: "+8",
        icon: A.coffee,
      },
      {
        title: "If you reduce smoking by 50%",
        save: smoking,
        hp: "+6",
        icon: A.smoking,
      },
      {
        title: "If you stop takeouts",
        save: takeouts,
        hp: "+10",
        icon: A.takeouts,
      },
      {
        title: "If you cut random shopping",
        save: shopping,
        hp: "+8",
        icon: A.shopping,
      },
    ];
  }, [currentMonthExpenses]);

  const totalPotentialSavings = sum(whatIfCards.map((item) => item.save)) * 12;

  function addExpense() {
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

    setExpenses((prev) => [expense, ...prev]);
    setAmount("");
    setNote("");
    setExpenseType("Needed");
    setActiveTab("home");
  }

  function deleteExpense(id: string) {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }

  function resetData() {
    const ok = window.confirm("Delete all $BROKE Life Tracker data?");
    if (!ok) return;

    setSettings(defaultSettings);
    setExpenses([]);
    localStorage.removeItem(STORAGE_KEY);
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
        {activeTab === "home" && (
          <DashboardScreen
            settings={settings}
            summary={summary}
            chartDays={chartDays}
            expenses={currentMonthExpenses.slice(0, 6)}
            onDeleteExpense={deleteExpense}
          />
        )}

        {activeTab === "add" && (
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
          />
        )}

        {activeTab === "chart" && (
          <ChartScreen settings={settings} expenses={expenses} />
        )}

        {activeTab === "whatif" && (
          <WhatIfScreen
            settings={settings}
            cards={whatIfCards}
            totalPotentialSavings={totalPotentialSavings}
          />
        )}

        {activeTab === "settings" && (
          <SettingsScreen
            settings={settings}
            setSettings={setSettings}
            expenses={expenses}
            onReset={resetData}
          />
        )}

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </section>
    </main>
  );
}

function Header({
  title,
  showBack = false,
  rightIcon,
}: {
  title: string;
  showBack?: boolean;
  rightIcon?: string;
}) {
  return (
    <div className="screen-header">
      <div className="header-side">
        {showBack ? (
          <img className="header-icon" src={A.back} alt="Back" />
        ) : (
          <img className="app-icon" src={A.appFrog} alt="$BROKE" />
        )}
      </div>

      <div className="header-title">{title}</div>

      <div className="header-side right">
        {rightIcon ? (
          <img className="header-icon" src={rightIcon} alt="" />
        ) : (
          <img className="header-icon" src={A.bell} alt="Notifications" />
        )}
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
      <Header title="$BROKE Life Tracker" />

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

function RecentExpenses({
  settings,
  expenses,
  onDeleteExpense,
}: {
  settings: Settings;
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}) {
  function getCategoryIcon(category: string) {
    return categories.find((item) => item.name === category)?.icon || A.custom;
  }

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
            <div className="expense-row" key={expense.id}>
              <img src={getCategoryIcon(expense.category)} alt="" />

              <div>
                <strong>{expense.category}</strong>
                <span>
                  {expense.needType}
                  {expense.note ? ` · ${expense.note}` : ""}
                </span>
              </div>

              <b>{money(expense.amount, settings.currency)}</b>

              <button
                type="button"
                onClick={() => onDeleteExpense(expense.id)}
                aria-label="Delete expense"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
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
}) {
  return (
    <form
      className="screen"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd();
      }}
    >
      <Header title="Add Expense" showBack rightIcon={A.help} />

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
}: {
  settings: Settings;
  expenses: Expense[];
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
      <Header title="$BROKE Chart" showBack rightIcon={A.export} />

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
  cards,
  totalPotentialSavings,
}: {
  settings: Settings;
  cards: {
    title: string;
    save: number;
    hp: string;
    icon: string;
  }[];
  totalPotentialSavings: number;
}) {
  return (
    <div className="screen">
      <Header title="What If?" showBack rightIcon={A.help} />

      <section className="whatif-hero">
        <img src={A.whatIfFrog} alt="" />
        <div>
          <h2>Small changes.</h2>
          <h2>Big wins.</h2>
        </div>
      </section>

      <section className="whatif-list">
        {cards.map((item) => (
          <div className="whatif-card" key={item.title}>
            <img src={item.icon} alt="" />

            <div>
              <strong>{item.title}</strong>
              <span>Save</span>
              <b>
                {money(item.save, settings.currency)}
                <small>/month</small>
              </b>
              <em>{money(item.save * 12, settings.currency)}/year</em>
            </div>

            <aside>
              <strong>{item.hp}</strong>
              <span>Wallet HP</span>
            </aside>
          </div>
        ))}
      </section>

      <section className="savings-card">
        <img src={A.walletMascot} alt="" />
        <div>
          <span>Total Potential Savings</span>
          <strong>{money(totalPotentialSavings, settings.currency)}</strong>
          <small>/year</small>
        </div>
        <aside>
          <b>+18</b>
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
  onReset,
}: {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  expenses: Expense[];
  onReset: () => void;
}) {
  const totalIncome = getTotalIncome(settings);
  const fixedCosts = getFixedCosts(settings);

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
      <Header title="Settings" showBack />

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
          value={`${expenses.length} records`}
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
    </div>
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
          onClick={() => setActiveTab(item.id)}
          className={activeTab === item.id ? "active" : ""}
        >
          <img src={item.icon} alt="" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
