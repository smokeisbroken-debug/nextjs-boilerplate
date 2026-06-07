# Smoke Is Broke — v59.52.7 Wallet Balance Persist + Share Image Hardening

This hotfix keeps `Recheck $BROKE balance` truly live by preserving the fresh RPC snapshot during verified-status sync and saving the checked balance snapshot to the existing wallet-link record when Telegram auth is available. It also hardens Android Telegram share-card capture by removing decorative capture artifacts, pseudo-elements, heavy filters, and high capture scale for profile public cards.

## Changes

- Live balance recheck now passes Telegram auth to `/api/wallet/balance`.
- `/api/wallet/balance` can persist the latest balance/percent/tier into `broke_wallet_links` without requiring a schema change.
- Verified-status refresh preserves the fresh live balance snapshot instead of restoring stale stored values.
- Android share image capture uses a lower capture scale and stricter safe styles for public profile cards.
- No rewards/admin payout, verification signature flow, Supabase schema, Universal Check scoring, Daily Routine formula, transaction history, PnL, scam labels, or investment advice changed.

## Verification

- `npm ci --ignore-scripts --no-audit --no-fund`
- `npm run typecheck`
- `npm run lint:quiet`
- `NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build`

---

# Project Order — v59.52.6 Wallet Balance Live Recheck Hotfix

v59.52.6 is a targeted hotfix on top of v59.52.5 stable8. It makes the Profile wallet `$BROKE` balance Recheck action force a live RPC balance fetch instead of being overwritten by older verification-status data. The client now sends no-store balance requests with a timestamp, uses the linked wallet as fallback when the draft input is empty, updates the draft after a successful check, and preserves the freshly fetched live balance while silently syncing verified/watched status.

Changed:
- `app/page.tsx`
- `app/lib/brokeAdminRewards.ts`

Not changed:
- Rewards/Admin payout logic
- Wallet verification signature flow
- Supabase schema
- Universal Check scoring
- Daily Routine rules
- Transaction history, PnL, scam labels, or investment advice

Checks:
- `npm run typecheck`
- `npm run lint:quiet`
- production build attempted separately

