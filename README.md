# v59.12 — Wallet Balance Foundation

Patch-only update for $BROKE Life Tracker.

## What changed
- Added Profile → Wallet & $BROKE balance.
- Users can paste a Solana wallet address and check read-only $BROKE token balance.
- Added holder tier display based on percentage of visible token supply:
  - Tadpole: <0.05%
  - Frog: 0.05–0.25%
  - Strong Frog: 0.25–0.75%
  - Shark Frog: 0.75–2%
  - Whale Frog: 2–5%
  - Leviathan Frog: 5%+
- Added privacy toggles for holder tier and exact token balance.
- Added Holder tier as an optional Share Studio item.
- Added `/api/wallet/balance` read-only balance endpoint.

## Security notes
- No seed phrase.
- No private key.
- No approval transaction.
- No token transfer.
- No staking or custody.
- This is read-only balance tracking through Solana RPC.

## Environment
Optional:

```txt
BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

The app has a default token mint fallback, but setting `BROKE_TOKEN_MINT` in Vercel is cleaner.

## Supabase
No migration is required for this patch. Wallet display state is saved through the existing settings payload.
