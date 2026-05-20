# Testing — v59.3.1 Wallet Snapshot Top Placement Hotfix

## Required checks

- Home loads after deployment.
- `Wallet Snapshot for Today` is the first visible content block under the app header.
- Hero / brand message appears below Wallet Snapshot.
- Today’s Focus still appears after the hero.
- Income / Life Cost / Money Leaks / Real Balance are visible upfront.
- Snapshot day tabs scroll horizontally on mobile.
- Tapping a day tab changes the daily snapshot card.
- More wallet context opens and shows profile, streak, and Wallet HP.
- Track Leak still saves expenses.
- Chart / Leak Pattern Lab still loads.
- Telegram Mini App layout does not collide with bottom nav.

## Build checks used

- `npm run typecheck`
- `npm run lint:quiet`
- `NEXT_TELEMETRY_DISABLED=1 npm run build`
