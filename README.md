# $BROKE / Smoke Is Broke — v59.43 Eligibility + Routine + Smart Leak Hotfix

Patch-only update on top of confirmed v59.42.9.

## Changes

- Admin legitimacy is explicitly minimum-streak based: a required streak value of 7 means 7+ days, not exactly 7.
- Admin form label/help now says minimum streak days and clarifies that 8, 9, 10+ day users remain eligible.
- Daily Routine task controls were polished so small mobile screens do not make action buttons look crooked.
- Restored Smart Leak Excess UI in Add / Track Leak for Maybe and Not needed records.
- Users can enter a cheaper / necessary baseline amount, and only the excess counts as leak pressure.
- Example: spent 5, necessary baseline 3, leak counted 2.
- Smart leak fields are preserved locally and through the `app/api/broke` route when the Supabase migration is applied.

## No changes

- No payout formula changes.
- No distribution/RPC changes.
- No Supabase reward schema changes.
- No wallet verification changes.
- No Daily Routine proof rule changes: Active Streak is still protected only by full 7/7 Daily Routine completion.

## Migration reminder

Smart Leak Excess persistence uses the existing v59.36 migration:

`supabase/migrations/20260528_v59_36_smart_leak_excess_amount.sql`

If it was already applied, do not re-run it manually unless Supabase reports the columns are missing.
