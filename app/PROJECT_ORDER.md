# PROJECT ORDER — v59.25.3

Current patch: **v59.25.3 — Daily Routine Streak Proof Hotfix**.

## Scope

This is a streak-only hotfix. It changes the Daily Routine reward behavior from old XP-oriented wording/claiming to Active Streak proof protection.

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

- A normal day is protected by at least one valid proof action.
- Recovery still requires two proof actions during the recovery day.
- 7+ Active Streak is live eligibility foundation, not a one-time unlock.
- Daily Routine now counts as a valid proof action after all 7 real tasks are completed.
- Future Holder Rewards remain preparation-only in the app.

## Main fixes

1. Daily Routine 7/7 completion records `daily_routine` in Active Streak proof logs.
2. Routine proof does not require Telegram cloud XP claim.
3. Old Daily Routine XP labels were removed from the visible routine card.
4. Cloud/server proof normalization accepts `daily_routine` so the proof survives sync.
