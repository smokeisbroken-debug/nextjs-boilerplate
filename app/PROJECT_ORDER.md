# Project Order — v59.52.3 User Reminder Time + Telegram Routine Notifications

Base: confirmed working `v59.52.2 stable8`.

## Goal

Let users set their own reminder time and receive a phone notification through Telegram bot messages.

## Scope

- Profile reminder toggle/time control.
- Settings payload now stores reminder enabled/time/timezone.
- Protected routine-reminder cron endpoint.
- Telegram bot message with web app open button.
- One reminder per user per local day.

## Out of scope

- Browser Push / Firebase notifications.
- Email reports.
- New reward logic.
- Admin payout changes.
- Daily Routine proof-task formula changes.
- Universal Check signal/scoring changes.

## Verification

Run:

```txt
npm run typecheck
npm run lint:quiet
NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```

Cron dry-run:

```txt
/api/notifications/routine-reminders?key=<CRON_SECRET>&dryRun=1
```
