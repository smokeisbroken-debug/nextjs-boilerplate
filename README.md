# $BROKE / SmokeIsBroke — v59.3.2 Wallet Snapshot Order Hotfix

Patch-only update from v59.3.1.

## Purpose

The Home block order needed one more adjustment: the core cash-flow numbers should appear first inside the Wallet Snapshot block. The daily snapshot/tabs should sit below them as supporting history/context.

## Changes

- Kept `Wallet Snapshot for Today` as the first Home block under the app header.
- Moved the main cash-flow cards directly under the Wallet Snapshot heading:
  - Income;
  - Life Cost;
  - Money Leaks;
  - Real Balance.
- Moved the daily Wallet Snapshot tabs and selected-day card below the cash-flow cards.
- Kept secondary context in `More wallet context`:
  - Life Profile;
  - Streak;
  - Wallet HP details.

## Backend

No API changes.
No Supabase changes.
No migrations.
No Telegram webhook changes.
No stored-data rewrite.
