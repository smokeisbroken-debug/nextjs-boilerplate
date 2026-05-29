# TESTING — v59.38 Real Manual Distribution Prep

## Expected checks

```bash
npm run typecheck
npm run lint:quiet
```

## Manual QA

1. Open Admin Panel as a configured admin.
2. Enter Admin read key when needed.
3. Load legitimate holders.
4. Change min hold / streak and reload; confirm candidates update.
5. Enter pool amount and token.
6. In Test ledger mode:
   - Copy test manifest.
   - Save test batch.
   - Confirm status is `draft`.
7. In Real manual distribution mode:
   - Confirm button stays locked if treasury wallet is not matched.
   - Connect and verify treasury wallet.
   - Type `PREPARE REAL DISTRIBUTION`.
   - Save real batch.
   - Confirm status is `prepared`.
8. Copy send sheet.
9. Paste rows like `1,TX_SIGNATURE` or `wallet,TX_SIGNATURE`.
10. Confirm tx signatures are recorded and status progresses toward `manual_sent`.

## Non-goals

- Do not expect automatic transfers.
- Do not expect Phantom/Jupiter signing inside this patch.
- Do not enter private keys anywhere.

## v59.39 Final Distribution Queue Test

1. Open the app as admin.
2. Open Profile → Admin.
3. Load legitimate holders with the desired min hold/streak rules.
4. Enter a small reward pool, such as `1` `$BROKE`.
5. Select `Real manual distribution`.
6. Connect/verify the configured treasury wallet.
7. Type `PREPARE REAL DISTRIBUTION`.
8. Press `Prepare real batch`.
9. Confirm the `Final payout queue` appears.
10. Use `Copy all links` or `Open payment` per recipient.
11. Confirm each payment inside the treasury wallet.
12. Paste transaction signatures into `Record transaction signatures`.
13. Confirm the ledger status moves toward `manual_sent`.

Expected: real payout requests are created from the admin UI, but the treasury wallet still confirms transfers and the server never stores a private key.
