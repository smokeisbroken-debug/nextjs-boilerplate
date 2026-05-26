# PROJECT ORDER — v59.26

Current patch: **v59.26 — Chart Proof Timeline + Full App Consistency Polish**.

## Scope

This patch adds the Active Streak proof history to Chart and performs a visible-copy consistency audit across the app. It does not change reward distribution, wallet verification, balance formulas, or backend payout mechanics.

## Files changed

- `app/page.tsx`
- `app/globals.css`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Product rules preserved

- A normal day is protected by at least one valid proof action.
- Daily Routine counts only after full 7/7 completion.
- Recovery requires two proof actions during the recovery day.
- 7+ Active Streak is a live eligibility foundation, not a permanent unlock.
- Future Holder Rewards remain preparation-only.

## Main changes

1. Added a Chart-only **Active Streak Timeline**.
2. Shows the last 7 days as protected, missed, recovered, or today.
3. Shows the proof action label: Track Leak, Daily Routine, Clean Day, One Fix, or Daily Challenge.
4. Adds clear status text for Today protected / Recovery available / Today needs proof / No active proof yet.
5. Updated Chart guide content for the new proof history block.
6. Cleaned visible copy so old Save wording aligns with the current Rewards tab.
