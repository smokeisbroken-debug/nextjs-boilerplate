# v59.9 — Weekly Behavior Report

## Goal
Turn existing Pattern History and Leak Pattern Lab data into a clearer weekly user-facing report on Home.

## Files changed
- app/page.tsx
- app/globals.css
- README.md
- PROJECT_ORDER.md
- TESTING.md

## User-facing behavior
- Home now includes Weekly Behavior Report after Today's Focus.
- The card summarizes:
  - strongest pattern;
  - leak pressure;
  - comparison vs previous saved week if available;
  - one next move;
  - safe share/copy text.

## Not changed
- API routes
- Supabase schema
- migrations
- Telegram webhook
- settings data
- expense data
