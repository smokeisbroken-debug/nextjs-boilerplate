# v59.12.1 — Wallet UX & Share Preview Polish

Patch-only update for the $BROKE Telegram Mini App.

## What changed
- Wallet address flow is clearer in Profile / Personal Cabinet.
- `Check $BROKE balance` button is now disabled until a valid-looking Solana address is entered.
- Valid address state now shows `Address ready to check`.
- Added `Paste` and `Clear` actions for the wallet address field.
- Added a clear linked-wallet result block with wallet, holder tier, and last checked time.
- Added trust notes: read-only check, no seed phrase, no transaction.
- Polished Profile share preview so long values such as BROKE balance and Biggest leak do not crop as easily.

## What did not change
- No Supabase migration.
- No token transaction logic.
- No wallet signing.
- No custody / staking / claim logic.
- Holder tiers remain unchanged.
