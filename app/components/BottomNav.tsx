"use client";

import {
  getActiveBottomNavTab,
  getVisibleBottomNavItems,
  type AppMode,
  type Tab,
} from "../lib/brokeNavigation";

type RoutineNavAction = "checkedChart" | "checkedSave";

type BottomNavProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  appMode: AppMode;
  onHaptic: (type?: "light" | "medium" | "success" | "error") => void;
  onRoutineAction: (action: RoutineNavAction) => void;
};

export function BottomNav({
  activeTab,
  setActiveTab,
  appMode,
  onHaptic,
  onRoutineAction,
}: BottomNavProps) {
  const visibleItems = getVisibleBottomNavItems(appMode);
  const activeNavTab = getActiveBottomNavTab(activeTab);

  return (
    <nav
      className={`bottom-nav ${appMode === "standard" ? "standard-mode-nav" : "pro-mode-nav"}`}
      style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}
    >
      {visibleItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            onHaptic("light");
            if (item.id === "chart") onRoutineAction("checkedChart");
            if (item.id === "whatif") onRoutineAction("checkedSave");
            setActiveTab(item.id);
          }}
          className={activeNavTab === item.id ? "active" : ""}
          aria-label={item.label}
          title={item.label}
        >
          <img src={item.icon} alt="" />
        </button>
      ))}
    </nav>
  );
}
