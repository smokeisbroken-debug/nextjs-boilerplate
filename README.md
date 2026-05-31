# Smoke Is Broke — v59.43.9 Admin Distribution Route Validation Helper Extraction

## Patch scope

v59.43.9 continues the Admin/Rewards backend extraction work by moving Admin distribution route validation and normalization helpers out of `app/api/admin/distributions/route.ts` into `app/lib/brokeAdminDistributionValidation.ts`.

This is a refactor-only patch. It does not intentionally change reward payout logic, eligibility rules, payout share math, Daily Routine, Active Streak, wallet verification, Supabase schema, public UI behavior, Admin UI behavior, payout-wallet env names, server auto-send behavior, or distribution API behavior.

## Changed files

- `app/api/admin/distributions/route.ts`
- `app/lib/brokeAdminRewards.ts`
- `app/lib/brokeAdminDistributionValidation.ts` — new
- Root/app docs

## What changed

- Added `app/lib/brokeAdminDistributionValidation.ts` for Admin reward distribution request validation helpers.
- Moved distribution request input types out of the route into the validation helper.
- Moved reward token normalization into `normalizeAdminDistributionToken()`.
- Moved distribution mode normalization into `normalizeAdminDistributionMode()`.
- Moved payout recipient sanitization into `normalizeAdminDistributionPayouts()`.
- Moved manual-send signature parsing into `parseAdminManualSendRecords()`.
- Kept distribution route behavior the same while reducing local validation code in `app/api/admin/distributions/route.ts`.
- Updated shared Admin build marker to `v59.43.9` through `BROKE_APP_BUILD_VERSION`.

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

Copy the contents of the `v59.43.9/` folder into the project root and replace files.

Do not delete any files.
