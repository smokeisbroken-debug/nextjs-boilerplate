# Testing — v59.3 Wallet Snapshot Visibility

## Required checks

- Home loads after deployment.
- Today’s Focus still appears near the top.
- Wallet Snapshot is visible without opening a collapsible section.
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
