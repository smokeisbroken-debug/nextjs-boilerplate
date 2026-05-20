# $BROKE / SmokeIsBroke Manual Testing Checklist

Use this checklist after deploying **v58.15 — Fast Start Onboarding**.

## 1. Basic load

- Open the web app URL in a browser.
- Open the Telegram Mini App from the bot.
- Confirm there is no white screen.
- Confirm the bottom navigation is visible.

## 2. Track Leak screen

Open Add / Track.

Expected result:

- Header says `Track Leak`.
- The screen has a short behavior-mode hero.
- Amount input still works.
- Quick presets still fill category and amount.
- Category selection still works.
- Decision type shows:
  - Survival cost
  - Grey zone
  - Full leak
- Trigger chips are visible and selectable.
- Selected trigger summary updates under `Pattern context`.

## 3. Save behavior

Create one record with:

```txt
Amount: any positive value
Decision: Grey zone or Full leak
Trigger: Stress + Late night
Note: test context
```

Expected result:

- Record saves successfully.
- The note includes the written note plus trigger tags such as `#stress #late-night`.
- The form resets after save.
- No Supabase migration is required.

## 4. Pattern Lab behavior

After creating several records with trigger chips, open Chart.

Expected result:

- Leak Pattern Lab can use trigger tags as context.
- `#late-night` can contribute to late-night signals.
- `#weekend` can contribute to weekend signals.
- `#after-payday` can contribute to after-payday signals.
- `#stress`, `#boredom`, `#impulse`, `#social-pressure`, or `#habit` can contribute to emotional/context signals.

## 5. Regression checks

Check these tabs still open and scroll:

- Home
- Add / Track Leak
- Chart
- Growth
- Save
- Settings

## 6. Pre-deploy command

Run before pushing a patch:

```bash
npm run verify
```

Expected result:

```txt
typecheck OK
lint:quiet OK
build OK
```

## v58.12 Weekly Pattern Summary checks

1. Open Chart.
2. Open Leak Pattern Lab.
3. Confirm the 7-day behavior read appears above the detailed detector.
4. Add a Track Leak record with a trigger chip such as `Late night`, `Weekend`, `Stress`, or `After payday`.
5. Return to Chart and confirm the weekly pattern summary can reflect that trigger.
6. Confirm the panel still works with no expenses and with only Needed expenses.
7. Confirm Home, Chart, Growth, Save, and Settings still open normally.

No Supabase migration is required.

## v58.13 Toast Feedback Polish checks

1. Try starting a challenge while not connected to Telegram.
   - Expected: in-app toast appears, not a browser alert.
2. Try enabling public leaderboard while not connected to Telegram.
   - Expected: in-app toast appears.
3. Copy a report/share text.
   - Expected: toast confirms the copy.
4. Generate/share/download a public card, Weekly Review card, Monthly Leak History card, Growth card, Mission card, and Survival card where possible.
   - Expected: success/fallback/error feedback appears as a toast.
5. Confirm no browser-native alert modal appears during normal app actions.
6. Confirm the manual copy prompt still appears only when clipboard fallback is needed.

No Supabase migration is required.

## v58.14 Home Priority Layout checks

1. Open Home on desktop and Telegram Mini App mobile view.
2. Confirm the first important card after the hero is `Today’s Focus`.
3. Confirm the focus card still shows the correct next action:
   - first leak;
   - check Chart;
   - share safe progress;
   - lock tomorrow goal.
4. Confirm `Wallet Snapshot` appears below Today’s Focus as a collapsible section.
5. Open Wallet Snapshot and confirm these still render:
   - Income;
   - Life Cost;
   - Money Leaks;
   - Real Balance;
   - Life Profile;
   - Streak;
   - Wallet HP.
6. Confirm old Home secondary systems still open below:
   - Biggest Leak Challenge;
   - First Leak Mission when empty;
   - Daily Routine;
   - Wallet Survival Report;
   - Share Reports;
   - Smart Insights Lab;
   - Badges;
   - Share Result;
   - Chart Preview;
   - Recent Expenses;
   - Account / Sync.
7. Confirm no API, Supabase, or Telegram webhook configuration is required.


## v58.15 Fast Start Onboarding checks

1. Reset local onboarding state or open as a fresh user.
2. Confirm the first onboarding screen shows a `Fast Start` card.
3. Tap `Fast start: Track leak`.
   - Expected: onboarding completes and the app opens Track Leak.
   - Expected: the starter leak amount/category are prefilled.
   - Expected: the user still has to save manually; no fake expense is auto-created.
4. Reset again and go through the normal onboarding path.
5. On the Income step, tap `Add later`.
   - Expected: the app moves to the Fixed Costs step without errors.
6. On the Fixed Costs step, tap `Add later`.
   - Expected: the app moves to the First leak step without errors.
7. Confirm Home, Track Leak, Chart, Growth, Save, and Settings still open normally.

No Supabase migration is required.

## v58.16 Security tests

Required checks:

1. `/api/telegram` without `x-telegram-bot-api-secret-token` should return unauthorized/config error.
2. `/api/telegram/set-webhook` without `key` should return unauthorized.
3. `/api/telegram/set-webhook?key=TELEGRAM_SETUP_SECRET_VALUE` should succeed after env values are set.
4. `/api/notifications/gentle` without secret should not run.
5. `/api/broke?check=supabase` without secret should not expose table diagnostics.
6. `/api/broke?check=supabase&key=TELEGRAM_SETUP_SECRET_VALUE` should show all required tables.
7. `/api/community` GET should still load the read-only feed.
8. `/api/community` POST should be blocked unless explicit write env is enabled.
