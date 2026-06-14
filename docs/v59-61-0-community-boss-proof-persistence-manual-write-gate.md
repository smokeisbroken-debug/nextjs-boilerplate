# v59.61.0 — Community Boss Proof Persistence Manual Write Gate

Base: v59.60.9 — Community Boss Proof Persistence Dry-Run Server Path

## Status

This patch adds the first controlled real proof persistence path for Community Boss.

The write path is still locked by default and only runs when all manual gates are enabled.

## Required flags for real proof upsert

All must be true:

```env
COMMUNITY_BOSS_SYNC_ENABLED=true
COMMUNITY_BOSS_MIGRATION_REVIEWED=true
COMMUNITY_BOSS_DB_READ_ENABLED=true
COMMUNITY_BOSS_WRITE_PATH_ENABLED=true
COMMUNITY_BOSS_PROOF_PERSISTENCE_REVIEWED=true
COMMUNITY_BOSS_PROOF_WRITE_ENABLED=true
COMMUNITY_BOSS_PROOF_PERSISTENCE_DRY_RUN_ENABLED=true
COMMUNITY_BOSS_PROOF_MANUAL_WRITE_ENABLED=true
```

Supabase service env must also exist:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Write behavior

`POST /api/community-boss/proof` now:

1. checks Telegram initData or web session;
2. rejects forbidden private/financial fields;
3. sanitizes and clamps safe proof payload;
4. prepares the dry-run row;
5. if the manual write gate is open and auth is verified, upserts into `broke_community_boss_user_proofs`;
6. returns `persisted:true` only after Supabase confirms the upsert.

## Supabase target

Table:

```text
broke_community_boss_user_proofs
```

Conflict target:

```text
week_key, telegram_user_id
```

Note: `telegram_user_id` receives the existing public hashed user key, not raw Telegram ID.

## Guardrails

Still no:

- payout math;
- reward amount;
- wallet value;
- wallet balance;
- income/debt fields;
- transaction history;
- PvP/multiplayer;
- game economy.

## UI changes

Community Boss Prep now distinguishes:

- dry-run checked;
- manual write gate ready;
- Supabase upsert attempted;
- persisted proof row.

## Next step

`v59.61.1 — Community Boss Aggregate Recalculate Manual Gate`

After proof persistence works, aggregate recalculation should update `broke_community_boss_aggregates` behind a separate admin/manual gate.
