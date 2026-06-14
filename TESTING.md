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


## v59.60.0 Community Boss Backend Plan / Schema Draft

- Documentation-only backend/schema draft.
- Confirm docs exist:
  - `docs/v59-60-0-community-boss-backend-plan.md`
  - `docs/v59-60-0-community-boss-schema-draft.sql`
  - `docs/v59-60-0-community-boss-api-contract.md`
- No runtime backend sync should be active in this patch.


## v59.60.1 Community Boss Safe Sync API Skeleton

- Run `npm run typecheck`.
- Run `npm run lint:quiet`.
- Run production build.
- Optional API checks after local server start:
  - `GET /api/community-boss/current` should return `persisted:false`.
  - `POST /api/community-boss/proof` with safe fields should return sanitized proof and `persisted:false`.
  - `POST /api/community-boss/proof` with `balance` or `walletValue` should return 400.


## v59.60.2 Community Boss Supabase Migration Review / Apply Prep

- Confirm `supabase/migrations_pending/v59_60_2_community_boss_schema_review_required.sql` exists.
- Confirm the migration is not placed in `supabase/migrations/`.
- Run `npm run typecheck`.
- Run `npm run lint:quiet`.
- Run production build.
- Optional route check after local server start: `GET /api/community-boss/current` should include `backendReadiness.canWrite:false`.
- Optional proof route check: `POST /api/community-boss/proof` should still return `persisted:false`.


## v59.60.3 Community Boss DB Read Path Prep

- Run `npm run typecheck`.
- Run `npm run lint:quiet`.
- Run production build.
- Confirm `GET /api/community-boss/current` still returns dry-run data when `COMMUNITY_BOSS_DB_READ_ENABLED` is not true.
- After manual migration and ENV enablement, confirm current can read from `broke_community_boss_public_weeks` and falls back safely if no row exists.
- Confirm `POST /api/community-boss/proof` still returns `persisted:false` and performs no write.
