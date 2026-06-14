# Supabase migrations pending manual review

This directory contains SQL files that are prepared for manual review and copy/apply.

They are intentionally **not** in `supabase/migrations/` so CI or Supabase tooling will not auto-run them.

For v59.60.2, review:

- `v59_60_2_community_boss_schema_review_required.sql`
- `docs/v59-60-2-community-boss-migration-review-apply-prep.md`

Do not apply Community Boss schema until the guardrails are accepted:

- no wallet value
- no real balances
- no income/debt
- no payout math
- no reward promises
- no PvP/multiplayer


For v59.60.4, review and optionally copy/apply manually after schema exists:

- `v59_60_4_seed_current_community_boss_week_manual.sql`

This seed snippet only creates/updates the current weekly boss metadata and a zero aggregate row. It does not insert user proof rows and does not include wallet value, payout math, or private financial data.
