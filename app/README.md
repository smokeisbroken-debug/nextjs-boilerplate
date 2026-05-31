# Smoke Is Broke — v59.46.1 Token Data Safety Layer + Better Source Status

v59.46.1 hardens the first automatic BROKE Leak Research data layer. The token fetch remains read-only, local-to-the-session, and non-accusatory, but now the UI is clearer about source quality and incomplete data.

## What changed

- Added source-health status to basic token data: `complete`, `partial`, or `limited`.
- Added source health label/helper text to the token-data API response.
- Added fetched-at display inside the Leak Research token data panel.
- Added a 12-second UI cooldown guard to reduce fast repeated requests and source rate-limit noise.
- Added clearer warnings that fetched liquidity, volume, and concentration are point-in-time research snapshots.
- If automatic sources are limited, auto-data hints are not generated/applied.
- Share card compact auto-data row now includes the source-health label.
- Updated holder-count wording for v59.46.1 while keeping `Indexer needed` for reliable total holder counts.
- Updated shared build marker to `v59.46.1`.

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

## Testing notes

1. Open Pro Mode → Leak.
2. Paste a valid Solana mint and click `Fetch data`.
3. Confirm the panel shows source health and fetched-at status.
4. Click fetch again immediately and confirm the cooldown message appears.
5. Confirm warnings say data is a point-in-time research snapshot.
6. Confirm `Apply hints` is disabled or unavailable when source health is limited.
7. Confirm share card still exports/sends and includes compact auto-data source health.
