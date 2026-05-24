# v59.15.1 Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Expected:
- Profile opens normally.
- Identity Setup is directly under Personal Cabinet.
- Identity Setup has a visible `Edit ›` CTA.
- Tapping Identity Setup opens the section.
- Open state shows `Close`.
- Wallet, Share Studio, holder proof, and avatar upload behavior remain unchanged.
