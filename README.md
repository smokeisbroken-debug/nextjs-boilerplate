# $BROKE / SmokeIsBroke — v59.3.1 Wallet Snapshot Top Placement Hotfix

Patch-only update from v59.3.

## Purpose

Community feedback clarified that the Wallet Snapshot should not only be visible upfront. It should be the first Home block under the app header, because the cash-flow state is the immediate psychological hook when users open the app.

## Changes

- Moved `Wallet Snapshot for Today` to the very top of Home, directly under the app header.
- Hero / brand message now appears below the Wallet Snapshot.
- Today’s Focus stays below the hero.
- Cash-flow cards remain visible upfront:
  - Income;
  - Life Cost;
  - Money Leaks;
  - Real Balance.
- Snapshot day tabs still allow quick comparison with older wallet states.
- Profile, streak, and Wallet HP details remain inside secondary `More wallet context`.

## Backend

No API changes.
No Supabase changes.
No migrations.
No Telegram webhook changes.
No stored-data rewrite.
