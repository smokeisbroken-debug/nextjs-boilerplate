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
