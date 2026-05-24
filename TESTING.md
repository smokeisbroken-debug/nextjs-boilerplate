# v59.9 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Home.
2. Confirm **Weekly Behavior Report** appears below Today's Focus.
3. With no/low data, confirm it says the report is still learning.
4. Add a few Grey-zone / Full-leak records with trigger chips.
5. Confirm Weekly Behavior Report updates with pattern, pressure, and next move.
6. Tap **Open full report** and confirm Chart opens.
7. Tap **Copy safe text** and confirm toast feedback appears.
8. Confirm no private income or real balance appears in copied text.
