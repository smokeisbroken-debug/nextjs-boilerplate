# TESTING — v59.42 Clean One-Button Admin Distribution

## Static checks run in sandbox

```text
TypeScript transpile diagnostics: app/page.tsx — OK
TypeScript transpile diagnostics: app/api/admin/distributions/route.ts — OK
CSS brace balance — OK
TSX/API brace balance — OK
No BigInt literal suffixes in app/page.tsx — OK
```

Full `npm run typecheck`, `npm run lint:quiet`, and `npm run build` were not rerun in this sandbox because the dependency workspace has been unreliable in recent patches.

## Manual test path

1. Apply the patch.
2. Ensure v59.37 distribution ledger migration has already been applied.
3. Set Vercel env:

```env
REWARDS_ADMIN_SECRET=...
BROKE_PAYOUT_AUTO_SEND_ENABLED=true
BROKE_PAYOUT_WALLET_SECRET_KEY=...
BROKE_PAYOUT_WALLET_ADDRESS=...
SOLANA_RPC_URL=...
BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
NEXT_PUBLIC_BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
```

4. Redeploy.
5. Open Admin modal.
6. Enter Admin key.
7. Set test rules, for example:

```text
Minimum hold: 1
Streak days: 0
Token: $BROKE
Amount: small test amount
```

8. Press `Distribute rewards`.
9. Verify:

- legitimate holders load;
- distribution row is created;
- payout rows are sent from the dedicated payout wallet;
- tx signatures are saved;
- UI shows `Done. Sent X/Y payout(s).`.

## Expected failure messages

- If `BROKE_PAYOUT_AUTO_SEND_ENABLED` is missing, UI asks to enable it.
- If `BROKE_PAYOUT_WALLET_SECRET_KEY` is missing, UI asks to configure the payout wallet.
- If there are no legitimate recipients, UI says no legitimate recipients match the rules.

## Not tested here

Live token transfer on mainnet was not executed in the sandbox.

## v59.42.1 — One-Button Distribution Build Hotfix

- Fixed Vercel/Next.js build failure caused by a stale undefined frontend variable the stale server auto-send confirm variable left from the older dedicated payout-wallet flow.
- The clean one-button Admin distribution flow now uses the literal server confirmation phrase `SERVER AUTO SEND` internally when preparing and executing payout-wallet auto-send.
- No UI complexity was reintroduced: Admin remains a simple form with Admin key, minimum hold, required streak days, token, amount, eligible preview, and one Distribute rewards action.
- No eligibility formula, Daily Routine/Active Streak, Supabase schema, claims/staking, public UI, or wallet verification backend changes.

Verification in patch workspace:

```bash
TypeScript transpile diagnostics: app/page.tsx OK
TypeScript transpile diagnostics: app/api/admin/distributions/route.ts OK
CSS/TSX/API brace balance OK
No remaining stale confirm-variable references in frontend code
```

## v59.42.2 — Eligible Preview + RPC Method Hotfix

- Admin distribution now has two clear actions: `Check eligible` first, then `Distribute rewards`.
- `Distribute rewards` no longer silently reloads and sends in one hidden step; it requires an already loaded eligible preview so the admin can review recipients first.
- Recipient preview now renders the full eligible list instead of truncating at 6 rows; the list scrolls inside the Admin panel when it is long.
- Added clearer handling for `Method not found` RPC failures: this usually means `SOLANA_RPC_URL` is not a valid Solana JSON-RPC endpoint. The server now retries public mainnet once when the configured endpoint is wrong, and the UI explains the RPC issue clearly.
- No eligibility formula, Daily Routine/Active Streak logic, Supabase schema, claims/staking, public UI, or payout-wallet env names changed.


## v59.42.3 Admin Eligible List Scroll Reach Hotfix

- Fixed private Admin eligible-recipient preview scrolling so the last eligible holder can be reached on mobile.
- Raised the Admin modal above the bottom navigation and added safe-area/bottom padding to the modal scroll area and recipient list.
- Kept the v59.42.2 two-step flow: Check eligible first, then Distribute rewards.
- No payout logic, eligibility formula, Supabase schema, wallet backend, token mint, Daily Routine, or Active Streak changes.
