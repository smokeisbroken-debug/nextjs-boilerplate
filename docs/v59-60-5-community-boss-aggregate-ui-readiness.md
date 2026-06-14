# v59.60.5 — Community Boss Aggregate UI Readiness

Base: v59.60.4 — Community Boss Seed Week / Admin Prep

## Status

This patch prepares the visible UI for backend aggregate readiness. It does not add user proof writes, payout math, wallet value exposure, or PvP.

## Changes

- Community Boss Prep now checks `GET /api/community-boss/current` from the client.
- The UI shows whether the aggregate source is dry-run or Supabase.
- The UI shows seeded/not seeded state for the current week row.
- The UI shows read path status and fallback reason.
- The UI shows community damage/participant/progress values from the read endpoint when available.
- The UI keeps write path explicitly disabled until a later reviewed patch.

## UI fields

The Community Boss Prep card now displays:

- aggregate source;
- backend status;
- week row status;
- read path state;
- community damage;
- participant count;
- write path disabled state;
- first missing readiness items.

## Guardrails

No changes to:

- Supabase schema;
- migration auto-run;
- user proof persistence;
- aggregate writes;
- rewards/admin payout;
- wallet verification;
- PvP/multiplayer;
- Universal Check scoring;
- Daily Routine formula;
- transaction history/PnL/scam labels;
- wallet value/balance/income/debt exposure;
- token reward promises;
- game economy.

## Next stage

`v59.60.6 — Community Boss Proof Submit Dry-Run UI`

Recommended scope:

- add a visible safe proof submit button;
- POST sanitized local proof to dry-run `/api/community-boss/proof`;
- show sanitized response;
- still `persisted:false`;
- still no Supabase writes.
