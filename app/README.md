# Smoke Is Broke — v59.44.2 Admin Distribution GET/PATCH Response Hardening

## Patch scope

v59.44.2 hardens the private Admin distribution route GET/PATCH response paths after the v59.44.1 smoke-test pass.

This is a response-hardening patch. It does not intentionally change reward payout logic, eligibility rules, payout share math, Daily Routine, Active Streak, wallet verification, Supabase schema, public UI behavior, Admin UI behavior, payout-wallet env names, server auto-send behavior, or normal successful distribution behavior.

## Changed files

- `app/api/admin/distributions/route.ts`
- `app/lib/brokeAdminRewards.ts`
- `app/lib/brokeAdminDistributionRoute.ts`
- `app/lib/brokeAdminDistributionValidation.ts`
- `app/lib/brokeAdminDistributionSmoke.ts`
- `app/lib/brokeAdminDistributionResponses.ts` — new
- Root/app docs

## What changed

- Added `app/lib/brokeAdminDistributionResponses.ts` for route response shaping and safer JSON/body handling.
- Hardened `GET /api/admin/distributions` list responses with explicit `count` and sanitized `limit`.
- Fixed invalid list limits such as `limit=abc` so they fall back to `8` instead of producing `NaN`.
- Hardened `GET /api/admin/distributions?distributionId=...`:
  - invalid UUID query values now return a clear `400 invalid_distribution_id` response instead of falling through to the list endpoint;
  - missing distributions now return `found: false`, `distribution: null`, and empty `payouts` without querying payout rows.
- Hardened JSON parsing for POST/PATCH bodies so invalid/non-object JSON returns `400 invalid_json_body` instead of a generic server error.
- Hardened PATCH handling:
  - unsupported actions now return `400 unsupported_distribution_action` with a stable error code;
  - missing distribution rows now return `404 distribution_not_found`;
  - distributions with no payout rows return `409 distribution_has_no_payout_rows` before manual/server-send updates;
  - successful PATCH responses now echo the normalized `action`.
- Added stable `code` fields to Admin distribution route error responses for easier frontend/debug handling.
- Expanded the authorized smoke report to cover invalid limit fallback, list response shape, missing distribution GET shape, and PATCH action normalization.
- Updated shared Admin build marker to `v59.44.2` through `BROKE_APP_BUILD_VERSION`.

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
    "total": 17,
    "passed": 17,
    "failed": 0
  },
  "buildVersion": "v59.44.2"
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
- The smoke endpoint remains authorized and does not expose secrets.
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

Copy the contents of the `v59.44.2/` folder into the project root and replace files.

Do not delete any files.
