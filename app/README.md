# v59.18 — Wallet Provider Help + Verification Stability

Patch-only stability/polish update built on the confirmed v59.17.2 stable base.

## What changed
- Adds a visible wallet-provider readiness card in Profile → Wallet & $BROKE balance.
- Detects injected Solana wallet providers where available: Phantom, Solflare, Backpack, or generic Solana wallet.
- Adds `Rescan provider` so users can return from a wallet browser and immediately re-check whether message signing is available.
- Expands the verification help flow with clear three-step guidance:
  1. open the app inside a Solana wallet browser;
  2. sign only the ownership message;
  3. return to Telegram/web and press `Sync verification` if the profile is still watch-only.
- Keeps watch-only balance checking available when Telegram/WebView does not expose a signing wallet provider.
- Extends protected Supabase diagnostics to include wallet verification tables:
  - `broke_wallet_links`
  - `broke_wallet_verifications`

## No changes
- No Supabase migration.
- No token transactions.
- No staking, claims, transfers, custody, or wallet-drain behavior.
- No holder reward thresholds changed.
- No avatar upload backend changes.
- No balance formula changes.
- No Telegram webhook changes.

## Diagnostics
The protected Supabase diagnostic endpoint now checks the wallet tables too:

```bash
/api/broke?check=supabase&key=YOUR_DIAGNOSTICS_SECRET
```

This is useful after deploy because the current full project uses `broke_wallet_links` and `broke_wallet_verifications` for verified-holder status.
