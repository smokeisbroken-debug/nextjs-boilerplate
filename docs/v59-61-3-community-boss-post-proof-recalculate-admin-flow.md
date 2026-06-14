# v59.61.3 — Community Boss Post-Proof Recalculate Admin Flow

Base: v59.61.2 — Community Boss Live Aggregate Refresh

## Status

This patch adds an admin UI flow for the existing aggregate recalculation route.

It does not add payout math, wallet value, PvP, reward promises, or a game economy.

## What changed

- Adds a `Community Boss admin` panel inside the existing Rewards admin modal.
- Adds an admin-only `Recalculate aggregate` button.
- Calls `POST /api/community-boss/recalculate` with the existing admin key.
- Shows recalculation status, proof rows read, total aggregate damage, and participant count.
- Shows locked/blocked states when manual aggregate gates are not enabled.

## Required gates for real recalculation write

The route still requires the manual gates added in previous patches:

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

If these are not present, the admin panel will show a locked/blocked response and no aggregate write is performed.

## Guardrails

No changes to:

- Supabase schema;
- migration auto-run;
- reward/admin payout logic;
- wallet verification;
- PvP/multiplayer;
- wallet value, balance, income, or debt exposure;
- token reward promises;
- Universal Check scoring;
- Daily Routine formula;
- transaction history/PnL/scam-label logic;
- game economy.

## Next stage

`v59.61.4 — Community Boss Admin Refresh + Abuse Guard`

Recommended next scope:

- make the admin panel refresh public aggregate after recalculation;
- add clearer blocked reason display;
- add duplicate/rate-limit prep for proof writes.
