# PROJECT ORDER — v59.42 Clean One-Button Admin Distribution

Base: confirmed v59.41 Dedicated Payout Wallet Auto-Send Fallback.

## Objective

Reduce the private Admin distribution flow to a usable production-style screen:

```text
conditions + amount + one button
```

## Patch files

- `app/page.tsx`
- `app/globals.css`
- `app/api/admin/distributions/route.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- matching `app/` docs

## Implementation

### Admin UI

The Admin modal now shows a clean form:

- Admin key.
- Minimum hold.
- Streak days.
- Token.
- Amount.
- `Distribute rewards`.

The old visible controls for wallet batch signing, payment-link queue, copy rows, tx paste, test/real mode toggles, and long technical explanations were removed from the main Admin UI.

### One-button distribution

`Distribute rewards` runs this sequence:

1. `GET /api/admin/holders` with the selected `minHold` and `minStreak`.
2. Build local payout rows by balance-share percent.
3. `POST /api/admin/distributions` to create a real distribution batch.
4. `PATCH /api/admin/distributions` with `server_auto_send` to send through the dedicated payout wallet.
5. Update UI with sent count and saved tx signatures.

### API

- Fixed duplicate `const rows` declaration in payout normalization.
- Real distribution preparation now accepts the dedicated payout-wallet flow when `BROKE_PAYOUT_AUTO_SEND_ENABLED=true`, instead of requiring browser treasury-wallet signing.

## Safety boundary

The one-button flow uses the dedicated payout wallet env from v59.41. The main treasury seed must not be used. No Supabase schema changes are included.

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
