# v59.19.6 Profile Share Card Header Crop Hotfix — Project Order

## Base
Apply after:
1. v59.18 Wallet Provider Help + Verification Stability
2. v59.19 Global Premium Style Foundation
3. v59.19.1 Share Studio Brightness Hotfix
4. v59.19.2 Card Premium Alignment Polish
5. v59.19.3 Profile Compact Cabinet Hotfix
6. v59.19.4 Share Cards Premium Fit & Avatar Polish
7. v59.19.5 Profile Share Card Export Fit Hotfix

## Scope
Fix the Profile Share Card export result where the top/header area can look cropped after the width/fit adjustment. Keep the wider card, preserve custom/avatar display, and avoid changing any reward, wallet, API, or Supabase logic.

## Files changed
- `app/globals.css`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Deployment order
1. Apply the patch files.
2. Run the recommended checks.
3. Open Profile → Share Studio → Preview here.
4. Generate/export the Profile Share Card PNG.
5. Confirm the top border, avatar, `$BROKE PROFILE` pill, nickname, status line, and style badge are not cropped.
