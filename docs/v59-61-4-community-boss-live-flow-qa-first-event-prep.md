# v59.61.4 — Community Boss Live Flow QA / First Real Event Prep

Base: v59.61.3 — Community Boss Post-Proof Recalculate Admin Flow

## Status

This patch prepares the first live Community Boss event flow without adding payout mechanics, wallet value exposure, PvP, or a game economy.

## Changes

- Adds a Live Flow QA panel inside Rewards → Community Boss Prep.
- Shows the full chain readiness:
  - read path;
  - week seed;
  - proof auth;
  - proof write;
  - aggregate recalculation;
  - live UI read.
- Adds a First Event next-action hint so the operator knows the next safe step.
- Keeps the existing proof submit, aggregate refresh, and admin recalculation separation.
- Reduces uncertainty before the first real Community Boss event.

## First live event checklist

Before announcing the first live event, verify:

1. Current week is seeded.
2. Public aggregate read path returns Supabase data.
3. Authenticated proof submit works.
4. Proof write manual gate is enabled only after migration review.
5. At least one safe proof row persists.
6. Admin aggregate recalculation writes public totals.
7. Community Boss Prep refresh shows the new public aggregate.

## Guardrails

No changes to:

- Supabase schema;
- migration auto-run;
- payout math;
- reward/admin payout;
- wallet verification;
- PvP/multiplayer;
- wallet value/balance/income/debt exposure;
- token reward promises;
- Universal Check/Daily Routine/transaction history/PnL/scam-label logic;
- game economy.
