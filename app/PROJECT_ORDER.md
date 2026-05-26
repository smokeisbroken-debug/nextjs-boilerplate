# Project Order — v59.23 — Rewards Proof Polish + Shareable Active Streak Card

## Current patch

Rewards becomes easier to understand and easier to share. The tab now starts with a status-oriented command center, a daily proof checklist, future Holder Rewards explanation, and a new public Active Streak proof card.

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

1. Home remains focused on Wallet Snapshot and overview.
2. Rewards owns Active Streak, Recovery Mode, proof actions, future Holder Rewards readiness, and shareable proof.
3. Profile remains the place for identity, wallet proof, holder tier, Share Studio, and settings.
4. Active Streak is rolling: 7+ days means eligible foundation, below 7 days pauses eligibility.
5. Recovery can restore a missed day only when the user completes the required proof actions within the recovery day.
6. Future Creator Fee Reward Pool remains locked and informational only.

## Not in this patch

- No Creator Fee distribution.
- No claims, staking, payouts, token transfers, or reward epochs.
- No new database tables or Supabase migration.
- No wallet verification backend changes.

---

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
