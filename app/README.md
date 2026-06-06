# Smoke Is Broke — v59.51.6 Leak Hub Accordion UX Hotfix

v59.51.6 is a small UX hotfix on top of confirmed working v59.51.5 stable8. It keeps the main Check tab as the single leak-tools hub, but makes the hub cards behave like an accordion instead of immediate navigation buttons.

## Changes

- Leak Hub cards now open and close in place with an arrow-style control.
- Universal Check, Project Research, Wallet Review, and Project vs Project can each expand inside Check.
- Project Research, Wallet Review, and Project vs Project now reveal a short explanation and an explicit Open button instead of jumping immediately when the card header is tapped.
- Universal Check expansion includes a direct focus action for the paste input.
- Users can tap the same arrow/card again to close the expanded section without leaving Check or switching to Home/Add.
- Check remains the highlighted bottom-nav section for all leak tools.

## Not changed

No token/wallet data logic, scoring formulas, rewards, Admin distribution, payout logic, Daily Routine/Active Streak, wallet verification, Supabase schema, transaction history, PnL, scam labels, investment advice, bottom-nav item count, or new manual screen changes.

## Verification

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```
