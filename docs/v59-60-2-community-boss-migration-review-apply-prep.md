# v59.60.2 — Community Boss Supabase Migration Review / Apply Prep

Base: v59.60.1 — Community Boss Safe Sync API Skeleton

## Status

This patch prepares the Supabase migration review package.

It does **not** apply the migration, does **not** enable Supabase writes, and does **not** turn Community Boss into a live backend feature yet.

## Added files

### Pending manual SQL

```text
supabase/migrations_pending/v59_60_2_community_boss_schema_review_required.sql
```

This is a review-ready copy of the Community Boss schema draft with a manual-review warning header.

It is intentionally placed in `supabase/migrations_pending/`, not `supabase/migrations/`, so it will not be auto-applied by normal migration tooling.

### Pending migration README

```text
supabase/migrations_pending/README.md
```

Explains that pending migration files are manual review/apply only.

## API readiness guard added

`app/lib/brokeCommunityBoss.ts` now exposes backend readiness state:

```ts
getCommunityBossBackendReadiness()
```

Readiness reports:

- `syncEnabled`
- `migrationReviewed`
- `writePathEnabled`
- `writePathImplemented`
- `canWrite`
- `missing`

In this patch:

```text
canWrite: false
writePathImplemented: false
```

Even if env flags are set, the API still does not write to Supabase in v59.60.2.

## Environment flags prepared

For future patch only:

```text
COMMUNITY_BOSS_SYNC_ENABLED=true
COMMUNITY_BOSS_MIGRATION_REVIEWED=true
COMMUNITY_BOSS_WRITE_PATH_ENABLED=true
```

These flags are **not enough** to write in v59.60.2 because the write path remains intentionally unimplemented.

## Manual review checklist before applying SQL

Review the SQL file and confirm:

- [ ] Table names match the app contract.
- [ ] No column stores wallet value.
- [ ] No column stores real balance.
- [ ] No column stores income.
- [ ] No column stores debt.
- [ ] No column stores payout value.
- [ ] No column stores reward amount/allocation.
- [ ] No column stores raw transaction history.
- [ ] No column stores raw expense descriptions.
- [ ] RLS is enabled on all Community Boss tables.
- [ ] Public read access is limited to week/aggregate data.
- [ ] Raw user proof rows stay server-only.
- [ ] Constraints clamp proof numbers.
- [ ] Unique key prevents duplicate user/week proof rows.
- [ ] View exposes only public-safe aggregate fields.

## Manual apply sequence

Only after review:

1. Open Supabase SQL editor.
2. Copy SQL from:

```text
supabase/migrations_pending/v59_60_2_community_boss_schema_review_required.sql
```

3. Run in a staging/project-safe environment first.
4. Confirm tables exist.
5. Confirm public aggregate view works.
6. Confirm RLS policies exist.
7. Confirm no public access to raw user proofs.
8. Only then set:

```text
COMMUNITY_BOSS_MIGRATION_REVIEWED=true
```

## API behavior after this patch

### `GET /api/community-boss/current`

Still returns dry-run current boss data and now includes `backendReadiness`.

### `POST /api/community-boss/proof`

Still returns sanitized payload and `persisted:false`.

It does not write to Supabase.

### `POST /api/community-boss/recalculate`

Still admin-protected and no-write.

## What this patch does not do

- Does not apply Supabase schema.
- Does not create live backend sync.
- Does not save user proof rows.
- Does not aggregate community damage from DB.
- Does not add payout math.
- Does not change rewards/admin payout logic.
- Does not change wallet verification.
- Does not expose wallet value, balances, income, debt, or transactions.
- Does not add PvP/multiplayer.
- Does not add token reward promises.

## Next step

`v59.60.3 — Community Boss DB Read Path Prep`

Recommended next patch:

- add read-only Supabase fetch helpers for current week/aggregate;
- keep fallback to dry-run when tables are absent;
- do not write proofs yet;
- do not enable payouts or PvP.
