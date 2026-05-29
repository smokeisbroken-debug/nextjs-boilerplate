# PROJECT ORDER — v59.40.2 Treasury Batch Sender Access Fallback Hotfix

Base: confirmed v59.40.1 Treasury Batch Sender BigInt Build Hotfix.

## Changed files

- `app/page.tsx`
- `app/globals.css`
- `app/api/admin/distributions/route.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Summary

v59.40.2 improves the real distribution batch sender when mobile wallet browsers return `Access forbidden` from direct Wallet Standard send. The sender now tries direct `signAndSendTransaction` first, then falls back to `signTransaction` plus browser-side RPC broadcast when available.

## Not changed

- Supabase schema
- reward eligibility formula
- Daily Routine / Active Streak logic
- wallet verification backend
- treasury private-key handling
- claims/staking/payout backend


## v59.40.3 — Standalone Batch Send Guard

- Treasury Batch Sender now blocks batch signing inside embedded/site preview frames, where Phantom/Jupiter/Solflare can return `Access forbidden` or open only the wallet home screen.
- Added a clear `Open full app for batch send` button in the private Admin payout queue.
- Admin must run `Send all with treasury wallet` from the full standalone app tab/desktop extension context, not from the site preview iframe.
- No private key storage, server-side signing, server-side token transfer, Supabase schema changes, reward formula changes, or Daily Routine changes.
