# $BROKE / SmokeIsBroke Project Order

## Current checkpoint

- Version: v56.2
- Base: confirmed working v56.1 cleanup
- Goal: stability before new features

## Rules

1. Keep `app/page.tsx` as the current main UI file until a planned refactor is done.
2. Do not add large new mechanics before the current sync/settings layer is stable.
3. Before deploy, run:

```bash
npm run typecheck
npm run build
```

4. For full settings sync, run the Supabase migration:

```sql
supabase/migrations/20260517_v56_2_settings_payload.sql
```

## v56.2 changes

- Removed leftover `app/api/broke/a`.
- Added `typecheck` and `check` npm scripts.
- Expanded API-side `Settings` type to match the client settings shape.
- Added backward-compatible `settings_payload` support for full settings sync.
- `/api/broke` now preserves full settings when syncing between website and Telegram, once the migration is applied.
- If the migration is not applied yet, the app continues to save legacy core settings without crashing.

## Do not touch casually

- `/api/telegram` webhook
- `/api/auth/telegram` web login route
- Supabase service-role logic
- `Growth Lab` calculation logic
- Gentle notification rules
