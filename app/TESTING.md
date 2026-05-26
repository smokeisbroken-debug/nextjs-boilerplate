# TESTING — v59.25.1

## Verified in patch workspace

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Result: passed.

## Manual QA checklist

1. Open Rewards.
2. Open Today’s Proof.
3. Tap **Mark Clean Day**.
4. Confirm Today changes to protected and Active Streak shows at least `1d` / `1/7`.
5. Refresh app.
6. Confirm streak proof remains protected.
7. Wait for cloud sync or reopen Telegram Mini App.
8. Confirm proof does not reset to `0d`.
9. Tap **Daily Challenge**.
10. Confirm Daily Challenge is logged as proof and challenge area opens.

## Regression checks

- Track Leak still records a normal expense.
- One Fix still logs proof and opens Chart.
- Rewards Notifications settings still keep independent state.
- Future Holder Rewards text still uses balance-share wording.
