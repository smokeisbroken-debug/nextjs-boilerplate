# TESTING — v59.30 Daily Routine No-Spend + Growth Fairness Polish

## Build checks

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Daily Routine checks

Confirm:

- Daily Routine does not ask the user to add/track one expense as a required task.
- A day with no expenses can still reach 7/7 Daily Routine completion.
- Check wallet state can be marked from Daily Routine.
- Confirm no extra spend / review today’s spend can be marked from Daily Routine.
- Lock one next move can be marked from Daily Routine.
- Chart task still completes by opening/checking Chart.
- Rewards task still completes by opening/checking Rewards.
- Final Daily Routine task still requires Share on X.
- Completing all 7 Daily Routine actions records `daily_routine` proof.
- Active Streak does not protect today before full 7/7 completion.

## Active Streak non-regression checks

Confirm:

- Track Leak does not directly protect Active Streak.
- Mark Clean Day does not directly protect Active Streak.
- One Fix does not directly protect Active Streak.
- Daily Challenge does not directly protect Active Streak.
- Copy text, Telegram share, native share, and image download do not complete the final public proof task.
- Share on X completes the final public proof task.
- Streak breaks only when the full Daily Routine is not completed for the day.

## Growth Lab checks

Confirm:

- Growth Lab hero explains base saving + leak boost.
- If no leaks are detected, Growth Lab does not block the user or demand a fake leak.
- Use base saving sets a base-saving plan.
- Use detected leaks still fills the leak boost from detected monthly leaks.
- Result card shows base/month, leak boost/month, and total/month.
- Personal goal time uses the combined monthly total.

## Wallet/provider non-regression checks

Confirm v59.29.1 still holds:

- Phantom provider detection still works.
- Solflare provider detection still works.
- Backpack provider detection still works.
- Jupiter Wallet provider detection still works when injected.
- Multi-provider selector still works when several Solana providers are exposed.
- Use wallet address still connects selected provider and fills the public address.
- Wallet verification remains message-signature-only.

## General non-regression checks

Confirm existing flows still work:

- expense save/delete;
- Home display;
- Chart display;
- Rewards overview;
- share cards;
- wallet verification display;
- reward snapshot ledger display;
- Supabase sync;
- Telegram Mini App loading;
- external-site/iframe display guard.
