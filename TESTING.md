# v59.15 Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Profile → Wallet & $BROKE balance.
2. Paste wallet and check balance without verifying.
3. Confirm holder proof says watch-only and share metric does not expose holder tier as verified.
4. Verify wallet ownership.
5. Confirm Holder Proof dashboard shows Verified holder proof.
6. Confirm next-tier progress bar appears.
7. Profile → Share Studio → enable Holder tier.
8. Confirm public share preview shows holder tier only for verified wallet.
