# v59.24.2 — Rewards Balance-Share Wording Hotfix Testing

Recommended checks:

1. Open Rewards.
2. Confirm the first visible block is the June 1 Rewards overview card.
3. Confirm the overview is compact and says distribution is based on each eligible holder’s $BROKE balance share.
4. Confirm Today’s Proof is collapsed by default and opens correctly.
5. Confirm Streak & Recovery is collapsed by default and opens correctly.
6. Confirm Future Holder Rewards is collapsed by default and contains the 100K $BROKE minimum hold plus balance-share wording.
7. Confirm Share Active Streak Card is collapsed by default and opens correctly.
8. Confirm Notifications Prep is collapsed by default and opens correctly.
9. Confirm old Rewards tools remain available below.
10. Confirm examples/wording do not imply fixed tier percentages; share should be described as holder eligible balance divided by total eligible balance.
11. Confirm Rewards buttons use dark/glass premium styling instead of bright neon fills.
12. Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```
