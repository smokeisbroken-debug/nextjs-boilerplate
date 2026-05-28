# $BROKE Life Tracker — v59.32 Private Admin Treasury Panel Foundation

Patch-only update on top of confirmed v59.31.2.

## What changed

- Added a hidden Profile-side **Admin Panel** surface for future Treasury / Reward Distribution controls.
- The Admin Panel is not rendered for normal users.
- Admin visibility can be unlocked only by configured Telegram admin IDs or configured verified admin wallet addresses.
- Added Treasury status preview:
  - expected treasury public address;
  - connected verified wallet;
  - treasury match / different wallet / not configured;
  - payout mode remains off.
- Public Rewards wording was cleaned up so normal users see project/snapshot language instead of internal admin wording.
- No public nav item or public Rewards admin block was added.

## Admin config

Use public addresses/IDs only. Do not store seed phrases or private keys.

Recommended Vercel env values:

```bash
NEXT_PUBLIC_TREASURY_WALLET_ADDRESS=<treasury public wallet address>
NEXT_PUBLIC_BROKE_ADMIN_TELEGRAM_IDS=<comma-separated Telegram user IDs>
NEXT_PUBLIC_BROKE_ADMIN_WALLET_ADDRESSES=<comma-separated verified admin wallet addresses>
```

Notes:

- `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS` is a public address and is safe to show shortened in the admin UI.
- `NEXT_PUBLIC_BROKE_ADMIN_TELEGRAM_IDS` controls whether the private panel appears for specific Telegram/web-auth users.
- `NEXT_PUBLIC_BROKE_ADMIN_WALLET_ADDRESSES` lets verified admin wallets unlock the panel.
- Real admin API calls still must use server-side secrets such as `REWARDS_ADMIN_SECRET`. Client visibility is not a replacement for backend authorization.

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
