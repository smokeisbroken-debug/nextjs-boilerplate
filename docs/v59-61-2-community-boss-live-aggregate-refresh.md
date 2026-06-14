# v59.61.2 — Community Boss Live Aggregate Refresh

Base: v59.61.1 — Community Boss Aggregate Recalculate Manual Gate

## Status

This patch improves the live aggregate read/refresh loop only.

It does not add payout logic, wallet value exposure, PvP, token rewards, or a game economy.

## Changes

- `GET /api/community-boss/current` now returns `refreshedAt` and `refreshReason`.
- Community Boss Prep now has a manual `Refresh aggregate` button.
- The UI shows live aggregate freshness, aggregate updated time, and refresh state.
- After a proof is persisted behind the manual write gate, the UI triggers a public aggregate refresh.
- Dry-run wording is reduced when Supabase public aggregate read is active.

## Important behavior

Proof write and aggregate recalculation remain separate controlled operations:

1. Safe proof can be persisted only behind the proof manual write gate.
2. Public aggregate can be recalculated only behind the aggregate manual write gate.
3. UI refresh reads only the public-safe aggregate view.

The refresh button does not write anything. It only reads `GET /api/community-boss/current`.

## Guardrails

No changes to:

- Supabase schema;
- migration auto-run;
- payout math;
- rewards/admin payout logic;
- wallet verification;
- PvP/multiplayer;
- wallet value, balance, income, or debt exposure;
- token reward promises;
- Universal Check scoring;
- Daily Routine formula;
- transaction history/PnL/scam labels;
- game economy.

## Next stage

`v59.61.3 — Community Boss Post-Proof Recalculate Admin Flow`

Recommended next: add an admin-only UI/action or safer internal flow for recalculating aggregate after proof writes, still behind manual gates.
