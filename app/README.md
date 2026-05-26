# $BROKE Life Tracker — v59.27 Reward Snapshot Ledger Foundation

Patch-only update on top of v59.26.

## What changed

- Added future Holder Rewards snapshot ledger foundation.
- Added Supabase migration for `broke_reward_epochs` and `broke_reward_snapshots`.
- Added admin-only `/api/rewards/snapshot` route.
- Added dry-run snapshot preview for eligible holders.
- Added commit mode to upsert an epoch and snapshot ledger rows.
- Added balance-share calculation:
  - `user verified eligible BROKE / total verified eligible BROKE`.
- Added snapshot eligibility reasons:
  - wallet not verified;
  - below 100K $BROKE;
  - active streak below 7 days.
- Added Rewards → Future Holder Rewards → Reward Snapshot Ledger card.
- Added reward tables to `/api/broke?check=supabase` diagnostics.
- Updated the `?` guide with Reward Snapshot Ledger explanation.

## What did not change

- No Creator Fee distribution.
- No payouts.
- No claims.
- No staking.
- No token transfers.
- No treasury wallet logic.
- No reward claim window.
- No wallet verification backend flow changes.
- No holder threshold enforcement outside wording/snapshot prep.
- No balance formula changes.
- No avatar backend changes.
- No Telegram webhook changes.
- No share-card export changes.

## Required Supabase step

Run this migration before using the admin snapshot route:

```sql
supabase/migrations/20260526_v59_27_reward_snapshot_ledger_foundation.sql
```

Optional audit:

```sql
supabase/review/20260526_v59_27_reward_snapshot_ledger_audit.sql
```

## Admin snapshot route

Route:

```txt
/api/rewards/snapshot
```

Auth:

```txt
REWARDS_ADMIN_SECRET
or DIAGNOSTICS_SECRET
or TELEGRAM_SETUP_SECRET
```

Dry run preview:

```bash
curl -X POST "https://YOUR_APP/api/rewards/snapshot?key=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true,"snapshotDate":"2026-06-01"}'
```

Commit ledger rows:

```bash
curl -X POST "https://YOUR_APP/api/rewards/snapshot?key=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"commit":true,"epochCode":"june-1-prep","epochName":"June 1 Prep Snapshot","snapshotDate":"2026-06-01"}'
```

Commit mode creates/updates:

- one `broke_reward_epochs` row;
- one `broke_reward_snapshots` row per scanned user.

It does not send tokens.

## Verification

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```
