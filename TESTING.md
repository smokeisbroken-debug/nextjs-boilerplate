# TESTING — v59.26

## Verified in patch workspace

```bash
npm run typecheck
npm run lint:quiet
```

Result: passed.

`NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully and finished TypeScript, then timed out in this sandbox during/after static page generation. Full final build completion was not confirmed here. Re-run the same build command in the deployment workspace.

## Manual QA checklist

### Chart Active Streak Timeline

1. Open Rewards.
2. Complete one proof action such as Mark Clean Day or Daily Routine 7/7.
3. Open Chart.
4. Confirm **Active Streak Timeline** appears below Chart stats.
5. Confirm Today shows protected and the correct proof action label.
6. Refresh the app and wait for cloud sync.
7. Confirm the proof timeline still shows the same protected day.

### Recovery / missed day display

1. Use a test account or local storage state with a missed yesterday scenario.
2. Open Chart.
3. Confirm recovery/missed state is visible and not presented as a payout or reward claim.
4. Complete two proof actions in Rewards.
5. Return to Chart and confirm the missed day shows as recovered.

### Copy consistency

1. Open Home, Chart, Growth, Rewards, and Profile.
2. Confirm the bottom nav uses Rewards, not old Save wording.
3. Confirm Growth still uses “Save plan” only as a verb for saved simulations.
4. Confirm Rewards remains the place for proof actions and Chart remains read-only history.

### Regression checks

1. Track Leak still saves expenses and logs proof.
2. Daily Routine 7/7 still logs `daily_routine` proof.
3. Mark Clean Day still logs proof.
4. One Fix and Daily Challenge still log proof.
5. Wallet formulas and Holder Rewards wording remain unchanged.
