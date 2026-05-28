# $BROKE Life Tracker — v59.31.2 Wallet Standard + Jupiter Detection Hotfix

Patch-only hotfix on top of v59.31.1.

## What changed

- Added a lightweight Solana Wallet Standard registry listener so wallets that do not expose `window.solana` directly can still be detected when they register through `wallet-standard:register-wallet` / `wallet-standard:app-ready`.
- Added a Wallet Standard provider wrapper for `standard:connect` + `solana:signMessage` so Verify wallet can use standard registered wallets when available.
- Improved delayed rescans after page load: provider checks now run at 250ms, 850ms, 1600ms, and 3000ms, plus focus/visibility changes and Wallet Standard registration events.
- Jupiter Wallet detection now has a second path: direct injected/browser shapes from v59.29.1 plus Wallet Standard registration when Jupiter exposes it through the app browser.
- Rescan/Verify messages are clearer outside Telegram: if a wallet browser does not expose a signer, the app says that directly instead of showing Telegram-only wording.
- The compact wallet connection UI from v59.31.1 stays in place; no large provider wall was restored.

## Current wallet behavior

- Phantom/Solflare-style injected providers continue to work through the existing connect-and-sign flow.
- Wallet Standard-compatible Solana wallets can now be detected without needing a custom global like `window.jupiter` or `window.solana`.
- If Jupiter Mobile still does not expose a signer in the current browser session, the app cannot force a signature from it without a deeper Wallet Kit / WalletConnect setup.
- Watch-only balance remains possible by pasting a public wallet address.
- Seed phrase is never requested.

## What did not change

- No Creator Fee distribution.
- No payouts.
- No claims.
- No staking.
- No token transfers.
- No treasury signing.
- No WalletConnect/Reown integration.
- No Jupiter Wallet Kit dependency.
- No wallet verification backend flow changes.
- No Supabase migration required.
- No holder threshold changes.
- No balance formula changes.
- No avatar backend changes.
- No Telegram webhook changes.
- No Daily Routine / Active Streak rule changes.
