# TESTING — v59.25.2

## Verified in patch workspace

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Result: passed.

## Manual QA checklist

### Formula consistency

1. Open Home.
2. Check Income, Life Cost, Money Leaks, Real Balance, and Wallet HP.
3. Open Wallet Snapshot.
4. Select Today in the day chips.
5. Confirm `State after day` lines up with Home `Real Balance` for the same current-month data.
6. Add an old current-month expense more than 7 days ago and confirm weekly snapshot still starts from the corrected month baseline.

### Rewards readiness

1. Open Rewards.
2. Confirm Future Holder Rewards does not show `Ready` unless all are true:
   - wallet verified;
   - verified $BROKE balance is 100K+;
   - Active Streak is 7+ days.
3. Use watch-only wallet balance and confirm it does not appear as verified holder proof on the Active Streak share card.

### Streak proof regression

1. Open Rewards.
2. Open Today’s Proof.
3. Tap **Mark Clean Day**.
4. Confirm Today changes to protected and Active Streak shows at least `1d` / `1/7`.
5. Refresh app and wait for cloud sync.
6. Confirm proof does not reset to `0d`.

### Old Save wording cleanup

1. Open the `?` guide.
2. Check Home and Rewards guide sections.
3. Confirm the old bottom tab is described as **Rewards**, not **Save**, except where `save` is used as a normal verb such as saving a Growth plan.
