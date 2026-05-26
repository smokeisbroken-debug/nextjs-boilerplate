# Project Order — v59.22 Rewards Hub Foundation

## Current patch

v59.22 turns the old Save tab into the future-facing Rewards Hub while keeping the app stable and avoiding payout logic.

## Files changed

- `app/page.tsx`
- `app/globals.css`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Product order

1. Preserve the existing six bottom-nav layout.
2. Rename the old Save nav item to Rewards.
3. Keep existing Save mechanics inside Rewards instead of deleting or rewriting them.
4. Put Active Streak and recovery status at the top of Rewards.
5. Add future Holder Rewards readiness logic as UI/status only.
6. Keep Creator Fee Reward Pool locked/teaser-only until reward epochs and payout safety exist.
7. Keep all private financial details out of public reward/share wording.

## Not included

- No Creator Fee distribution.
- No on-chain payouts.
- No staking.
- No claims.
- No token transfers.
- No reward epoch backend.
- No Supabase migration.
- No wallet verification backend change.
- No balance formula change.
- No holder threshold change.
- No avatar backend change.
- No Telegram webhook change.
