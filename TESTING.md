# Smoke Is Broke — v59.47.0 Token Data Source Details + Confidence UI

v59.47.0 improves the Basic Token Data research layer inside BROKE Leak Research. The app now explains source coverage more clearly, shows a confidence status for the fetched context, separates DEX/Solana RPC/cache/indexer limitations, and keeps the "auto data is not a verdict" positioning visible.

## Changes

- Added Token Data confidence status: `Good context`, `Partial context`, or `Limited context`.
- Added Source details panel for DEX Screener, Solana RPC, visible DEX pair context, top-account concentration, and holder/indexer limitations.
- Added clearer freshness/source row: live snapshot, cached snapshot, or source snapshot.
- Added clearer source warnings for missing DEX pair context and unavailable top-10 account concentration.
- Updated Leak Score share card compact auto-data row to include the confidence label and live/cache context.
- Updated shared build marker to `v59.47.0`.

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


## v59.47.0 — Wallet Leak Score Foundation

- Added a Pro-mode Wallet Leak Score screen as a manual/local wallet-behavior self-check.
- Added wallet behavior signals for FOMO entries, buying after green candles, influencer chasing, too many hype tokens, no research before buy, no position-size rules, panic selling, holding dead projects, revenge trading, and no exit plan.
- Added local wallet draft storage under `broke-wallet-leak-score-local-draft-v1`, local notes, auto review readiness, manual score tiers, copy/share text, and Help Guide coverage.
- Kept the feature educational: no wallet API, no on-chain wallet scan, no Supabase persistence, no public wallet database, no wallet accusations, and no financial advice.
- No payout logic, reward eligibility formula, Daily Routine, Active Streak, wallet verification, Admin distribution API behavior, payout-wallet env names, or server auto-send behavior changed.
