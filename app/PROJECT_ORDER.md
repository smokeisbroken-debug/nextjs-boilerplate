# PROJECT ORDER — v59.25.2

Current patch: **v59.25.2 — Formula & Rewards Consistency Audit**.

## Scope

This patch audits and aligns formulas/copy after the Rewards and Active Streak work. It is a consistency patch, not a new reward payout system.

## Files changed

- `app/page.tsx`
- `app/api/broke/route.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Product rules preserved

- A normal day is protected by at least one proof action.
- Recovery still requires two proof actions during the recovery day.
- 7+ Active Streak is live eligibility foundation, not a one-time unlock.
- Future Holder Rewards are preparation-only in the app.
- Balance-share wording remains: user eligible BROKE / total eligible BROKE.

## Main audit fixes

1. Home/Wallet Snapshot chart balances now line up better with monthly Real Balance.
2. Client wallet totals now flow through one shared visible summary helper.
3. Server badge/leaderboard wallet formulas now match client income/fixed-cost/leak weighting rules.
4. Rewards `Ready` state now uses the planned 100K+ verified holder requirement consistently.
5. Watch-only balances no longer appear as verified holder proof in the Active Streak share output.
