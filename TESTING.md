# v59.6 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual test:

1. Open Save.
2. Find Home Habit Leaks.
3. Tap a few quick chips: Lights, Fan, TV, Water.
4. Confirm weekly count updates.
5. Confirm biggest home leak updates after repeated logs.
6. Confirm late-night/weekend signal appears when relevant.
7. Reload app and verify recent logs remain.
8. If Telegram/cloud sync is active, verify logs do not disappear after sync.
9. Remove a recent log and verify it disappears.

Expected:
- No exact money is required.
- No app crash if app_state_payload is missing or sync is unavailable.
- Save screen remains usable on mobile.
