# Smoke Is Broke — v59.48.2 Wallet Data Cache Polish + Error States

v59.48.2 polishes the Basic Wallet Data layer inside Wallet Leak Score. It keeps the wallet feature read-only and local-first while making cache status, empty states, error recovery, and source limitations clearer.

## Changes

- Added a visible cache-status panel for the current wallet address: fresh cache available, expired cache, no cache for this wallet, or empty cache.
- Added clearer empty-state guidance before wallet data is loaded.
- Added structured wallet-data error states with a label, helper text, and recovery action.
- Cooldown errors now explain why the app asks the user to wait before re-fetching public RPC context.
- Clear cache now leaves the current loaded data visible but marks it as a local snapshot whose cache was cleared.
- Kept the 5-minute local browser cache under `broke-wallet-leak-data-cache-v1`.
- Kept `Fetch wallet data`, `Force refresh`, `Clear data`, and `Clear cache` controls.
- Updated the shared build marker to `v59.48.2`.

## Unchanged

- No transaction-history scan.
- No PnL or buy/sell timing analysis.
- No wallet accusations or public wallet database.
- No Supabase persistence.
- No investment advice.
- No payout logic changes.
- No reward eligibility formula changes.
- No Daily Routine / Active Streak changes.
- No wallet verification changes.
- No Admin distribution API changes.
- No payout-wallet env changes.
- No server auto-send changes.

## Verification

- `npm run typecheck`
- `npm run lint:quiet`
- `NEXT_TELEMETRY_DISABLED=1 npm run build`
- targeted brace / paren balance
- targeted BigInt suffix scan
- zip integrity test
