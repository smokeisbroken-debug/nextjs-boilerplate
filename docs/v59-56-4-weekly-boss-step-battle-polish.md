# v59.56.4 — Weekly Boss Step Battle Polish

## Goal

Polish the Weekly Boss social battle UI after testing showed the mascot and boss could stack vertically on small screens and the boss visual did not match the existing $BROKE app style.

This is a UX/presentation patch only. It does not add real gameplay, rewards, backend sync, PvP, or payout mechanics.

## Changes

- Weekly Boss arena now keeps mascot and boss facing each other in a compact side-by-side battle layout on mobile.
- Replaced the generated blob-style boss with an existing $BROKE leak-style app asset so the boss fits the app’s visual language better.
- Added a step-by-step damage log.
- Each boss contribution now shows:
  - step number;
  - action/proof source;
  - damage from that action;
  - cumulative damage after the action.
- `Replay steps` button now replays the active weekly proof steps one by one.
- Current replayed step is highlighted in the damage log.
- Existing sound toggle remains local and opt-in.

## Guardrails

Not changed:

- reward/admin payout logic;
- wallet verification;
- Supabase schema;
- backend community boss sync;
- PvP or multiplayer;
- Universal Check scoring;
- Daily Routine formula;
- transaction history, PnL, or scam labels;
- token reward promises;
- game economy.

Weekly Boss damage still comes from real app activity only.

## Verification

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Next planned stage

After this UI polish is tested, continue with:

`v59.57.0 — Community Boss Prep`

Safe scope: UI and logic preparation only, no backend community sync or payout promises unless explicitly approved later.
