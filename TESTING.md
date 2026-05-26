# TESTING — v59.24.3

Recommended checks:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Rewards tab.
2. Confirm first card is brighter and closer to the rest of the app.
3. Confirm the first card has short text, not long paragraphs.
4. Confirm collapsed blocks remain closed by default.
5. Open Notifications prep.
6. Toggle Daily Proof, Recovery, and 7-day milestone separately.
7. Change reminder time between 09:00 / 18:00 / 21:00.
8. Leave and reopen Rewards; selected notification preferences should remain stable.
9. If cloud sync is active, wait for sync and confirm preferences do not reset.

No database migration is required.
