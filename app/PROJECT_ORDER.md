# Smoke Is Broke — v59.51.2 Mobile Edit Visibility Hotfix

v59.51.2 is a focused UX hotfix on top of v59.51.1. It fixes the mobile wallet-behavior checklist layout where labels could run together, and makes corrected leak editing easier to find from the Track Leak screen.

## Changes

- Fixed Manual wallet behavior leak items on mobile by applying the existing `leak-score-signal` layout class and separating the Check/Selected status pill from the signal label/helper text.
- Changed selected wallet-behavior local notes to use the same textarea pattern as Project Leak Score notes, with local character count helper text.
- Added a visible `Wrong amount or duplicate?` panel inside Track Leak showing the latest records with Edit/Delete actions.
- The edit entry point is now visible near the leak-tracking flow, not only inside collapsed Home/Chart/Profile record lists.
- Existing edit behavior is unchanged: amount, category, decision type, and note can be corrected, and charts / Wallet HP / analysis recalculate after saving.

## Not changed

- No rewards/Admin payout logic changes.
- No wallet verification changes.
- No Supabase schema changes.
- No transaction-history scan, PnL, scam labels, project accusations, or investment advice added.
- No new bottom-nav tab or new manual screen added.

## Verification

- `npm run typecheck`
- `npm run lint:quiet`
- `NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build`
