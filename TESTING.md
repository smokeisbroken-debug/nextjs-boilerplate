# Testing — v59.32 Private Admin Treasury Panel Foundation

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

## Admin visibility checks

With no admin env variables configured:

- Open Profile.
- Confirm no Admin Panel is visible.
- Confirm normal users still see Wallet, Share Studio, Privacy, Settings, and other normal Profile sections.

With `NEXT_PUBLIC_BROKE_ADMIN_TELEGRAM_IDS` containing the current Telegram/web-auth user ID:

- Open Profile.
- Confirm Admin Panel appears.
- Confirm it shows Admin access confirmed and payout mode Off.

With `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS` and/or `NEXT_PUBLIC_BROKE_ADMIN_WALLET_ADDRESSES` configured:

- Verify the matching wallet in Profile.
- Confirm Admin Panel appears for the verified matching admin wallet.
- Confirm the treasury status says Treasury matched when the verified wallet equals `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS`.
- Confirm a different wallet does not show treasury matched.

## Public Rewards checks

Open Rewards as a normal user.

Confirm:

- No Admin Panel is visible.
- No payout button is visible.
- No claim button is visible.
- No treasury signing button is visible.
- Reward Snapshot Ledger uses public project/snapshot wording.

## Regression checks

Confirm unchanged:

- Daily Routine remains the only Active Streak proof source.
- Final Daily Routine task remains Share on X.
- Wallet Standard/Jupiter detection from v59.31.2 still works.
- Watch-only wallet balance still works.
- Connect & verify still requests only one message signature.
- No token transaction is requested.
