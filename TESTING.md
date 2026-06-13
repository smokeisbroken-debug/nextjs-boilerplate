# Smoke Is Broke — v59.52.15 Share Bot Flat Capture Hardening

v59.52.15 is a targeted share-card export hotfix on top of v59.52.14 stable8.

## Changes

- Bot/share PNG capture now uses a flat export mode.
- Android/Telegram capture scale is reduced to 1 for stability.
- Capture clone removes filters, backdrop filters, pseudo-elements, shadows, blend modes, decorative art, and animated layers.
- UI appearance in the app is unchanged; only the generated PNG export is simplified for reliability.

## Not changed

- Rewards/admin payout logic.
- Wallet verification.
- Supabase schema.
- Universal Check scoring.
- Daily Routine formula.
- Transaction history, PnL, scam labels, or investment advice.

## Verification

- Run `npm run typecheck`.
- Run `npm run lint:quiet`.
- Run `NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build` when local dependencies are available.

## v59.53.2 test notes
- Open Rewards.
- Confirm Mascot Progression shows current stage.
- Open Evolution path.
- Open How to grow.
- Confirm no admin payout or wallet verification flows changed.


## v59.58.5 — Social Game Guide Polish

- Adds Guide Search coverage for Weekly Boss, boss damage, boss weakness, Safe Points, Community Boss Prep, and why social progress avoids wallet value/payout promises.
- Adds compact in-app guide strips to Weekly Boss, Community Boss Prep, and Social Leaderboard so users understand the social game layer.
- Reinforces that BROKE remains a Life Tracker: real habits make mascot/boss/social proof stronger.
- No Supabase schema, payout logic, PvP, wallet verification, Universal Check scoring, Daily Routine formula, transaction history/PnL/scam labels, wallet value exposure, token reward promises, or game economy changed.
