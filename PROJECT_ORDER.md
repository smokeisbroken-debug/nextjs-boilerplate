# PROJECT ORDER — v59.20.2 Home Compact + Share Card Crop Hotfix

## Current patch

`v59.20.2 — Home Compact + Share Card Crop Hotfix`

## Build target

Apply this patch on top of `v59.20.1 — Button Guide Build Hotfix`.

## What this patch does

1. Keeps Home visually premium but makes it much shorter by default.
2. Converts major Home sections into compact expandable rows.
3. Keeps the first-user clarity card visible when the user has no expenses.
4. Keeps all existing Home mechanics and panels available inside collapsed sections.
5. Adds export-safe top padding for major share cards.
6. Updates html2canvas capture offsets/window sizing to reduce cropped exports on Telegram/mobile WebView.

## What this patch intentionally does not do

- Does not change calculations.
- Does not change API routes.
- Does not add Supabase migrations.
- Does not change wallet verification.
- Does not change holder reward tiers.
- Does not change avatar upload backend.
- Does not change Telegram webhook behavior.
- Does not change share-card content rules; it only improves layout/capture safety.

## Manual review focus

- Home should no longer feel like a long feed at first open.
- Wallet Snapshot, Today’s Focus, Weekly Behavior Report, and Comeback Mode should open only when tapped.
- Share-card PNG exports should no longer clip the top header/avatar/status area.
