# v59.53.6 — Mascot UI Polish / QA

Small polish pass for the Mascot Progression layer after v59.53.5 was confirmed working.

## Added

- Compact mascot progress summary chips:
  - unlocked badges
  - completed boost plan actions
  - power left to next stage / max stage
- Asset fallback handler for mascot stage and badge images.
- Lazy/async image hints for mascot detail assets.
- Very narrow mobile layout hardening for Mascot Progression and share proof card.
- Drag-selection prevention for mascot images.
- Build version note updated to `v59.53.6`.

## Not changed

- No game mode.
- No rewards/admin payout logic.
- No wallet verification logic.
- No Supabase schema changes.
- No Universal Check scoring changes.
- No Daily Routine formula changes.
- No transaction history, PnL, or scam label changes.

## QA focus

- Rewards → Mascot Progression layout on mobile.
- Profile → Mascot status snapshot.
- Missing/corrupt mascot asset fallback.
- Mascot share proof card on narrow screens.
- Share mascot / Copy text / Share image actions.
