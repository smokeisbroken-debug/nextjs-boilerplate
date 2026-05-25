# Smoke is Broke / $BROKE Life Tracker

## Current checkpoint

`v59.19 — Global Premium Style Foundation`

This patch applies a shared premium visual system across the app while preserving the existing product logic from `v59.18 — Wallet Provider Help + Verification Stability`.

## What changed

- Added a global premium dark dashboard visual layer.
- Unified cards, heroes, panels, badges, inputs, buttons, tabs, modals, and bottom navigation.
- Made Home, Track Leak, Chart, Growth, Save, Profile, onboarding, reports, and wallet/profile sections feel closer to one product style.
- Added missing global CSS aliases for `--accent` and `--neon` to stabilize newer profile/wallet styles.
- Preserved share-image capture safety by disabling blur effects inside share-capture surfaces.

## What did not change

- No API behavior changes.
- No Supabase migration.
- No wallet verification logic change.
- No balance formula change.
- No holder reward threshold change.
- No avatar upload backend change.
- No Telegram webhook change.
- No stored data rewrite.

## Verify

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```
