# v59.16 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Profile → Wallet & $BROKE balance.
2. Confirm Holder rewards card appears.
3. With watch-only wallet, rewards should stay locked.
4. With verified 500K+ BROKE, custom avatar and +1 public display slot should show as unlocked.
5. With verified 1M+ BROKE, +2 slot state should apply.
6. With verified 5M+ BROKE, +3 slot state should apply.
7. Open Profile → Share Studio and verify the slot counter reflects the verified-holder bonus.
8. Confirm no transaction/signing prompt appears except existing wallet verification message-signature flow.
```
