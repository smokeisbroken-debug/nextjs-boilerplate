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
