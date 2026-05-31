# Smoke Is Broke — v59.45.4 Leak Score Saved Drafts + Reset Safety

v59.45.4 hardens the local-only BROKE Leak Score flow after the Telegram bot PNG delivery hotfix. Users can now save up to five local Leak Score snapshots on the same device, load or delete them, and clear the active draft through a two-step reset guard.

## Patch scope

- Added local-only saved Leak Score snapshots under `broke-leak-score-saved-drafts-v1`.
- Added `Save snapshot`, `Load`, and `Delete` actions inside the Leak Score project draft card.
- Kept the active draft under `broke-leak-score-local-draft-v1`.
- Changed Clear into a two-step safety action: first tap arms the clear action, second tap confirms it.
- Clear only resets the active draft; saved snapshots stay untouched.
- Updated Leak Score guide and roadmap copy.
- Updated shared build marker to `v59.45.4`.

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
- `NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully but timed out during Next.js page-data/typecheck work in the sandbox while standalone typecheck passed, consistent with the existing large monolithic `page.tsx` build-time issue.
