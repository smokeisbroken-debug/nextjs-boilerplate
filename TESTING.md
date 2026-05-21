# v59.6.2 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Growth tab.
2. Type quickly into Growth plan title.
3. Type into Target Coverage cost name.
4. Type into Target Coverage amount.
5. Type into Personal Goal name.
6. Type into Personal Goal amount.
7. Wait a few seconds and confirm text does not delete itself.
8. Save a plan.
9. Open saved plan and add progress.
10. Reload app and confirm data remains.

Expected:
- letters should appear on first tap/type;
- no self-deleting input;
- no forced reset while typing;
- saved Growth plan tracking still works.
