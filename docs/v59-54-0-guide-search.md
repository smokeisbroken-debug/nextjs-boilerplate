# v59.54.0 — Guide Search

## Purpose

Improve guide usability without changing app logic.

## Changes

- Added a search bar inside the app guide modal.
- Added quick guide filters: All, Rewards, Wallet, Routine, Mascot, Leaderboard, Check.
- Search scans guide labels, titles, intros, section titles, and section body text.
- Search results show the source guide label and a short preview.
- Added an empty state for unknown keywords.
- Added an “Open this guide” action from each result.
- Added Rewards guide entries for Mascot Progression and Public Leaderboard.
- Included the Check guide tab in the guide tab list.

## Not changed

- No rewards/admin payout changes.
- No wallet verification changes.
- No Supabase schema changes.
- No Universal Check scoring changes.
- No Daily Routine formula changes.
- No Mascot activity/power logic changes.
- No game mode changes.

## Verification

Run:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run lint:quiet
NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```
