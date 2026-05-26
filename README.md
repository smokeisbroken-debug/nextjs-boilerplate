# $BROKE Life Tracker — v59.25.3 Daily Routine Streak Proof Hotfix

Patch-only update on top of v59.25.2.

## What changed

- Daily Routine completion now protects the BROKE Active Streak directly.
- Finishing the 7/7 Daily Routine tasks logs a new `daily_routine` Active Streak proof action.
- Daily Routine no longer depends on the old daily XP claim flow for streak protection.
- Removed visible XP reward wording from the Daily Routine card.
- Updated Daily Routine copy so users understand the goal is now streak protection, not XP claiming.
- Server-side Active Streak proof normalization now accepts the new `daily_routine` action, so cloud sync does not drop routine proof logs.

## Not changed

- No Creator Fee distribution.
- No payouts, reward epochs, staking, claims, or token transfers.
- No Supabase migration.
- No wallet backend changes.
- No holder threshold enforcement.
- No balance formula changes.
- No avatar backend changes.
- No Telegram webhook changes.
- No share-card export changes.
- No broader Rewards rule changes.
