# $BROKE Life Tracker — v59.28 Daily Routine Streak Lock + Site Embed Fit

Patch-only update on top of v59.27.

## What changed

- Active Streak proof is now locked to **Daily Routine completion only**.
- Rewards no longer presents separate streak-proof tasks such as Track Leak, Clean Day, One Fix, or Daily Challenge.
- Track Leak, Clean Day, One Fix, and Daily Challenge can still exist as app tools, but they no longer activate/protect Active Streak directly.
- Daily Routine remains a 7-action path.
- The final Daily Routine action is now **Share on X**.
- Copy text, Telegram share, native share, image download, and other share helpers no longer complete the final Daily Routine proof action.
- Rewards buttons now point users back to Daily Routine instead of creating separate proof actions inside Rewards.
- Active Streak copy, Rewards guide copy, Chart timeline text, notifications, and share-card text now describe Daily Routine as the only streak proof source.
- Added an embedded-site display guard that detects iframe/site embedding and constrains the app to a centered phone-style width so the Mini App does not stretch or render crooked on the external site.

## What did not change

- No Creator Fee distribution.
- No payouts.
- No claims.
- No staking.
- No token transfers.
- No treasury wallet logic.
- No reward claim window.
- No wallet verification backend flow changes.
- No holder threshold changes.
- No balance formula changes.
- No avatar backend changes.
- No Telegram webhook changes.
- No Supabase migration required.
- No reward snapshot ledger schema changes.

## Product rule after this patch

Active Streak is protected only when the user finishes the full Daily Routine.

The 7th Daily Routine action must be completed through a **Share on X** button.

Other app actions may still help the user build discipline, but they do not directly count as Active Streak proof.
