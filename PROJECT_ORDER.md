# v59.8 — Profile Share Studio & Account State Cleanup

## Purpose
Polish the app after Profile/Cabinet changes by reducing share-card confusion and making public profile sharing configurable from one place.

## Files changed
- `app/page.tsx`
- `app/globals.css`
- `app/api/broke/route.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`

## Main changes
1. Added Profile Share Studio with selectable public-card slots.
2. Added Wallet HP-based slot limit:
   - low HP: fewer display slots
   - higher HP: more trophy/display slots
3. Share Result card now uses the selected Profile Share Studio items.
4. Added account-level app-state sync support for daily routine actions, daily routine reward state, and local leak mission.
5. Kept old share flows available but made Profile the central place for configuring what gets shared.

## Not changed
- No Supabase migration.
- No new API route.
- No Telegram webhook changes.
- No custom avatar upload.
- No private debt sharing.
