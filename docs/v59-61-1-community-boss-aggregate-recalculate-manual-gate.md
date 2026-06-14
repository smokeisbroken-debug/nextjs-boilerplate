# v59.61.1 — Community Boss Aggregate Recalculate Manual Gate

Base: v59.61.0 — Community Boss Proof Persistence Manual Write Gate

## Status

This patch adds the first controlled aggregate recalculation write path for Community Boss.

It does not add payout math, token reward promises, PvP, wallet value, or wallet balance exposure.

## What changed

`POST /api/community-boss/recalculate` can now recompute `broke_community_boss_aggregates` from safe rows in `broke_community_boss_user_proofs`, but only when the manual aggregate gate is fully open.

The route remains admin-protected.

## Required flags

The aggregate write path requires:

```env
COMMUNITY_BOSS_SYNC_ENABLED=true
COMMUNITY_BOSS_MIGRATION_REVIEWED=true
COMMUNITY_BOSS_DB_READ_ENABLED=true
COMMUNITY_BOSS_WRITE_PATH_ENABLED=true
COMMUNITY_BOSS_AGGREGATE_RECALC_REVIEWED=true
COMMUNITY_BOSS_AGGREGATE_WRITE_ENABLED=true
COMMUNITY_BOSS_AGGREGATE_MANUAL_WRITE_ENABLED=true
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
COMMUNITY_BOSS_ADMIN_SECRET=...
```

## Tables touched when gate is open

Reads from:

```text
broke_community_boss_user_proofs
```

Writes to:

```text
broke_community_boss_aggregates
```

## Aggregate fields

The aggregate is derived only from public-safe proof fields:

- weekly damage
- safe points
- participant count
- routine completed count
- challenge completed count
- weakness hit count
- tracking day total

## Guardrails

No changes to:

- rewards/admin payout
- wallet verification
- PvP/multiplayer
- wallet value/balance/income/debt exposure
- token reward promises
- Universal Check scoring
- Daily Routine formula
- transaction history/PnL/scam labels
- game economy

## Next stage

`v59.61.2 — Community Boss Live Aggregate Refresh`

Recommended next step: refresh the public aggregate UI after proof submit/recalculate and reduce dry-run wording when Supabase data is live.
