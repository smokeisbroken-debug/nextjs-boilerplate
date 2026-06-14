# v59.60.1 — Community Boss Safe Sync API Skeleton

Base: v59.60.0 — Community Boss Backend Plan / Schema Draft

## Status

This patch adds server route skeletons only.

It intentionally does **not** write to Supabase, does **not** apply a migration, and does **not** enable real Community Boss sync yet.

## Added routes

### `GET /api/community-boss/current`

Returns deterministic current-week Community Boss metadata and a dry-run aggregate.

Current behavior:

- returns week key;
- returns boss identity;
- returns boss HP;
- returns zeroed aggregate;
- returns explicit guardrails;
- returns `persisted: false`.

### `POST /api/community-boss/proof`

Validates and sanitizes a public-safe proof payload.

Current behavior:

- rejects forbidden private/financial field names;
- clamps safe proof numbers;
- checks week key;
- returns sanitized proof;
- returns HTTP `202`;
- returns `persisted: false`;
- performs no database write.

### `POST /api/community-boss/recalculate`

Admin-protected skeleton for future aggregate repair.

Current behavior:

- requires admin secret;
- returns dry-run status;
- performs no aggregate recalculation;
- performs no database write.

## Added shared helper

`app/lib/brokeCommunityBoss.ts`

Includes:

- current ISO week calculation;
- deterministic weekly boss rotation;
- safe proof sanitizer;
- forbidden field detector;
- range clamps;
- no-store headers;
- dry-run aggregate helper.

## Forbidden payload fields

The proof route rejects payloads containing fields matching:

- balance
- wallet value
- income
- debt
- payout
- reward amount/allocation
- transaction
- expense description
- real balance
- private budget
- payday

## Guardrails

No changes to:

- Supabase schema;
- backend community sync;
- rewards/admin payout;
- wallet verification;
- PvP/multiplayer;
- Universal Check scoring;
- Daily Routine formula;
- transaction history/PnL/scam labels;
- wallet value/balance exposure;
- token reward promises;
- game economy.

## Next stage

`v59.60.2 — Community Boss Supabase Migration Review / Apply Prep`

Recommended next step:

1. Review the SQL draft.
2. Decide whether to apply migration manually.
3. Add a migration file only after review.
4. Keep API write path disabled until tables exist.


## v59.60.2 readiness update

The dry-run routes now include `backendReadiness`, which reports migration/write flags while keeping `canWrite:false`.

The SQL file is prepared in `supabase/migrations_pending/` for manual review only. No Supabase write path is implemented yet.
