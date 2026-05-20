# $BROKE / SmokeIsBroke — v59.3 Wallet Snapshot Visibility

Patch-only update from v59.2.

## Purpose

Community feedback said the Home tab felt less alive when cash-flow numbers were hidden behind a collapsed Wallet Snapshot. This patch restores upfront money-state visibility while keeping the cleaner Home hierarchy.

## Changes

- Wallet Snapshot is visible directly on Home again.
- Added a clear heading: `Wallet Snapshot for Today`.
- Added scrollable day snapshot tabs for the current 7-day chart range.
- Daily snapshot cards show:
  - state after day;
  - tracked amount;
  - leak pressure;
  - pressure status.
- Monthly cash-flow cards stay visible upfront:
  - Income;
  - Life Cost;
  - Money Leaks;
  - Real Balance.
- Profile, streak, and Wallet HP details moved into a small secondary collapsible block.

## Backend

No API changes.
No Supabase changes.
No migrations.
No Telegram webhook changes.
No stored-data rewrite.
