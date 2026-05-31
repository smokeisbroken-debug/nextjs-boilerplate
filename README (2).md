# Smoke Is Broke — v59.44.3 Admin Distribution UI Safety Polish

## Patch scope

v59.44.3 adds a visible safety layer around the private Admin reward distribution UI after the v59.44.2 GET/PATCH response hardening pass.

This is a UI safety polish patch. It does not intentionally change reward payout logic, eligibility rules, payout share math, Daily Routine, Active Streak, wallet verification, Supabase schema, public user UI, payout-wallet env names, server auto-send behavior, or Admin distribution API behavior.

## Changed files

- `app/page.tsx`
- `app/globals.css`
- `app/lib/brokeAdminRewards.ts`
- Root/app docs

## What changed

- Updated shared Admin build marker to `v59.44.3` through `BROKE_APP_BUILD_VERSION`.
- Added a private Admin UI smoke-check panel before the `Distribute rewards` action.
- Added `Run smoke-check` / `Re-check` button in the Admin distribution UI.
- The smoke button calls the existing protected endpoint:

```txt
GET /api/admin/distributions?smoke=1
```

- The smoke check uses the Admin key as a Bearer token and performs no Supabase writes and no token signing/sending.
- Added a safety summary before distribution showing:
  - smoke-check status;
  - loaded recipient count;
  - reward pool amount;
  - calculated payout total;
  - minimum hold / minimum streak rules;
  - payout mode.
- The `Distribute rewards` button now remains locked until:
  - Admin key is entered;
  - smoke-check has passed;
  - eligible holder preview is loaded;
  - reward amount is valid;
  - payout rows exist.
- Added a visible locked reason so the admin can see exactly why distribution is blocked.
- Changing the Admin key resets the smoke-check status, so a new key must pass smoke-check again.
- Added mobile-safe styling for the new safety panel.

## Smoke check

After deployment, the Admin UI can run smoke-check directly from the panel.

CLI check still works:

```bash
curl "https://YOUR_DOMAIN/api/admin/distributions?smoke=1&key=YOUR_REWARDS_ADMIN_SECRET"
```

Expected high-level response shape remains:

```json
{
  "ok": true,
  "smoke": {
    "ok": true,
    "total": 17,
    "passed": 17,
    "failed": 0
  },
  "buildVersion": "v59.44.3"
}
```

If `smoke.ok` is false, do not run a real distribution until the failed check names are reviewed.

## Safety notes

- No new Supabase migration is included.
- No payout sender logic was rewritten.
- No server-side Solana transaction logic was changed.
- No eligibility formula or payout share calculation was changed.
- No public user-facing UI was changed.
- The new smoke-check UI is inside the private Admin panel only.
- The smoke endpoint remains authorized and does not expose secrets.
- The smoke endpoint does not read/write Supabase and does not send/sign transactions.

## Verification

Run after installing:

```bash
npm run typecheck
npm run lint:quiet
```

`NEXT_TELEMETRY_DISABLED=1 npm run build` may still time out in restricted sandboxes because the app still has a large monolithic `app/page.tsx`. This patch does not address that existing build-time pressure.

Targeted checks for the patch:

- changed TypeScript files should pass typecheck;
- changed files should pass lint;
- no BigInt literal suffixes should appear in changed TypeScript files;
- patch zip integrity should pass.

## Install

Copy the contents of the `v59.44.3/` folder into the project root and replace files.

Do not delete any files.
