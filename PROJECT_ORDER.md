# Project Order — v59.1

Current stable line before this patch: `v58.19 — First User Clarity Polish`.

## v59.1 objective

Make trigger chips stable enough for future features by storing them as structured Supabase metadata while preserving old note-tag compatibility.

## Required order

1. Backup/check Supabase project.
2. Run migration:
   `supabase/migrations/20260520_v59_1_expense_context_foundation.sql`
3. Deploy patch files:
   - `app/page.tsx`
   - `app/api/broke/route.ts`
   - docs/review files
4. Run audit:
   `supabase/review/20260520_v59_1_expense_context_audit.sql`
5. Smoke test:
   - Save leak without triggers.
   - Save leak with Stress + Late night.
   - Reopen app.
   - Confirm Chart / Leak Pattern Lab sees the trigger.

## Rollback note

If needed, revert app files to v58.19. The new Supabase columns are additive and can stay in place safely.
