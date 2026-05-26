# v59.24 — Rewards Notifications Prep Testing

Recommended checks:

1. Open Rewards.
2. Confirm Rewards Status hero still renders.
3. Confirm Daily Proof Checklist still works.
4. Confirm Notifications Prep card appears below the checklist.
5. Toggle Daily Proof / Recovery / 7-day reached buttons.
6. Select 09:00, 18:00, and 21:00 reminder time chips.
7. Click Copy reminder plan and confirm clipboard/toast behavior.
8. Complete a proof action and confirm toast wording for today protected.
9. Build a 7-day test state and confirm 7-day reached wording.
10. Confirm no payout, claim, staking, transfer, or reward epoch UI became active.

Verification commands:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

# Testing — v59.23 — Rewards Proof Polish + Shareable Active Streak Card

## Automated checks completed

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Manual checks after deploy

1. Open Rewards and confirm the top status card shows current streak, today state, wallet state, holder tier, and reward status.
2. Confirm the Daily Proof Checklist shows Track Leak, Mark Clean Day, One Fix, and Daily Challenge.
3. Press Track Leak and confirm it opens Add.
4. Press One Fix and confirm it records proof and opens Chart.
5. Press Daily Challenge and confirm it opens the Challenges section.
6. If recovery mode is active, confirm the copy says two proof actions are required.
7. Confirm the “How future Holder Rewards will work” explainer appears below the readiness cards.
8. Confirm the Active Streak share card shows profile avatar/custom avatar, identity, active streak, today status, wallet verification, holder tier, and reward status.
9. Test Copy text from the Active Streak card.
10. Test Share on X opens a tweet intent with the proof text.
11. Test Share image in Telegram WebView and in normal browser fallback.
12. Confirm old Rewards tools still open and close: Survival Mode, Debt & Bills Radar, Home Habit Leaks, Challenges, Public Leaderboard, and Leak Cut Scenarios.
13. Confirm Home still does not show the large Active Streak card.

## Safety checks

- Confirm no payout, claim, staking, token transfer, reward epoch, or Creator Fee distribution UI is active.
- Confirm public proof text does not expose income, real balance, payday, seed phrase, or debt details.

---

# Testing — v59.22.1 — Rewards UI Placement Hotfix

## Manual checks after deploy

1. Open Home and confirm the large `BROKE Active Streak` card is no longer shown there.
2. Confirm Home still shows the Wallet Snapshot open by default.
3. Open Rewards and confirm `BROKE Active Streak` is still visible there.
4. Confirm `Track Leak`, `Mark Clean Day`, `One Fix`, and `Daily Challenge` buttons render as clean 2x2 action buttons on mobile.
5. Confirm Rewards tool rows such as Survival Mode, Debt & Bills Radar, Home Habit Leaks, Challenges, Public Leaderboard, and Leak Cut Scenarios show horizontal `Open` / `Close` pills, not vertical cramped text.
6. Confirm opening and closing Rewards tool rows still works.
7. Confirm bottom nav still has six items and the Rewards icon opens the Rewards tab.

## Automated checks in this environment

- `app/page.tsx` TSX transpile diagnostics: passed
- `app/globals.css` brace balance: passed

Full npm checks were not rerun for this small UI placement/CSS hotfix.

---

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
