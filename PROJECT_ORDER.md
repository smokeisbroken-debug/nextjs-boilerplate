# Project Order — v59.31.1 Wallet Telegram UX Cleanup

## Patch base

Apply this patch on top of v59.31.

## Objective

Make the wallet verification area understandable inside Telegram WebView, where injected Solana wallet providers are often unavailable.

## Implementation order

1. Keep the v59.31 direct connect-and-sign verification flow for real wallet browsers/extensions.
2. Stop auto-opening the oversized provider-help block when no provider is detected.
3. Replace the old help block with one compact connection card.
4. Keep only the necessary actions visible:
   - Open Phantom
   - Open Solflare
   - Copy link
   - Rescan
5. Keep **Use wallet address** only when an actual signing provider is detected.
6. Allow **Verify wallet** to be pressed even when Telegram has no provider, so users get a clear action instead of a disabled button.
7. In Telegram without a provider, use Verify wallet to explain the limitation and attempt to open Phantom’s app-browser deeplink.
8. Improve external-link opening with Telegram `openLink(..., { try_instant_view: false })` plus browser fallback.
9. Tighten mobile wallet button CSS and reduce bottom-nav overlap.
10. Preserve all reward, staking, payout, snapshot, and Daily Routine logic.

## Non-goals

- No WalletConnect/Reown integration.
- No Jupiter Wallet Kit integration.
- No transaction signing.
- No SPL token transfers.
- No treasury payout execution.
- No private key storage.
- No reward claim windows.
- No Supabase migration.
