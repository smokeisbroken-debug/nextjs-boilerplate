# Smoke Is Broke — v59.52.9 Auto Wallet Balance Refresh + Share Card Safe Export

v59.52.9 is a targeted hotfix on top of v59.52.8 stable8.

## Changes

- Linked wallet $BROKE balance now auto-refreshes while Profile is open, when the app regains focus, and on a safe interval.
- Auto-refresh uses the same live RPC + persistence path as Recheck/Rescan.
- Auto-refresh is quiet when the balance is unchanged, but shows a message when buy/sell activity changes the visible $BROKE balance.
- Android share-card export is further hardened for Daily/Weekly/Profile-style cards by removing heavy effects, pseudo-elements, decorative art, blend modes, and filters during capture.
- Android capture scale is reduced to 1 to reduce Telegram WebView html2canvas artifacts.

## Unchanged

No wallet signature verification flow, rewards/Admin payout logic, Supabase schema migration, Universal Check scoring, Daily Routine formula, transaction history, PnL, scam labels, or investment advice changed.
