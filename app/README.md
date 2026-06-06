# Smoke Is Broke — v59.51.3 Small Amount Tracking Minimum

v59.51.3 is a focused hotfix on top of v59.51.2. It lowers the tracked leak minimum from the practical old 1-unit behavior to 0.01 so users in cheaper countries can record small real expenses without rounding the analysis to zero or forcing a larger fake amount.

## Changes

- Track Leak amount input now uses a 0.01 minimum and 0.01 step.
- Corrected leak editing now accepts values from 0.01 and rejects only values below 0.01.
- Added a visible Track Leak helper showing the minimum tracked amount.
- Money formatting now preserves cents for fractional records, so 0.01 displays as 0.01 instead of being rounded to 0.
- Onboarding starter leak amount no longer clamps to 1; it respects the 0.01 minimum.

## Not changed

No rewards, Admin payout logic, wallet verification, Supabase schema, transaction history, PnL, scam labels, investment advice, bottom-nav, or new screens were changed.
