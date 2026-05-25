# $BROKE Life Tracker — v59.19.4 Share Cards Premium Fit & Avatar Polish

Patch-only polish on top of v59.19.3.

## What changed
- Share cards now use a more consistent premium vertical layout and controlled width.
- Profile avatar is shown on major public share cards, including custom uploaded avatars when active.
- Daily Report, Weekly Report, Mission Result, Weekly Review, Monthly History, Survival Mode, Weekly Behavior Report, Profile Share Card, and Growth card output were aligned visually.
- Share card metric grids now use more consistent two-column spacing, stronger wrapping, and safer text fit.
- html2canvas capture now receives a stable card width for cleaner exported PNGs.
- Growth Lab canvas share card now tries to draw the active profile/custom avatar in the header. If the avatar cannot load, the card still renders.

## No changes
- No API changes.
- No Supabase migration.
- No wallet verification logic changes.
- No holder reward logic changes.
- No balance formula changes.
- No avatar upload backend changes.
- No Telegram webhook changes.
- No stored data rewrite.

## Verification
- TypeScript TSX transpile diagnostics pass for `app/page.tsx`.
- CSS brace balance passes for `app/globals.css`.
- Full npm checks were not rerun in this environment because the workspace lacks installed dependencies.
