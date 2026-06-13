# v59.56.0 — Weekly Boss MVP

Adds the first light game-like layer inside Rewards without turning $BROKE into a separate game.

## Scope

- Adds `Weekly Boss MVP` card under Mascot Progression.
- Uses existing app activity only.
- Calculates weekly personal damage from:
  - Mascot Power
  - Wallet HP
  - Daily Routine completion
  - Active Streak
  - Real tracking / Clean Day proof
  - Leak Fix / One Fix proof
  - Challenge History proof
- Shows damage, progress, active proofs, damage sources, and next useful action.
- Adds actions to open Daily Routine and Challenges.

## Intent

This is a safe MVP for the future gamification layer:

`real app activity → mascot strength → weekly boss contribution`

It does not add real gameplay, PvP, token payouts, or a separate app.

## Not changed

- Rewards/admin payout
- Wallet verification
- Supabase schema
- Universal Check scoring
- Daily Routine formula
- Transaction history / PnL / scam labels
- $BROKE reward distribution logic
