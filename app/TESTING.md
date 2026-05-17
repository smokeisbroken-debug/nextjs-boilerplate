# $BROKE / SmokeIsBroke Manual Testing Checklist

Use this checklist after every patch deploy.

## 1. Basic load

- Open the web app URL in a browser.
- Open the Telegram Mini App from the bot.
- Confirm there is no white screen.
- Confirm the bottom navigation is visible.

## 2. Navigation

Check every tab:

- Home
- Add
- Chart
- Growth
- Save
- Settings

Expected result: every tab opens without console-breaking behavior or blocked scrolling.

## 3. Add expense

Create a test expense:

```txt
Category: Coffee or Custom
Amount: 5
Type: Not needed
```

Expected result:

- Expense is added.
- Wallet HP/summary updates.
- Chart reflects the expense.
- Add helper text for Needed/Maybe/Not needed remains readable.

## 4. Growth mobile layout

On a phone or Telegram WebView, open Growth.

Check:

- Hero card is not hidden under the Telegram header.
- Detected-leaks card is readable.
- `Use detected leaks` does not overlap the amount.
- Create leak plan section scrolls above the fixed bottom nav.

## 5. Settings sync

In Settings, change one safe test value:

```txt
Language / country / custom category name
```

Then reload the app and check the same value.

Expected result:

- Setting persists.
- App does not reset user data.

## 6. Telegram/Web sync

If Telegram account linking is enabled:

- Add one expense from Telegram Mini App.
- Open the website.
- Confirm the expense appears after sync.

Then reverse the test:

- Add one expense from the website.
- Open Telegram Mini App.
- Confirm the expense appears after sync.

## 7. Share cards

Test at least one share action:

- Home result card
- Save/Survival card
- Growth goal card

Expected result:

- Image generation starts.
- No crash/white screen.
- Telegram/share flow does not block app use.

## 8. Pre-deploy command

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


## 9. Growth + Debt cloud sync

After running the v57.0 Supabase migration:

```sql
alter table public.broke_settings
  add column if not exists app_state_payload jsonb;
```

Test Growth:

- Open Growth.
- Add or edit a Target Coverage line.
- Add a Personal Goal.
- Save one Growth plan.
- Open the app from the other surface: Telegram ↔ website.
- Confirm the saved plan, targets, and goal appear.

Test Debt Radar:

- Open Save.
- Add one Debt item and one Recurring bill.
- Fill Monthly hit, due day, and priority.
- Open the app from the other surface: Telegram ↔ website.
- Confirm Debt & Bills Radar items appear.

Expected result: Growth and Debt Radar data persist across website and Telegram after cloud sync.
