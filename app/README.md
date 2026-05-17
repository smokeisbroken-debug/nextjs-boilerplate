# $BROKE / SmokeIsBroke Telegram Mini App

Current stable checkpoint before this patch: **v56.9**.  
This package prepares **v57.0 — Cloud Sync for Growth + Debt Radar**.

This is the working Next.js app for the $BROKE / SmokeIsBroke ecosystem.

## Stack

- Next.js 16.2.4
- React 19.2.4
- Tailwind CSS v4
- Supabase
- Telegram Mini App / Telegram Bot

## Main files

```txt
app/page.tsx              Main UI and client logic
app/globals.css           Main design system
app/api/broke/route.ts    Main Supabase/API logic
app/api/telegram/route.ts Telegram webhook
app/api/auth/telegram     Website Telegram login
```

## Useful commands

```bash
npm run dev
npm run typecheck
npm run lint:quiet
npm run build
npm run verify
```

Use `npm run verify` before deploy. It runs:

```bash
npm run typecheck
npm run lint:quiet
npm run build
```

## Environment variables

Copy `.env.example` into Vercel Environment Variables. Do not commit real secrets.

## Supabase migrations

### v56.2 Settings Sync Fix

v56.2 added full settings sync support through a JSONB column:

```sql
alter table public.broke_settings
  add column if not exists settings_payload jsonb;
```

Migration file:

```txt
supabase/migrations/20260517_v56_2_settings_payload.sql
```

### v57.0 Cloud App State Sync

v57.0 adds cloud sync for Growth saved plans, Target Coverage / Personal Goal data, and Debt & Bills Radar items through another JSONB column:

```sql
alter table public.broke_settings
  add column if not exists app_state_payload jsonb;
```

Migration file:

```txt
supabase/migrations/20260517_v57_0_app_state_payload.sql
```

The app is backward-compatible. If this column is not created yet, Growth and Debt Radar remain local-first and the app should not crash. Full website ↔ Telegram sync for these modules requires running the migration.
