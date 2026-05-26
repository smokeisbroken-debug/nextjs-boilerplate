# TESTING — v59.27 Reward Snapshot Ledger Foundation

## Build checks

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Supabase checks

1. Run migration:

```sql
supabase/migrations/20260526_v59_27_reward_snapshot_ledger_foundation.sql
```

2. Run audit:

```sql
supabase/review/20260526_v59_27_reward_snapshot_ledger_audit.sql
```

3. Check app diagnostics:

```txt
/api/broke?check=supabase&key=YOUR_SECRET
```

Confirm these tables return `ok: true`:

- `broke_reward_epochs`
- `broke_reward_snapshots`

## Admin route checks

Dry run must not write rows:

```bash
curl -X POST "https://YOUR_APP/api/rewards/snapshot?key=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true}'
```

Expected:

- `dryRun: true`
- `committed: false`
- eligible/ineligible previews returned
- no token transfer fields or claim execution

Commit test:

```bash
curl -X POST "https://YOUR_APP/api/rewards/snapshot?key=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"commit":true,"epochCode":"test-prep","epochName":"Test Prep Snapshot"}'
```

Expected:

- one epoch row created/updated;
- snapshot rows created/updated;
- balance-share percentages calculated only for eligible holders.

## UI checks

Open Rewards → Future Holder Rewards.

Confirm:

- Reward Snapshot Ledger card appears.
- It says ledger only, no payout or claim active.
- Ready state requires wallet verification, 100K+ verified BROKE, and 7+ active streak.
- Main Rewards screen stays compact.

## Non-regression checks

Confirm unchanged:

- Track Leak.
- Daily Routine proof.
- Rewards proof actions.
- Chart proof timeline.
- Wallet verification.
- Share cards.
- Avatar upload.
