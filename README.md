# Smoke Is Broke — v59.51.8 Bottom Nav Icon Fill + Leak Hub Close Control

v59.51.8 is a small UX hotfix on top of confirmed working v59.51.7 stable8. It makes the bottom-nav icons fill more of each button by tightening/cropping their visual framing, and it improves Leak Hub closing by keeping a visible close control, preserving one-open-at-a-time behavior, and auto-scrolling opened cards back to their header.

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
- Updated build marker to `v59.51.8`.

## Test checklist

1. Open the app in Telegram mobile view.
2. Confirm bottom nav shows the new artwork for Home, Check, Add, Chart, Growth, Rewards, and Profile.
3. Confirm tapping each bottom nav item still opens the same existing screen.
4. Confirm Check remains the Leak Hub, only one section is open at a time, the arrow can close the opened section, and the new Close section control works on mobile.
