# $BROKE / SmokeIsBroke Project Order

## Current checkpoint

- Version: **v58.15 — Fast Start Onboarding**
- Base: **v58.14 — Home Priority Layout**
- Goal: reduce first-session friction so users can reach the first real Track Leak faster without backend changes

## Working rules

1. Keep `app/page.tsx` as the current main UI file until a planned refactor is done.
2. Ship small patch-only updates when possible.
3. Do not mix UI polish, API changes, Supabase migrations, and new mechanics unless there is a direct dependency.
4. Before deploy, run:

```bash
npm run verify
```

5. If `npm run verify` is too slow locally, run the checks separately:

```bash
npm run typecheck
npm run lint:quiet
npm run build
```

## Stable version trail

### v58.10 — Leak Pattern Lab

- Added behavior-pattern detection inside Chart/Insights.
- Added signals for late-night leaks, weekend leaks, after-payday spikes, and emotional/stress/boredom/impulse notes.
- No API, Supabase, new screen, or migration changes.

### v58.10.1 — Chart Candle Story Mobile Polish

- Improved mobile layout for selected-candle details.
- Split category names and leak-pressure metadata.
- Added cleaner card styling and bottom spacing above the fixed nav.
- CSS-only polish.

### v58.10.2 — Leak Pattern Insight Polish

- Replaced the selected-candle technical summary with a human Pattern Insight diagnosis card.
- Added selected-day diagnosis types: controlled day, timing pattern, payday pattern, weekend pattern, emotion clue, grey-zone pattern, avoidable leak, and pattern forming.
- Added direct Next move guidance for the chosen candle.
- Limited noisy lists to the strongest 3 causes/events.
- Improved Spending Mix readability with compact chips.
- Kept all work client-side inside existing Chart/Insights.

### v58.11 — Track Leak UX + Trigger Chips

- Reworked Add into a behavior-first `Track Leak` flow.
- Added decision labels: Survival cost / Grey zone / Full leak.
- Added optional trigger chips and stores them safely in `note` as tags.
- Pattern Lab now reads trigger tags without requiring a database migration.

### v58.13 — Toast Feedback Polish

- Added a small app-wide notification event helper.
- Replaced browser `window.alert` popups with existing in-app toast feedback across share/report/challenge flows.
- Kept manual copy prompt fallback where clipboard access can be blocked by WebViews.
- No API, Supabase, migration, webhook, or stored-data changes.

### v58.14 — Home Priority Layout

- Moves Today’s Focus directly under the hero so users see one clear next action first.
- Groups full numbers, Life Profile, Streak, and Wallet HP inside a collapsible Wallet Snapshot section.
- Keeps quick daily metrics visible inside the focus card.
- Adds mobile styling for the compact snapshot panel.
- No API, Supabase, migration, webhook, calculation, or stored-data changes.


### v58.15 — Fast Start Onboarding

- Adds a Fast Start CTA on the first onboarding screen.
- Fast Start completes onboarding and opens Track Leak with a starter leak prefilled for manual confirmation.
- Adds `Add later` helper rows to Income and Fixed Costs onboarding steps.
- Keeps private money fields optional during first use, while preserving accuracy when filled later.
- Adds mobile polish and RU translations for the new onboarding copy.
- No API, Supabase, migration, webhook, calculation, or stored-data changes.



## Do not touch casually

- `/api/telegram` webhook
- `/api/auth/telegram` website login route
- Supabase service-role logic
- `Growth Lab` calculation logic
- Gentle notification rules
- Share-card image generation

### v58.12 — Weekly Pattern Summary

- Adds a 7-day behavior read to Leak Pattern Lab.
- Turns recent expenses into weekly pattern cards: Grey zone, Full leak, Weekend, Late night, After payday, Emotion, Spike day, and Category concentration.
- Adds weekly confidence, leak pressure, total leaks, and a practical “Next move this week”.
- Uses existing data only, including trigger tags stored in notes from v58.11.
- No API, Supabase, migration, webhook, or stored-data rewrite.

## v58.16 — Security Audit & Guard Rails

- Locked Telegram webhook behind `TELEGRAM_WEBHOOK_SECRET`.
- Locked webhook setup/delete behind `TELEGRAM_SETUP_SECRET`.
- Locked notification cron behind `CRON_SECRET` / `NOTIFICATIONS_SECRET`.
- Locked Supabase diagnostics behind `DIAGNOSTICS_SECRET` / `TELEGRAM_SETUP_SECRET`.
- Added auxiliary Supabase tables to diagnostics.
- Disabled public community web posting by default.
- Added share image size/type validation.
- Added basic security headers.
