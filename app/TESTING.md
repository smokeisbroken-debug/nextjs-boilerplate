# Smoke Is Broke — v59.47.1 Wallet Leak Share Card

v59.47.1 adds a local Wallet Leak Score PNG share card on top of the v59.47.0 manual wallet-behavior self-check. It keeps the feature framed as Manual Self-Check / Educational / Wallet Behavior Leaks / Not Wallet Surveillance / Not Financial Advice.

## Patch contents

- Added Wallet Leak share-card preview in the Wallet Leak Score screen.
- Added `Send to TG bot`, `Share card`, and `Save PNG` actions using the existing share image helper and `/api/share-result` route.
- Added Telegram fallback behavior: outside Telegram or on bot delivery failure, the PNG is saved locally.
- Added mobile-safe card styling and compact signal chips for small WebView screens.
- Updated shared build marker to `v59.47.1`.

## Boundaries

- No wallet API.
- No on-chain wallet history scan.
- No Supabase persistence.
- No public wallet/project database.
- No automated wallet accusations.
- No investment advice.
- No payout logic changes.
- No reward eligibility formula changes.
- No Daily Routine / Active Streak changes.
- No wallet verification changes.
- No Admin distribution API changes.
- No payout-wallet env changes.
- No server auto-send changes.

## Manual verification

1. Open the app.
2. Switch to Pro Mode.
3. Open Wallet.
4. Add wallet label and optional public wallet address.
5. Select several behavior leaks.
6. Add local notes.
7. Confirm local score changes.
8. Confirm share-card preview updates.
9. Tap `Save PNG`.
10. Tap `Share card`.
11. Open inside Telegram and tap `Send to TG bot`.
12. Confirm the PNG arrives in the bot chat or falls back to local save.
13. Confirm `Copy text` and `Share text` still work.
14. Confirm Project Leak Research and Admin/Rewards screens remain unchanged.

## Verification run

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` passed.
- Targeted brace/paren balance passed.
- Targeted BigInt suffix scan passed.
- Zip integrity passed.
