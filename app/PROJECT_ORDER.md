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


## v59.59.0 — My BROKE Proof Center

- Adds one collapsed My BROKE Proof center in Rewards.
- Unifies Mascot, Weekly Boss, Social Leaderboard, Routine, and Challenge proof cards into one public-safe card layout.
- Each card supports Copy text, Share image, Share to X image-first flow, and Send to bot.
- No wallet value, income, balance, debt detail, payout promise, Supabase schema, PvP, backend community sync, or reward/admin payout logic changed.


## v59.59.1 — Proof Components Split / Refactor

- Extracted My BROKE Proof Center UI/types into `app/components/BrokeProofCenter.tsx`.
- Kept share side effects in `app/page.tsx` so existing image, X, bot and copy flows stay unchanged.
- No user-facing behavior, payout logic, wallet verification, Supabase schema, PvP, or reward promise changes.


## v59.59.2 — Proof Center QA / Mobile Polish

- Hardens My BROKE Proof Center mobile layout.
- Keeps proof tabs inside screen bounds with horizontal tab scrolling.
- Makes share action buttons compact and consistent on narrow screens.
- Adds a selected-proof hint and stronger public-safe fallback note.
- Keeps all proof cards public-safe and does not change backend, rewards, wallet verification, payout logic, PvP, or game economy.


## v59.59.3 — Rewards Layout Cleanup

- Adds a compact Rewards map so users understand Proof, Boss, Routine, and Tools lanes.
- Moves Social Leaderboard next to the other social/game blocks.
- Tightens Rewards section summaries and mobile wrapping.
- Keeps My BROKE Proof as the main share center and marks the separate streak card as optional legacy share.
- No backend, schema, payout, wallet verification, PvP, or game economy changes.


## v59.60.0 — Community Boss Backend Plan / Schema Draft

- Adds documentation for Community Boss backend data boundaries, schema draft, and API contract.
- Adds draft SQL for public-safe weekly boss tables, aggregate table, audit table, indexes, view, and RLS policies.
- Keeps Community Boss as local-only preview in the app; no API writes or database sync are enabled.
- Explicitly forbids wallet value, balances, income, debt, payout value, rewards promises, PvP, and game economy fields in Community Boss backend.
- Next planned step: v59.60.1 Community Boss Safe Sync API Skeleton.


## v59.60.1 — Community Boss Safe Sync API Skeleton

- Adds dry-run Community Boss API skeleton routes:
  - `GET /api/community-boss/current`
  - `POST /api/community-boss/proof`
  - `POST /api/community-boss/recalculate`
- Adds shared helper/types in `app/lib/brokeCommunityBoss.ts`.
- Proof route sanitizes safe fields, clamps numbers, rejects private/financial forbidden fields, and returns `persisted: false`.
- No Supabase writes, no migration auto-run, no backend sync enabled, no payout, no wallet value, no PvP.


## v59.60.2 — Community Boss Supabase Migration Review / Apply Prep

- Adds pending manual Supabase SQL in `supabase/migrations_pending/`.
- Adds a migration review/apply checklist document.
- Adds backend readiness reporting to Community Boss dry-run API responses.
- Keeps `canWrite:false` and `persisted:false`; no Supabase writes, no migration auto-run, no payouts, no wallet value, no PvP.
- Next planned step: read-only DB path prep after manual migration review.


## v59.60.3 — Community Boss DB Read Path Prep

- Adds read-only Supabase aggregate read path for `GET /api/community-boss/current`.
- Reads only from public-safe view `broke_community_boss_public_weeks` when readiness flags and Supabase ENV are present.
- Falls back to dry-run if flags/ENV/table/current row are missing.
- Adds `COMMUNITY_BOSS_DB_READ_ENABLED` readiness guard.
- Keeps proof submit and recalculation endpoints no-write.
- No migration auto-run, no proof writes, no payout, no wallet value, no PvP.


## v59.60.4 — Community Boss Seed Week / Admin Prep

- Adds admin-protected dry-run seed route: `POST /api/community-boss/seed-week`.
- Adds manual pending seed SQL for the current weekly Community Boss row and zero aggregate row.
- Adds seed readiness flags while keeping `canSeedWrite:false` and no Supabase writes.
- No user proof writes, no payout, no wallet value, no PvP, and no game economy changes.


## v59.60.5 — Community Boss Aggregate UI Readiness

- Adds client-side Community Boss aggregate readiness display in the Community Boss Prep card.
- Reads `GET /api/community-boss/current` and shows data source, seeded/not seeded, read fallback, community damage, participant count, and write path disabled status.
- Keeps backend writes, user proof persistence, payouts, wallet value, PvP, and game economy disabled.
- Next planned step: v59.60.6 Community Boss Proof Submit Dry-Run UI.


## v59.60.6 — Community Boss Proof Submit Dry-Run UI

- Adds Safe proof submit dry-run UI inside Community Boss Prep.
- Posts public-safe proof summary to `POST /api/community-boss/proof`.
- Displays sanitized response and `persisted:false`.
- No Supabase writes, no proof persistence, no aggregate writes, no payout, no wallet value, no PvP.


## v59.60.7 — Community Boss Proof Submit Server Auth Prep

- Adds server-side Telegram initData / web session auth check to Community Boss proof dry-run route.
- Sends Telegram initData from client dry-run submit when available.
- Returns public-safe auth status without exposing raw Telegram ID.
- Optional `COMMUNITY_BOSS_PROOF_AUTH_REQUIRED=true` can require auth for dry-run proof submit.
- Still no Supabase writes, proof persistence, payout, wallet value, PvP, or game economy changes.


## v59.60.8 — Community Boss Proof Persistence Flag Prep

- Adds explicit proof persistence readiness flags and API response metadata.
- `POST /api/community-boss/proof` returns a `persistence` object with `canPersist:false` and `persisted:false`.
- Community Boss Prep UI now shows proof persistence gate status.
- No Supabase writes, no proof persistence, no aggregate writes, no payout, no wallet value, no PvP.


## v59.60.9 — Community Boss Proof Persistence Dry-Run Server Path

- Adds future proof persistence dry-run server path behind explicit flags.
- Builds a public-safe Supabase upsert row for `broke_community_boss_user_proofs` without executing the write.
- `POST /api/community-boss/proof` returns `persistenceDryRun` with target table, conflict target, blocked reasons, and guardrails.
- Community Boss Prep UI shows server path Prepared/Blocked and DB target.
- No Supabase write, no proof persistence, no aggregate write, no payout, no wallet value, no PvP.


## v59.61.0 — Community Boss Proof Persistence Manual Write Gate

- Adds the first real Community Boss proof upsert path behind explicit manual gates.
- `POST /api/community-boss/proof` can persist a sanitized authenticated safe proof row only when all flags/env are ready.
- Default state remains locked/no-write.
- UI now distinguishes dry-run, manual write gate, upsert attempted, and persisted states.
- No payout, no wallet value, no PvP, no reward promises, and no game economy changes.


## v59.61.1 — Community Boss Aggregate Recalculate Manual Gate

- Adds admin-protected aggregate recalculation write path behind manual flags.
- `POST /api/community-boss/recalculate` can read safe proof rows and upsert public aggregate when all gates are enabled.
- Community Boss Prep UI now shows Aggregate gate status.
- No payout, wallet value, PvP, reward promises, or game economy changes.


## v59.61.2 — Community Boss Live Aggregate Refresh

- Adds live aggregate refresh metadata to `GET /api/community-boss/current`.
- Adds manual Refresh aggregate action inside Community Boss Prep.
- After a persisted proof, UI triggers a public aggregate read refresh.
- Refresh reads only public-safe aggregate data and performs no writes.
- No payout, wallet value, PvP, reward promise, or game economy changes.
