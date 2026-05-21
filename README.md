# v59.6 — Home Habit Leaks

Patch-only update based on v59.5.

## What changed
- Added **Home Habit Leaks** inside Save.
- Users can log household habit leaks without entering exact money values.
- Quick logs include lights, fan, TV, water, devices/chargers, AC/heater, fridge, and custom home leak.
- The app shows weekly awareness signals:
  - logged this week
  - biggest home leak
  - late-night/weekend timing signal
  - repeat read
  - recent home leak log
- Home habit leaks sync through the existing app state payload.

## Not changed
- No Supabase migration.
- No new table.
- No Telegram webhook changes.
- No expense calculation rewrite.
- No public sharing of home habit details.

## Why no money estimates yet
The feature is awareness-first. Exact bill/tariff estimation can be added later after users have enough habit logs and optional bill details.
