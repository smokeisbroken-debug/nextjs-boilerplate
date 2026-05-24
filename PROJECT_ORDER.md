# v59.17.2 — Wallet Verification Sync Hotfix

## Purpose
Fix the case where wallet verification succeeds in Phantom/Solflare, but the Telegram Mini App still shows `Verify wallet` because local Profile state has not synced the server-side verified wallet link.

## Files changed
- `app/page.tsx`
- `app/api/wallet/verify/status/route.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`

## Deploy order
1. Replace files.
2. Deploy to Vercel.
3. No SQL required.
4. Test verification in wallet browser and return to Telegram Mini App.
