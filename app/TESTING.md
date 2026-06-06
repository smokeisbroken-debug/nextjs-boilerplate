# Testing — v59.51.8 Bottom Nav Icon Fill + Leak Hub Close Control

## Automated checks

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Manual checks

- Bottom nav uses the new icon/button art for:
  - Home
  - Check
  - Add
  - Chart
  - Growth
  - Rewards
  - Profile
- Check opens the same Check / Leak Hub screen.
- Leak Hub accordion still expands and collapses.
- Add, Chart, Growth, Rewards, and Profile still open their existing sections.
- No duplicate root files should exist:
  - `page.tsx`
  - `route.ts`
  - `globals.css`
