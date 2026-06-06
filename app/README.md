# Smoke Is Broke — v59.52.1 Standard Mode Check Tab Restore

v59.52.0 is a safe refactor patch on top of confirmed working v59.51.10 stable8. It adds a clear Close control on the deep Leak Hub screens opened from Check, returns those screens back to Check instead of Home, renames the in-hub close control to Collapse section, and forces screen navigation to start at the top instead of preserving random scroll positions.

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
- Updated build marker to `v59.52.1`.

## Test checklist

1. Open the app in Telegram mobile view.
2. Confirm bottom nav shows the new artwork for Home, Check, Add, Chart, Growth, Rewards, and Profile.
3. Confirm tapping each bottom nav item still opens the same existing screen.
4. Confirm Check remains the Leak Hub, only one section is open at a time, the arrow can close the opened section, and the new Close section control works on mobile.


## v59.52.0 extraction notes

- Moved bottom navigation rendering from `app/page.tsx` to `app/components/BottomNav.tsx`.
- Moved bottom navigation config/types/helpers to `app/lib/brokeNavigation.ts`.
- Moved the latest bottom-nav icon-fill override styles to `app/styles/bottom-nav.css`, imported from `app/layout.tsx`.
- No routing, rewards, Admin payout, Universal Check logic, Daily Routine, wallet verification, or scoring formula changes were intended.
