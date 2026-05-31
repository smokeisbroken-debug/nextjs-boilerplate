# Smoke Is Broke — v59.46.0 Basic Token Data Fetch

v59.46.0 adds the first read-only automatic data layer to BROKE Leak Research. A user can paste a Solana mint address and fetch basic project context without creating a public project database or labeling anything as a scam.

## What changed

- Added `app/api/leak-score/token-data/route.ts` as a no-store read-only token data endpoint.
- Added `app/lib/brokeLeakScoreTokenData.ts` for shared token data types, formatting helpers, and route constants.
- Leak Research now has a `Basic token data` panel under the contract / mint field.
- The panel fetches DEX Screener pair context: liquidity, 24h volume, market cap, FDV, pair age, DEX, and token name/symbol when available.
- The panel fetches Solana RPC token supply and largest-token-account data, then estimates top-10 account concentration.
- Holder count is intentionally shown as `Indexer needed` because reliable total holders are not available from public Solana RPC alone.
- Added safe data hints that can be applied manually to selected leak signals. They are not automatic verdicts.
- Share card can show attached auto-data summary for liquidity and top-10 account concentration.
- Updated shared build marker to `v59.46.0`.

## Safety / non-goals

- No Supabase persistence.
- No public project database.
- No automated scam detection.
- No project accusation labels.
- No investment advice.
- No payout logic, reward eligibility, Daily Routine, Active Streak, wallet verification, Admin distribution API, payout wallet, or server auto-send changes.

## Data sources

- DEX Screener public token-pairs endpoint for visible DEX pair data.
- Solana JSON-RPC for token supply and largest token accounts.
- Optional env override: `LEAK_SCORE_SOLANA_RPC_URL`; fallback: `SOLANA_RPC_URL`; final fallback: public Solana mainnet RPC.
