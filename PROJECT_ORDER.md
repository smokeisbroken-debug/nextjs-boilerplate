# Project Order — v59.31.2 Wallet Standard + Jupiter Detection Hotfix

## Patch base

Apply this patch on top of v59.31.1.

## Objective

Improve wallet detection for Jupiter and other Solana wallets that may register through Wallet Standard instead of exposing only `window.solana`.

## Implementation order

1. Preserve v59.31.1 compact wallet UI and Telegram cleanup.
2. Add a local Wallet Standard registry listener for `wallet-standard:register-wallet`.
3. Dispatch `wallet-standard:app-ready` from the app when wallet detection runs.
4. Support the deprecated `navigator.wallets.push(...)` compatibility path when the browser allows it.
5. Convert registered Solana Wallet Standard wallets into the app's existing provider shape.
6. Require both `standard:connect` and `solana:signMessage` before treating a standard wallet as ready for verification.
7. Include standard wallets in the existing provider selector and Verify wallet flow.
8. Add repeated delayed rescans after page load because some wallet browsers register late.
9. Clarify non-Telegram no-provider messages so Jupiter/browser failures are not described as Telegram-only issues.
10. Preserve all reward, payout, snapshot, Daily Routine, and backend logic.

## Non-goals

- No WalletConnect/Reown integration.
- No Jupiter Wallet Kit dependency.
- No transaction signing.
- No SPL token transfers.
- No treasury payout execution.
- No private key storage.
- No reward claim windows.
- No Supabase migration.
