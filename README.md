# v59.8 — Profile Share Studio & Account State Cleanup

Patch-only update built from the uploaded latest stable archive `nextjs-boilerplate-main(3).zip`.

## Product changes
- Adds one central **Share Studio** inside Profile / Personal Cabinet.
- Users can choose which public profile items appear on their main share card.
- Share card output now follows the Profile Share Studio selection.
- Daily routine / mission state is included in account app-state sync so a second device should not reset completed routine steps back to local-only state.
- Keeps Public Proof Mode private-first: income, real balance, payday, and private debt details remain hidden by default.

## No migration required
This uses existing `settings_payload` and `app_state_payload`.
