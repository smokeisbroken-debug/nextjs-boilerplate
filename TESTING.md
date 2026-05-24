# v59.13.2 Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:
1. Profile → Share Studio → Preview here.
2. Enable Survival, Wallet HP, Top, Status, Holder tier.
3. Verify labels and values are not cropped.
4. Generate/download/share the card.
5. Verify the generated image has no cut-off metric text.
