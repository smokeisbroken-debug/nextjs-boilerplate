# Project Order — v59.32 Private Admin Treasury Panel Foundation

## Patch base

Apply this patch on top of v59.31.2.

## Objective

Move Treasury/Admin preparation into a private admin-only surface instead of exposing future admin controls to every user.

## Implementation order

1. Preserve the v59.31.2 wallet detection and verification flow.
2. Add client-side admin visibility helpers for configured Telegram IDs and verified admin wallet addresses.
3. Add optional treasury public-address config.
4. Render the new Admin Panel only when the current session matches a configured admin condition.
5. Keep the Admin Panel inside Profile, with no public nav item.
6. Show treasury readiness, connected wallet, and payout-off status inside the private panel.
7. Clean public Rewards copy so normal users see project-level snapshot wording, not internal admin wording.
8. Preserve backend snapshot authorization through server-side secrets.
9. Do not add token transfers, claims, payouts, treasury signing, or private key handling.

## Non-goals

- No SPL token transfer execution.
- No Phantom/Jupiter transaction signing for payouts.
- No payout batch generation.
- No reward claim windows.
- No private key storage.
- No Supabase migration.
- No Rewards eligibility formula change.
- No Daily Routine / Active Streak logic change.
