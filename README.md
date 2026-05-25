# $BROKE Life Tracker — v59.19.5 Profile Share Card Export Fit Hotfix

Patch-only polish on top of v59.19.4.

## What changed
- Profile Share Card export is wider and less vertically stretched during html2canvas capture.
- Profile Share Card preview is more compact on mobile.
- Header spacing was tightened so the avatar, title, nickname, status, and identity badge do not leave a large empty area.
- Metric cards are shorter, better aligned, and still support 8 selected Share Studio items.
- Potential yearly savings and footer blocks are more compact.
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
- CSS brace balance passes for `app/globals.css`.
- Full npm checks were not rerun in this environment because this is CSS/docs-only.
