# $BROKE / SmokeIsBroke Project Order

## Current checkpoint

- Version: **v57.0 patch candidate**
- Base: **v56.9 stable**
- Goal: cloud sync for Growth + Debt Radar; no visual redesign

## Working rules

1. Keep `app/page.tsx` as the current main UI file until a planned refactor is done.
2. Ship small patch-only updates when possible.
3. Do not mix UI polish, API changes, Supabase migrations, and new mechanics unless there is a direct dependency.
4. Before deploy, run:

```bash
npm run verify
```

5. If `npm run verify` is too slow locally, run checks separately:

```bash
npm run typecheck
npm run lint:quiet
npm run build
```

## Stable version trail

### v56.2 — Settings Sync Fix

- Removed leftover `app/api/broke/a`.
- Added `typecheck` and `check` npm scripts.
- Expanded API-side `Settings` type to match the client settings shape.
- Added backward-compatible `settings_payload` support for full settings sync.
- Added Supabase migration: `supabase/migrations/20260517_v56_2_settings_payload.sql`.

### v56.3 — UI/UX Copy Cleanup

- Changed Save/Growth wording to be clearer and less investment-like.
- Changed Growth saved-plan copy from value/gain language to projected/redirected language.
- No API, Supabase, CSS, or logic changes.

### v56.4 — Small UX/Logic Polish

- Added helper text for `Needed / Maybe / Not needed` impact.
- Replaced Growth risk wording with planning-only wording.
- No API, Supabase, CSS, or package changes.

### v56.5 — Mobile Growth UI Polish

- Fixed Growth mobile spacing.
- Improved detected-leaks card layout on small screens.
- Added extra scroll space above the fixed bottom navigation.
- CSS-only patch.

### v56.6 — Cleanup/Testing

- Added `lint:quiet` and `verify` scripts.
- Reduced intentional `<img>` lint noise in ESLint config.
- Removed small unused API variables/functions.
- Added `TESTING.md` manual QA checklist.

### v56.7 — Growth Target Coverage

- Renamed Growth real-life planning section to Target Coverage.
- Added Insurance and Mortgage / rent coverage lines.
- Added quick personal targets such as school fees, phone upgrade, emergency fund, debt, and family support.

### v56.8 — Debt & Bills Radar

- Added local-first Debt & Bills Radar in Save.
- Tracks debt, recurring bills, maintenance, priority, due day, monthly hit, and remaining debt.

### v56.9 — Debt & Bills Radar Polish

- Added item meta summaries.
- Made Remaining debt visible only for Debt items.
- Added Rent / mortgage and Phone / internet quick chips.
- Improved mobile spacing.

### v57.0 — Cloud Sync for Growth + Debt Radar

- Adds `app_state_payload` support in `/api/broke`.
- Syncs Growth saved plans through cloud state.
- Syncs Target Coverage lines and Personal Goal through cloud state.
- Syncs Debt & Bills Radar items through cloud state.
- Keeps fallback behavior: without the migration, modules remain local-first and the app should not crash.

## Supabase requirements

For full settings sync:

```sql
alter table public.broke_settings
  add column if not exists settings_payload jsonb;
```

For full Growth + Debt Radar sync:

```sql
alter table public.broke_settings
  add column if not exists app_state_payload jsonb;
```

## Do not touch casually

- `/api/telegram` webhook
- `/api/auth/telegram` website login route
- Supabase service-role logic
- Gentle notification rules
- Share-card image generation
