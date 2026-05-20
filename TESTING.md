# Testing — v59.3.3

## Automated checks

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Manual checks

1. Open Home on mobile/Telegram WebView.
2. Confirm the first visible section after the app header is Wallet Snapshot.
3. Confirm cash-flow cards are visible before the selected day snapshot.
4. Confirm the frog mascot is smaller and placed inside a compact Home header.
5. Confirm the old huge `Your wallet is not broken / It is leaking` banner is gone.
6. Confirm Today's Focus is visible below the compact hero.
7. Confirm bottom nav does not cover Today's Focus content unexpectedly.

## Regression checks

- Track Leak still opens and saves expenses.
- Chart still opens.
- Wallet Snapshot day tabs still switch selected day.
- Pattern History and Trigger Tags are not affected.
