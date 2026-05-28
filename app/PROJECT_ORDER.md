# PROJECT ORDER — v59.29.1 Jupiter Wallet Provider Hotfix

## Current patch

v59.29 broadens Solana wallet support before building treasury-funded payouts. The app no longer treats Phantom as the only practical signer path.

## Files changed

- `app/page.tsx`
- `app/globals.css`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Product order

1. Daily Routine remains the only Active Streak proof path.
2. Rewards and snapshot eligibility stay unchanged.
3. Wallet verification supports a broader injected-provider layer.
4. If several Solana wallets are detected, the user can select one.
5. The selected wallet can paste its connected public address into Profile.
6. Verification still requires a signed text message only.
7. Future treasury payout work should reuse this provider selector for admin signing, but not store private keys in the app.

## Supported provider path

The app now checks for common Solana injected/browser providers including Phantom, Solflare, Backpack, OKX Wallet, Bitget/BitKeep, Coinbase Wallet, Glow, Exodus, Brave Wallet, Trust Wallet, Magic Eden Wallet, `window.solana.providers[]`, and generic `window.solana`.

## Safety line

This patch is wallet-compatibility UI/client logic only. It does not activate payouts, claims, staking, token transfers, Creator Fee distribution, treasury transfers, or reward execution.

## v59.29.1 Jupiter Wallet Provider Hotfix

Scope: small wallet compatibility hotfix on top of v59.29.

- Add Jupiter Wallet to supported wallet detection and visible help copy.
- Keep the broader v59.29 wallet selector and Use wallet address behavior.
- Do not add payout execution, treasury signing, WalletConnect/Reown, token transfers, staking, claims, or Supabase migrations.
