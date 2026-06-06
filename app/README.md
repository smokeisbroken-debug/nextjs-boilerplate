# Smoke Is Broke — v59.52.5 Telegram Reminder Cron Wiring Hotfix

v59.52.5 wires Telegram routine reminders to Vercel Cron with `vercel.json`, keeps the endpoint protected by `CRON_SECRET`/`NOTIFICATIONS_SECRET`, removes the dependency on a separate `broke_notification_logs` table by storing the last successful reminder date in existing app state payload, and adds an authorized `testTelegramId` endpoint parameter for manual bot-send testing. No reminder UI, Daily Routine formula, rewards/admin payout, or Universal Check logic changed.

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
