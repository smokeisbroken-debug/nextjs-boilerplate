# v59.56.1 — Weekly Boss Proof Hardening

## Goal

Make Weekly Boss harder to inflate with old activity and clearer for users.

## Changes

- Weekly Boss now uses an ISO-style weekly key and Monday-based weekly window.
- The card shows the active week range and reset hint.
- Real Tracking damage now counts current-week tracking days instead of only today's proof.
- Leak Fix damage now uses this week's leak-control proof instead of any old non-needed expense.
- Challenge Proof now counts challenges completed during the current weekly window.
- Challenge Proof no longer becomes active from any old completed challenge.
- Copy clarified that the boss uses this week's real Life Tracker actions.

## Not changed

- Rewards/admin payout
- Wallet verification
- Supabase schema
- Universal Check scoring
- Daily Routine formula
- Transaction history / PnL / scam labels
- $BROKE reward distribution logic
- Separate game mode

## Verification

Run:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run lint:quiet
NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```
