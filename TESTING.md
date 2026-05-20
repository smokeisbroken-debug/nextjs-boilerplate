# Testing — v58.19 First User Clarity Polish

## Automated checks

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Expected: all pass.

## Manual QA

### Onboarding

- Open a fresh user session.
- Confirm the first screen explains the app as a first-session loop.
- Confirm the route says Track one leak / Read Wallet HP / Get the pattern.
- Confirm Fast Start still opens Track Leak.
- Confirm final onboarding CTA says Open Track Leak.

### Home

- With no expenses, confirm Home shows:
  - hero clarity strip;
  - Today’s Focus;
  - first-user clarity card.
- Confirm the first-user clarity card opens Track Leak.
- With existing expenses, confirm the first-user clarity card is hidden.

### Track Leak

- Open Track Leak.
- Confirm the result preview appears below the hero.
- Save a leak.
- Confirm normal save/load behavior still works.
- Confirm trigger tags still attach to notes when chips are selected.

### Russian mode

- Switch language to Russian.
- Confirm the new onboarding/Home/Track Leak copy is translated or readable.
