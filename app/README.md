# Smoke Is Broke — v59.51.7 Bottom Nav Icon Refresh

v59.51.7 is a small visual hotfix on top of confirmed working v59.51.6 stable8. It replaces the visible bottom navigation artwork with the new user-provided button set, mapped by meaning: Home, Check, Add, Chart, Growth, Rewards, and Profile.

No navigation logic, Check accordion behavior, rewards/Admin payout logic, wallet verification, Supabase schema, token/wallet data logic, scoring formulas, transaction-history scan, PnL, scam labels, or investment-advice behavior changed.

## Changed

- Added new processed nav assets:
  - `public/nav-home.png`
  - `public/nav-check.png`
  - `public/nav-add.png`
  - `public/nav-chart.png`
  - `public/nav-growth.png`
  - `public/nav-rewards.png`
  - `public/nav-profile.png`
- Updated visible nav mapping so Check, Rewards, and Profile no longer reuse old generic chart/save/settings icons.
- Updated build marker to `v59.51.7`.

## Test checklist

1. Open the app in Telegram mobile view.
2. Confirm bottom nav shows the new artwork for Home, Check, Add, Chart, Growth, Rewards, and Profile.
3. Confirm tapping each bottom nav item still opens the same existing screen.
4. Confirm Check remains the Leak Hub and accordion behavior from v59.51.6 still works.
