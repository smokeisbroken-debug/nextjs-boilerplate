# Testing — v59.1 Expense Context Foundation

## Local checks

Passed before packaging:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Supabase checks

Run after migration:

```sql
-- file: supabase/review/20260520_v59_1_expense_context_audit.sql
```

Expected:

- `trigger_tags` exists on `broke_expenses`.
- `context_version` exists on `broke_expenses`.
- `broke_expenses_trigger_tags_allowed` exists.
- `broke_expenses_trigger_tags_gin_idx` exists.
- Old hashtag notes are backfilled into `trigger_tags` when possible.

## App smoke test

1. Open app.
2. Go to Track Leak.
3. Add amount/category.
4. Select `Stress` and `Late night` trigger chips.
5. Save.
6. Reopen app.
7. Open Chart / Leak Pattern Lab.
8. Confirm the new leak still appears and pattern context is read.

## Compatibility test

Save should still work if the migration has not been run yet, but structured trigger storage will not persist until the migration exists.
