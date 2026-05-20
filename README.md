# $BROKE / SmokeIsBroke — v59.1 Expense Context Foundation

This patch moves Track Leak trigger chips toward a stable data foundation.

## What changed

- Expenses now support structured `triggerTags` in the client.
- `/api/broke` now reads/writes `trigger_tags` on `broke_expenses`.
- Leak Pattern Lab reads structured trigger tags first and still supports old note hashtags.
- Old note hashtags remain as a fallback for backwards compatibility.
- Supabase migration adds:
  - `broke_expenses.trigger_tags text[] not null default '{}'`
  - `broke_expenses.context_version integer not null default 1`
  - allowed trigger constraint
  - GIN index for trigger lookups
  - backfill from old note hashtags

## Stable fallback

The API is defensive. If the `trigger_tags` column is missing, expense saves fall back to the old note-based behavior instead of crashing.

Run the migration to enable structured trigger storage.

## Deployment order

1. Run `supabase/migrations/20260520_v59_1_expense_context_foundation.sql` in Supabase SQL Editor.
2. Replace the files from this patch.
3. Deploy to Vercel.
4. Run `supabase/review/20260520_v59_1_expense_context_audit.sql` to confirm the column/index/backfill.
5. Track a new leak with trigger chips and confirm Chart / Leak Pattern Lab still works.

## Not changed

- No auth model change.
- No webhook change.
- No RLS rollback.
- No stored amount rewrite.
- No destructive migration.
