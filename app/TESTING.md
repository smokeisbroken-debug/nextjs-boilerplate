# TESTING — v59.40 Treasury Batch Sender Beta

## Expected checks

1. Open the app as admin.
2. Verify the configured treasury wallet.
3. Open Admin.
4. Load legitimate holders.
5. Prepare a real manual distribution batch.
6. Confirm `Final payout queue` is shown.
7. Confirm the new `Treasury batch sender` card is shown.
8. Press `Send all with treasury wallet`.
9. Wallet should request transaction signing.
10. After successful send, tx signatures should be recorded automatically.
11. If wallet/RPC/token-account support fails, payment links and manual signature paste should still work.

## Verification performed in sandbox

- TSX transpile diagnostics passed for `app/page.tsx`.
- API route transpile diagnostics passed for `app/api/admin/distributions/route.ts`.
- CSS brace balance passed for `app/globals.css`.

Full npm checks were not rerun because dependency installation is currently unreliable in the sandbox environment.
