# v59.58.2 — Weekly Boss Battle Polish

Improves the Weekly Boss social game layer after v59.58.1 mobile polish.

## Changes

- Adds rotating weekly boss identities derived from the week key.
- Adds boss HP remaining, HP bar, phase labels, and phase detail text.
- Adds result labels such as No hit yet, Boss weakened, Boss cracked, Boss breaking, and Boss defeated.
- Improves step-by-step replay feedback with current step damage shown in the arena impact area.
- Adds a stronger empty state when the mascot has not hit the boss yet.
- Adds a Next best hit panel with potential damage and the real app action needed next.
- Adds a more precise weekly reset hint with days/hours and next boss start date.

## Guardrails

- No reward/admin payout logic changed.
- No wallet verification changes.
- No Supabase schema changes.
- No backend community boss sync.
- No PvP or multiplayer.
- No token reward promises.
- No game economy.
- No Universal Check scoring changes.
- No Daily Routine formula changes.
- No transaction history, PnL, or scam-label changes.

## Verification

- `npm run typecheck` passed.
- `npm run lint:quiet` passed with the existing Babel deoptimization warning for large `app/page.tsx`.
