# Smoke Is Broke — v59.52.3 User Reminder Time + Telegram Routine Notifications

v59.52.3 adds the first user-controlled Telegram reminder foundation on top of v59.52.2 stable8.

Users can enable a routine reminder from Profile, choose their own reminder time, and the app stores the selected time/timezone in settings. A protected server endpoint can be called by cron to send Telegram bot reminders only when the user opted in, the selected local time is due, and the Daily Routine is not complete.

## What changed

- Added user reminder settings: enabled/off, reminder time, timezone.
- Reworked the Profile notification row into a compact reminder control.
- Added `app/api/notifications/routine-reminders/route.ts`.
- Reminder endpoint uses Telegram `sendMessage` with an `Open $BROKE` web app button.
- Anti-spam: max one successful routine reminder per local day through `broke_notification_logs`.
- No browser/Firebase push was added; this uses Telegram-native bot reminders.

## What did not change

- No rewards/Admin payout logic changes.
- No wallet verification changes.
- No Supabase schema migration required.
- No Universal Check data/scoring changes.
- No Daily Routine task formula changes.
- No transaction history, PnL, scam labels, or investment advice.

## Cron target

Call this route every 5–10 minutes from Vercel Cron or another scheduler:

```txt
/api/notifications/routine-reminders?key=<CRON_SECRET>
```

Dry run:

```txt
/api/notifications/routine-reminders?key=<CRON_SECRET>&dryRun=1
```

Required env:

```txt
TELEGRAM_BOT_TOKEN
WEBAPP_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET or NOTIFICATIONS_SECRET
```
