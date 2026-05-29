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
