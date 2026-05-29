# $BROKE Life Tracker — v59.40 Treasury Batch Sender Beta

Patch-only update on top of confirmed v59.39.

## Scope

v59.40 reduces real reward distribution work by adding a private Admin **Treasury Batch Sender**. It keeps the safe architecture: the app prepares grouped payout transactions and the treasury wallet signs them. The server still never stores a treasury private key and does not execute server-side token transfers.

## Changes

- Added `Send all with treasury wallet` inside the private Admin final payout queue.
- Batch sender is shown only after a real manual distribution batch is prepared.
- Uses Wallet Standard signing when the treasury wallet exposes it.
- Groups recipients into small transactions:
  - SOL: up to 6 recipients per transaction.
  - SPL tokens ($BROKE / USDC): up to 2 recipients per transaction.
- Automatically records returned tx signatures in the existing reward ledger.
- Keeps payment links and manual tx-signature paste as fallback.
- Supports current reward token labels:
  - `SOL`
  - `USDC`
  - `$BROKE`
- Uses the existing $BROKE mint fallback:
  - `9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray`
- Uses the existing USDC mint fallback:
  - `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

## Important operational note

The batch sender is beta and wallet-dependent. It needs a wallet/browser that exposes Wallet Standard transaction signing. If a wallet blocks the grouped transaction flow, use the existing payment links or manual tx-signature recorder.

For SPL-token payouts, recipients need an existing token account for that mint. This is normally true for legitimate $BROKE holders. If a recipient has no token account, use the payment-link fallback or ask the recipient to receive/hold the token first.

## Optional env

For browser-side RPC calls, you may set a public-safe RPC URL:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://...
```

If omitted, the batch sender falls back to public Solana mainnet RPC. Public RPC can rate-limit; a dedicated endpoint is better for real distributions.

Required existing env remains:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
REWARDS_ADMIN_SECRET=...
NEXT_PUBLIC_TREASURY_WALLET_ADDRESS=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_ADMIN_WALLET_ADDRESSES=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
```

## No changes

- No private key storage.
- No server-side signing.
- No claim/staking system.
- No Supabase schema change.
- No holder eligibility formula change.
- No Daily Routine / Active Streak logic change.
- No WalletConnect/Reown dependency.

## Verification

- TSX transpile diagnostics passed for `app/page.tsx`.
- API route transpile diagnostics passed for `app/api/admin/distributions/route.ts`.
- CSS brace balance passed for `app/globals.css`.
- Full npm typecheck/lint/build were not rerun because this sandbox cannot currently install/restore project dependencies reliably.
