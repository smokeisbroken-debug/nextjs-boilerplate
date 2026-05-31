# Smoke Is Broke — v59.48.1 Wallet Data Safety + Source Status

v59.48.1 hardens the first Basic Wallet Data layer inside Wallet Leak Score. It keeps the wallet feature read-only and local-first while making source status, cache behavior, and safety limitations clearer.

## Changes

- Added a 5-minute local browser cache for basic wallet data under `broke-wallet-leak-data-cache-v1`.
- Added same-wallet cache reuse before making another public Solana RPC request.
- Added `Force refresh` to bypass fresh cache and request a live public RPC snapshot.
- Added `Clear cache` to remove local wallet-data cache without clearing the manual wallet behavior draft.
- Added visible wallet-data cache count in the Wallet Leak Score UI.
- Added a clearer confidence panel: `Good context`, `Partial context`, `Limited context`, or `No context`.
- Expanded source details for SOL balance, SPL token accounts, visible token exposure, `$BROKE` visibility, and known limitations.
- Added stronger wording that wallet data is not behavior proof, not trade history, not PnL, not surveillance, and not financial advice.
- Updated shared build marker to `v59.48.1`.

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
