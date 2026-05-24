# v59.12.2 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:
1. Profile → Wallet & $BROKE balance shows compact token amounts.
2. Profile → Share Studio includes Holder tier.
3. Public share card shows `Holder tier` instead of a cropped `BROKE balance` label.
4. If exact token balance is allowed, balance appears as compact secondary detail such as `15M BROKE`.
5. Biggest leak and holder fields do not overflow the public card.
