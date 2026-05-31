# Smoke Is Broke — v59.45.5 Leak Score Signal Notes

v59.45.5 adds local-only notes to the BROKE Leak Score checklist. When a user selects a visible leak signal, they can now write a short reason/context note for that signal. Notes stay in the local draft and saved snapshots, and are included only when the user intentionally copies/shares the generated Leak Score text or card.

## Patch scope

- Added `signalNotes` to the local Leak Score draft model.
- Added a local note textarea under each selected Leak Score signal.
- Notes are limited to 180 characters per signal and sanitized through the existing Leak Score text cleaner.
- Unselecting a signal removes its note from the active draft.
- Saved local snapshots preserve signal notes.
- Share text now includes signal notes beside selected signals and a `Signal notes: X/Y` summary.
- Share card now shows whether local signal notes were added, without printing long notes onto the PNG.
- Updated Leak Score guide and roadmap copy.
- Updated shared build marker to `v59.45.5`.

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
- `NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully but timed out during Next.js “Running TypeScript ...” in the sandbox while standalone typecheck passed, consistent with the existing large monolithic `page.tsx` build-time issue.
