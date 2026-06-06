# Project Order — v59.52.5 Telegram Reminder Cron Wiring Hotfix

v59.52.5 wires Telegram routine reminders to Vercel Cron with `vercel.json`, keeps the endpoint protected by `CRON_SECRET`/`NOTIFICATIONS_SECRET`, removes the dependency on a separate `broke_notification_logs` table by storing the last successful reminder date in existing app state payload, and adds an authorized `testTelegramId` endpoint parameter for manual bot-send testing. No reminder UI, Daily Routine formula, rewards/admin payout, or Universal Check logic changed.

Base: confirmed v59.52.3 stable8.

## Scope

Fix the Supabase `PGRST102` sync error shown in Profile/Notifications by making bulk local-expense import rows use matching keys.

## Files changed

- `app/api/broke/route.ts`
- `app/lib/brokeAdminRewards.ts`
- docs

## Constraints

No changes to rewards/Admin payout, Daily Routine proof formula, reminders behavior, Universal Check scoring, wallet verification, or schema migrations.
