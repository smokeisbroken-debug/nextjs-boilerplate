# $BROKE Life Tracker — v59.31 Wallet Connect Verify + Button Alignment Hotfix

Patch-only update on top of v59.30.

## What changed

- Wallet verification no longer requires manual address copy/paste when a supported Solana wallet provider is available.
- Pressing **Verify wallet** now opens/connects the selected detected wallet, reads the public address, inserts it into Profile, requests one ownership message signature, and completes verification.
- If several injected wallets are available, the existing wallet selector is used before verification.
- If the typed/watched address differs from the connected wallet, verification now safely uses the connected wallet address instead of failing with a copy/paste loop.
- Wallet copy was updated to explain the new direct flow: choose wallet → Verify wallet → sign one text message.
- Wallet action buttons were aligned and made more stable on mobile:
  - full-width wallet buttons on narrow screens;
  - cleaner line wrapping;
  - clearer verified/active verify states;
  - provider action buttons use a consistent grid.

## Current wallet rule

Verification is still message-signature-only. No transaction is created, no token is moved, and no Treasury/payout signing is enabled in this patch.

## What did not change

- No Creator Fee distribution.
- No payouts.
- No claims.
- No staking.
- No token transfers.
- No treasury signing.
- No reward claim window.
- No wallet verification backend flow changes.
- No holder threshold changes.
- No balance formula changes.
- No avatar backend changes.
- No Telegram webhook changes.
- No Supabase migration required.
- No reward snapshot ledger schema changes.
- No WalletConnect/Reown setup.
- No Daily Routine / Active Streak rule changes.

## Notes

Telegram WebView can still hide injected wallet providers. In that case the app keeps the wallet help card and asks the user to open the app inside a Solana wallet browser or desktop extension. Where wallet injection exists, Verify wallet now handles the address automatically.
