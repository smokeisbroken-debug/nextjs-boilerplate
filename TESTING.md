# v59.7.5 Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Expected:
- Profile opens normally.
- Personal Cabinet fits better on mobile.
- Public identity preview no longer feels oversized.
- Profile settings sections are visible as compact collapsed cards.
- Opening Quick Setup still shows all old controls.
- Bottom navigation does not cover the last settings cards.
