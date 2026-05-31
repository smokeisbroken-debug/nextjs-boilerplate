# Smoke Is Broke — v59.43.7 Admin Auth / Supabase Helper Extraction

Patch-only release on top of v59.43.6.

## Summary

v59.43.7 continues the Admin/Rewards extraction work by moving Admin authorization and Supabase REST infrastructure helpers out of `app/api/admin/distributions/route.ts` into `app/lib/brokeAdminAuthSupabase.ts`.

The patch is refactor-only. It does not intentionally change payout logic, reward eligibility, Daily Routine, Active Streak, wallet verification, Supabase schema, public UI behavior, server auto-send behavior, Admin UI behavior, or distribution API behavior.

## Changed

- Added `app/lib/brokeAdminAuthSupabase.ts`.
- Moved private Admin auth helpers into the helper module:
  - admin Telegram ID env parsing;
  - treasury wallet env/default resolution;
  - rewards admin secret fallback resolution;
  - Telegram web auth session cookie parsing;
  - timing-safe secret/session comparison;
  - Admin request authorization by secret, bearer token, or configured Telegram admin session;
  - Admin auth configured check;
  - payout auto-send enabled flag helper.
- Moved Supabase REST helpers into the helper module:
  - Supabase base URL normalization;
  - service-role request headers;
  - REST URL construction;
  - no-store Supabase fetch wrapper with compact error formatting.
- Reduced `app/api/admin/distributions/route.ts` by keeping distribution route handling and persistence calls there while delegating auth/env/Supabase infrastructure to the new helper.
- Updated shared Admin build marker to `v59.43.7` through `BROKE_APP_BUILD_VERSION`.

## Not changed

- No reward eligibility formula change.
- No payout share math change.
- No Daily Routine or Active Streak change.
- No wallet verification backend change.
- No Supabase migration.
- No public user UI behavior change.
- No Admin UI behavior change.
- No payout-wallet env name change.
- No server auto-send behavior change.
- No distribution API behavior change intended.

## Verification

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully, then the sandbox command timed out during Next.js `Running TypeScript ...`; standalone `npm run typecheck` passed, so full build completion was not confirmed in this sandbox.
- Targeted scan found no BigInt literal suffixes in changed TS files.
- Zip integrity test passed.
