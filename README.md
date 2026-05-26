# $BROKE Life Tracker — v59.26 Chart Proof Timeline + Full App Consistency Polish

Patch-only update on top of v59.25.3.

## What changed

- Added **Active Streak Timeline** to Chart.
- Chart now shows the last 7 proof days, protected/missed days, recovery days, and the action that protected each day.
- Added clearer Chart wording for why a streak is protected, needs proof, is in recovery, or has no active proof yet.
- Updated the detailed `?` guide so Chart explains the new proof timeline and tells users to use Rewards for today’s proof action.
- Audited visible old Save wording and aligned remaining user-facing copy with the current **Rewards** tab.
- Kept Rewards as the action hub and Chart as the proof/history view.

## Product logic

- Rewards = protect today and complete proof actions.
- Chart = inspect proof history, leaks, candles, and patterns.
- Daily Routine still protects Active Streak only after the full 7/7 routine is completed.
- Active Streak is still live/rolling, not a one-time unlock.
- Recovery still requires two proof actions during the recovery day.

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
