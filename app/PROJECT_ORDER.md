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

## v59.58.3 — Weekly Boss Action Polish

- Added boss weakness, today battle status, stronger hit labels, battle result, and improved next best hit.
- Visual/social polish only: no payouts, no PvP, no schema changes, no game economy.


## v59.58.4 — Weekly Boss Image Share Polish

- Weekly Boss `Share to X` now tries to generate the PNG card first and open the native share sheet with the image + text.
- If native file share is unavailable, the app downloads the PNG, copies the proof text when possible, opens X text share, and tells the user to attach the downloaded card manually.
- No payout logic, schema, PvP, wallet verification, or reward promises changed.


## v59.58.5 — Social Game Guide Polish

- Adds Guide Search coverage for Weekly Boss, boss damage, boss weakness, Safe Points, Community Boss Prep, and why social progress avoids wallet value/payout promises.
- Adds compact in-app guide strips to Weekly Boss, Community Boss Prep, and Social Leaderboard so users understand the social game layer.
- Reinforces that BROKE remains a Life Tracker: real habits make mascot/boss/social proof stronger.
- No Supabase schema, payout logic, PvP, wallet verification, Universal Check scoring, Daily Routine formula, transaction history/PnL/scam labels, wallet value exposure, token reward promises, or game economy changed.
