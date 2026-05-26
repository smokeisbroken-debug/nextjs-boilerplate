# TESTING — v59.28 Daily Routine Streak Lock + Site Embed Fit

## Build checks

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Active Streak checks

Confirm:

- Track Leak does not directly protect Active Streak.
- Mark Clean Day does not directly protect Active Streak.
- One Fix does not directly protect Active Streak.
- Daily Challenge does not directly protect Active Streak.
- Completing all 7 Daily Routine actions records Daily Routine proof.
- The final Daily Routine action is completed only by Share on X.
- Copy text, Telegram share, native share, image download, and share-card export do not complete the final Daily Routine task.

## Rewards checks

Open Rewards and confirm:

- Rewards no longer shows separate proof task buttons for Track Leak, Clean Day, One Fix, or Daily Challenge.
- Rewards tells the user to open Daily Routine.
- Today protected / needs proof states are based on Daily Routine proof.
- Recovery wording says Daily Routine is needed.

## Chart checks

Open Chart and confirm:

- Active Streak Timeline still renders.
- Proof labels show Daily Routine proof instead of multiple independent proof tasks.
- Chart remains read-only history.

## Embedded-site checks

Open the app inside the external website/iframe and confirm:

- app content is centered;
- content does not stretch to the full desktop site width;
- bottom nav remains phone-width and centered;
- major cards remain readable on desktop and mobile embedding.

## Non-regression checks

Confirm existing flows still work:

- expense save/delete;
- Daily Routine checklist;
- share cards;
- wallet verification display;
- reward snapshot ledger display;
- Supabase sync;
- Telegram Mini App loading.
