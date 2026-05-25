# v59.20 — Detailed Button Guide Replacement

Patch-only update for the $BROKE / SmokeIsBroke Telegram Mini App.

## Purpose

Replaces the existing short in-app help guide with a much more detailed button-by-button user guide. The goal is to help new users understand what every main tab and important action is for before they touch money settings, wallet proof, share cards, charts, or rewards.

## Files changed

- `app/page.tsx`
- `app/globals.css`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Product changes

- Replaced the old guide copy inside the question-mark help modal.
- Added detailed guide tabs for:
  - Home
  - Add
  - Chart
  - Growth
  - Save
  - Profile
- Each guide now explains the main buttons, cards, and actions on that screen.
- Added clearer explanations for:
  - bottom navigation
  - Wallet HP
  - Income / Life Cost / Money Leaks / Real Balance
  - Today snapshot
  - Track Leak amount/category/decision/trigger/note/save/delete flow
  - Chart ranges, candles, candle detail, One Fix, Pattern Lab
  - Growth targets, simulations, save plan, share card, no-investment disclaimer
  - Save survival mode, leak cuts, challenges, leaderboard, Debt & Bills Radar
  - Profile identity, wallet proof, provider help, holder rewards, Share Studio, privacy/settings
- Updated guide modal styling to handle longer content with a more readable premium layout.

## Safety

No backend behavior changed.

- No API changes
- No Supabase migration
- No wallet verification logic changes
- No holder reward threshold changes
- No token transfer logic
- No avatar upload backend changes
- No Telegram webhook changes
- No stored data rewrite
