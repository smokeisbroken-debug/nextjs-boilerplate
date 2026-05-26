# PROJECT ORDER — v59.28 Daily Routine Streak Lock + Site Embed Fit

## Current patch

v59.28 simplifies Active Streak into one clear rule: finish Daily Routine, including Share on X, to protect the streak.

## Files changed

- `app/page.tsx`
- `app/globals.css`
- `app/api/broke/route.ts`
- `app/api/rewards/snapshot/route.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Product order

1. Daily Routine is the only Active Streak proof path.
2. Rewards explains the rule and sends the user to Daily Routine.
3. Chart remains read-only proof history.
4. Snapshot ledger eligibility reads the same normalized Daily Routine proof log.
5. External-site iframe display is kept phone-width and centered to avoid stretched Mini App layout.

## Safety line

This patch is UX/proof-normalization only. It does not activate payouts, claims, staking, token transfers, Creator Fee distribution, or reward execution.
