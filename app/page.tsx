"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "home" | "add" | "chart" | "whatif" | "settings";
type NeededStatus = "needed" | "not_needed" | "maybe";

type Expense = {
  id: string;
  amount: number;
  category: string;
  needed: NeededStatus;
  note: string;
  date: string;
};

type AppData = {
  salary: number;
  sideIncome: number;
  otherIncome: number;
  currency: string;
  fixedCosts: {
    rent: number;
    utilities: number;
    foodBasics: number;
    transport: number;
    phoneInternet: number;
  };
  expenses: Expense[];
};

const STORAGE_KEY = "broke-life-tracker-ui-v2";

const categories = [
  { name: "Coffee", icon: "☕", label: "Coffee" },
  { name: "Smoking", icon: "🚬", label: "Smoking" },
  { name: "Takeouts", icon: "🍔", label: "Takeouts" },
  { name: "Shopping", icon: "🛍", label: "Shopping" },
  { name: "Subscriptions", icon: "💳", label: "Subs" },
  { name: "Taxi", icon: "🚕", label: "Taxi" },
  { name: "Custom", icon: "•••", label: "Custom" },
];

const defaultData: AppData = {
  salary: 2800,
  sideIncome: 600,
  otherIncome: 450,
  currency: "USD",
  fixedCosts: {
    rent: 1200,
    utilities: 200,
    foodBasics: 350,
    transport: 150,
    phoneInternet: 80,
  },
  expenses: [
    {
      id: "1",
      amount: 84,
      category: "Coffee",
      needed: "not_needed",
      note: "Daily coffee",
      date: new Date().toISOString(),
    },
    {
      id: "2",
      amount: 120,
      category: "Takeouts",
      needed: "not_needed",
      note: "Food delivery",
      date: new Date().toISOString(),
    },
    {
      id: "3",
      amount: 98,
      category: "Shopping",
      needed: "maybe",
      note: "Random order",
      date: new Date().toISOString(),
    },
  ],
};

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function sameMonth(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function sameDay(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [data, setData] = useState<AppData>(defaultData);

  const [amount, setAmount] = useState("25");
  const [selectedCategory, setSelectedCategory] = useState("Coffee");
  const [needed, setNeeded] = useState<NeededStatus>("needed");
  const [note, setNote] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch {
        setData(defaultData);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const stats = useMemo(() => {
    const totalIncome = data.salary + data.sideIncome + data.otherIncome;

    const fixedLifeCost =
      data.fixedCosts.rent +
      data.fixedCosts.utilities +
      data.fixedCosts.foodBasics +
      data.fixedCosts.transport +
      data.fixedCosts.phoneInternet;

    const monthExpenses = data.expenses.filter((expense) =>
      sameMonth(expense.date)
    );

    const todayExpenses = data.expenses.filter((expense) =>
      sameDay(expense.date)
    );

    const moneyLeaks = monthExpenses
      .filter((expense) => expense.needed === "not_needed")
      .reduce((sum, expense) => sum + expense.amount, 0);

    const maybeSpending = monthExpenses
      .filter((expense) => expense.needed === "maybe")
      .reduce((sum, expense) => sum + expense.amount, 0);

    const neededSpending = monthExpenses
      .filter((expense) => expense.needed === "needed")
      .reduce((sum, expense) => sum + expense.amount, 0);

    const realBalance =
      totalIncome - fixedLifeCost - moneyLeaks - maybeSpending - neededSpending;

    const leakDamage = totalIncome > 0 ? (moneyLeaks / totalIncome) * 100 : 0;
    const walletHp = Math.max(0, Math.min(100, Math.round(100 - leakDamage)));

    let status = "Stable Wallet";

    if (walletHp < 20) status = "Full $BROKE Mode";
    else if (walletHp < 40) status = "Heavy Leak";
    else if (walletHp < 60) status = "Pressure Mode";
    else if (walletHp < 80) status = "Small Leak";

    const todayDamage = todayExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const categoryTotals = monthExpenses.reduce<Record<string, number>>(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      },
      {}
    );

    const biggestLeak =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "None";

    const potentialYearlySavings = moneyLeaks * 12;

    return {
      totalIncome,
      fixedLifeCost,
      moneyLeaks,
      maybeSpending,
      neededSpending,
      realBalance,
      walletHp,
      status,
      todayDamage,
      categoryTotals,
      biggestLeak,
      potentialYearlySavings,
    };
  }, [data]);

  function addExpense() {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) return;

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      amount: numericAmount,
      category: selectedCategory,
      needed,
      note,
      date: new Date().toISOString(),
    };

    setData((current) => ({
      ...current,
      expenses: [newExpense, ...current.expenses],
    }));

    setAmount("");
    setNote("");
    setActiveTab("home");
  }

  return (
    <main className="app-shell">
      <div className="noise" />
      <div className="phone">
        <div className="phone-glow" />

        {activeTab === "home" && (
          <section className="screen">
            <TopBar title="$BROKE Life Tracker" />

            <section className="hero">
              <div className="hero-copy">
                <p className="kicker">Life dashboard</p>
                <h1>
                  Your wallet is not broken.
                  <span> It is leaking.</span>
                </h1>
                <p className="hero-sub">Track your leaks. Fix your life.</p>
              </div>

              <Mascot />
            </section>

            <section className="metric-grid">
              <Metric
                title="Income"
                value={money(stats.totalIncome, data.currency)}
                subtitle="This month"
                tone="green"
              />
              <Metric
                title="Life Cost"
                value={money(stats.fixedLifeCost, data.currency)}
                subtitle="This month"
                tone="red"
              />
              <Metric
                title="Money Leaks"
                value={money(stats.moneyLeaks, data.currency)}
                subtitle="This month"
                tone="orange"
              />
              <Metric
                title="Real Balance"
                value={money(stats.realBalance, data.currency)}
                subtitle="Left to stack"
                tone="green"
              />
            </section>

            <section className="panel wallet-panel">
              <div className="panel-head">
                <div>
                  <h2>Wallet HP</h2>
                  <p>Hold the line, fix the leaks.</p>
                </div>
                <span className="status-badge">{stats.status}</span>
              </div>

              <div className="hp-track">
                <div style={{ width: `${stats.walletHp}%` }} />
              </div>

              <div className="panel-foot">
                <span>Wallet condition</span>
                <strong>{stats.walletHp}/100</strong>
              </div>
            </section>

            <button className="chart-preview" onClick={() => setActiveTab("chart")}>
              <div className="panel-head">
                <div>
                  <h2>$BROKE Chart</h2>
                  <p>7D preview</p>
                </div>
                <span className="open-link">Open</span>
              </div>

              <MiniChart />

              <div className="panel-foot">
                <span>Today’s Damage</span>
                <strong className="negative">
                  -{money(stats.todayDamage, data.currency)}
                </strong>
              </div>
            </button>
          </section>
        )}

        {activeTab === "add" && (
          <section className="screen">
            <TopBar title="Add Expense" />

            <section className="amount-panel">
              <p className="field-label">Amount</p>
              <div className="money-input">
                <span>$</span>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
                <small>{data.currency}</small>
              </div>
            </section>

            <section className="block">
              <p className="field-label">Category</p>

              <div className="category-grid">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    className={
                      selectedCategory === category.name
                        ? "category active"
                        : "category"
                    }
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <span>{category.icon}</span>
                    <small>{category.label}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="block">
              <p className="field-label">Was it needed?</p>

              <div className="choice-row">
                <button
                  className={needed === "needed" ? "choice good active" : "choice good"}
                  onClick={() => setNeeded("needed")}
                >
                  Needed
                </button>
                <button
                  className={
                    needed === "not_needed" ? "choice bad active" : "choice bad"
                  }
                  onClick={() => setNeeded("not_needed")}
                >
                  Not needed
                </button>
                <button
                  className={
                    needed === "maybe" ? "choice maybe active" : "choice maybe"
                  }
                  onClick={() => setNeeded("maybe")}
                >
                  Maybe
                </button>
              </div>
            </section>

            <section className="block">
              <p className="field-label">Note optional</p>
              <input
                className="note-input"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a quick note..."
              />
            </section>

            <button className="add-button" onClick={addExpense}>
              + Add Expense
            </button>

            <p className="tiny-note">
              Track daily leaks. Small leaks sink big wallets.
            </p>
          </section>
        )}

        {activeTab === "chart" && (
          <section className="screen">
            <TopBar title="$BROKE Chart" />

            <section className="quote-panel">
              <p>You watch crypto charts every day.</p>
              <strong>But do you watch your own $BROKE Chart?</strong>
            </section>

            <div className="range-tabs">
              <button>Day</button>
              <button className="active">Week</button>
              <button>Month</button>
            </div>

            <section className="chart-panel">
              <TradingChart />
              <div className="volume-title">Spending Volume</div>
              <Volume />

              <div className="day-card">
                <div className="panel-head">
                  <div>
                    <h2>Friday, May 9</h2>
                    <p>Selected candle details</p>
                  </div>
                  <span className="status-badge danger">Leak Day</span>
                </div>

                <div className="day-grid">
                  <Info title="Open" value={money(stats.realBalance + 132)} />
                  <Info title="Close" value={money(stats.realBalance)} />
                  <Info title="Daily Damage" value={`-${money(132)}`} bad />
                  <Info title="Top Leak" value={stats.biggestLeak} />
                </div>
              </div>
            </section>
          </section>
        )}

        {activeTab === "whatif" && (
          <section className="screen">
            <TopBar title="What If?" />

            <section className="what-hero">
              <Mascot small />
              <div>
                <h2>Small changes.</h2>
                <p>Big wins.</p>
              </div>
            </section>

            <div className="what-list">
              {Object.entries(stats.categoryTotals).map(([category, total]) => (
                <WhatIfCard
                  key={category}
                  category={category}
                  total={total}
                  currency={data.currency}
                />
              ))}
            </div>

            <section className="savings-panel">
              <div>
                <span>Total Potential Savings</span>
                <strong>{money(stats.potentialYearlySavings, data.currency)}</strong>
                <p>per year if leaks are reduced</p>
              </div>
              <div className="hp-plus">+18</div>
            </section>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="screen">
            <TopBar title="Settings" />

            <section className="settings-panel">
              <h2>Income Monthly</h2>

              <NumberRow
                label="Salary"
                value={data.salary}
                onChange={(value) =>
                  setData((current) => ({ ...current, salary: value }))
                }
              />
              <NumberRow
                label="Side income"
                value={data.sideIncome}
                onChange={(value) =>
                  setData((current) => ({ ...current, sideIncome: value }))
                }
              />
              <NumberRow
                label="Other income"
                value={data.otherIncome}
                onChange={(value) =>
                  setData((current) => ({ ...current, otherIncome: value }))
                }
              />

              <div className="total-row good">
                <span>Total Income</span>
                <strong>{money(stats.totalIncome, data.currency)}</strong>
              </div>
            </section>

            <section className="settings-panel">
              <h2>Fixed Life Costs Monthly</h2>

              <NumberRow
                label="Rent"
                value={data.fixedCosts.rent}
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    fixedCosts: { ...current.fixedCosts, rent: value },
                  }))
                }
              />
              <NumberRow
                label="Utilities"
                value={data.fixedCosts.utilities}
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    fixedCosts: { ...current.fixedCosts, utilities: value },
                  }))
                }
              />
              <NumberRow
                label="Food basics"
                value={data.fixedCosts.foodBasics}
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    fixedCosts: { ...current.fixedCosts, foodBasics: value },
                  }))
                }
              />
              <NumberRow
                label="Transport"
                value={data.fixedCosts.transport}
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    fixedCosts: { ...current.fixedCosts, transport: value },
                  }))
                }
              />
              <NumberRow
                label="Phone / Internet"
                value={data.fixedCosts.phoneInternet}
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    fixedCosts: {
                      ...current.fixedCosts,
                      phoneInternet: value,
                    },
                  }))
                }
              />

              <div className="total-row bad">
                <span>Total Fixed Costs</span>
                <strong>{money(stats.fixedLifeCost, data.currency)}</strong>
              </div>
            </section>

            <section className="settings-panel compact">
              <SettingsLine title="Currency" value="USD ($)" />
              <SettingsLine title="Daily Reminder" value="On" />
              <SettingsLine title="Custom Categories" value="Manage" />
              <button
                className="delete-button"
                onClick={() => {
                  window.localStorage.removeItem(STORAGE_KEY);
                  setData(defaultData);
                }}
              >
                Delete My Data
              </button>
            </section>
          </section>
        )}

        <BottomNav active={activeTab} setActive={setActiveTab} />
      </div>
    </main>
  );
}

function TopBar({ title }: { title: string }) {
  return (
    <header className="topbar">
      <div className="brand-dot">
        <span />
      </div>
      <strong>{title}</strong>
      <button className="icon-button">⌁</button>
    </header>
  );
}

function Mascot({ small = false }: { small?: boolean }) {
  return (
    <div className={small ? "mascot-box small" : "mascot-box"}>
      <div className="frog-head">
        <span className="eye left" />
        <span className="eye right" />
        <span className="mouth" />
        <span className="cap" />
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: "green" | "red" | "orange";
}) {
  return (
    <div className={`metric ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </div>
  );
}

function MiniChart() {
  const bars = [34, 56, 42, 28, 66, 72, 48, 86, 70, 94, 110, 124];

  return (
    <div className="mini-chart">
      {bars.map((height, index) => (
        <span
          key={index}
          className={index % 4 === 0 ? "down" : "up"}
          style={{ height }}
        />
      ))}
    </div>
  );
}

function TradingChart() {
  const candles = [
    { top: 20, wick: 128, body: 48, red: true },
    { top: 46, wick: 118, body: 42, red: true },
    { top: 72, wick: 106, body: 32, red: false },
    { top: 62, wick: 136, body: 44, red: false },
    { top: 90, wick: 92, body: 30, red: true },
    { top: 110, wick: 100, body: 36, red: false },
    { top: 100, wick: 128, body: 42, red: true },
    { top: 134, wick: 90, body: 28, red: false },
    { top: 128, wick: 120, body: 36, red: true },
    { top: 148, wick: 96, body: 30, red: false },
  ];

  return (
    <div cla  otherIncome: 450,
  currency: "USD",
  fixedCosts: {
    rent: 1200,
    utilities: 200,
    foodBasics: 350,
    transport: 150,
    phoneInternet: 80,
  },
  expenses: [
    {
      id: "1",
      amount: 25,
      category: "Coffee",
      needed: "not_needed",
      note: "Morning run",
      date: new Date().toISOString(),
    },
    {
      id: "2",
      amount: 46,
      category: "Takeouts",
      needed: "not_needed",
      note: "Fast food",
      date: new Date().toISOString(),
    },
    {
      id: "3",
      amount: 32,
      category: "Shopping",
      needed: "maybe",
      note: "Small order",
      date: new Date().toISOString(),
    },
  ],
};

const categories = [
  { name: "Coffee", icon: "☕" },
  { name: "Smoking", icon: "🚬" },
  { name: "Takeouts", icon: "🍔" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Subscriptions", icon: "💳" },
  { name: "Taxi", icon: "🚕" },
  { name: "Custom", icon: "•••" },
];

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function sameMonth(dateString: string) {
  return getMonthKey(new Date(dateString)) === getMonthKey(new Date());
}

function sameDay(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();

  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [data, setData] = useState<AppData>(defaultData);

  const [amount, setAmount] = useState("25");
  const [selectedCategory, setSelectedCategory] = useState("Coffee");
  const [needed, setNeeded] = useState<NeededStatus>("needed");
  const [note, setNote] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch {
        setData(defaultData);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const stats = useMemo(() => {
    const totalIncome = data.salary + data.sideIncome + data.otherIncome;

    const fixedLifeCost =
      data.fixedCosts.rent +
      data.fixedCosts.utilities +
      data.fixedCosts.foodBasics +
      data.fixedCosts.transport +
      data.fixedCosts.phoneInternet;

    const monthExpenses = data.expenses.filter((expense) =>
      sameMonth(expense.date)
    );

    const todayExpenses = data.expenses.filter((expense) =>
      sameDay(expense.date)
    );

    const moneyLeaks = monthExpenses
      .filter((expense) => expense.needed === "not_needed")
      .reduce((sum, expense) => sum + expense.amount, 0);

    const maybeSpending = monthExpenses
      .filter((expense) => expense.needed === "maybe")
      .reduce((sum, expense) => sum + expense.amount, 0);

    const neededSpending = monthExpenses
      .filter((expense) => expense.needed === "needed")
      .reduce((sum, expense) => sum + expense.amount, 0);

    const realBalance =
      totalIncome - fixedLifeCost - moneyLeaks - maybeSpending - neededSpending;

    const leakDamage = totalIncome > 0 ? (moneyLeaks / totalIncome) * 100 : 0;
    const walletHp = Math.max(0, Math.round(100 - leakDamage));

    let status = "Stable Wallet";

    if (walletHp < 20) status = "Full $BROKE Mode";
    else if (walletHp < 40) status = "Heavy Leak";
    else if (walletHp < 60) status = "Pressure Mode";
    else if (walletHp < 80) status = "Small Leak";

    const todayDamage = todayExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const categoryTotals = monthExpenses.reduce<Record<string, number>>(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      },
      {}
    );

    const biggestLeak =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "None yet";

    return {
      totalIncome,
      fixedLifeCost,
      moneyLeaks,
      maybeSpending,
      neededSpending,
      realBalance,
      walletHp,
      status,
      todayDamage,
      categoryTotals,
      biggestLeak,
    };
  }, [data]);

  function addExpense() {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) return;

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      amount: numericAmount,
      category: selectedCategory,
      needed,
      note,
      date: new Date().toISOString(),
    };

    setData((current) => ({
      ...current,
      expenses: [newExpense, ...current.expenses],
    }));

    setAmount("");
    setNote("");
    setActiveTab("home");
  }

  return (
    <main className="appShell">
      <div className="phoneFrame">
        <div className="topGlow" />

        {activeTab === "home" && (
          <section className="screen">
            <Header title="$BROKE Life Tracker" />

            <div className="heroCard">
              <div>
                <p className="eyebrow">Life dashboard</p>
                <h1>
                  Your wallet is not broken.
                  <span> It is leaking.</span>
                </h1>
              </div>

              <div className="mascot">
                <span>🐸</span>
              </div>
            </div>

            <div className="statGrid">
              <StatCard
                label="Income"
                value={money(stats.totalIncome, data.currency)}
                sub="This month"
                tone="green"
              />
              <StatCard
                label="Life Cost"
                value={money(stats.fixedLifeCost, data.currency)}
                sub="This month"
                tone="red"
              />
              <StatCard
                label="Money Leaks"
                value={money(stats.moneyLeaks, data.currency)}
                sub="This month"
                tone="orange"
              />
              <StatCard
                label="Real Balance"
                value={money(stats.realBalance, data.currency)}
                sub="Left to stack"
                tone="green"
              />
            </div>

            <div className="card">
              <div className="rowBetween">
                <div>
                  <p className="cardTitle">Wallet HP</p>
                  <p className="muted">Hold the line, fix the leaks.</p>
                </div>

                <span className="statusPill">{stats.status}</span>
              </div>

              <div className="hpBar">
                <div style={{ width: `${stats.walletHp}%` }} />
              </div>

              <div className="rowBetween">
                <span className="muted">Wallet condition</span>
                <strong>{stats.walletHp}/100</strong>
              </div>
            </div>

            <button className="chartPreview" onClick={() => setActiveTab("chart")}>
              <div className="rowBetween">
                <div>
                  <p className="cardTitle">$BROKE Chart</p>
                  <p className="muted">7D preview</p>
                </div>

                <span className="greenText">Open</span>
              </div>

              <MiniCandles />

              <div className="rowBetween">
                <span className="muted">Today’s Damage</span>
                <strong className="redText">
                  -{money(stats.todayDamage, data.currency)}
                </strong>
              </div>
            </button>
          </section>
        )}

        {activeTab === "add" && (
          <section className="screen">
            <Header title="Add Expense" />

            <div className="amountBox">
              <label>Amount</label>
              <div className="amountInput">
                <span>$</span>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                />
                <small>{data.currency}</small>
              </div>
            </div>

            <div className="sectionBlock">
              <p className="sectionTitle">Category</p>

              <div className="categoryGrid">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    className={
                      selectedCategory === category.name
                        ? "categoryCard active"
                        : "categoryCard"
                    }
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <span>{category.icon}</span>
                    <small>{category.name}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="sectionBlock">
              <p className="sectionTitle">Was it needed?</p>

              <div className="choiceRow">
                <button
                  className={needed === "needed" ? "choice activeGreen" : "choice"}
                  onClick={() => setNeeded("needed")}
                >
                  Needed
                </button>
                <button
                  className={needed === "not_needed" ? "choice activeRed" : "choice"}
                  onClick={() => setNeeded("not_needed")}
                >
                  Not needed
                </button>
                <button
                  className={needed === "maybe" ? "choice activeYellow" : "choice"}
                  onClick={() => setNeeded("maybe")}
                >
                  Maybe
                </button>
              </div>
            </div>

            <div className="sectionBlock">
              <p className="sectionTitle">Note optional</p>

              <input
                className="textField"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add a quick note..."
              />
            </div>

            <button className="primaryButton" onClick={addExpense}>
              + Add Expense
            </button>

            <p className="helperText">
              Track daily leaks. Small leaks sink big wallets.
            </p>
          </section>
        )}

        {activeTab === "chart" && (
          <section className="screen">
            <Header title="$BROKE Chart" />

            <div className="quoteCard">
              You watch crypto charts every day.
              <span> But do you watch your own $BROKE Chart?</span>
            </div>

            <div className="segmented">
              <button>Day</button>
              <button className="selected">Week</button>
              <button>Month</button>
            </div>

            <div className="chartCard">
              <CandlestickChart />

              <p className="sectionTitle">Spending Volume</p>
              <VolumeBars />

              <div className="dayDetail">
                <div className="rowBetween">
                  <strong>Today</strong>
                  <span className="muted">Daily report</span>
                </div>

                <div className="detailGrid">
                  <div>
                    <span>Open</span>
                    <strong>{money(stats.realBalance + stats.todayDamage)}</strong>
                  </div>
                  <div>
                    <span>Close</span>
                    <strong>{money(stats.realBalance)}</strong>
                  </div>
                  <div>
                    <span>Daily Damage</span>
                    <strong className="redText">
                      -{money(stats.todayDamage, data.currency)}
                    </strong>
                  </div>
                  <div>
                    <span>Top Leak</span>
                    <strong>{stats.biggestLeak}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "whatif" && (
          <section className="screen">
            <Header title="What If?" />

            <div className="heroSmall">
              <span>🐸</span>
              <div>
                <strong>Small changes.</strong>
                <p>Big wins.</p>
              </div>
            </div>

            <div className="whatIfList">
              {Object.entries(stats.categoryTotals)
                .slice(0, 5)
                .map(([category, total]) => (
                  <WhatIfCard
                    key={category}
                    category={category}
                    monthly={total}
                    currency={data.currency}
                  />
                ))}

              {Object.keys(stats.categoryTotals).length === 0 && (
                <div className="emptyState">
                  Add expenses first to see your What If scenarios.
                </div>
              )}
            </div>

            <div className="savingsCard">
              <span>Total Potential Savings</span>
              <strong>
                {money(stats.moneyLeaks * 12, data.currency)}
                <small>/year</small>
              </strong>
              <p>Cut the leaks. Restore the wallet.</p>
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="screen">
            <Header title="Settings" />

            <div className="settingsCard">
              <p className="sectionTitle">Income Monthly</p>

              <NumberRow
                label="Salary"
                value={data.salary}
                onChange={(value) =>
                  setData((current) => ({ ...current, salary: value }))
                }
              />
              <NumberRow
                label="Side income"
                value={data.sideIncome}
                onChange={(value) =>
                  setData((current) => ({ ...current, sideIncome: value }))
                }
              />
              <NumberRow
                label="Other income"
                value={data.otherIncome}
                onChange={(value) =>
                  setData((current) => ({ ...current, otherIncome: value }))
                }
              />

              <div className="settingsTotal">
                <span>Total Income</span>
                <strong>{money(stats.totalIncome, data.currency)}</strong>
              </div>
            </div>

            <div className="settingsCard">
              <p className="sectionTitle">Fixed Life Costs Monthly</p>

              <NumberRow
                label="Rent"
                value={data.fixedCosts.rent}
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    fixedCosts: { ...current.fixedCosts, rent: value },
                  }))
                }
              />
              <NumberRow
                label="Utilities"
                value={data.fixedCosts.utilities}
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    fixedCosts: { ...current.fixedCosts, utilities: value },
                  }))
                }
              />
              <NumberRow
                label="Food basics"
                value={data.fixedCosts.foodBasics}
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    fixedCosts: { ...current.fixedCosts, foodBasics: value },
                  }))
                }
              />
              <NumberRow
                label="Transport"
                value={data.fixedCosts.transport}
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    fixedCosts: { ...current.fixedCosts, transport: value },
                  }))
                }
              />
              <NumberRow
                label="Phone / Internet"
                value={data.fixedCosts.phoneInternet}
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    fixedCosts: { ...current.fixedCosts, phoneInternet: value },
                  }))
                }
              />

              <div className="settingsTotal red">
                <span>Total Fixed Costs</span>
                <strong>{money(stats.fixedLifeCost, data.currency)}</strong>
              </div>
            </div>

            <button
              className="dangerButton"
              onClick={() => {
                window.localStorage.removeItem(STORAGE_KEY);
                setData(defaultData);
              }}
            >
              Delete local data
            </button>
          </section>
        )}

        <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </main>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="header">
      <div className="avatar">🐸</div>
      <strong>{title}</strong>
      <button>🔔</button>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "green" | "red" | "orange";
}) {
  return (
    <div className={`statCard ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function BottomTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "home", label: "Home", icon: "⌂" },
    { id: "add", label: "Add", icon: "+" },
    { id: "chart", label: "Chart", icon: "⌁" },
    { id: "whatif", label: "What If", icon: "?" },
    { id: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <nav className="bottomTabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={activeTab === tab.id ? "active" : ""}
          onClick={() => setActiveTab(tab.id)}
        >
          <span>{tab.icon}</span>
          <small>{tab.label}</small>
        </button>
      ))}
    </nav>
  );
}

function MiniCandles() {
  return (
    <div className="miniCandles">
      {[20, 48, 32, 70, 42, 55, 80, 64, 90, 105].map((height, index) => (
        <span
          key={index}
          className={index % 3 === 0 ? "redCandle" : "greenCandle"}
          style={{ height }}
        />
      ))}
    </div>
  );
}

function CandlestickChart() {
  const candles = [
    { h: 170, top: 20, body: 56, red: true },
    { h: 130, top: 54, body: 42, red: false },
    { h: 150, top: 42, body: 50, red: true },
    { h: 118, top: 78, body: 36, red: false },
    { h: 145, top: 62, body: 46, red: false },
    { h: 178, top: 34, body: 64, red: true },
    { h: 122, top: 86, body: 38, red: false },
    { h: 110, top: 98, body: 32, red: false },
    { h: 135, top: 84, body: 44, red: false },
  ];

  return (
    <div className="candleChart">
      {candles.map((candle, index) => (
        <div className="candleSlot" key={index}>
          <span
            className={candle.red ? "wick red" : "wick green"}
            style={{ height: candle.h, marginTop: candle.top }}
          />
          <span
            className={candle.red ? "candle red" : "candle green"}
            style={{ height: candle.body, marginTop: candle.top + 38 }}
          />
        </div>
      ))}
    </div>
  );
}

function VolumeBars() {
  return (
    <div className="volumeBars">
      {[40, 80, 60, 95, 55, 130, 75, 115, 90, 145].map((height, index) => (
        <span
          key={index}
          className={index % 2 === 0 ? "volumeRed" : "volumeGreen"}
          style={{ height }}
        />
      ))}
    </div>
  );
}

function WhatIfCard({
  category,
  monthly,
  currency,
}: {
  category: string;
  monthly: number;
  currency: string;
}) {
  return (
    <div className="whatIfCard">
      <div className="whatIcon">{categoryIcon(category)}</div>

      <div>
        <strong>If you cut {category.toLowerCase()} by 50%</strong>
        <p>
          Save <span>{money(monthly * 0.5, currency)}</span>/month
        </p>
        <p>
          <span>{money(monthly * 6, currency)}</span>/year
        </p>
      </div>

      <div className="hpGain">
        +{Math.max(3, Math.round(monthly / 20))}
        <small>Wallet HP</small>
      </div>
    </div>
  );
}

function categoryIcon(category: string) {
  const found = categories.find((item) => item.name === category);
  return found?.icon || "💸";
}

function NumberRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="numberRow">
      <span>{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
        }
