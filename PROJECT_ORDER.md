# PROJECT ORDER — v59.40 Treasury Batch Sender Beta

Base: confirmed v59.39 Final Real Distribution Queue.

## Changed files

- `app/page.tsx`
- `app/globals.css`
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

v59.40 adds a private Admin beta batch sender that prepares grouped Solana transactions in the browser and asks the connected treasury wallet to sign/send them. Returned tx signatures are recorded through the existing private distribution ledger API. Existing payment links remain as fallback.
