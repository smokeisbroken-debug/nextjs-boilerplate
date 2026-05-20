# $BROKE / SmokeIsBroke — v58.19 First User Clarity Polish

Patch-only release focused on the first user experience.

## What changed

- Added clearer first-session messaging on onboarding.
- Reframed the onboarding route around: Track one leak → Read Wallet HP → Get the pattern.
- Added a first-session promise card so new users understand the immediate result.
- Added a compact Home hero clarity strip: Track leak → Read pattern → Take next move.
- Added a first-user clarity card when the user has no expenses yet.
- Added a Track Leak result preview explaining what happens after saving a leak.
- Updated Trigger Chips helper copy to sound less technical and more behavioral.
- Added Russian translation entries for the new clarity copy.

## Backend impact

No backend changes.

- No API route changes.
- No Supabase migrations.
- No database schema changes.
- No Telegram webhook changes.
- No stored data rewrites.

## Verification

Passed:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```
