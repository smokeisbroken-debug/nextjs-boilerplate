# Testing — v59.22 Rewards Hub Foundation

## Automated checks completed

The following commands passed in this environment:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Manual checks after deploy

1. Open the app and confirm the bottom nav shows `Rewards` instead of `Save`.
2. Open Rewards and confirm the top card says `Rewards Hub`.
3. Confirm BROKE Active Streak is visible inside Rewards.
4. Press `Track Leak` from the Rewards hero and confirm it opens Add.
5. Press `Read Chart` from the Rewards hero and confirm it opens Chart.
6. Press `Mark Clean Day` in the Active Streak card and confirm today becomes protected.
7. Press `One Fix` and confirm it opens Chart while recording proof.
8. Press `Daily Challenge` and confirm the Challenges section opens inside Rewards.
9. Confirm the Future Creator Fee Reward Pool card is locked/teaser-only.
10. Confirm the eligibility checklist shows:
    - verified wallet
    - $BROKE balance
    - 7+ day active streak
    - locked reward epoch
11. Confirm existing Save tools still work inside Rewards:
    - Survival Mode
    - Debt & Bills Radar
    - Home Habit Leaks
    - Pattern Challenge Coach
    - Challenges
    - Public Leaderboard
    - Leak Cut Scenarios
12. Confirm no payout/claim/transfer UI appears.
13. Confirm no Supabase migration is required.
