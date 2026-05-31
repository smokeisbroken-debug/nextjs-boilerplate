# $BROKE / Smoke Is Broke — v59.43.1 P0 Stabilization Patch

Patch-only update on top of confirmed v59.43.

## What changed

- Fixed current ESLint `prefer-const` failures in `app/page.tsx` and `app/api/admin/distributions/route.ts`.
- Synced the private Admin distribution API build marker to `v59.43.1`.
- Updated private Admin payout readiness wording so it no longer says payouts are off while the beta payout-wallet path exists.
- Added `supabase/migrations/20260529_v59_43_1_schema_repair_pack.sql`.
- Added `supabase/review/20260529_v59_43_1_schema_repair_pack_audit.sql`.

## Migration purpose

The schema repair pack restores/creates the Supabase objects currently used by the app:

- core app tables;
- settings/app-state payload columns;
- expense Smart Leak Excess columns;
- pattern history table/columns;
- web link codes;
- wallet verification/link tables;
- reward distribution/payout ledger tables.

The SQL is idempotent. It does not create token transfers, claims, staking, or payout automation.

## Do not delete

Do not remove existing Supabase data or old migrations. Run this migration in addition to the existing project schema.
