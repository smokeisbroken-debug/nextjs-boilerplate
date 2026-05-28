# v59.35 — Standard / Pro Mode + Leak Reflection Questions

1. Keep v59.34.2 Admin Legitimate-Only Controls unchanged.
2. Add app mode state with `standard` and `pro`.
3. Persist mode locally and include it in cloud app-state sync.
4. Add a compact Home header toggle beside Guide.
5. Keep Standard Mode focused on the core product loop: track leak, Daily Routine, streak, wallet status, simple report.
6. Hide Growth and Rewards from Standard bottom navigation.
7. Hide advanced Home blocks in Standard Mode.
8. Keep Pro Mode as the existing full-power app.
9. Add the spending-reflection question bank to the leak reflection popup.
10. Do not change rewards, payouts, wallet verification, or Active Streak proof logic.

## Standard Mode visible surface

- Home
- Add
- Chart
- Profile
- Wallet Snapshot
- Today’s Focus
- Daily Routine
- Wallet Survival Report
- Recent Expenses
- Account / Sync

## Pro Mode visible surface

Everything from Standard plus Growth, Rewards, weekly patterns, challenges, share cards, badges, leaderboards, smart insights, and advanced reports.

---

# v59.34.2 — Admin Legitimate-Only Controls Hotfix

1. Keep the private Admin Panel hidden from normal users.
2. Remove the live Solana RPC Top 10 all-holder section from Admin.
3. Remove treasury live balance, token supply, RPC mode, and RPC warning UI from holder intelligence.
4. Keep only app-data legitimate holders.
5. Add private Admin controls for legitimacy rules:
   - minimum $BROKE hold;
   - required Daily Routine Active Streak days.
6. Pass these rules to `/api/admin/holders` through `minHold` and `minStreak`.
7. Recalculate Top 20 legitimate holders and payout manifest from the loaded rules.
8. Keep the balance-share formula unchanged.
9. Keep all payout execution disabled.

## Non-goals

- No live blockchain Top 10 list.
- No Solana RPC requirement for the Admin holder list.
- No treasury balance read.
- No automatic payout.
- No send transaction.
- No treasury signing.
- No private key storage.
- No Supabase migration.
- No Daily Routine / Active Streak proof logic change.

---

# Project Order — v59.33 Private Admin Holder Intelligence Panel

## Patch base

Apply this patch on top of v59.32.

## Objective

Extend the private Admin Panel so the project owner can inspect holder state before future reward distribution work.

## Implementation order

1. Preserve the v59.32 private Admin Panel visibility rules.
2. Add the provided treasury/admin public wallet as the default public fallback.
3. Add the provided $BROKE contract/mint as the default token mint fallback.
4. Add a read-only admin endpoint at `/api/admin/holders`.
5. Protect the endpoint with `REWARDS_ADMIN_SECRET` or a configured Telegram admin session.
6. Fetch Top 10 all holders from Solana RPC using the token mint.
7. Build Top 20 legitimate holders from app data using the same eligibility basis as Rewards.
8. Display the two tables inside the hidden Profile-side Admin Panel only.
9. Keep reward payouts, claims, staking, treasury signing, and token transfers off.

## Holder intelligence rules

### Top 10 all holders

- Uses Solana RPC `getTokenLargestAccounts`.
- Fetches parsed token account owners with `getMultipleAccounts`.
- Groups returned token accounts by owner where visible.
- This is a live RPC view of the largest token accounts returned by the RPC provider.

### Top 20 legitimate holders

A holder is legitimate for reward preview when:

- app wallet is verified;
- verified balance is at least 100,000 $BROKE;
- current Active Streak is at least 7 days;
- streak proof comes from Daily Routine completion.

Reward-share preview remains:

```text
holder verified eligible balance / total verified eligible balance
```

## Non-goals

- No SPL token transfer execution.
- No Phantom/Jupiter transaction signing for payouts.
- No payout batch generation.
- No reward claim windows.
- No private key storage.
- No Supabase migration.
- No Rewards eligibility formula change.
- No Daily Routine / Active Streak logic change.

# v59.34 — Admin Panel Launcher + Distribution Draft Prep

1. Keep v59.33 Admin Panel private.
2. Remove the bulky inline Profile admin block.
3. Add an admin-only header button beside the Profile guide button.
4. Open Admin Panel in a modal so normal Profile remains clean.
5. Keep server-side holder data protected by `REWARDS_ADMIN_SECRET` or Telegram admin session.
6. Make `/api/admin/holders` resilient when public Solana RPC returns HTTP 429.
7. Return legitimate app holder data even when the Top 10 all-holder RPC call fails.
8. Add a draft-only reward distribution calculator:
   - pool token label;
   - pool amount;
   - all eligible legitimate holders;
   - balance-share reward amount per holder;
   - copyable payout manifest.
9. Keep all real payout execution disabled.

## Non-goals

- No automatic payout.
- No send transaction.
- No treasury signing.
- No claim window.
- No private key storage.
- No reward eligibility rule change.
- No Daily Routine / Active Streak logic change.


## v59.34.1 — Admin RPC Setup + Treasury Balance Clarity Hotfix

- Clarifies the private Admin holder view when Solana public RPC is rate-limited: token supply and Top 10 holder sections now show RPC unavailable instead of misleading `0 BROKE`.
- Adds a live treasury $BROKE balance read for the configured treasury wallet and BROKE mint when `SOLANA_RPC_URL` is available.
- Separates treasury balance from eligible reward balance: eligible balance remains only verified app users with 100K+ BROKE and a 7+ Daily Routine Active Streak.
- Reward Distribution Draft now clearly blocks when there are no eligible recipients, even if the treasury wallet has funds.
- Documents `SOLANA_RPC_URL` as a server-only private mainnet RPC env var for stable Top 10 holder, token supply, and treasury balance reads.
- No payouts, claims, staking, token transfers, treasury signing, private key storage, Supabase migration, wallet backend changes, holder threshold changes, balance formula changes, avatar backend, Telegram webhook, reward execution, or Daily Routine/Active Streak rule changes.

## v59.36 Smart Leak Excess + First Distribution Test Prep

- Added partial leak accounting: when a user marks an expense as Maybe or Not needed, they can enter the cheaper/necessary version of the same purchase. Only the excess counts as leak pressure. Example: $5 outside food with a $3 home baseline counts $2 as the actual leak.
- Added optional expense fields `necessary_amount` and `avoidable_leak_amount` with a Supabase migration and fallback behavior if the migration has not been applied yet.
- Leak reflection now shows tracked spend, necessary baseline, and leak counted. Wallet HP, Chart pressure, Growth Lab, category leak totals, and reports use the adjusted leak value.
- Admin distribution draft wording now supports a first test distribution workflow: enter a small pool, calculate legitimate holder shares, and copy a payout manifest for review. It still does not send tokens or request treasury signing.
- No live payouts, token transfers, claims, staking, treasury signing, private key storage, wallet backend changes, or Daily Routine / Active Streak rule changes.

