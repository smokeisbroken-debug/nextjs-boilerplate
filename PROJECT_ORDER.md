# v59.14 — Verified Holder Guard

## Goal

Protect holder identity and future holder unlocks from wallet-address spoofing.

## What changed

- Added verified-vs-watched wallet state.
- Added signed-message verification flow.
- Added server-side verification tables.
- Custom avatar upload now requires verified ownership, not only balance.
- Existing read-only balance checking remains available.

## Files changed

```txt
app/page.tsx
app/globals.css
app/api/avatar/upload/route.ts
app/api/wallet/verify/nonce/route.ts
app/api/wallet/verify/confirm/route.ts
supabase/migrations/20260524_v59_14_verified_holder_guard.sql
supabase/review/20260524_v59_14_verified_holder_guard_audit.sql
README.md
PROJECT_ORDER.md
TESTING.md
```

## Not changed

- Token transfers.
- Staking.
- Rewards/claims.
- Wallet custody.
- Expense calculations.
- Share Studio item logic.
