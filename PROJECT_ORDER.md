# $BROKE / SmokeIsBroke Project Order

## Current checkpoint

- Version: **v56.6**
- Base: **v56.5 stable**
- Goal: cleanup/testing only; no new mechanics

## Working rules

1. Keep `app/page.tsx` as the current main UI file until a planned refactor is done.
2. Ship small patch-only updates when possible.
3. Do not mix UI polish, API changes, Supabase migrations, and new mechanics in one patch unless there is a direct dependency.
4. Before deploy, run:

```bash
npm run verify
```

5. If `npm run verify` is too slow locally, run the checks separately:

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
- Updated project docs to the current stable version.

## Supabase requirement from v56.2

For full settings sync, run this migration once in Supabase SQL Editor:

```sql
alter table public.broke_settings
  add column if not exists settings_payload jsonb;
```

## Do not touch casually

- `/api/telegram` webhook
- `/api/auth/telegram` website login route
- Supabase service-role logic
- `Growth Lab` calculation logic
- Gentle notification rules
- Share-card image generation
