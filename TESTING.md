# v59.14 Testing

## Build checks

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Manual checks

### Watched wallet

1. Open Profile → Wallet & $BROKE balance.
2. Paste a public Solana wallet address.
3. Click `Check $BROKE balance`.
4. Confirm balance/tier display works.
5. Confirm status says watched/not verified.

### Verified wallet

1. Open the app in a wallet browser or extension environment with signMessage support.
2. Paste the connected wallet address.
3. Click `Verify wallet`.
4. Sign the message.
5. Confirm status becomes verified.
6. Confirm no transaction approval appears.

### Custom avatar guard

1. Try to upload custom avatar with watched wallet only.
2. Expected: blocked; asks for wallet verification.
3. Verify a wallet with 500K+ BROKE.
4. Upload avatar.
5. Expected: upload succeeds.

### Regression

- Profile order remains:
  - Personal Cabinet
  - Identity Setup
  - Wallet & $BROKE balance
  - Share Studio
  - Other settings
- Share Studio still opens profile card.
- Existing avatar presets still work.
