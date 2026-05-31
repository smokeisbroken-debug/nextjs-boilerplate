# Smoke Is Broke — v59.45.1 Leak Score Local Draft + Share Text

Patch-only update on top of v59.45.0.

v59.45.1 continues the BROKE Leak Score concept as a safe local-only DYOR tool. It adds one persistent local draft and neutral share text generation while keeping the feature manual, educational, and non-accusatory.

## Changed files

- `app/page.tsx`
- `app/globals.css`
- `app/lib/brokeAdminRewards.ts`
- `app/lib/brokeLeakScore.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- matching `app/` docs

## What changed

- Added a local-only Leak Score draft saved in browser `localStorage`.
- Project/token name, chain, optional contract/mint address, and selected visible signals now survive reloads on the same device.
- Added neutral `BROKE Leak Score draft` share text generation.
- Added `Copy text` and `Share text` actions.
- Added a read-only share text preview for manual fallback when clipboard/share APIs are blocked.
- Updated the Leak Score guide to explain local draft and share text behavior.
- Updated shared build marker to `v59.45.1`.

## Safety constraints

This patch does not add:

- API calls
- Supabase persistence
- public project database
- automated on-chain scanning
- scam labeling
- public accusations
- investment advice
- share image/card generation

## Unchanged

- Payout logic
- Reward eligibility formula
- Payout shares
- Daily Routine
- Active Streak
- Wallet verification
- Admin distribution API behavior
- Server auto-send behavior
- Supabase schema
- Public project database behavior

## Manual test checklist

1. Open the app.
2. Enable Pro Mode.
3. Open the `Leak` tab.
4. Enter a project/token name, chain, and optional contract/mint address.
5. Select several visible leak signals.
6. Reload the app and confirm the local draft remains.
7. Press `Copy text` and paste the result somewhere safe.
8. Press `Share text` and confirm native share opens or falls back to copy.
9. Press `Clear` and confirm the local draft resets.
10. Confirm there are no API calls or Supabase writes from the Leak Score screen.
11. Confirm Rewards/Admin/Wallet verification still behave as before.

## Verification performed

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- Targeted brace/paren balance passed.
- Zip integrity passed.

`NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully but timed out during the known large-project Next.js build phase in the sandbox. Standalone typecheck passed.
