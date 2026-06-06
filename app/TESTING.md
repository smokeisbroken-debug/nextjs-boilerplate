# Testing — v59.52.4 Sync Payload Key Normalization Hotfix

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
