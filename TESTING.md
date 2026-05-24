# v59.18 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Manual checks

### Wallet watch-only flow
1. Open Profile → Wallet & $BROKE balance.
2. Paste a valid Solana public address.
3. Press `Check $BROKE balance`.
4. Confirm balance/tier can display as watch-only.
5. Confirm holder rewards and custom avatar remain locked until verification.

### Telegram WebView provider help
1. Open the app inside Telegram Mini App.
2. Paste/check a wallet.
3. Press `Verify wallet`.
4. Confirm provider help appears if Telegram does not expose Phantom/Solflare/Backpack signing.
5. Confirm the help card explains:
   - open inside wallet browser;
   - sign only text message;
   - return and press `Sync verification`.

### Wallet browser verification
1. Open the app inside Phantom, Solflare, Backpack, or another Solana wallet browser.
2. Press `Rescan provider`.
3. Confirm the readiness card detects a signing provider when available.
4. Press `Verify wallet`.
5. Sign the message.
6. Confirm the profile updates to verified.

### Return-to-Telegram sync
1. Complete verification in wallet browser.
2. Return to Telegram Mini App.
3. Confirm auto-sync updates status, or press `Sync verification`.
4. Confirm holder rewards unlock only after verified status is synced.

### Protected diagnostics
1. Open:

```bash
/api/broke?check=supabase&key=YOUR_DIAGNOSTICS_SECRET
```

2. Confirm wallet tables are listed:
   - `broke_wallet_links`
   - `broke_wallet_verifications`
3. If either returns non-OK, wallet verification SQL is missing or permissions need review.
