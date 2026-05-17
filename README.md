# $BROKE / SmokeIsBroke Telegram Mini App

Current stable checkpoint: **v56.6**.

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

## v56.2 Settings Sync Fix

v56.2 added full settings sync support through a JSONB column:

```sql
alter table public.broke_settings
  add column if not exists settings_payload jsonb;
```

The migration file is here:

```txt
supabase/migrations/20260517_v56_2_settings_payload.sql
```

The app is backward-compatible. If this column is not created yet, legacy settings still save and the app does not crash. For full website ↔ Telegram sync of language, region, life mode, survival, privacy, custom category names, data cost, and education cost, run the migration in Supabase SQL Editor.

## v56.6 Cleanup/Testing

v56.6 does not add product mechanics. It updates project maintenance only:

- adds `lint:quiet` and `verify` scripts;
- reduces expected `<img>` lint noise, because the app intentionally uses local static PNG assets and share-card-friendly image tags;
- removes several unused API variables/functions;
- adds `TESTING.md` for manual checks after deploy.
