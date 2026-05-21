# v59.4 — Growth Plan Tracking Detail

Patch-only update for the $BROKE / SmokeIsBroke Telegram Mini App.

## User-facing change
Saved Growth plans are now clickable and trackable. A chosen plan no longer ends at a share image: users can open the plan, see progress, add saved progress, mark a planned contribution, update the plan, view recent progress history, and share the card when needed.

## Files changed
- `app/page.tsx`
- `app/globals.css`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`

## Backend
No API route changes.
No Supabase migration.
No Telegram webhook change.

Growth progress is stored inside the existing saved Growth simulation payload, so old saved plans stay compatible and normalize with an empty progress history.
