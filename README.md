# $BROKE / SmokeIsBroke Telegram Mini App

Current patch checkpoint: **v58.15 — Fast Start Onboarding**.

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

## v58.11 Track Leak UX + Trigger Chips

This patch improves the Add screen so users record behavior context, not only amounts.

Changed:

- renames the Add screen experience to `Track Leak`;
- adds a behavior-first hero explaining that triggers help Pattern Lab understand why the leak happened;
- changes decision labels from raw Needed / Maybe / Not needed UI to:
  - `Survival cost`
  - `Grey zone`
  - `Full leak`
- adds trigger chips:
  - Stress
  - Boredom
  - Impulse
  - After payday
  - Late night
  - Social pressure
  - Weekend
  - Habit
- saves selected triggers into the existing `note` field as tags such as `#stress` or `#late-night`;
- extends the existing Leak Pattern detector so trigger tags can strengthen late-night, weekend, after-payday, and emotional/context signals;
- updates RU translations for the new Add/Track Leak wording.

Not changed:

- no API changes;
- no Supabase migration;
- no Telegram webhook changes;
- no new database columns;
- no stored-data rewrite.

## v58.12 Weekly Pattern Summary

This patch strengthens Leak Pattern Lab by adding a 7-day behavior read inside Chart.

Changed:

- adds a weekly pattern summary card inside Leak Pattern Lab;
- reads the last 7 days of expenses and leak pressure;
- highlights the strongest weekly behavior pattern, such as:
  - Grey zone decisions;
  - Full leak spending;
  - Weekend mode;
  - Late-night spending;
  - After-payday spending;
  - Emotion / stress / boredom / impulse clues;
  - One-day spike;
  - Top category concentration;
- adds weekly confidence, total leaks, leak pressure, and a direct “Next move this week”;
- keeps this as client-side analysis using existing expense data and v58.11 trigger tags.

Not changed:

- no API changes;
- no Supabase migration;
- no Telegram webhook changes;
- no new database columns;
- no stored-data rewrite.

## v58.13 Toast Feedback Polish

This patch removes browser-native alert popups from the main app flow and routes user feedback through the existing in-app toast system.

Changed:

- added a small app-wide notification event helper so nested panels can trigger the existing toast without prop drilling;
- replaced browser `window.alert` calls used by challenges, leaderboard, reports, share cards, Growth cards, Weekly Review, Monthly History, Mission results, and Survival cards;
- kept clipboard `window.prompt` fallback where needed, because it still gives users a manual copy path when WebView clipboard access is blocked;
- makes Telegram WebView share/download feedback feel native instead of browser-like.

Not changed:

- no API changes;
- no Supabase migration;
- no Telegram webhook changes;
- no database schema changes;
- no share-card logic rewrite.

## v58.14 Home Priority Layout

This patch makes Home feel less like a report wall and more like a daily command screen.

Changed:

- moves `Today’s Focus` directly under the hero so the first visible action is clear;
- moves full financial stats, Life Profile, Streak, and Wallet HP into a collapsible `Wallet Snapshot` section;
- keeps the key quick metrics visible inside Today’s Focus: Wallet HP, biggest leak, and today’s tracked spend;
- updates helper copy so users understand Home has one main action first and deeper systems below;
- adds mobile polish for the new Wallet Snapshot section.

Not changed:

- no API changes;
- no Supabase migration;
- no Telegram webhook changes;
- no database schema changes;
- no calculation logic changes;
- no stored-data rewrite.


## v58.15 Fast Start Onboarding

This patch reduces first-session friction so a new user can reach Track Leak faster.

Changed:

- adds a `Fast Start` call-to-action on the first onboarding screen;
- Fast Start completes onboarding and opens Track Leak with the starter leak prefilled, so users can record a real leak immediately;
- adds soft `Add later` rows on Income and Fixed Costs steps so private numbers do not block the first aha moment;
- clarifies that profile, income and fixed costs can be filled later for better accuracy;
- adds mobile styling and RU translations for the new onboarding copy.

Not changed:

- no API changes;
- no Supabase migration;
- no Telegram webhook changes;
- no database schema changes;
- no calculation logic changes;
- no stored-data rewrite.

## v58.16 Security Audit & Guard Rails

Security hardening added after v58.15:

- Telegram webhook requires `TELEGRAM_WEBHOOK_SECRET`.
- Webhook setup/delete endpoints require `TELEGRAM_SETUP_SECRET`.
- Notification cron requires `CRON_SECRET` or `NOTIFICATIONS_SECRET`.
- Supabase diagnostics require `DIAGNOSTICS_SECRET` or `TELEGRAM_SETUP_SECRET`.
- Community web posting is disabled by default.
- Share image upload validates type and size.
- Basic security headers are set in `next.config.ts`.

See `SECURITY_AUDIT.md` for the full table and environment checklist.
