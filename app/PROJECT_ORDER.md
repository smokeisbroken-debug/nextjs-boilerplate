# Smoke Is Broke — v59.43.6 Admin Server Payout Helper Extraction

Patch-only release on top of v59.43.5.

## Summary

v59.43.6 continues the Admin/Rewards extraction work by moving the dedicated server payout-wallet transaction sender out of `app/api/admin/distributions/route.ts` into `app/lib/brokeAdminServerPayout.ts`.

The patch is refactor-only. It does not intentionally change payout logic, reward eligibility, Daily Routine, Active Streak, wallet verification, Supabase schema, public UI behavior, server auto-send behavior, or Admin UI behavior.

## Changed

- Added `app/lib/brokeAdminServerPayout.ts`.
- Moved private server payout-wallet helpers into the helper module:
  - strict Solana RPC candidate selection;
  - server base58 encode/decode;
  - Solana public-key validation;
  - token mint selection for `$BROKE` and USDC;
  - legacy transaction message serialization;
  - SOL transfer instruction building;
  - SPL token transfer-checked instruction building;
  - token account lookup;
  - mint decimal lookup;
  - payout wallet secret parsing;
  - Ed25519 transaction signing;
  - `sendTransaction` RPC call;
  - payout chunking;
  - `serverAutoSendPreparedDistribution()`.
- Reduced `app/api/admin/distributions/route.ts` by keeping Supabase persistence and route handling there while delegating the payout transaction sender to the new helper.
- Updated shared Admin build marker to `v59.43.6` through `BROKE_APP_BUILD_VERSION`.

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
- `NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully and finished TypeScript, then the sandbox command timed out during `Collecting page data using 26 workers` / worker SIGTERM, consistent with the existing large `page.tsx` build-time issue.
- Targeted scan found no BigInt literal suffixes in changed TS files.
- Zip integrity test passed.
