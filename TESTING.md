# v59.6.1 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual check:
1. Open Save → Home Habit Leaks.
2. Type a custom habit such as `Garage light`.
3. Log it twice.
4. Confirm it appears as one stack: `Garage light · 2x`.
5. Reload the app and confirm the custom habit remains.
6. Type the same name with different spacing/case and confirm it stacks with the same habit.
