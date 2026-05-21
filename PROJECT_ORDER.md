# v59.4 — Growth Plan Tracking Detail

## Goal
Fix the user expectation that a selected Growth plan should be clickable and usable for ongoing tracking, not only for generating a picture/share card.

## What changed
1. Added structured progress entries to saved Growth simulations.
2. Existing Growth plans normalize safely with empty progress history.
3. Saved plans are clickable.
4. Clicking a plan opens an Active tracking plan detail card.
5. Detail card shows:
   - goal value,
   - tracked progress,
   - next checkpoint,
   - progress bar,
   - receipt/progress history.
6. Added actions:
   - Add progress,
   - Mark planned contribution,
   - Update plan,
   - Share card,
   - Close.

## Not changed
- API routes
- Supabase schema
- migrations
- Telegram webhook
- security/RLS
- existing expense data
- Growth share card endpoint behavior
