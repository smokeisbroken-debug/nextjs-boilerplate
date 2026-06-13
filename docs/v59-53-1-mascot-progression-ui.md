# v59.53.1 — Mascot Progression UI

## Scope

Adds the first visible Mascot Progression card inside Rewards.

The mascot is not a separate game yet. It is a visual progression layer connected to existing Life Tracker activity.

## Added

- Mascot Progression card in Rewards.
- Current mascot stage image from `/public/mascot/stages`.
- Mascot Power score from existing app signals.
- Mascot Level display.
- Wallet HP / Power / Level / Badge summary.
- Streak Energy, Routine Energy, and Tracking Energy.
- Badge row using the existing badge asset foundation.
- Actions to open Daily Routine and Profile.

## Power formula

Mascot Power uses existing local/app data only:

- Wallet HP
- Active Streak
- Daily Routine state
- Current tracking consistency
- Earned badge count

No payout logic or reward distribution logic is involved.

## Safety

Not changed:

- rewards/admin payout
- wallet verification
- Supabase schema
- Universal Check scoring
- Daily Routine formula
- transaction history
- PnL/scam labels
- investment advice wording

## Verification

- `npm ci --ignore-scripts --no-audit --no-fund` passed.
- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- Production build compiled successfully, then the sandbox timed out during the Next.js TypeScript stage. Standalone `typecheck` passed.
