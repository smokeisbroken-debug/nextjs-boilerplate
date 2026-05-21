# v59.5 — Debt Payment Tracker

## Reason
Community requested debt paid status, partial/full payment tracking, due timeframe visibility, and receipt history.

## Files changed
- app/page.tsx
- app/globals.css
- app/api/broke/route.ts
- README.md
- PROJECT_ORDER.md
- TESTING.md

## What changed
1. Growth saved plans mobile layout fix.
2. Debt items now have payment status.
3. Partial Pay action logs a payment and reduces remaining debt.
4. Full Pay action clears remaining debt and logs the final payment.
5. Receipt History Log appears for debts with logged payments.
6. API normalization preserves `paymentHistory` in app state sync.

## Not changed
- Supabase schema
- migrations
- Telegram webhook
- security/RLS
- expenses table
- pattern history table
