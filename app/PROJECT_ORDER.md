# v59.19.3 Profile Compact Cabinet Hotfix — Project Order

## Base
Apply after:
1. v59.18 Wallet Provider Help + Verification Stability
2. v59.19 Global Premium Style Foundation
3. v59.19.1 Share Studio Brightness Hotfix
4. v59.19.2 Card Premium Alignment Polish

## Scope
Make Profile / Personal Cabinet less long and less noisy while preserving all wallet, identity, Share Studio, and settings functionality.

## Files changed
- `app/page.tsx`
- `app/globals.css`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Implementation notes
- Wallet & $BROKE Balance is now a collapsed `<details>` block with a compact status summary.
- Share Studio is now a collapsed `<details>` block with selected/slot summary.
- Internal controls are unchanged and remain available after opening the sections.
- Mobile CSS reduces card height, chip height, grid gaps, and settings-summary height.

## Do not change in this patch
- API routes
- Supabase schema
- wallet proof/signature logic
- holder tiers/reward thresholds
- avatar upload backend
- calculation logic
- Telegram integration
