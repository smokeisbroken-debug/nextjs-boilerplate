# v59.12.1 Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Profile / Personal Cabinet.
2. Scroll to Wallet & $BROKE balance.
3. Confirm the check button is disabled when the address field is empty.
4. Paste a valid Solana address.
5. Confirm `Address ready to check` appears and the CTA becomes bright.
6. Tap `Check $BROKE balance`.
7. Confirm linked wallet result, holder tier, and balance appear.
8. Test `Paste`, `Clear`, and `Remove wallet`.
9. Open Share Studio preview.
10. Confirm BROKE balance and Biggest leak do not crop on mobile.
