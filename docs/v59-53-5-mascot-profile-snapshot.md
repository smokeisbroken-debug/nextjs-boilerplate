# v59.53.5 — Mascot Profile Snapshot

## Purpose

Add a compact Mascot status snapshot inside Profile so users can see their mascot stage without opening Rewards first.

## Added

- Profile Mascot status card.
- Current mascot stage image.
- Stage number.
- Mascot level and power.
- Badge progress.
- Power-to-next-stage hint.
- `Open Mascot` button that jumps to Rewards/Mascot Progression.

## Data source

The snapshot uses the same existing Mascot Progression calculation:

- Wallet HP
- Active Streak
- Daily Routine status
- tracking history
- earned badges

No new Supabase table or schema change is required.

## Not changed

- rewards/admin payout
- wallet verification
- Supabase schema
- Universal Check scoring
- Daily Routine formula
- transaction history / PnL / scam labels
- game mode
