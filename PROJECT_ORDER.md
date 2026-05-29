# v59.42.8 Admin Deployment Marker + Stale RPC Warning Proof Hotfix

This patch is intentionally small. It adds a visible `Build v59.42.8` marker inside the private Rewards Admin panel and a server-side build constant in `app/api/admin/distributions/route.ts`. The old misleading frontend message `SOLANA_RPC_URL is not a valid Solana JSON-RPC endpoint...` is not present in this build.

If the live app still shows that old warning after deploying this patch, the live domain is not serving this build, the patch was not applied to the deployed project/branch, or the wallet browser is showing a cached old bundle.

Distribution logic remains the v59.42.7 one-request flow: Check eligible first, review recipients, then Distribute rewards sends through the dedicated payout wallet server path in one POST request. No eligibility formula, payout share math, Supabase schema, Daily Routine, Active Streak, public UI, or wallet verification logic changed.

Verification: targeted source scan confirms no old `SOLANA_RPC_URL is not a valid Solana JSON-RPC endpoint` frontend warning string exists in `app/page.tsx`.


## v59.42.9 Admin JSON-RPC Method Fix

- Fixed dedicated payout sender RPC call for SPL token decimals: replaced the invalid raw JSON-RPC method `getParsedAccountInfo` with standard Solana JSON-RPC `getAccountInfo` using `encoding: "jsonParsed"`.
- This addresses the real `Method not found` failure shown after v59.42.8 when distributing `$BROKE`; the previous build marker proved the latest frontend was loaded, and the remaining failure was a server RPC method bug.
- Admin build marker now shows `Build v59.42.9 · JSON-RPC method fix`.
- No payout share formula, eligibility rules, Supabase schema, Daily Routine, Active Streak, public UI, or wallet verification changes.
