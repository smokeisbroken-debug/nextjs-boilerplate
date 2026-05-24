# v59.8 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Profile.
2. Find **Share Studio** inside Personal Cabinet.
3. Toggle Survival Score, Wallet HP, Streak, Badges, Leaderboard, Biggest leak, Life hours, Status.
4. Confirm selected items appear in the preview.
5. Open Home → Profile Share Card / Share Result and confirm the share card follows the selected items.
6. Complete Daily Routine steps on one logged-in device.
7. Open the same account on another device and confirm completed routine state does not fall back to blank local state after sync.
8. Confirm Public Proof Mode still hides private money details.
