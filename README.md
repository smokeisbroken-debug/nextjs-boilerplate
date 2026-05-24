# v59.12.2 — Holder Display & Share Card Polish

Patch-only update focused on the wallet/share display layer.

## What changed
- Rounded large `$BROKE` balances for cleaner profile/share display, for example `15M BROKE` instead of long decimal values.
- Share cards now show `Holder tier` as the main public wallet signal.
- If the user allows exact token balance publicly, the compact token balance appears as secondary detail under the holder tier.
- Public share card metric layout was tightened for holder tier, token balance, and long leak/category names.

## Not changed
- No Supabase migration.
- No wallet transaction flow.
- No seed phrase/private key logic.
- No staking/claim/rewards logic.
