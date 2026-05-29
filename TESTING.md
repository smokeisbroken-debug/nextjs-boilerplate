# v59.42.4 Admin $BROKE Payout Public Key + Token Safety Hotfix

Patch on top of v59.42.3.

## Changes
- Fixed the custom base58 decoder used by the admin payout sender so all-zero/system-program public keys such as `11111111111111111111111111111111` decode to 32 bytes instead of being rejected as `Invalid Solana public key: 111111...`.
- Applied the same base58 decoder fix to the browser-side admin helpers.
- Defaulted the clean admin distribution token to `$BROKE`.
- Temporarily limited the clean one-button Admin distribution UI to `$BROKE` only to avoid accidental SOL/USDC payouts while the project is testing real token rewards.
- Kept the v59.42.2/v59.42.3 two-step flow: `Check eligible` first, then `Distribute rewards`.

## Not changed
- No eligibility formula changes.
- No Daily Routine / Active Streak changes.
- No Supabase schema changes.
- No wallet verification backend changes.
- No public user UI changes.

## Verification
- Targeted base58 decoder check confirms `11111111111111111111111111111111` decodes to 32 bytes.
- TSX/API/CSS brace balance passed.
