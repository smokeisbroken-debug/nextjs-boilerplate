# Smoke Is Broke — v59.43.4 Admin Wallet Transaction Helper Extraction

Patch-only release on top of v59.43.3.

## Summary

v59.43.4 continues the Admin/Rewards extraction work by moving the private Admin browser-wallet transaction helper logic out of `app/page.tsx` into `app/lib/brokeAdminWalletTransactions.ts`.

The patch is refactor-only. It does not intentionally change payout logic, reward eligibility, Daily Routine, Active Streak, wallet verification, Supabase schema, public UI behavior, server auto-send flow, or distribution API behavior.

## Changed

- Added `app/lib/brokeAdminWalletTransactions.ts`.
- Moved Admin Wallet Standard signer helpers from `app/page.tsx` into the shared browser-wallet transaction module.
- Moved Solana base58, RPC, transaction serialization, SOL transfer, SPL transfer-checked, batch chunking, and sign/send fallback helpers into the transaction module.
- Added `buildAdminBatchTransactions()` to keep batch construction outside the Admin UI component.
- Updated Admin build marker to `v59.43.4` through the shared `BROKE_APP_BUILD_VERSION` constant.
- Kept `app/page.tsx` focused on UI flow: get signer, build transactions, sign/send, record tx signatures.

## Not changed

- No reward eligibility formula change.
- No payout share math change.
- No Daily Routine or Active Streak change.
- No wallet verification backend change.
- No Supabase migration.
- No public user UI behavior change.
- No server-side payout wallet behavior change.
- No distribution API behavior change.

## Verification

- `npm ci` passed.
- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully and finished TypeScript, then timed out during `Collecting page data using 26 workers` in the sandbox. Full build completion was not confirmed here.
- Raw brace/paren balance passed for changed TS files.
- Targeted scan found no BigInt literal suffixes in changed TS files.
