# Smoke Is Broke — v59.46.4 Token Data UI Polish + Safer Apply Hints

v59.46.4 polishes the Basic Token Data UI in BROKE Leak Research and makes automatic data hints safer to apply. Auto data remains a read-only research snapshot, not a verdict, scam label, or investment recommendation.

## Changes

- Improved Basic Token Data readability with clearer metric cards for liquidity, 24h volume, market cap, FDV, pair age, top-10 token-account concentration, token supply, and holder-count limitations.
- Added stronger visible warning: auto data is not a verdict and does not label projects.
- Made `Apply hints` a two-step review flow: first tap opens the exact signals/notes that will be added, second tap confirms.
- Shows whether each suggested signal is new or already selected before applying.
- Keeps source-health, fetched-at display, 12-second fetch cooldown, 10-minute same-mint cache, force refresh, and clear cache controls.
- Updated shared build marker to `v59.46.4`.

## No changes

- No Supabase persistence.
- No public project database.
- No automated scam detection.
- No project accusation labels.
- No investment advice.
- No payout logic changes.
- No reward eligibility formula changes.
- No Daily Routine or Active Streak changes.
- No wallet verification changes.
- No Admin distribution API changes.
- No payout-wallet env changes.
- No server auto-send changes.

## Verification

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- `next build` was not fully confirmed in sandbox because the large monolithic `app/page.tsx` continues to time out during Next.js build finalization after TypeScript succeeds.
