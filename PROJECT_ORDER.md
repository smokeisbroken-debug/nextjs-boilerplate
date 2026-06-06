# Project Order — v59.52.4 Sync Payload Key Normalization Hotfix

Base: confirmed v59.52.3 stable8.

## Scope

Fix the Supabase `PGRST102` sync error shown in Profile/Notifications by making bulk local-expense import rows use matching keys.

## Files changed

- `app/api/broke/route.ts`
- `app/lib/brokeAdminRewards.ts`
- docs

## Constraints

No changes to rewards/Admin payout, Daily Routine proof formula, reminders behavior, Universal Check scoring, wallet verification, or schema migrations.
