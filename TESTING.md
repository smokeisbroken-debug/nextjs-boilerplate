# v59.13.3 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Expected:
- Profile opens normally.
- Identity Setup is directly below Personal Cabinet top area.
- Wallet & $BROKE balance appears below Identity Setup.
- Share Studio appears below Wallet.
- Custom Avatar stays inside Identity Setup.
- Upload avatar CTA is clearly visible when unlocked.
- Locked custom avatar state is still readable.
