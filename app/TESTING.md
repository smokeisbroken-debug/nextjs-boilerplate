# Smoke Is Broke — v59.44.0 Admin Distribution Route Final Cleanup / Thin Route Pass

## Patch scope

v59.44.0 completes the current Admin distribution route cleanup pass by moving route-level composition helpers out of `app/api/admin/distributions/route.ts` into `app/lib/brokeAdminDistributionRoute.ts`.

This is a refactor-only patch. It does not intentionally change reward payout logic, eligibility rules, payout share math, Daily Routine, Active Streak, wallet verification, Supabase schema, public UI behavior, Admin UI behavior, payout-wallet env names, server auto-send behavior, or distribution API behavior.

## Changed files

- `app/api/admin/distributions/route.ts`
- `app/lib/brokeAdminRewards.ts`
- `app/lib/brokeAdminDistributionRoute.ts` — new
- Root/app docs

## What changed

- Added `app/lib/brokeAdminDistributionRoute.ts` for route-level Admin distribution helpers.
- Moved repeated Admin access-gate handling into `getAdminDistributionAccessError()`.
- Moved list-limit normalization into `getAdminDistributionListLimit()`.
- Moved manifest request normalization into `normalizeAdminDistributionManifestRequest()`.
- Moved distribution/payout insert-row composition into `buildAdminDistributionInsertBatch()`.
- Moved distribution response summary shaping into `summarizeAdminDistributionBatch()`.
- Moved manual-send completion counting into `getAdminManualSendCompletion()`.
- Moved the route-local server auto-send callback wiring into `autoSendAdminPreparedDistribution()`.
- Reduced `app/api/admin/distributions/route.ts` from roughly 351 lines to roughly 228 lines.
- Updated shared Admin build marker to `v59.44.0` through `BROKE_APP_BUILD_VERSION`.

## Safety notes

- No new Supabase migration is included.
- No payout sender logic was rewritten.
- No server-side Solana transaction logic was changed.
- No eligibility formula or payout share calculation was changed.
- No public user-facing UI was changed.
- No Admin UI behavior was changed.

## Verification

Passed in the patch workspace:

```bash
npm run typecheck
npm run lint:quiet
```

`NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully, then timed out during Next.js `Running TypeScript ...` in the sandbox. Standalone `npm run typecheck` passed, so this is consistent with the existing large monolithic `app/page.tsx` build-time issue in the sandbox and was not introduced by this patch.

Targeted checks:

- changed TypeScript files passed brace/paren balance checks
- no BigInt literal suffixes found in changed TypeScript files
- patch zip integrity verified

## Install

Copy the contents of the `v59.44.0/` folder into the project root and replace files.

Do not delete any files.
