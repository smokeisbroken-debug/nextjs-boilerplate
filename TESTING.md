# Smoke Is Broke — v59.43.8 Admin Distribution Route Persistence Helper Extraction

## Patch scope

v59.43.8 continues the Admin/Rewards backend extraction work by moving Admin distribution persistence/store helpers out of `app/api/admin/distributions/route.ts` into `app/lib/brokeAdminDistributionStore.ts`.

This is a refactor-only patch. It does not intentionally change reward payout logic, eligibility rules, payout share math, Daily Routine, Active Streak, wallet verification, Supabase schema, public UI behavior, Admin UI behavior, payout-wallet env names, server auto-send behavior, or distribution API behavior.

## Changed files

- `app/api/admin/distributions/route.ts`
- `app/lib/brokeAdminRewards.ts`
- `app/lib/brokeAdminDistributionStore.ts` — new
- Root/app docs

## What changed

- Added `app/lib/brokeAdminDistributionStore.ts` for Admin reward distribution persistence helpers.
- Moved distribution/payout row types out of the route into the store helper.
- Moved distribution formatting into `formatAdminDistribution()`.
- Moved distribution list/single fetch helpers into `getAdminDistributionRows()` and `getAdminDistributionById()`.
- Moved payout row fetch helper into `getAdminPayoutRows()`.
- Moved distribution and payout insert helpers into `insertAdminDistributionRow()` and `insertAdminPayoutRows()`.
- Moved distribution status update helper into `updateAdminDistributionStatus()`.
- Moved cancel-payout update helper into `cancelAdminPayoutRows()`.
- Moved manual-send and server-send payout marking helpers into `markAdminManualSendRecordsSent()` and `markAdminPayoutRanksSent()`.
- Updated shared Admin build marker to `v59.43.8` through `BROKE_APP_BUILD_VERSION`.

## Safety notes

- No new Supabase migration is included.
- No payout sender logic was rewritten.
- No server-side Solana transaction logic was changed.
- No eligibility formula or payout share calculation was changed.
- No public user-facing UI was changed.

## Verification

Passed in the patch workspace:

```bash
npm run typecheck
npm run lint:quiet
```

`NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully and finished TypeScript, then timed out during `Collecting page data using 26 workers`. This is consistent with the existing large monolithic `app/page.tsx` build-time issue in the sandbox and was not introduced by this patch.

Targeted checks:

- changed TypeScript files passed brace/paren balance checks
- no BigInt literal suffixes found in changed TypeScript files
- patch zip integrity verified

## Install

Copy the contents of the `v59.43.8/` folder into the project root and replace files.

Do not delete any files.
