# v59.10 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Save.
2. Confirm **Pattern Challenge Coach** appears above Challenges.
3. With no useful pattern data, it should show a learning/waiting state.
4. With tracked leak patterns, it should suggest a relevant challenge.
5. Start recommended challenge.
6. Confirm existing active challenge flow still works.
7. Confirm Profile / Share Studio is unchanged.
