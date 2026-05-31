# SmokeIsBroke / $BROKE App — v59.48.0

Patch: **Basic Wallet Data Fetch**

This patch adds the first read-only automatic public-wallet context layer to the existing manual Wallet Leak Score screen.

## What changed

- Added `app/lib/brokeWalletLeakData.ts`.
- Added `app/api/leak-score/wallet-data/route.ts`.
- Wallet Leak Score can now fetch basic public Solana wallet context:
  - SOL balance.
  - SPL token-account count.
  - Non-zero SPL token-account count.
  - Visible `$BROKE` balance/account status using the configured BROKE mint.
  - A short visible token-account sample.
  - Source-health status for balance and token-account RPC paths.
- Added local wallet-address cleanup for pasted addresses / explorer URLs.
- Added safe UI wording: this is public RPC context only, not wallet surveillance, not trade history, not PnL, and not financial advice.
- Updated shared build marker to `v59.48.0`.

## What did not change

- No transaction-history scan.
- No PnL.
- No buy/sell timing analysis.
- No wallet accusations.
- No public wallet database.
- No Supabase persistence.
- No reward eligibility changes.
- No payout logic changes.
- No Daily Routine / Active Streak changes.
- No Admin distribution API changes.

## Optional env

The wallet-data route uses this RPC fallback order:

```bash
WALLET_LEAK_SOLANA_RPC_URL
LEAK_SCORE_SOLANA_RPC_URL
SOLANA_RPC_URL
https://api.mainnet-beta.solana.com
```

A private/stable RPC is recommended for production.
