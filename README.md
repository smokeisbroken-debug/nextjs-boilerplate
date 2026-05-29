# $BROKE Life Tracker — v59.42 Clean One-Button Admin Distribution

Patch-only cleanup on top of v59.41.

## Scope

v59.42 replaces the overloaded private Admin distribution UI with a simple one-button flow.

The Admin modal now focuses on four inputs and one action:

- Admin read key.
- Minimum $BROKE hold.
- Required Daily Routine Active Streak days.
- Token + amount.
- `Distribute rewards`.

The button loads legitimate holders, prepares the real distribution batch, sends pending payouts from the dedicated payout wallet, and records tx signatures in the existing ledger.

## Operational model

This version intentionally uses the v59.41 dedicated payout-wallet server sender because mobile wallet browser batch signing was unreliable. The main treasury seed must not be used.

Required Vercel env for one-button distribution:

```env
REWARDS_ADMIN_SECRET=your_admin_secret
BROKE_PAYOUT_AUTO_SEND_ENABLED=true
BROKE_PAYOUT_WALLET_SECRET_KEY=dedicated_low_balance_payout_wallet_secret
BROKE_PAYOUT_WALLET_ADDRESS=dedicated_payout_wallet_public_address
SOLANA_RPC_URL=stable_private_rpc_url
BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
NEXT_PUBLIC_BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
```

Optional safety caps:

```env
BROKE_PAYOUT_MAX_RECIPIENTS=30
BROKE_PAYOUT_MAX_POOL=1000000
```

## Changes

- Removed the visible Admin clutter around wallet batch signing, payment links, manual tx paste, queue controls, repeated warnings, and multi-step real/test modes from the main UI.
- Added `Distribute rewards` as the main Admin action.
- The one-button flow performs:
  1. Load legitimate holders using the selected rules.
  2. Calculate balance-share payouts.
  3. Save a real distribution batch to the existing ledger.
  4. Call server auto-send from the dedicated payout wallet.
  5. Record tx signatures automatically.
- Cleaned the Admin modal layout for mobile and desktop.
- Fixed a duplicate local declaration in `app/api/admin/distributions/route.ts`.
- Relaxed real-batch preparation so a configured dedicated payout wallet can be used without relying on browser treasury-wallet batch signing.

## Not changed

- No eligibility formula change.
- No Daily Routine / Active Streak change.
- No Supabase schema change.
- No claims or staking backend.
- No public user UI change.
- No main treasury private key storage.

## Safety note

Use a separate payout wallet funded only with the intended distribution amount. Do not place the main treasury seed phrase/private key in Vercel.

## v59.42.1 — One-Button Distribution Build Hotfix

- Fixed Vercel/Next.js build failure caused by a stale undefined frontend variable `serverAutoSendConfirmPhrase` left from the older dedicated payout-wallet flow.
- The clean one-button Admin distribution flow now uses the literal server confirmation phrase `SERVER AUTO SEND` internally when preparing and executing payout-wallet auto-send.
- No UI complexity was reintroduced: Admin remains a simple form with Admin key, minimum hold, required streak days, token, amount, eligible preview, and one Distribute rewards action.
- No eligibility formula, Daily Routine/Active Streak, Supabase schema, claims/staking, public UI, or wallet verification backend changes.

Verification in patch workspace:

```bash
TypeScript transpile diagnostics: app/page.tsx OK
TypeScript transpile diagnostics: app/api/admin/distributions/route.ts OK
CSS/TSX/API brace balance OK
No remaining serverAutoSendConfirmPhrase references
```
