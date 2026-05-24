# v59.8.2 Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:
1. Open Profile / Personal Cabinet.
2. Confirm Identity Setup appears above Share Studio.
3. Open Smart Category Names.
4. Clear a standard category label input.
5. Confirm the input does not immediately refill with the default label.
6. Type a custom label and confirm it stays saved.
7. Use Reset category names to restore defaults.
