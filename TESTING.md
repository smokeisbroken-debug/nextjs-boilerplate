# v59.5 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Growth.
2. Check Saved plans on mobile width.
3. Verify plan cards are readable and clickable.
4. Open Save → Debt & Bills Radar.
5. Add or edit a Debt item.
6. Add Remaining debt.
7. Use Partial Pay and verify remaining debt decreases.
8. Use Full Pay and verify remaining debt becomes 0.
9. Verify Receipt History Log appears.
10. Reload app and confirm the payment history persists.
11. Sync through Telegram/web account if available and confirm payment history remains.

Expected:
- No layout collapse in saved Growth plans.
- Debt paid status updates correctly.
- Existing debt/bill/maintenance items still load.
