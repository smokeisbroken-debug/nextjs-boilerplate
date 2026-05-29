# PROJECT ORDER — v59.40.1 Treasury Batch Sender BigInt Build Hotfix

Base: confirmed v59.40 Treasury Batch Sender Beta.

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

## Not changed

- Supabase schema
- reward eligibility formula
- Daily Routine / Active Streak logic
- wallet verification backend
- treasury private-key handling
- claims/staking/payout backend

## Summary

v59.40.1 fixes the Vercel build error from BigInt literal suffixes in the browser-side transaction helper while preserving the v59.40 Treasury Batch Sender flow and existing fallbacks.
