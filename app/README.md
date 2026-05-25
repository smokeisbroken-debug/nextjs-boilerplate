# v59.20.2 — Home Compact + Share Card Crop Hotfix

Patch-only update for the $BROKE / SmokeIsBroke Telegram Mini App.

## Purpose

This patch makes Home shorter and easier to scan, similar to the compact Personal Cabinet flow. It also adds a safer share-card export layout so major share cards stop clipping their top identity/header area during html2canvas capture.

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

- Wallet Snapshot on Home is collapsed by default.
- Today’s Focus on Home is collapsed by default.
- Weekly Behavior Report on Home is collapsed by default.
- Comeback Mode on Home is collapsed by default when present.
- Existing Home details such as missions, reports, insights, badges, recent expenses, and sync remain in collapsible sections.
- Share-card export now uses safer scroll offsets and a taller clone viewport.
- Major share cards receive extra export-safe top padding while captured.
- Identity/avatar/header rows on share cards are allowed to breathe during capture.

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
