# v59.19.5 Profile Share Card Export Fit Hotfix — Project Order

## Base
Apply after:
1. v59.18 Wallet Provider Help + Verification Stability
2. v59.19 Global Premium Style Foundation
3. v59.19.1 Share Studio Brightness Hotfix
4. v59.19.2 Card Premium Alignment Polish
5. v59.19.3 Profile Compact Cabinet Hotfix
6. v59.19.4 Share Cards Premium Fit & Avatar Polish

## Scope
Fix the Profile Share Card visual result after the premium share-card pass: reduce excessive height, improve exported width, tighten metric card spacing, and keep custom/profile avatar rendering.

## Files changed
- `app/globals.css`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Implementation notes
- The visible Profile Share Card remains mobile-safe at up to 390–440px depending on viewport.
- The cloned html2canvas capture version uses a wider 520px canvas to produce a cleaner PNG.
- The fix is scoped to the Profile Share Card / public share image card CSS.

## Do not change in this patch
- API routes
- Supabase schema
- wallet proof/signature logic
- holder tiers/reward thresholds
- avatar upload backend
- calculation logic
- Telegram integration
