# Smoke Is Broke — v59.45.0 Leak Score Concept Screen

## Patch scope

v59.45.0 adds the first experimental `BROKE Leak Score` screen as a Pro-mode research concept.

This is a UI/local-only concept pass. It does not intentionally change reward payout logic, reward eligibility, payout share math, Daily Routine, Active Streak, wallet verification, Supabase schema, Admin distribution API behavior, payout-wallet env names, or server auto-send behavior.

## Changed files

- `app/page.tsx`
- `app/globals.css`
- `app/lib/brokeAdminRewards.ts`
- `app/lib/brokeLeakScore.ts`
- Root/app docs

## New file

- `app/lib/brokeLeakScore.ts`

## What changed

- Updated shared build marker to `v59.45.0` through `BROKE_APP_BUILD_VERSION`.
- Added a new Pro-mode `Leak` bottom-nav entry.
- Added `BROKE Leak Score` screen.
- Added a manual project draft form:
  - project / token name;
  - chain;
  - optional contract / mint address.
- Added a manual visible-signal checklist for:
  - wallet concentration;
  - unlocked team / insider supply;
  - liquidity weakness;
  - suspicious volume;
  - fake engagement signs;
  - hype pressure;
  - unclear operators;
  - no working product;
  - poor communication;
  - rushed decisions.
- Added local score calculation with four tiers:
  - Low Leak Risk;
  - Medium Leak Risk;
  - High Leak Risk;
  - Extreme Leak Risk.
- Added Help Guide copy for the new Leak Score screen.
- Added mobile-safe styling for the new Leak Score cards and updated Pro bottom nav layout for the extra tab.

## Safety notes

- No API calls are made by the Leak Score screen.
- No data is saved to Supabase.
- No public project database is created.
- No project is called a scam.
- The score is an educational DYOR pause signal, not investment advice.
- This patch does not add automated on-chain analysis yet.

## Verification

Run locally:

```bash
npm run typecheck
npm run lint:quiet
```

Sandbox verification during patch generation:

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully, then timed out during Next.js `Running TypeScript ...`; standalone typecheck passed. This matches the existing large `page.tsx` build-time issue and is not considered a new patch-specific TypeScript failure.

## Suggested manual QA

1. Switch to Pro Mode.
2. Open the new `Leak` nav item.
3. Enter a project name and optional mint/address.
4. Select and unselect several leak signals.
5. Confirm the score and tier update instantly.
6. Press `Clear` and confirm the local draft resets.
7. Open Help while on Leak Score and confirm the Leak Score guide appears.
8. Confirm Admin distribution, Rewards, wallet verification, Daily Routine, and Active Streak screens still open normally.
