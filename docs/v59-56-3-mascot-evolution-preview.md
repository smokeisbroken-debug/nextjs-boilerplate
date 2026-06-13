# v59.56.3 — Mascot Evolution Preview

Built on top of `v59.56.2 — Social Boss Foundation`.

## Purpose

This patch makes Mascot Progression feel more like a social game character roadmap while keeping BROKE as a Life Tracker / wallet leak tracker / survival system.

The feature is a visual preview layer only. It does not add rewards, payouts, PvP, backend sync, or a separate game economy.

## Added

- Mascot Evolution Preview card inside Mascot Progression.
- Current/next/future mascot forms shown as a visual roadmap.
- Locked future stages shown with clear locked styling.
- Stage role labels:
  - Survivor
  - Awakening
  - Leak Fixer
  - Guardian
  - Legend
- Requirements shown per stage:
  - required mascot power threshold
  - power left to next form
  - real activity hint for each stage
- Clear copy that evolution is powered by real app activity only.
- Build version updated to `v59.56.3` with build note `Mascot Evolution Preview`.

## Explicitly unchanged

- no rewards/admin payout logic changes
- no wallet verification changes
- no Supabase schema changes
- no backend community boss sync
- no PvP
- no real multiplayer
- no token payout promise
- no game economy
- no Universal Check scoring changes
- no Daily Routine formula changes
- no transaction history, PnL, or scam-label changes

## Verification target

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run lint:quiet
NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Next planned stage

`v59.57.0 — Community Boss Prep` after `v59.56.3` is tested.
