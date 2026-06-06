# Smoke Is Broke — v59.51.5 Token Data Fallback + Limited Result Honesty

v59.51.5 is a focused UX/mechanics patch on top of confirmed working v59.51.3 stable8. It improves the main Check flow so new users understand what they can paste, what the app detected, what address will be checked, and why an input cannot be checked.

## Changes

- Universal Check now shows a compact first-use guide before the input flow.
- Added supported-input chips for Solscan, DEX Screener, Birdeye, Jupiter, Raydium, and plain Solana addresses.
- Improved resolver output for Token, Wallet, Auto-detect, Unsupported URL, Unknown input, and sensitive/private-key-like input.
- Resolver now extracts URL context from pasted text, not only when the whole paste is a URL.
- Resolver shows source host, source label, detected path, address used, and a first-use tip.
- Multiple Solana-format addresses are explicitly disclosed; the app uses the first detected address.
- Sensitive/private-key/seed-phrase-like input is blocked with safer copy.
- Loading copy now explains when the app is auto-detecting vs checking a known token/wallet path.

## Not changed

No rewards, Admin distribution, payout logic, wallet verification, Supabase schema, transaction history, PnL, scam labels, investment advice, bottom-nav, or new manual screen changes.

## Verification

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```

