# TESTING — v59.19.1 Share Studio Brightness Hotfix

## Visual checks

1. Open Profile / Personal Cabinet.
2. Scroll to Share Studio.
3. Select multiple public display items.
4. Confirm selected items are readable dark selected cards, not full neon green blocks.
5. Confirm unselected and locked items still look normal.
6. Confirm bottom navigation and main CTAs remain unchanged.

## Build checks

Recommended after applying patch:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```
