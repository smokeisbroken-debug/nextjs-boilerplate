# Project Order — v59.52.1 Standard Mode Check Tab Restore

Base: `v59.52.0 stable8`.

Scope: visual-only bottom navigation asset refresh using the user's generated button artwork.

## Included

- Processed the uploaded 7-button set into app-ready public nav assets.
- Mapped by meaning:
  - Home → `nav-home.png`
  - Check → `nav-check.png`
  - Add → `nav-add.png`
  - Chart → `nav-chart.png`
  - Growth → `nav-growth.png`
  - Rewards → `nav-rewards.png`
  - Profile → `nav-profile.png`
- Updated `navItems` so visible bottom nav uses the correct matching art.
- Updated shared build marker to `v59.52.1`.

## Not included

- No bottom-nav item count change.
- No route/screen changes.
- No token/wallet data logic changes.
- No scoring formula changes.
- No rewards/Admin payout changes.
- No wallet verification or Supabase schema changes.
- No transaction-history, PnL, scam label, or investment-advice changes.


## v59.52.0 extraction notes

- Moved bottom navigation rendering from `app/page.tsx` to `app/components/BottomNav.tsx`.
- Moved bottom navigation config/types/helpers to `app/lib/brokeNavigation.ts`.
- Moved the latest bottom-nav icon-fill override styles to `app/styles/bottom-nav.css`, imported from `app/layout.tsx`.
- No routing, rewards, Admin payout, Universal Check logic, Daily Routine, wallet verification, or scoring formula changes were intended.
