# Testing — v59.51.6 Leak Hub Accordion UX Hotfix

## Manual checks

1. Open the app and go to `Check`.
2. Confirm the Leak Hub shows four cards: Universal Check, Project Research, Wallet Review, Project vs Project.
3. Tap the Universal Check card arrow/header.
   - It should close if open.
   - Tapping again should open it.
   - `Paste / focus input` should focus the input.
4. Tap Project Research.
   - The card should expand in place.
   - It should show explanation text and an `Open Project Research` button.
   - Tapping the card again should close it.
5. Repeat for Wallet Review and Project vs Project.
6. Confirm no user has to switch to Home/Add to close an expanded hub section.
7. Confirm bottom nav still has the same items and Check stays the active leak section.

## Commands

```bash
npm run typecheck
npm run lint:quiet
NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Not changed

No data-source logic, score formulas, rewards, Admin payout, streak logic, Supabase schema, transaction history, PnL, scam labels, or investment advice changed.
