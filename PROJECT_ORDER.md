# v59.12 — Wallet Balance Foundation

## Purpose
Add safe read-only $BROKE holder balance visibility to Profile / Personal Cabinet.

## Scope
- Profile wallet section.
- Read-only wallet balance API.
- Holder tier logic.
- Share Studio holder item.
- Privacy controls for holder status and exact token balance.

## Files changed
- app/page.tsx
- app/globals.css
- app/api/wallet/balance/route.ts
- README.md
- PROJECT_ORDER.md
- TESTING.md

## Not changed
- Supabase schema
- Telegram webhook
- expense calculations
- Debt Radar
- rewards/claim logic
- wallet transactions

## Deployment
1. Replace files from the patch.
2. Optional: add `BROKE_TOKEN_MINT` and `SOLANA_RPC_URL` in Vercel env.
3. Deploy on Vercel.
4. Test Profile → Wallet & $BROKE balance.
