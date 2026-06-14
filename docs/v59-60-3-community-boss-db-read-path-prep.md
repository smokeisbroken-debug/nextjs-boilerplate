# v59.60.3 — Community Boss DB Read Path Prep

Base: v59.60.2 — Community Boss Supabase Migration Review / Apply Prep

## Status

This patch prepares the read-only database path for Community Boss.

It does **not** submit proof rows, does **not** write aggregates, does **not** apply a migration, and does **not** enable payout logic.

## What changed

### `GET /api/community-boss/current`

The endpoint now tries a read-only Supabase aggregate read when all readiness conditions are true:

- `COMMUNITY_BOSS_SYNC_ENABLED=true`
- `COMMUNITY_BOSS_MIGRATION_REVIEWED=true`
- `COMMUNITY_BOSS_DB_READ_ENABLED=true`
- `SUPABASE_URL` exists
- `SUPABASE_SERVICE_ROLE_KEY` exists

It reads only from:

```text
public.broke_community_boss_public_weeks
```

This is the public-safe aggregate view drafted in v59.60.0/v59.60.2.

### Fallback behavior

If ENV flags are missing, the view is missing, Supabase returns an error, or there is no row for the current week, the endpoint falls back to dry-run data and keeps the UI alive.

Response includes:

- `dataSource: "supabase" | "dry_run"`
- `readAttempted`
- `readError`
- `persisted`
- `backendReadiness`

### Helper updates

`app/lib/brokeCommunityBoss.ts` now includes:

- `COMMUNITY_BOSS_DB_READ_ENABLED`
- Supabase read readiness checks
- safe public row mapping
- `readCommunityBossPublicSnapshotFromSupabase()`

## Not changed

- `POST /api/community-boss/proof` remains dry-run/sanitizer only.
- `POST /api/community-boss/recalculate` remains no-write.
- No Supabase migration is applied automatically.
- No proof row is persisted.
- No aggregate is updated.
- No payout, reward allocation, wallet value, balance, income, debt, transaction, or private budget field is added.

## Manual checks after deploy

With DB read disabled:

```bash
curl /api/community-boss/current
```

Expected:

- `dataSource: "dry_run"`
- `persisted: false`
- `backendReadiness.canRead: false`

After the reviewed migration is manually applied and read ENV is enabled:

```env
COMMUNITY_BOSS_SYNC_ENABLED=true
COMMUNITY_BOSS_MIGRATION_REVIEWED=true
COMMUNITY_BOSS_DB_READ_ENABLED=true
```

Expected if the current week row exists:

- `dataSource: "supabase"`
- `persisted: true`
- aggregate values from `broke_community_boss_public_weeks`

Expected if tables/row are missing:

- fallback to dry-run;
- `readError` explains why;
- no crash.

## Next stage

`v59.60.4 — Community Boss Seed Week / Admin Prep`

Recommended next step:

- create reviewed/manual seed for the current week boss row;
- add admin-only seed route or SQL snippet;
- still no user proof writes until seed/read path is verified.
