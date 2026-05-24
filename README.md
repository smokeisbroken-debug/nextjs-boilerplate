# v59.17.2 — Wallet Verification Sync Hotfix

Patch-only hotfix.

## What changed
- Adds `/api/wallet/verify/status` to read the server-side verified wallet link for the logged-in user.
- Profile now auto-syncs verified wallet status after returning from wallet-browser verification.
- Adds a `Sync verification` action for Telegram Mini App cases where Phantom/Solflare verification completed outside the Telegram WebView.
- Keeps watched-wallet balance available while holder unlocks remain gated behind verified ownership.

## No changes
- No Supabase migration.
- No token transactions.
- No staking, claims, transfers, or custody.
