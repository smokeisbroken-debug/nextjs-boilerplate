# TESTING — v59.40.2 Treasury Batch Sender Access Fallback Hotfix

## Expected checks

1. Open the app as admin.
2. Verify the configured treasury wallet.
3. Open Admin.
4. Load legitimate holders.
5. Prepare a real manual distribution batch.
6. Confirm `Final payout queue` is shown.
7. Press `Send all with treasury wallet`.
8. Wallet should request grouped transaction signing.
9. If direct `signAndSendTransaction` is blocked with `Access forbidden`, the app should retry with `signTransaction` + RPC broadcast when available.
10. After successful send, tx signatures should be recorded automatically.
11. If both wallet signing paths are blocked, payment links and manual signature paste should still work.

## Verification performed in sandbox

- TSX transpile diagnostics passed for `app/page.tsx`.
- API route transpile diagnostics passed for `app/api/admin/distributions/route.ts`.
- CSS brace balance passed for `app/globals.css`.
- Targeted scan confirms no remaining BigInt literal suffixes in `app/page.tsx`.

Full npm checks were not rerun because dependency installation is unreliable in the sandbox environment.


## v59.40.3 — Standalone Batch Send Guard

- Treasury Batch Sender now blocks batch signing inside embedded/site preview frames, where Phantom/Jupiter/Solflare can return `Access forbidden` or open only the wallet home screen.
- Added a clear `Open full app for batch send` button in the private Admin payout queue.
- Admin must run `Send all with treasury wallet` from the full standalone app tab/desktop extension context, not from the site preview iframe.
- No private key storage, server-side signing, server-side token transfer, Supabase schema changes, reward formula changes, or Daily Routine changes.
