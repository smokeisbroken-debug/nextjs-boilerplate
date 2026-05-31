# $BROKE / Smoke Is Broke — v59.43.2 Admin / Rewards Extraction Prep

Patch-only update on top of confirmed v59.43.1.

## What changed

- Added `app/lib/brokeAdminRewards.ts` as the first shared Admin/Rewards extraction point.
- Moved shared build/version constants into that module.
- Moved shared default treasury wallet, `$BROKE` mint, USDC mint, and reward-confirm phrases into that module.
- Reused the shared constants in `app/page.tsx` and `app/api/admin/distributions/route.ts`.
- Updated private Admin build marker/API build version to `v59.43.2`.

## Behavior

No payout logic, reward eligibility formula, Daily Routine, Active Streak, wallet verification, Supabase schema, or public user UI behavior was intentionally changed.

This is a prep patch for future refactoring: it creates a small shared module before larger Admin/Rewards code is extracted from the monolithic `app/page.tsx`.

## Do not delete

Do not remove the v59.43.1 Supabase schema repair migration or older migrations. This patch does not add a new migration.
