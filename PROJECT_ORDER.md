# PROJECT_ORDER — v59.38 Real Manual Distribution Prep

## Current checkpoint

Use v59.38 as the current patch after confirmed v59.37.

## Admin distribution flow

1. Open hidden Admin modal.
2. Load legitimate holders using the current min hold / streak rules.
3. Enter reward token and pool amount.
4. Choose `Test ledger` or `Real manual distribution`.
5. For real manual distribution:
   - connect and verify the configured treasury wallet,
   - type `PREPARE REAL DISTRIBUTION`,
   - save the prepared real batch.
6. Copy the send sheet and send manually from treasury.
7. Paste tx signatures back into the Admin Panel.
8. Ledger marks payout rows as `manual_sent`; full batch becomes `manual_sent` when every payout has a tx signature.

## Safety boundary

The app prepares and records distribution batches. It does not send tokens from the server and does not store private keys.

## v59.39 Patch Order

Apply after v59.38.

1. Replace `app/page.tsx`.
2. Replace `app/globals.css`.
3. Replace root/app docs if desired.
4. No Supabase migration required beyond the existing v59.37 distribution ledger migration.
5. Keep `REWARDS_ADMIN_SECRET`, treasury/admin wallet envs, and `NEXT_PUBLIC_BROKE_TOKEN_MINT` configured.
