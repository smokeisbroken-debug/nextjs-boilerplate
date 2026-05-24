# v59.13 — Custom Avatar Unlock

Patch-only update for the $BROKE / SmokeIsBroke Telegram Mini App.

## User-facing change
Users can upload a custom profile/share-card avatar only after the checked wallet balance reaches at least **500,000 BROKE**.

## What changed
- Added custom avatar unlock card in Profile → Identity Setup.
- Added holder-gated avatar upload.
- Custom avatar appears in Profile, Public identity preview, Share Result, and Safe Weekly Share Card.
- Preset avatars remain as fallback.
- Added server-side upload endpoint: `app/api/avatar/upload/route.ts`.
- Added Supabase Storage bucket setup SQL.

## Safety
- Read-only holder check.
- No seed phrase.
- No transaction.
- No token transfer.
- PNG/JPG/WebP only.
- Max upload size: 2 MB.
