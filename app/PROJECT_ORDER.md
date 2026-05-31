# Smoke Is Broke — v59.50.4 Token Danger Explanation Engine

v59.50.4 continues the automatic leak-check product direction without adding another manual loop. Universal Check now explains dangerous token leak patterns in plain language after the automatic token scan, and token-data fetch can resolve DEX Screener pair addresses/URLs into the likely token mint before reading Solana RPC concentration data.

## What changed

- Added a plain-language `What this means` decision card to Universal Check results.
- Added `Dangerous leaks explained` for automatic results, with:
  - plain signal summary,
  - why the pattern can drain a wallet,
  - what to verify next.
- Expanded Token Auto Signal Engine with more automatic token leak patterns:
  - valuation/liquidity gap,
  - fresh pair + tiny liquidity,
  - fresh pair + high/extreme concentration,
  - missing price/valuation/supply context,
  - source blind spots.
- Added DEX Screener pair-address fallback in `/api/leak-score/token-data`:
  - if a pasted address is a pair address instead of a mint, the app attempts to resolve the likely token mint from the pair.
- Added optional token-data resolution metadata:
  - `requestedAddress`,
  - `resolutionSource`,
  - `resolutionLabel`,
  - `resolutionHelper`.
- Updated shared build marker to `v59.50.4`.

## What did not change

- No rewards changes.
- No Admin distribution changes.
- No payout logic changes.
- No Daily Routine / Active Streak changes.
- No wallet verification changes.
- No Supabase schema changes.
- No transaction-history scan.
- No PnL analysis.
- No scam labels.
- No project accusations.
- No investment advice.

## Product rule

The main product direction remains:

```txt
Open app → Check → paste token / wallet / URL → get leak result
```

The wording remains safe: leak signals, research context, educational, not scam detection, not financial advice.
