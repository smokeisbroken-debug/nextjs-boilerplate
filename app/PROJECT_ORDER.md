# Smoke Is Broke — v59.44.1 Admin Distribution Route Smoke-Test Hardening

## Patch scope

v59.44.1 adds an authorized smoke-test path for the private Admin distribution route after the v59.43.x → v59.44.0 refactor pass.

This is a test-hardening patch. It does not intentionally change reward payout logic, eligibility rules, payout share math, Daily Routine, Active Streak, wallet verification, Supabase schema, public UI behavior, Admin UI behavior, payout-wallet env names, server auto-send behavior, or normal distribution API behavior.

## Changed files

- `app/api/admin/distributions/route.ts`
- `app/lib/brokeAdminRewards.ts`
- `app/lib/brokeAdminDistributionSmoke.ts` — new
- Root/app docs

## What changed

- Added `app/lib/brokeAdminDistributionSmoke.ts` for pure Admin distribution route smoke checks.
- Added an authorized `GET /api/admin/distributions?smoke=1` path.
- The smoke path runs without Supabase reads/writes and without token transfer/signing.
- Smoke checks cover list-limit clamping, manifest normalization, `$BROKE` token normalization, treasury match detection, payout-row normalization, insert-batch composition, summary shaping, manual-send signature parsing, and partial manual-send completion status.
- The smoke response is protected by the same Admin access gate as the normal distribution endpoint.
- Updated shared Admin build marker to `v59.44.1` through `BROKE_APP_BUILD_VERSION`.

## Smoke check

After deployment, call the Admin distribution endpoint with an admin key or authenticated Telegram admin session:

```bash
curl "https://YOUR_DOMAIN/api/admin/distributions?smoke=1&key=YOUR_REWARDS_ADMIN_SECRET"
```

Expected high-level response shape:

```json
{
  "ok": true,
  "smoke": {
    "ok": true,
    "total": 13,
    "passed": 13,
    "failed": 0
  },
  "buildVersion": "v59.44.1"
}
```

If `smoke.ok` is false, do not run a real distribution until the failed check names are reviewed.

## Safety notes

- No new Supabase migration is included.
- No payout sender logic was rewritten.
- No server-side Solana transaction logic was changed.
- No eligibility formula or payout share calculation was changed.
- No public user-facing UI was changed.
- No Admin UI behavior was changed.
- The smoke endpoint is authorized and does not expose secrets.
- The smoke endpoint does not read/write Supabase and does not send/sign transactions.

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

Copy the contents of the `v59.44.1/` folder into the project root and replace files.

Do not delete any files.
