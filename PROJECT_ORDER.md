# Smoke Is Broke — v59.51.3 Small Amount Tracking Minimum

## Base

Built on the confirmed working v59.51.2 stable8 clean/full base.

## Scope

Lower the practical minimum tracked leak amount to 0.01 and preserve fractional display for very small expenses.

## Implementation

- Added `MIN_TRACKED_MONEY_AMOUNT = 0.01`.
- Added tracked-money normalization/validation helpers.
- Updated Track Leak amount input min and placeholder.
- Updated edit amount validation to accept 0.01+.
- Updated money formatting so cents are visible for fractional values.
- Updated onboarding starter expense clamp from 1 to 0.01.

## Exclusions

No database migration, no reward/admin changes, no wallet verification changes, no PnL/history/indexer logic, no scam labels, and no investment advice changes.
