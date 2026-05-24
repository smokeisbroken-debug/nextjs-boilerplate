# v59.17.1 Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:
1. Profile → Wallet & $BROKE balance.
2. Paste wallet address and check balance.
3. Press Verify wallet inside Telegram WebView where no provider exists.
4. Confirm helper card appears with Open Phantom / Open Solflare / Copy app link.
5. Confirm watch-only balance still remains visible.
6. Generate Profile share card and confirm name/status/header text is not cropped.
