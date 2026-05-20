# Testing — v59.3.2 Wallet Snapshot Order Hotfix

## Required checks

- Home loads after deployment.
- `Wallet Snapshot for Today` is still the first visible content block under the app header.
- Income / Life Cost / Money Leaks / Real Balance appear at the top of that block.
- Snapshot day tabs appear below the cash-flow cards.
- Selected-day wallet snapshot card appears below the day tabs.
- Hero / brand message appears below the Wallet Snapshot block.
- Today’s Focus still appears after the hero.
- More wallet context opens and shows profile, streak, and Wallet HP.
- Track Leak still saves expenses.
- Chart / Leak Pattern Lab still loads.
- Telegram Mini App layout does not collide with bottom nav.

## Build checks used

- `npm run typecheck`
- `npm run lint:quiet`
- `NEXT_TELEMETRY_DISABLED=1 npm run build`
