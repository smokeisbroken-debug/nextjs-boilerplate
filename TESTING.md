# Testing — v59.52.9 Auto Wallet Balance Refresh + Share Card Safe Export

## Automated checks

- `npm ci --ignore-scripts --no-audit --no-fund`
- `npm run typecheck`
- `npm run lint:quiet`
- `NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build`

## Manual checks

1. Open Profile with a linked wallet.
2. Confirm balance auto-refreshes shortly after Profile opens.
3. Buy or sell $BROKE, return to the app/Profile, and confirm the balance updates without requiring app restart.
4. Press Recheck balance and confirm the displayed message includes the refreshed live balance and time.
5. Press Rescan and confirm it can also refresh the linked balance.
6. Generate Daily Report / public profile card on Android Telegram and confirm no white square/glitch artifacts appear.
