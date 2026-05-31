# Smoke Is Broke — v59.51.0 Wallet Dangerous Leaks Explained

v59.51.0 strengthens the wallet side of Universal Check without adding another tab or manual loop. Token checks already explain dangerous token leaks; wallet checks now explain public-context wallet leaks in the same plain-language style.

## What changed

- Universal Check wallet results now show a wallet-specific context strip:
  - public RPC snapshot only;
  - no PnL / no trade history;
  - review prompt, not wallet surveillance.
- Wallet result language now uses `Wallet leaks explained` instead of generic token-risk wording.
- Wallet danger explanations were expanded:
  - `Gas-runway leak` for low SOL gas runway;
  - `Exposure-spread leak` for wide/heavy/very-wide non-zero SPL exposure;
  - `Dust-clutter leak` for large or mostly-empty token-account clutter;
  - `Low visible exposure` for wallets with SOL but no visible non-zero SPL exposure;
  - `Wallet source blind spot` for partial/limited RPC context;
  - `$BROKE context gap` when the configured $BROKE mint is not visible and there is space for a low-severity context note.
- Wallet decision summary and next actions were rewritten around wallet hygiene, not wallet judgment.
- Universal Check share summary/card now benefits from richer wallet `main leak`, `meaning`, and `next step` fields automatically.
- Updated shared build marker to `v59.51.0`.

## What did not change

- No new bottom-nav button.
- No new manual screen.
- No token auto-signal formula changes.
- No wallet transaction-history scan.
- No PnL, buy/sell timing, or trade-quality inference.
- No wallet accusations, bad-wallet labels, scam labels, or investment advice.
- No rewards, Admin distribution, payout logic, Daily Routine / Active Streak, wallet verification, Supabase schema, payout-wallet env, or server auto-send changes.

## Product intent

The product flow remains:

```txt
paste token / wallet / URL
↓
auto-check
↓
short result
↓
leaks explained
↓
copy/share
```

Wallet checks are intentionally limited to safe public context. They explain wallet hygiene risks such as gas friction, exposure breadth, and clutter while clearly avoiding surveillance or performance judgment.
