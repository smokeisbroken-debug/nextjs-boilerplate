# PROJECT ORDER — v59.30 Daily Routine No-Spend + Growth Fairness Polish

## Current stable base

Apply this patch on top of v59.29.1 Jupiter Wallet Provider Hotfix.

## Patch scope

Files changed:

- `app/page.tsx`
- `app/globals.css`
- `app/api/broke/route.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- matching docs under `app/`

## Implementation notes

### Daily Routine

Daily Routine now uses no-spend-compatible actions:

1. Open the app.
2. Check wallet state.
3. Review today’s spend or confirm no extra spend.
4. Lock one next move.
5. Check Chart.
6. Check Rewards.
7. Share on X.

The full 7/7 completion is still the only source of `daily_routine` Active Streak proof.

### App-state sync

`dailyRoutineActions` now includes:

- `reviewedWallet`
- `reviewedDay`
- `lockedNextMove`

The server app-state normalizer was updated so these fields can sync instead of being dropped.

### Growth Lab

Growth Lab now separates:

- base saving;
- leak boost;
- total monthly goal progress.

This prevents the wrong impression that fewer leaks make the goal harder. If no leaks are detected, the user can still create a base-saving plan.

## Safety boundaries

This patch does not enable treasury payouts or token movement. It is a product logic and UX correction only.
