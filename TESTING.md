# Testing — v59.2 Pattern History Foundation

## Local verification

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Supabase verification

After running the migration, run:

```txt
supabase/review/20260520_v59_2_pattern_history_audit.sql
```

Expected:

- table exists = true;
- required columns exist;
- rowsecurity = true;
- anon/authenticated do not have direct table grants;
- service_role has table privileges.

## App smoke test

1. Open the Mini App.
2. Track one or more leaks with trigger chips.
3. Open Chart.
4. Open Leak Pattern Lab.
5. Confirm Pattern memory shows either:
   - saved weekly reads, or
   - a warming-up empty state.
6. Refresh/reopen the app and confirm saved reads can load after cloud sync.

## Failure behavior

If the Supabase table was not migrated yet, the app should still work. Pattern history will stay empty until the migration is applied.
