# v59.17 Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:
1. Open Profile → Wallet & $BROKE balance.
2. With no wallet: holder coach should say to link a public wallet.
3. With watched wallet: holder coach should say to verify ownership.
4. With verified wallet under 500K: holder coach should show the next unlock and gap.
5. With verified wallet over 500K/1M/5M: milestone chips should update.
6. Open Profile → Share Studio and confirm display-space coach shows selected / available slots.
7. Confirm Share Studio checkboxes still respect the display-slot limit.
