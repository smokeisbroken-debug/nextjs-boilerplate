# Testing — v59.52.12 Maybe Leak Impact Uses Counted Leak

v59.52.12 is a targeted accuracy hotfix for the Latest Impact card. When a Maybe/partial record has a necessary baseline, the app now uses the actual counted leak amount for repeated-daily, monthly, yearly, and life-hours impact.

## Changed

- Latest Impact now uses `getExpenseLeakValue(expense)` instead of raw total tracked amount.
- Partial leaks now show copy like: `leak counted from tracked`.
- Maybe examples such as `$5 tracked / $3 needed / $2 leak counted` now calculate monthly/yearly impact from `$2`, not `$5`.
- Build marker updated to `v59.52.12`.

## Not changed

- Rewards/Admin payout logic.
- Wallet verification.
- Supabase schema.
- Universal Check scoring.
- Daily Routine formula.
- Transaction history, PnL, scam labels, or investment advice.
