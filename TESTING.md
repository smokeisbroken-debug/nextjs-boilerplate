# v59.24.1 — Rewards Compact Balance Polish Testing

Recommended checks:

1. Open Rewards.
2. Confirm the first visible block is the new June 1 Rewards overview card.
3. Confirm the overview is compact and readable on mobile.
4. Confirm Today’s Proof is collapsed by default and opens correctly.
5. Confirm Streak & Recovery is collapsed by default and opens correctly.
6. Confirm Future Holder Rewards is collapsed by default and contains the 100K $BROKE minimum hold wording.
7. Confirm Share Active Streak Card is collapsed by default and opens correctly.
8. Confirm Notifications Prep is collapsed by default and opens correctly.
9. Confirm old Rewards tools remain available below.
10. Confirm Rewards buttons use dark/glass premium styling instead of bright neon fills.
11. Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```
