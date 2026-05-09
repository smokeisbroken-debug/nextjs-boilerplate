"use client";

import { useState } from "react";

type Tab = "home" | "add" | "chart" | "whatif" | "settings";

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

const stats = [
  {
    title: "Income",
    value: "$3,850",
    subtitle: "This month",
    icon: A.income,
    tone: "green",
  },
  {
    title: "Life Cost",
    value: "$2,410",
    subtitle: "This month",
    icon: A.lifeCost,
    tone: "red",
  },
  {
    title: "Money Leaks",
    value: "$610",
    subtitle: "This month",
    icon: A.leaks,
    tone: "orange",
  },
  {
    title: "Real Balance",
    value: "$830",
    subtitle: "Left to stack",
    icon: A.balance,
    tone: "green",
  },
];

const categories = [
  { name: "Coffee", icon: A.coffee },
  { name: "Smoking", icon: A.smoking },
  { name: "Takeouts", icon: A.takeouts },
  { name: "Shopping", icon: A.shopping },
  { name: "Subscriptions", icon: A.subscriptions },
  { name: "Taxi", icon: A.taxi },
  { name: "Custom", icon: A.custom },
];

const whatIfCards = [
  {
    title: "If you stop coffee",
    save: "$84",
    year: "$1,008",
    hp: "+8",
    icon: A.coffee,
  },
  {
    title: "If you reduce smoking by 50%",
    save: "$60",
    year: "$720",
    hp: "+6",
    icon: A.smoking,
  },
  {
    title: "If you stop takeouts",
    save: "$120",
    year: "$1,440",
    hp: "+10",
    icon: A.takeouts,
  },
  {
    title: "If you cut random shopping",
    save: "$98",
    year: "$1,176",
    hp: "+8",
    icon: A.shopping,
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
  { id: "whatif", label: "What If", icon: A.navWhatIf },
  { id: "settings", label: "Settings", icon: A.navSettings },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedCategory, setSelectedCategory] = useState("Coffee");
  const [expenseType, setExpenseType] = useState("Needed");

  return (
    <main className="app-shell">
      <section className="phone">
        {activeTab === "home" && <DashboardScreen />}
        {activeTab === "add" && (
          <AddExpenseScreen
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            expenseType={expenseType}
            setExpenseType={setExpenseType}
          />
        )}
        {activeTab === "chart" && <ChartScreen />}
        {activeTab === "whatif" && <WhatIfScreen />}
        {activeTab === "settings" && <SettingsScreen />}

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

function DashboardScreen() {
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
          <b>Small Leak</b>
        </div>

        <div className="hp-row">
          <img src={A.walletHp} alt="Wallet HP" />
          <div className="hp-bar">
            <div />
          </div>
          <strong>77 / 100</strong>
        </div>

        <p>Hold the line, fix the leaks.</p>
      </section>

      <section className="chart-preview">
        <div className="section-title">
          <span>$BROKE Chart</span>
          <small>7D Preview</small>
        </div>

        <MiniChart />

        <div className="damage-card">
          <div>
            <small>Today's Damage</small>
            <strong>-$68</strong>
            <span>vs yesterday</span>
          </div>
          <img src={A.chartFrog} alt="Chart frog" />
        </div>
      </section>
    </div>
  );
}

function AddExpenseScreen({
  selectedCategory,
  setSelectedCategory,
  expenseType,
  setExpenseType,
}: {
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  expenseType: string;
  setExpenseType: (value: string) => void;
}) {
  return (
    <div className="screen">
      <Header title="Add Expense" showBack rightIcon={A.help} />

      <section className="amount-box">
        <label>Amount</label>
        <div className="amount-input">
          <span>$</span>
          <strong>25.00</strong>
          <b>USD</b>
        </div>
      </section>

      <section>
        <label className="field-label">Category</label>
        <div className="category-grid">
          {categories.map((cat) => (
            <button
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
          {["Needed", "Not needed", "Maybe"].map((type) => (
            <button
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
        <span>Add a quick note...</span>
        <img src={A.pencil} alt="" />
      </section>

      <button className="primary-btn">
        <span>+</span>
        Add Expense
      </button>

      <div className="tiny-note">
        <img src={A.addFrog} alt="" />
        <span>Track daily leaks. Small leaks sink big wallets.</span>
      </div>
    </div>
  );
}

function ChartScreen() {
  const bars = [68, 50, 43, 75, 64, 58, 40, 34, 29, 38, 41, 46, 55, 72];

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
        <button>Day</button>
        <button className="active">Week</button>
        <button>Month</button>
      </div>

      <section className="big-chart">
        <div className="chart-lines">
          {bars.map((height, index) => (
            <i
              key={index}
              className={index % 3 === 0 ? "red" : "green"}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        <div className="price-line">
          <span>$830</span>
        </div>
      </section>

      <section className="volume">
        <label>Spending Volume</label>
        <div>
          {bars.map((height, index) => (
            <i
              key={index}
              className={index % 3 === 0 ? "red" : "green"}
              style={{ height: `${height / 1.6}%` }}
            />
          ))}
        </div>
      </section>

      <section className="day-card">
        <div className="day-title">
          <strong>Friday, May 9</strong>
          <img src={A.calendar} alt="" />
        </div>

        <div className="day-info">
          <div>
            <span>Open</span>
            <b>$962</b>
          </div>
          <div>
            <span>Close</span>
            <b>$830</b>
          </div>
          <div>
            <span>Daily Damage</span>
            <b className="bad">-$132</b>
          </div>
        </div>

        <div className="leak-list">
          <p>Top Leaks</p>
          <div>
            <span>Takeout</span>
            <b>$46</b>
          </div>
          <div>
            <span>Shopping</span>
            <b>$32</b>
          </div>
          <div>
            <span>Taxi</span>
            <b>$18</b>
          </div>
        </div>
      </section>
    </div>
  );
}

function WhatIfScreen() {
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
        {whatIfCards.map((item) => (
          <div className="whatif-card" key={item.title}>
            <img src={item.icon} alt="" />

            <div>
              <strong>{item.title}</strong>
              <span>Save</span>
              <b>
                {item.save}
                <small>/month</small>
              </b>
              <em>{item.year}/year</em>
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
          <strong>$3,344</strong>
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

function SettingsScreen() {
  return (
    <div className="screen">
      <Header title="Settings" showBack />

      <section className="settings-group">
        <h3>Income (Monthly)</h3>
        <SettingLine label="Salary" value="$2,800" />
        <SettingLine label="Side income" value="$600" />
        <SettingLine label="Other income" value="$450" />
        <SettingLine label="Total Income" value="$3,850" strong good />
      </section>

      <section className="settings-group">
        <h3>Fixed Life Costs (Monthly)</h3>
        <SettingLine label="Rent" value="$1,200" />
        <SettingLine label="Utilities" value="$200" />
        <SettingLine label="Food basics" value="$350" />
        <SettingLine label="Transport" value="$150" />
        <SettingLine label="Phone / Internet" value="$80" />
        <SettingLine label="Total Fixed Costs" value="$1,980" strong bad />
      </section>

      <section className="settings-menu">
        <MenuLine icon={A.currency} label="Currency" value="USD ($)" />
        <MenuLine icon={A.reminder} label="Daily Reminder" value="On" toggle />
        <MenuLine icon={A.categories} label="Custom Categories" value="Manage" />
        <MenuLine icon={A.deleteData} label="Delete My Data" value="Permanent" danger />
      </section>
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
  toggle,
  danger,
}: {
  icon: string;
  label: string;
  value: string;
  toggle?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`menu-line ${danger ? "danger" : ""}`}>
      <img src={icon} alt="" />
      <div>
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
      {toggle ? <i className="toggle" /> : <b>›</b>}
    </div>
  );
}

function MiniChart() {
  const values = [20, 42, 35, 28, 18, 25, 32, 30, 26, 36, 48, 52, 58, 68];

  return (
    <div className="mini-chart">
      {values.map((height, index) => (
        <i
          key={index}
          className={index % 4 === 0 ? "red" : "green"}
          style={{ height: `${height}%` }}
        />
      ))}
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
