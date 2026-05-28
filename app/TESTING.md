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
