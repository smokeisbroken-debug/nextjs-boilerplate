# v59.58.1 — Social Game Mobile Polish

## Scope
Fixes Social Leaderboard mobile overflow after v59.58.0.

## Changes
- Hardens Social Leaderboard panel width with max-width and overflow guards.
- Adds min-width: 0 to nested grid/flex children that could push past the screen.
- Allows long safe-point text, rank labels, details, and proof copy hints to wrap.
- Makes Social Leaderboard hero, lanes, action row, local user card, tabs, leaderboard rows, empty state, and FAQ compact on narrow screens.
- Keeps the Social Leaderboard collapsed/open behavior unchanged.

## Guardrails
- No Supabase schema changes.
- No backend community sync.
- No PvP or multiplayer.
- No payout/reward promise logic.
- No wallet value, balance, income, debt, PnL, or scam-label exposure changes.
- No Universal Check scoring or Daily Routine formula changes.

## Verification
- `npm run typecheck`
- `npm run lint:quiet`
- `npm run build` attempted in sandbox.
