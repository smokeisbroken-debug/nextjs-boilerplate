# $BROKE / Smoke Is Broke — v59.43.3 Admin Distribution Helper Extraction

Patch-only update on top of confirmed v59.43.2.

## What changed

- Expanded `app/lib/brokeAdminRewards.ts` from constants-only into the first shared Admin distribution helper module.
- Moved pure payout/manifest helpers out of the private Admin UI path:
  - `calculateAdminPayoutRows()`
  - `getAdminRewardTokenMint()`
  - `buildAdminPayoutPaymentLink()`
  - `buildAdminPayoutPaymentLinksCsv()`
  - `buildAdminDistributionManifest()`
  - `buildAdminDistributionSendSheet()`
- Reused the shared helper module in `app/page.tsx` for payout row calculation, payment links, CSV copy, manifest building, and manual send sheet generation.
- Reused `parseAdminCsv()` in `app/api/admin/distributions/route.ts` to remove one duplicated parser.
- Updated private Admin build marker/API build version to `v59.43.3`.

## Behavior

No payout logic, reward eligibility formula, Daily Routine, Active Streak, wallet verification, Supabase schema, public UI behavior, server auto-send flow, or distribution API behavior was intentionally changed.

This is still a stabilization/refactor prep patch. It reduces duplicated logic and makes the next Admin extraction step safer without changing what the user sees or how rewards are distributed.

## Do not delete

Do not remove the v59.43.1 Supabase schema repair migration or older migrations. This patch does not add a new migration.
