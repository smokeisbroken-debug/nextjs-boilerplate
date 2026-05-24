# v59.17.2 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Profile → Wallet & $BROKE balance.
2. Paste wallet and check balance.
3. Press Verify wallet in Phantom/Solflare wallet browser.
4. Return to Telegram Mini App.
5. Profile should auto-sync to `Verified`, or press `Sync verification`.
6. Custom avatar / holder rewards should unlock only after verified status is synced.
