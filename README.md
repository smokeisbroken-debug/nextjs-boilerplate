# $BROKE Life Tracker — v59.40.2 Treasury Batch Sender Access Fallback Hotfix

Patch-only hotfix on top of confirmed v59.40.1.

## Scope

v59.40.2 keeps the private Admin **Treasury Batch Sender** and adds a safer fallback for wallets that expose `solana:signAndSendTransaction` but reject it with errors such as `Access forbidden` in mobile wallet browsers.

## Changes

- Updated the batch sender transaction flow:
  - First tries Wallet Standard `signAndSendTransaction`.
  - If the wallet blocks direct sending and also exposes `signTransaction`, the app now falls back to `signTransaction` plus browser-side RPC broadcast.
  - This keeps the grouped-transaction flow instead of forcing the admin back to one payment link per recipient.
- Improved the admin error message for `Access forbidden` so it explains that the wallet blocked batch signing in the current browser.
- Updated the Treasury Batch Sender UI copy to clarify the new fallback path.
- Kept the existing manual safety fallbacks:
  - payment links;
  - copy rows;
  - manual tx-signature paste.

## Important operational note

The batch sender is still wallet-dependent. Phantom/Jupiter/Solflare mobile browsers may expose different signing permissions depending on browser state and wallet permissions. If mobile still blocks batch signing, try:

1. Reopen the site inside the wallet browser.
2. Reconnect and verify the treasury wallet.
3. Try desktop browser + Phantom/Solflare extension.
4. Keep payment links/manual tx paste as final fallback.

## Not changed

- No private key storage.
- No server-side signing.
- No server-side token transfers.
- No Supabase schema change.
- No claims/staking backend.
- No Daily Routine / Active Streak change.
- No holder eligibility formula change.


## v59.40.3 — Standalone Batch Send Guard

- Treasury Batch Sender now blocks batch signing inside embedded/site preview frames, where Phantom/Jupiter/Solflare can return `Access forbidden` or open only the wallet home screen.
- Added a clear `Open full app for batch send` button in the private Admin payout queue.
- Admin must run `Send all with treasury wallet` from the full standalone app tab/desktop extension context, not from the site preview iframe.
- No private key storage, server-side signing, server-side token transfer, Supabase schema changes, reward formula changes, or Daily Routine changes.
