# Smoke Is Broke — v59.45.6 Leak Score Research Mode + Positioning Polish

v59.45.6 repositions Leak Score as a crypto-native manual research / wallet leak prevention tool instead of a project-rating or scam-detection feature. The screen now automatically reviews whether the local research draft is ready to share while keeping all data local and educational.

## Patch scope

- Updated Leak Score copy to emphasize `Manual Research`, `DYOR Tool`, `Educational`, `Leak Signals`, and `Not Scam Detection`.
- Added automatic local Research Review readiness checks for project name, chain, contract context, selected signals, signal notes, share text, and share card.
- Added a completion meter and ready/pending checklist inside the Leak screen.
- Shifted user-facing wording from “risk verdict” toward “wallet leak prevention” and “visible leak signals”.
- Updated share text with the stronger crypto-native framing: “Before you buy a project, check for leaks.”
- Updated the share card header from `$BROKE LEAK SCORE` to `$BROKE LEAK SIGNALS`.
- Updated tier labels from “Leak Risk” to “Leak Signal Pressure”.
- Updated guide and roadmap copy for the v1 manual research → v2 auto token data direction.
- Updated shared build marker to `v59.45.6`.

## Safety notes

- No API calls were added.
- No Supabase persistence was added.
- No public project database was added.
- No automated on-chain scanning was added.
- No scam labels, project accusations, or investment advice were added.
- No payout logic, reward eligibility formula, Daily Routine, Active Streak, wallet verification, Admin distribution API behavior, payout-wallet env names, or server auto-send behavior changed.

## Local storage keys

- Active draft: `broke-leak-score-local-draft-v1`
- Saved snapshots: `broke-leak-score-saved-drafts-v1`

## Verification

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- Targeted brace/paren balance passed for changed files.
- Targeted BigInt literal suffix scan passed.
- Zip integrity passed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully and finished TypeScript, then timed out during `Collecting page data using 26 workers`, consistent with the existing large monolithic `page.tsx` build-time issue.
