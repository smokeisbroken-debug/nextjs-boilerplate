# $BROKE Life Tracker — v59.33 Private Admin Holder Intelligence Panel

Patch-only update on top of confirmed v59.32.

## What changed

- Added the provided admin/treasury public wallet as the default admin wallet fallback:
  - `5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9`
- Added the provided $BROKE contract/mint as the default token mint fallback:
  - `9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray`
- Added a private Admin Panel holder intelligence block inside Profile.
- Added a new read-only admin route:
  - `/api/admin/holders`
- Admin Panel can now show:
  - **Top 10 all holders** from Solana RPC largest token accounts, grouped by visible owner address;
  - **Top 20 legitimate holders** from app eligibility logic.
- Legitimate holder logic stays aligned with Rewards:
  - verified app wallet;
  - 100,000+ $BROKE;
  - 7+ Active Streak;
  - streak based on completed Daily Routine proof.
- Admin holder data requires backend authorization through `REWARDS_ADMIN_SECRET` or a configured Telegram admin session.
- The feature is read-only. It does not send rewards, sign transactions, open claims, or transfer tokens.

## Admin config

The default wallet and mint are now embedded as public fallbacks, but Vercel env values can still override them.

Recommended Vercel env values:

```bash
NEXT_PUBLIC_TREASURY_WALLET_ADDRESS=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_ADMIN_WALLET_ADDRESSES=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
REWARDS_ADMIN_SECRET=<long random admin read key>
```

Optional:

```bash
NEXT_PUBLIC_BROKE_ADMIN_TELEGRAM_IDS=<comma-separated Telegram user IDs>
BROKE_ADMIN_TELEGRAM_IDS=<comma-separated Telegram user IDs>
SOLANA_RPC_URL=<custom mainnet RPC endpoint>
```

Notes:

- Public wallet addresses and public token mint addresses are safe to show shortened in the admin UI.
- Do not store seed phrases or private keys in Vercel, Supabase, code, or client env.
- `REWARDS_ADMIN_SECRET` is server-side and should not use the `NEXT_PUBLIC_` prefix.
- If the Admin Panel is unlocked by wallet only, enter the `REWARDS_ADMIN_SECRET` in the panel to load server-side holder data.
- If the Admin Panel is unlocked by a configured Telegram admin session, the endpoint can load without manually entering the read key.

## What did not change

- No Creator Fee distribution.
- No payouts.
- No claims.
- No staking.
- No token transfers.
- No treasury signing.
- No WalletConnect/Reown integration.
- No Jupiter Wallet Kit dependency.
- No wallet verification backend flow changes.
- No Supabase migration required.
- No holder threshold changes.
- No balance formula changes.
- No avatar backend changes.
- No Telegram webhook changes.
- No Daily Routine / Active Streak rule changes.
