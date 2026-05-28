# PROJECT ORDER — v59.31 Wallet Connect Verify + Button Alignment Hotfix

## Current stable base

Apply this patch on top of v59.30 Daily Routine No-Spend + Growth Fairness Polish.

## Patch scope

Files changed:

- `app/page.tsx`
- `app/globals.css`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- matching docs under `app/`

## Implementation notes

### Verify wallet direct connect

`verifyWalletOwnership()` now works as a direct connect-and-sign flow when a supported provider is detected:

1. Sync detected wallet provider state.
2. Connect the selected provider.
3. Read the returned public address.
4. Insert that address into the Profile wallet field.
5. Request the existing nonce/message from the backend.
6. Ask the wallet to sign the message.
7. Confirm verification with the existing backend route.

This removes the old requirement that users must paste the address before pressing Verify wallet.

### Multi-wallet selector

The existing selector remains active when more than one wallet provider is exposed. Verification uses the selected provider, so users can choose Phantom, Solflare, Backpack, Jupiter Wallet, OKX, Glow, Exodus, Coinbase Wallet, Brave, Trust Wallet, Magic Eden Wallet, or generic injected Solana providers when available in the browser.

### Button alignment

Wallet/Profile action buttons were normalized with:

- stable min heights;
- centered button text;
- safer wrapping;
- one-column wallet action layout on small mobile screens;
- consistent provider action grid.

## Safety boundaries

This patch does not add Treasury payouts, transaction signing, token movement, WalletConnect/Reown, claims, staking, Supabase migrations, or reward execution.
