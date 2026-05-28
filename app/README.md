# $BROKE Life Tracker — v59.29.1 Jupiter Wallet Provider Hotfix

Patch-only hotfix on top of v59.29.

## What changed

- Expanded Solana wallet provider detection beyond the earlier Phantom/Solflare/Backpack-focused path.
- Added detection for multiple injected/browser Solana wallets when available, including Phantom, Solflare, Backpack, Jupiter Wallet, OKX Wallet, Bitget/BitKeep, Coinbase Wallet, Glow, Exodus, Brave Wallet, Trust Wallet, Magic Eden Wallet, and generic `window.solana` providers.
- Added support for `window.solana.providers[]` so browsers exposing several Solana providers can show more than one option.
- Added a wallet provider selector when multiple wallets are detected.
- Added **Use wallet address** to connect the selected provider and paste the connected public address into Profile automatically.
- Wallet verification still uses message signing only. No transaction is sent during verification.
- Provider Help copy now explains the broader wallet-browser/desktop-extension flow instead of implying only Phantom/Solflare/Backpack.
- Kept the v59.28 Daily Routine-only Active Streak rule unchanged.

## v59.29.1 hotfix

- Added Jupiter Wallet to the visible supported wallet list.
- Added Jupiter Wallet provider detection for likely injected/browser shapes such as `window.jupiter`, `window.jupiterWallet`, `window.jupiterSolana`, provider flags, provider names, and `window.solana.providers[]`.
- Updated Provider Help, Rescan copy, and supported-wallet docs to mention Jupiter Wallet.
- Kept verification as message-signature-only. No transaction, payout, treasury signing, WalletConnect/Reown, or token movement was added.

## What did not change

- No Creator Fee distribution.
- No payouts.
- No claims.
- No staking.
- No token transfers.
- No treasury wallet logic.
- No reward claim window.
- No wallet verification backend flow changes.
- No holder threshold changes.
- No balance formula changes.
- No avatar backend changes.
- No Telegram webhook changes.
- No Supabase migration required.
- No reward snapshot ledger schema changes.
- No WalletConnect/Reown project setup yet.

## Product rule after this patch

Users can keep using watch-only wallet balance checks, but ownership verification can now use a broader set of Solana injected/browser wallets when the browser exposes `connect` and `signMessage`.

Treasury payout signing is still not enabled. This patch only prepares broader wallet compatibility for verification and future admin treasury flows.
