# Testing — v59.52.1 Standard Mode Check Tab Restore

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


## v59.52.0 extraction notes

- Moved bottom navigation rendering from `app/page.tsx` to `app/components/BottomNav.tsx`.
- Moved bottom navigation config/types/helpers to `app/lib/brokeNavigation.ts`.
- Moved the latest bottom-nav icon-fill override styles to `app/styles/bottom-nav.css`, imported from `app/layout.tsx`.
- No routing, rewards, Admin payout, Universal Check logic, Daily Routine, wallet verification, or scoring formula changes were intended.
