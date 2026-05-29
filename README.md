# $BROKE Life Tracker — v59.38 Real Manual Distribution Prep

Patch-only update on top of confirmed v59.37.

## Scope

v59.38 prepares the private Admin Panel for real manual reward distributions without putting treasury private keys or automatic token transfers into the app.

## Changes

- Admin Reward Distribution now has two modes:
  - `Test ledger` for dry-run/test saved batches.
  - `Real manual distribution` for a prepared live manual payout batch.
- Real manual batch preparation requires:
  - loaded legitimate holders,
  - pool token and amount,
  - configured treasury wallet matched to the connected verified wallet,
  - exact confirmation phrase: `PREPARE REAL DISTRIBUTION`.
- Real batch saves as `prepared` in the existing reward distribution ledger.
- Added copyable manual send sheet:
  - `rank,wallet,amount,token,share_percent`.
- Added tx signature recorder after a real manual batch is prepared:
  - admin can paste `rank,txSignature` or `wallet,txSignature` rows,
  - payout rows are marked `manual_sent`,
  - distribution becomes `manual_sent` when all payout rows have signatures.
- `/api/admin/distributions` now supports:
  - `GET` recent/specific private distributions,
  - `POST` test or real manual prepared batches,
  - `PATCH` manual send tx signature recording or cancellation.

## No changes

- No automatic token transfers.
- No treasury private key storage.
- No server-side signing.
- No claim system.
- No staking.
- No WalletConnect/Reown dependency.
- No Supabase schema change beyond the existing v59.37 ledger tables.
- No Daily Routine / Active Streak changes.
- No holder eligibility formula changes.

## Required setup

Run the v59.37 distribution ledger migration first if not already applied:

- `supabase/migrations/20260528_v59_37_reward_distribution_test_ledger.sql`

Required env:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
REWARDS_ADMIN_SECRET=...
NEXT_PUBLIC_TREASURY_WALLET_ADDRESS=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_ADMIN_WALLET_ADDRESSES=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
```

## Verification

- `npm run typecheck`
- `npm run lint:quiet`
- CSS brace balance

## v59.39 Final Real Distribution Queue

- Adds a final private admin payout queue for real manual distributions.
- After a real batch is prepared, Admin can open wallet payment requests per legitimate recipient.
- Payment links use Solana payment URLs with exact wallet, amount, token label, and SPL mint when applicable.
- Supported token labels in the queue: SOL, USDC, and $BROKE.
- $BROKE mint fallback: `9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray`.
- USDC mint fallback: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`.
- Admin can copy all payment links, open each recipient payment, then paste tx signatures back into the private ledger.
- No private key is stored by the app or server.
- No server-side token transfer is executed.
- Treasury wallet still confirms each payment inside the wallet app.
