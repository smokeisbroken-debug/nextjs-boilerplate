# Smoke Is Broke — v59.51.1 Leak Edit + No-Spend Routine Clarity

v59.51.1 turns the latest community feedback into core tracker fixes. The focus is not another new screen: it is correcting mistaken leak records, preventing duplicate tracking mistakes, and making no-spend Daily Routine behavior clearer.

## What changed

- Recent tracked leaks can now be edited directly from the expense rows:
  - amount;
  - category;
  - decision type;
  - note/context.
- Edited leaks immediately recalculate local Wallet HP, charts, reports, leak patterns, Growth/Rewards context, and reflection feedback.
- Cloud sync now supports a new `updateExpense` action for corrected records when Telegram/web sync is available.
- Delete now has a confirmation guard so a mistaken tap does not silently remove a tracked leak.
- Add and Quick Add now warn when the same amount/category/decision is already tracked on the same day.
- Clean Day now updates Daily Routine progress as a no-spend review instead of only showing an informational warning.
- Daily Routine now auto-recognizes safe review actions:
  - opening the routine marks wallet review;
  - no-spend days can auto-confirm the day review when no records exist;
  - adding or editing a leak marks the day review;
  - Universal Check marks wallet review.
- Daily Routine copy now says more clearly that no fake expense is needed; full 7/7 completion with Share on X still protects Active Streak.
- Updated shared build marker to `v59.51.1`.

## What did not change

- No new bottom-nav button.
- No new manual screen.
- No rewards, Admin distribution, payout logic, wallet verification, Supabase schema, payout-wallet env, or server auto-send changes.
- No wallet transaction-history scan, PnL, buy/sell timing, wallet accusation, scam label, project accusation, or investment advice.
- Active Streak is still protected only by full Daily Routine completion; this patch only makes routine progress smarter and no-spend days clearer.
- Email reports were intentionally not added yet; that needs a separate privacy/backend phase.

## Product intent

This patch fixes the highest-trust issue from testers: if a user enters the wrong amount or records a leak twice, the app must let them correct it without destroying their analysis.

The corrected flow is:

```txt
track leak
↓
edit/delete if wrong
↓
analysis recalculates
↓
no-spend days stay valid through Daily Routine
```
