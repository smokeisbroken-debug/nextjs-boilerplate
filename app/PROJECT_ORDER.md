# Smoke Is Broke — v59.43.5 Admin API Helper Extraction / Response Cleanup

Patch-only release on top of v59.43.4.

## Summary

v59.43.5 continues the Admin/Rewards extraction work by moving repeated Admin distribution API helper logic out of `app/api/admin/distributions/route.ts` into `app/lib/brokeAdminApi.ts`.

The patch is refactor-only. It does not intentionally change payout logic, reward eligibility, Daily Routine, Active Streak, wallet verification, Supabase schema, public UI behavior, server auto-send flow, or Admin UI behavior.

## Changed

- Added `app/lib/brokeAdminApi.ts`.
- Moved Admin API JSON response wrapper into the helper module.
- Moved shared no-store response headers into the helper module.
- Moved required/optional environment variable helpers into the helper module.
- Moved string/number normalization helpers into the helper module.
- Moved distribution UUID and transaction signature normalization helpers into the helper module.
- Added shared Admin distribution error formatting helpers.
- Updated schema-missing error guidance to mention the v59.43.1 schema repair pack.
- Updated shared Admin build marker to `v59.43.5` through `BROKE_APP_BUILD_VERSION`.

## Not changed

- No reward eligibility formula change.
- No payout share math change.
- No Daily Routine or Active Streak change.
- No wallet verification backend change.
- No Supabase migration.
- No public user UI behavior change.
- No server-side payout wallet behavior change.
- No distribution API behavior change beyond cleaner response/error formatting.
- No Admin UI behavior change.

## Verification

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- Targeted TypeScript transpile diagnostics passed for `app/api/admin/distributions/route.ts`, `app/lib/brokeAdminApi.ts`, and `app/lib/brokeAdminRewards.ts`.
- Raw brace/paren balance passed for changed TS files.
- Targeted scan found no BigInt literal suffixes in changed TS files.
- Zip integrity test passed.
