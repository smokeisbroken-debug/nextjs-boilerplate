# v59.6.2 — Growth Typing Stability Hotfix

## Purpose
Fix Growth tab text input instability reported by users: characters sometimes disappeared or were overwritten while typing into Growth plan fields.

## Files changed
- app/page.tsx
- app/globals.css
- app/api/broke/route.ts
- README.md
- PROJECT_ORDER.md
- TESTING.md

## Not changed
- Supabase schema
- migrations
- Telegram webhook
- Growth formulas
- Debt formulas
- Home Habit Leak calculations
- stored data format

## Deployment
1. Replace files from this patch.
2. Deploy to Vercel.
3. Test Growth typing in Telegram WebView and browser.
