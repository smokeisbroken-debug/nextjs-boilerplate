# v59.5 — Debt Payment Tracker

Patch-only update from v59.4 / v59.3.4 line.

## User-facing changes
- Fixes the Growth saved plans layout so clickable plans no longer collapse into vertical text on mobile.
- Adds Debt Payment Tracker inside Debt & Bills Radar.
- Debt items now show Paid Status: Unpaid, Partial Pay, or Paid.
- Users can log Partial Pay amounts.
- Users can mark a debt as Full Pay to clear the remaining debt.
- Debt items now keep a private Receipt History Log.
- Existing Debt & Bills Radar items remain compatible.

## Technical scope
- Uses existing app state payload / Debt Radar state.
- No Supabase migration required.
- No new API route required.
- `/api/broke` normalization was updated to preserve debt payment history during sync.
