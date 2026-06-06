# Smoke Is Broke — v59.52.4 Sync Payload Key Normalization Hotfix

v59.52.4 is a small hotfix on top of v59.52.3 stable8. It fixes a Supabase sync error where imported local expense rows could be sent with different JSON keys, causing PostgREST `PGRST102: All object keys must match` during sync.

## Changes

- Normalized bulk local-expense sync rows so optional columns are always present as values or `null`.
- Keeps fallback handling for older Supabase schemas that do not yet have currency/trigger/smart-leak columns.
- Updated shared build marker to `v59.52.4`.

## Not changed

- No reminder logic changes.
- No rewards/Admin payout changes.
- No Daily Routine formula changes.
- No Universal Check scoring changes.
- No wallet verification or Supabase migration added.
