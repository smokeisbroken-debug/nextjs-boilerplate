# Testing — v59.33 Private Admin Holder Intelligence Panel

## Automated checks

Run:

```bash
npm run typecheck
npm run lint:quiet
```

Optional:

```bash
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Env setup checks

Recommended values:

```bash
NEXT_PUBLIC_TREASURY_WALLET_ADDRESS=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_ADMIN_WALLET_ADDRESSES=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
REWARDS_ADMIN_SECRET=<long random admin read key>
```

Optional:

```bash
BROKE_ADMIN_TELEGRAM_IDS=<comma-separated Telegram user IDs>
SOLANA_RPC_URL=<custom mainnet RPC endpoint>
```

## Admin visibility checks

- Open Profile as a normal user.
- Confirm no Admin Panel is visible.
- Verify the configured admin wallet.
- Confirm Admin Panel appears.
- Confirm the expected treasury wallet shows `5eni...PxC9` shortened.
- Confirm the $BROKE contract shows `9Ujw...wray` shortened.

## Holder intelligence checks

With `REWARDS_ADMIN_SECRET` configured:

- Open the Admin Panel.
- Enter the read key if the Telegram admin session is not active.
- Press Load.
- Confirm Top 10 all holders appears.
- Confirm Top 20 legitimate holders appears or shows an empty-state message if no eligible holders exist.
- Confirm the summary shows eligible holders, eligible balance, and token supply.

## API checks

Authorized:

```bash
curl -H "Authorization: Bearer $REWARDS_ADMIN_SECRET" "$WEBAPP_URL/api/admin/holders"
```

Expected:

- `ok: true`
- `topAllHolders`
- `topLegitimateHolders`
- `summary`
- `safety.noTokenTransfers: true`

Unauthorized:

```bash
curl "$WEBAPP_URL/api/admin/holders"
```

Expected if no Telegram admin session cookie is present:

- HTTP 401
- `ok: false`

## Regression checks

Confirm unchanged:

- Daily Routine remains the only Active Streak proof source.
- Final Daily Routine task remains Share on X.
- Wallet Standard/Jupiter detection from v59.31.2 still works.
- Watch-only wallet balance still works.
- Connect & verify still requests only one message signature.
- No token transaction is requested.
- No payout, claim, staking, or treasury signing button is visible.

# v59.34 Testing

## Checks run in patch workspace

```bash
npm run typecheck
npm run lint:quiet
```

Both passed.

CSS brace balance passed.

`NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully, then timed out in the sandbox during the Next.js TypeScript/build finalization step. Standalone `tsc --noEmit` passed.

## Manual QA

Admin visibility:

1. Open Profile as a normal user.
2. Confirm no Admin button is visible beside Guide.
3. Open Profile as configured Telegram admin or verified admin wallet.
4. Confirm Admin button is visible beside the Guide button.
5. Tap Admin.
6. Confirm the private modal opens.
7. Close modal and confirm Profile remains clean.

Holder intelligence:

1. Enter `REWARDS_ADMIN_SECRET` if not authorized by Telegram admin session.
2. Tap Load.
3. If Solana RPC returns HTTP 429, confirm legitimate holders still load and a warning appears.
4. If a private `SOLANA_RPC_URL` is configured, confirm Top 10 all holders loads.

Distribution draft:

1. Load holder intelligence.
2. Enter a pool amount such as `100`.
3. Choose USDC, SOL, or $BROKE.
4. Confirm each legitimate holder receives reward amount based on balance-share percent.
5. Tap Prepare distribution.
6. Confirm a manifest is copied/prepared.
7. Confirm no wallet signature request appears.
8. Confirm no token transaction appears.
9. Confirm no claim, staking, or transfer is executed.
