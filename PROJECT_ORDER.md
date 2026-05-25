# PROJECT ORDER — v59.20.3 Home Snapshot Open + Premium Details Rows

## Current patch

`v59.20.3 — Home Snapshot Open + Premium Details Rows`

## Build target

Apply this patch on top of `v59.20.2 — Home Compact + Share Card Crop Hotfix`.

## What this patch does

1. Keeps Wallet Snapshot open by default on Home.
2. Keeps Today’s Focus, Weekly Behavior Report, and Comeback Mode collapsed by default.
3. Adds a Home-specific wrapper class so Home details can be styled without changing every `clean-details` usage elsewhere.
4. Reworks lower Home collapsed rows into premium dark/glass summary cards.
5. Removes the old arrow/chevron visual from Home details rows.
6. Keeps all existing Home panel content and actions unchanged.

## What this patch intentionally does not do

- Does not change calculations.
- Does not change API routes.
- Does not add Supabase migrations.
- Does not change wallet verification.
- Does not change holder reward tiers.
- Does not change avatar upload backend.
- Does not change Telegram webhook behavior.
- Does not change share-card export logic.

## Manual review focus

- Wallet Snapshot should be visible immediately on Home.
- Lower Home rows should look premium and consistent with Personal Cabinet.
- The old arrow-style details should no longer appear on Home.
- All collapsed Home sections should still open and show their original content.
