# $BROKE Life Tracker — v59.19.6 Profile Share Card Header Crop Hotfix

Patch-only polish on top of v59.19.5.

## What changed
- Added extra export-safe top padding to the Profile Share Card so html2canvas output no longer cuts the top/header area.
- Prevented the Profile Share Card identity/status block from clipping the status line.
- Increased safe header breathing room only for Profile Share Card preview/export.
- Kept the card width from v59.19.5.
- Improved the Biggest leak metric wrapping so category names are less likely to split awkwardly.
- Custom/profile avatar display is preserved.

## No changes
- No API changes.
- No Supabase migration.
- No wallet verification logic changes.
- No holder reward logic changes.
- No balance formula changes.
- No avatar upload backend changes.
- No Telegram webhook changes.
- No stored data rewrite.

## Verification
- CSS brace balance passes.
- Full npm checks were not rerun because this is CSS/docs-only.
