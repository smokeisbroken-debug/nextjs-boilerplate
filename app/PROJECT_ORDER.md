# Project Order — v59.22.1 — Rewards UI Placement Hotfix

## Current patch

Keep Rewards as the dedicated hub, but remove duplicate Active Streak weight from Home. Home should stay short and focused. Rewards should own the full streak/recovery/proof flow.

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

1. Home shows wallet status and Wallet Snapshot.
2. Rewards owns BROKE Active Streak, recovery, proof actions, and future reward readiness.
3. Bottom nav remains six items: Home, Add, Chart, Growth, Rewards, Profile.
4. Rewards tool sections use clean horizontal `Open` / `Close` buttons.
5. No backend, payout, wallet, token, or database behavior changes.

---

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
