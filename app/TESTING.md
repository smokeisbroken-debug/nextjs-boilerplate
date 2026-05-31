# Smoke Is Broke — v59.46.7 Token Data Source Details + Confidence UI

v59.46.7 improves the Basic Token Data research layer inside BROKE Leak Research. The app now explains source coverage more clearly, shows a confidence status for the fetched context, separates DEX/Solana RPC/cache/indexer limitations, and keeps the "auto data is not a verdict" positioning visible.

## Changes

- Added Token Data confidence status: `Good context`, `Partial context`, or `Limited context`.
- Added Source details panel for DEX Screener, Solana RPC, visible DEX pair context, top-account concentration, and holder/indexer limitations.
- Added clearer freshness/source row: live snapshot, cached snapshot, or source snapshot.
- Added clearer source warnings for missing DEX pair context and unavailable top-10 account concentration.
- Updated Leak Score share card compact auto-data row to include the confidence label and live/cache context.
- Updated shared build marker to `v59.46.7`.

## Unchanged

- No new token-data source was added.
- No Supabase persistence.
- No public project database.
- No automated scam detection.
- No project accusation labels.
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
