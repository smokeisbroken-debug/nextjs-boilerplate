# v59.13 — Custom Avatar Unlock

## Purpose
Add token-holder utility to Profile personalization: custom avatar upload unlocks at 500,000 BROKE.

## Files changed
- app/page.tsx
- app/globals.css
- app/api/broke/route.ts
- app/api/avatar/upload/route.ts
- supabase/migrations/20260524_v59_13_custom_avatar_storage_bucket.sql
- README.md
- PROJECT_ORDER.md
- TESTING.md

## Deploy order
1. Run Supabase Storage bucket SQL.
2. Replace files from this patch.
3. Deploy on Vercel.
4. Confirm required env vars exist.
5. Test Profile → Identity Setup → Custom avatar.

## Required env
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- TELEGRAM_BOT_TOKEN

## Optional env
- WEB_AUTH_SECRET
- BROKE_TOKEN_MINT
- SOLANA_RPC_URL
