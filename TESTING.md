# v59.8.1 Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:
1. Open Profile / Personal Cabinet.
2. Open Share Studio.
3. Change selected public-card checkboxes.
4. Tap **Open share card**.
5. Confirm the profile share card opens directly in the same Share Studio area.
6. Confirm Home / Daily Routine share flow still works.
