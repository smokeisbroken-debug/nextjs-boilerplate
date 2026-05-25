# v59.19.4 Share Cards Premium Fit & Avatar Polish — Project Order

## Base
Apply after:
1. v59.18 Wallet Provider Help + Verification Stability
2. v59.19 Global Premium Style Foundation
3. v59.19.1 Share Studio Brightness Hotfix
4. v59.19.2 Card Premium Alignment Polish
5. v59.19.3 Profile Compact Cabinet Hotfix

## Scope
Bring public share cards closer to the new premium app style and make them more consistent in width, spacing, and identity presentation.

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
- Active profile avatar is used as the identity visual on major share cards.
- Custom avatar URL is already returned by `getPublicProfileAvatarImage(settings)`, so uploaded custom avatars appear automatically where the public profile avatar is used.
- Signal/category icons remain as secondary icons where useful.
- Share card preview width is capped for mobile readability.
- Captured cards get a stable 420px width during html2canvas rendering for cleaner PNG output.
- Growth Lab share card is canvas-generated, so it draws the avatar separately and safely skips it if loading fails.

## Do not change in this patch
- API routes
- Supabase schema
- wallet proof/signature logic
- holder tiers/reward thresholds
- avatar upload backend
- calculation logic
- Telegram integration
