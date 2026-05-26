# $BROKE Life Tracker — v59.25.2 Formula & Rewards Consistency Audit

Patch-only update on top of v59.25.1.

## What changed

- Added a shared client-side wallet summary helper so Home, Wallet HP, Smart Insights, and other visible wallet figures use the same monthly totals.
- Fixed weekly/day Wallet Snapshot chart balances so the selected day's `State after day` starts from the same month balance baseline as Home `Real Balance` instead of ignoring earlier current-month expenses.
- Aligned server-side badge/leaderboard wallet formulas with the app UI:
  - Weekly income is multiplied by `4.35`.
  - Daily income is multiplied by `30`.
  - Rent is counted only when `hasRent` is enabled.
  - Data and education fixed costs are included.
  - Maybe leaks count as `50%` pressure, Not needed counts as `100%`, Needed counts as `0%`.
- Tightened Rewards holder readiness logic so `Ready` requires verified wallet + 100K+ verified $BROKE + live 7+ Active Streak.
- Active Streak share card and share text no longer treat watch-only balances as verified holder tier proof.
- Updated remaining visible old `Save` references in the button guide/routine copy to `Rewards` where the old Save tab has become the Rewards hub.

## Not changed

- No Creator Fee distribution.
- No payouts, reward epochs, staking, claims, or token transfers.
- No Supabase migration.
- No wallet verification backend flow changes.
- No holder threshold enforcement on-chain.
- No avatar backend changes.
- No Telegram webhook changes.
- No share-card export changes.
