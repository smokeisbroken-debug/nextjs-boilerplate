# Testing — v59.52.3 User Reminder Time + Telegram Routine Notifications

## UI checks

1. Open Profile.
2. Open Notifications & Sync.
3. Turn Reminder on.
4. Set a time.
5. Confirm the summary shows the chosen time.
6. Reload and confirm the chosen time is still stored.

## Server checks

1. Ensure required env vars are set.
2. Call dry run:

```txt
/api/notifications/routine-reminders?key=<CRON_SECRET>&dryRun=1
```

3. Confirm unauthorized calls return 401.
4. Confirm missing secret returns locked error.
5. Confirm route skips users when:
   - reminder is off
   - current local time is not due
   - Daily Routine is already complete
   - reminder was already sent today

## Send check

Temporarily set a test user's reminder time to current local time and call:

```txt
/api/notifications/routine-reminders?key=<CRON_SECRET>
```

Expected: Telegram bot sends one message with an Open $BROKE button.

## Guardrails

- Do not send browser/Firebase push.
- Do not send more than one successful reminder per local day.
- Do not change rewards/admin logic.
- Do not change Universal Check data logic.
