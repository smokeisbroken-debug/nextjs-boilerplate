# v59.42.6 Admin RPC Source Isolation Hotfix

Patch-only update on top of v59.42.5.

## Summary

The private Admin reward distribution route no longer lets old public/enhanced Helius env values poison the server payout sender. Server auto-send now uses only `SOLANA_RPC_URL` plus the public Solana mainnet fallback, and it no longer collapses back into the same misleading `RPC endpoint is not Solana JSON-RPC` loop when a stale endpoint exists elsewhere in Vercel.

The `$BROKE` payout mint is also hardened: invalid env values and the Solana System Program placeholder are ignored, then the known `$BROKE` mint fallback is used.

## Changed files

- `app/api/admin/distributions/route.ts`
- docs only

## Not changed

- Eligibility formula
- Payout share formula
- Supabase schema
- Wallet verification
- Public UI
- Daily Routine / Active Streak
- Token mint fallback

## Admin env expectation

Keep this server variable for private RPC:

```env
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

Old `NEXT_PUBLIC_SOLANA_RPC_URL`, `HELIUS_RPC_URL`, and `NEXT_PUBLIC_HELIUS_RPC_URL` are ignored by the payout sender.

## Verification

Targeted checks: TS/API/CSS brace balance passed. No BigInt literal suffixes were found in the admin route.
