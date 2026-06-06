# Smoke Is Broke — v59.51.3 Testing

## Checks run

- `npm ci --ignore-scripts --no-audit --no-fund` passed.
- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- `NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully, then timed out in this sandbox during Next.js `Running TypeScript ...` while standalone typecheck had already passed.

## Manual test targets

1. Open Track Leak.
2. Enter `0.01` and save.
3. Confirm it saves and displays as `0.01`, not `0`.
4. Edit that leak to `0.02`.
5. Confirm charts/Wallet HP/recent records update.
6. Try `0` or blank amount and confirm the app rejects it.
7. Confirm old whole-number leaks still display normally.
