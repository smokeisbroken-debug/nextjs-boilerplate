# Smoke Is Broke — v59.46.2 Token Data Cache + Same-Mint Reuse

v59.46.2 adds a short local cache for the first automatic BROKE Leak Research token-data layer. The token fetch remains read-only, local-to-the-session, and non-accusatory, but repeated checks for the same mint can now reuse fresh local data instead of hitting DEX/RPC sources again.

## What changed

- Added a local token-data cache under `broke-leak-score-token-data-cache-v1`.
- Added 10-minute same-mint cache reuse for Solana token data.
- Cached entries are capped at 12 recent token-data snapshots and expired entries are cleaned locally.
- `Fetch data` now reuses fresh same-mint cache before making another DEX Screener / Solana RPC request.
- UI shows whether token data came from a live fetch or local cache.
- UI explains that local cache reduces repeated source requests and rate-limit noise.
- Source-health status, fetched-at display, cooldown guard, and partial/limited-data safety wording remain in place.
- Holder count remains `Indexer needed` for reliable total holder counts.
- Updated shared build marker to `v59.46.2`.

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
- Same-mint reuse is browser localStorage only; it is not shared across users or devices.

## Testing notes

1. Open Pro Mode → Leak.
2. Paste a valid Solana mint and click `Fetch data`.
3. Confirm live source data appears and the UI says it was cached locally.
4. Click `Fetch data` again for the same mint within 10 minutes.
5. Confirm the UI reuses local cache and does not show a new source request error.
6. Change the mint address and confirm the old token data clears.
7. Paste the first mint again and confirm fresh local cache is available/reused.
8. Confirm source health, fetched-at status, warnings, share card, and `Send to TG bot` still work.
