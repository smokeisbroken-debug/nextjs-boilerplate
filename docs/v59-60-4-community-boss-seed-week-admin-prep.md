# v59.60.4 — Community Boss Seed Week / Admin Prep

Base: v59.60.3 — Community Boss DB Read Path Prep

## Status

This patch prepares current-week boss seeding for admin/manual review.

It does **not** automatically write to Supabase and does **not** submit user proof rows.

## Added admin route

`POST /api/community-boss/seed-week`

Current behavior:

- admin-protected;
- returns the current deterministic weekly boss metadata;
- returns a manual SQL snippet for Supabase SQL editor review/apply;
- returns `persisted:false`;
- returns `manualApplyRequired:true`;
- performs no Supabase write.

## Added pending manual SQL

`supabase/migrations_pending/v59_60_4_seed_current_community_boss_week_manual.sql`

This SQL:

- computes current ISO week key;
- selects deterministic weekly boss from the same rotation;
- inserts or updates `broke_community_boss_weeks`;
- inserts a zero row into `broke_community_boss_aggregates` if missing;
- does not insert user proof rows.

## ENV flags prepared

`COMMUNITY_BOSS_SEED_WRITE_ENABLED=true`

This flag is reported in readiness, but write implementation remains disabled in this patch:

```text
seedWriteImplemented: false
canSeedWrite: false
```

## Manual apply sequence

1. Apply/review the v59.60.2 schema draft first.
2. Confirm `broke_community_boss_public_weeks` exists.
3. Run the v59.60.4 seed SQL manually in Supabase SQL editor.
4. Enable read flags only after the row exists:
   - `COMMUNITY_BOSS_SYNC_ENABLED=true`
   - `COMMUNITY_BOSS_MIGRATION_REVIEWED=true`
   - `COMMUNITY_BOSS_DB_READ_ENABLED=true`
5. Check `GET /api/community-boss/current`.
6. Keep proof write disabled until a later patch.

## Guardrails

No changes to:

- Supabase auto migrations;
- automatic Supabase writes;
- user proof persistence;
- rewards/admin payout logic;
- wallet verification;
- PvP/multiplayer;
- wallet value/balance/income/debt exposure;
- token reward promises;
- Universal Check scoring;
- Daily Routine formula;
- transaction history/PnL/scam labels;
- game economy.

## Next stage

`v59.60.5 — Community Boss Aggregate UI Readiness`

Recommended scope:

- add UI state labels for `dataSource`, `readError`, and seeded/not seeded;
- show admin-safe fallback hint;
- still no user proof writes.
