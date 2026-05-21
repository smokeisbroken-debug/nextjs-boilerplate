# v59.6 — Home Habit Leaks

## Goal
Add the community-requested household habit leak tracker without forcing exact utility-cost math too early.

## User-facing behavior
Users can log small home drains such as:
- Lights left on
- Fan running
- TV nobody watches
- Water running
- Devices left on
- AC/heater waste
- Fridge left open
- Other home leak

The app then summarizes the habit pattern instead of pretending to know exact money lost.

## Files changed
- app/page.tsx
- app/globals.css
- app/api/broke/route.ts
- README.md
- PROJECT_ORDER.md
- TESTING.md

## Data storage
Home habit leaks are stored inside the existing app state payload and localStorage fallback.

No Supabase migration is required for this version.
