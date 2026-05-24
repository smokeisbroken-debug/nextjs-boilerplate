# v59.12 — Testing

Run locally:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Profile.
2. Find Wallet & $BROKE balance.
3. Paste a valid Solana wallet address.
4. Press Check $BROKE balance.
5. Confirm balance, holder tier and percent update.
6. Toggle holder privacy controls.
7. Open Share Studio.
8. Select Holder tier.
9. Open share card and confirm holder display follows privacy toggles.
10. Reload app and confirm wallet settings remain saved.

Security regression:
- App must never ask for seed phrase.
- App must never request token approval or transaction signing.
- Balance check must be read-only.
