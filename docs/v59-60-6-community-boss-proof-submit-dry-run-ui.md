# v59.60.6 — Community Boss Proof Submit Dry-Run UI

Base: v59.60.5 — Community Boss Aggregate UI Readiness

## Status

This patch adds a UI dry-run submit path only.

It does not persist user proof, does not write to Supabase, does not update aggregates, and does not enable rewards or payout logic.

## Changes

- Adds a Safe proof submit panel inside Rewards → Community Boss Prep.
- Adds a dry-run submit button that posts safe public proof to `POST /api/community-boss/proof`.
- Shows sanitized response values returned by the API.
- Shows `persisted:false` clearly in the UI.
- Shows guardrails returned by the proof endpoint.
- Keeps backend write path disabled.

## Submitted safe fields

The client sends only public-safe summary fields:

- `weekKey`
- `weeklyDamage`
- `safePoints`
- `proofCount`
- `mascotStage`
- `mascotPowerBucket`
- `badgeCount`
- `routineCompleted`
- `trackingDays`
- `challengeCompleted`
- `weaknessHit`

## Forbidden data

This patch still does not send or store:

- wallet balance;
- wallet value;
- income;
- debt;
- payout amount;
- reward allocation;
- transaction history;
- raw expense descriptions;
- private budget or payday data.

## Guardrails

No changes to:

- Supabase schema;
- migration auto-run;
- proof persistence;
- aggregate writes;
- rewards/admin payout;
- wallet verification;
- PvP/multiplayer;
- Universal Check scoring;
- Daily Routine formula;
- transaction history/PnL/scam labels;
- token reward promises;
- game economy.

## Next stage

`v59.60.7 — Community Boss Proof Submit Server Auth Prep`

Recommended next step: prepare auth/session validation for proof writes while still keeping persistence disabled.
