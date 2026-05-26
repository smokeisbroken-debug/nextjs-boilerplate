# TESTING — v59.25

Recommended checks:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open the app and tap the `?` guide.
2. Open the Rewards tab inside the guide.
3. Confirm the guide title says `Rewards: Proof, Streak, Future Holder Rewards`.
4. Confirm the guide explains Today’s Proof, Mark Clean Day, One Fix, Daily Challenge, 7+ day streak, Recovery Mode, Balance-share, Reward epoch, Notifications Prep, and Share Active Streak Card.
5. Open Rewards → Future Holder Rewards.
6. Confirm the `Quick reward terms` card appears and stays compact.
7. Confirm no long explanation was added back to the main Rewards overview card.
8. Confirm all major Rewards blocks remain collapsed by default except the lightweight top overview.
9. Confirm the app still builds and no new API or Supabase step is required.

No database migration is required.
