export type Tab =
  | "home"
  | "check"
  | "add"
  | "chart"
  | "growth"
  | "leakscore"
  | "walletleak"
  | "compare"
  | "whatif"
  | "settings";

export type AppMode = "standard" | "pro";

export type BottomNavItem = {
  id: Tab;
  label: string;
  icon: string;
  proOnly?: boolean;
  hubOnly?: boolean;
};

export const LEAK_HUB_TABS: Tab[] = ["check", "leakscore", "walletleak", "compare"];

export const bottomNavItems: BottomNavItem[] = [
  { id: "home", label: "Home", icon: "/nav-home.png" },
  { id: "add", label: "Track", icon: "/nav-add.png" },
  { id: "chart", label: "Analysis", icon: "/nav-chart.png" },
  { id: "growth", label: "Growth", icon: "/nav-growth.png", proOnly: true },
  { id: "whatif", label: "Rewards", icon: "/nav-rewards.png", proOnly: true },
  { id: "check", label: "Check", icon: "/nav-check.png" },
  { id: "leakscore", label: "Project", icon: "/nav-chart.png", proOnly: true, hubOnly: true },
  { id: "walletleak", label: "Wallet", icon: "/nav-profile.png", proOnly: true, hubOnly: true },
  { id: "compare", label: "Vs", icon: "/nav-chart.png", proOnly: true, hubOnly: true },
  { id: "settings", label: "Profile", icon: "/nav-profile.png" },
];

export function getVisibleBottomNavItems(appMode: AppMode) {
  return (appMode === "standard"
    ? bottomNavItems.filter((item) => !item.proOnly)
    : bottomNavItems
  ).filter((item) => !item.hubOnly);
}

export function getActiveBottomNavTab(activeTab: Tab): Tab {
  return LEAK_HUB_TABS.includes(activeTab) ? "check" : activeTab;
}
