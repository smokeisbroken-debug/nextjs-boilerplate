# Smoke Is Broke — v59.47.2 Wallet Leak Saved Snapshots + Reset Safety

v59.47.2 adds local saved snapshots and safer active-draft reset to the manual Wallet Leak Score screen. The feature remains framed as Manual Self-Check / Educational / Wallet Behavior Leaks / Not Wallet Surveillance / Not Financial Advice.

## Patch contents

- Added up to 5 local-only Wallet Leak saved snapshots under `broke-wallet-leak-score-saved-drafts-v1`.
- Added `Save snapshot`, `Load`, and `Delete` actions inside the Wallet context card.
- Kept the active draft under `broke-wallet-leak-score-local-draft-v1`.
- Updated Clear flow copy so the two-step reset clearly affects only the active draft and leaves saved snapshots untouched.
- Updated shared build marker to `v59.47.2`.

## Boundaries

- No wallet API.
- No on-chain wallet history scan.
- No Supabase persistence.
- No public wallet/project database.
- No automated wallet accusations.
- No investment advice.
- No payout logic changes.
- No reward eligibility formula changes.
- No Daily Routine / Active Streak changes.
- No wallet verification changes.
- No Admin distribution API changes.
- No payout-wallet env changes.
- No server auto-send changes.

## Manual verification

1. Open the app.
2. Switch to Pro Mode.
3. Open Wallet.
4. Add wallet label and optional public wallet address.
5. Select several behavior leaks.
6. Add local notes.
7. Tap `Save snapshot`.
8. Change the wallet label or selected behavior leaks.
9. Tap `Save snapshot` again.
10. Tap `Load` on the first snapshot and confirm it restores the saved wallet context/signals/notes.
11. Tap `Delete` on one snapshot and confirm it disappears.
12. Tap `Clear` once and confirm the button changes to `Confirm clear`.
13. Tap `Confirm clear` and confirm only the active draft resets.
14. Confirm saved snapshots remain available after active draft clear.
15. Reload the app and confirm saved snapshots remain local.
16. Confirm `Copy text`, `Share text`, `Save PNG`, `Share card`, and `Send to TG bot` still work.
17. Confirm Project Leak Research and Admin/Rewards screens remain unchanged.

## Verification run

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` passed.
- Targeted brace/paren balance passed.
- Targeted BigInt suffix scan passed.
- Zip integrity passed.
