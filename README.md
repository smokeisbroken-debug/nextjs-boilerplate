# Smoke Is Broke — v59.49.0 Project vs Project Concept

v59.49.0 adds the first Pro-mode Project vs Project comparison concept. It lets users compare two projects side by side using manual DYOR leak-signal context without publishing rankings, calling scams, or making investment recommendations.

## Changes

- Added a new Pro bottom-nav `Vs` entry for Project vs Project.
- Added a local-only Project vs Project screen.
- Added Project A / Project B fields for project name, chain, optional contract or mint context, manual signal pressure, visible signal count, optional liquidity, optional top-10 concentration, and manual notes.
- Added an automatic comparison summary for lower manual signal pressure, stronger liquidity context, and lower top-10 concentration when values are available.
- Added local draft persistence under `broke-project-compare-local-draft-v1`.
- Added copy/share text for manual comparison framing.
- Added Project vs Project PNG share card with Save PNG, Share card, and Send to TG bot using the existing share image flow.
- Added Help Guide coverage for the new comparison screen.
- Updated shared build marker to `v59.49.0`.

## Unchanged

- No automatic Project vs Project scanner.
- No public project ranking.
- No scam detection labels.
- No project accusation labels.
- No Supabase persistence.
- No public project database.
- No investment advice.
- No payout logic changes.
- No reward eligibility formula changes.
- No Daily Routine / Active Streak changes.
- No wallet verification changes.
- No Admin distribution API changes.
- No payout-wallet env changes.
- No server auto-send changes.

## Verification

- `npm run typecheck`
- `npm run lint:quiet`
- `NEXT_TELEMETRY_DISABLED=1 npm run build`
- targeted brace / paren balance
- targeted BigInt suffix scan
- zip integrity test
