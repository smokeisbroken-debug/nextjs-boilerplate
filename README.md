# $BROKE / SmokeIsBroke — v59.2 Pattern History Foundation

This patch adds the first structured server-side history layer for Leak Pattern reads.

## What changed

- Added Supabase table `broke_pattern_history` for weekly pattern snapshots.
- Added `/api/broke` action `savePatternHistory`.
- `sync` now returns saved pattern history.
- The app saves the current weekly pattern read after cloud sync.
- Leak Pattern Lab now shows a small **Pattern memory** block with recent saved weekly reads.
- Existing pattern logic remains client-side; this patch only stores the summary safely for future comparison.

## Files to replace

```txt
app/page.tsx
app/api/broke/route.ts
app/globals.css
README.md
PROJECT_ORDER.md
TESTING.md
```

## Supabase files to run/check

Run migration first:

```txt
supabase/migrations/20260520_v59_2_pattern_history_foundation.sql
```

Then run audit:

```txt
supabase/review/20260520_v59_2_pattern_history_audit.sql
```

## Deployment order

1. Run the Supabase migration.
2. Replace patch files in GitHub/project.
3. Deploy to Vercel.
4. Open the app with cloud auth.
5. Track/open Chart so Pattern History can save.
6. Run the audit SQL.

## Safety

- Old expenses are not rewritten.
- Old trigger-tags remain compatible.
- If the table is missing, the API returns empty pattern history instead of crashing.
- Direct anon/authenticated table access should remain revoked; server uses service_role.
