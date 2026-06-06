# Testing — v59.52.5 Telegram Reminder Cron Wiring Hotfix

v59.52.5 wires Telegram routine reminders to Vercel Cron with `vercel.json`, keeps the endpoint protected by `CRON_SECRET`/`NOTIFICATIONS_SECRET`, removes the dependency on a separate `broke_notification_logs` table by storing the last successful reminder date in existing app state payload, and adds an authorized `testTelegramId` endpoint parameter for manual bot-send testing. No reminder UI, Daily Routine formula, rewards/admin payout, or Universal Check logic changed.

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Profile / Notifications & Sync in Telegram.
2. Toggle Reminder On/Off and save/update settings.
3. Confirm sync no longer shows `PGRST102: All object keys must match`.
4. Confirm existing expenses still sync/import correctly.
5. Confirm Daily Routine and reminder settings still display normally.
