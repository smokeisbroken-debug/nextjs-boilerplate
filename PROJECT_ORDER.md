# Project Order — v59.2

Current checkpoint: **v59.2 — Pattern History Foundation**

## Purpose

Turn weekly Leak Pattern reads into structured server-side history so the app can later support:

- weekly behavior comparison;
- pattern change detection;
- safer shareable pattern cards;
- notification triggers;
- premium insights.

## Deployment order

1. Supabase: run `20260520_v59_2_pattern_history_foundation.sql`.
2. Code: replace `app/page.tsx`, `app/api/broke/route.ts`, `app/globals.css`.
3. Docs: replace README/PROJECT_ORDER/TESTING if desired.
4. Vercel: deploy.
5. Supabase: run `20260520_v59_2_pattern_history_audit.sql`.
6. Functional check: open Chart → Leak Pattern Lab → Pattern memory.

## Not changed

- Telegram webhook behavior.
- Existing expense rows.
- Existing RLS lockdown approach.
- Expense calculations.
- Currency conversion route.
