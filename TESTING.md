# v59.7.1 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual QA:

1. Open Profile tab.
2. Confirm profile card appears at the top.
3. Change nickname.
4. Change status line.
5. Choose different avatar preset.
6. Check that old settings remain visible below.
7. Reload app and confirm settings still sync normally.
8. Confirm no old Settings controls were removed.
