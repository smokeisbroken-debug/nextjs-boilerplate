# v59.3.4 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Expected result:
- Home Status appears first under the header.
- Wallet Snapshot appears below Home Status.
- No regressions in Home navigation or Wallet Snapshot tabs.
