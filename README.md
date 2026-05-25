# v59.20.3 — Home Snapshot Open + Premium Details Rows

Patch-only update for the $BROKE / SmokeIsBroke Telegram Mini App.

## Purpose

This patch keeps the important Wallet Snapshot visible on Home while making the rest of the Home collapsed sections look like the newer Personal Cabinet premium rows instead of older arrow-style details blocks.

## Files changed

- `app/page.tsx`
- `app/globals.css`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Product changes

- Wallet Snapshot on Home is open by default again.
- Today’s Focus, Weekly Behavior Report, and Comeback Mode remain collapsed by default.
- Lower Home sections now use compact premium summary rows instead of older arrow-style `clean-details` visuals.
- Old chevron arrows are hidden on Home details rows.
- Home detail rows now use the same dark/glass, rounded, status-pill visual language as the compact cabinet sections.
- Existing Home mechanics and panels remain available inside expandable sections.

## Not changed

- No API changes.
- No Supabase migration.
- No wallet verification logic changes.
- No holder reward logic changes.
- No balance formula changes.
- No avatar backend changes.
- No Telegram webhook changes.
- No stored data rewrite.
- No new reward distribution logic.
