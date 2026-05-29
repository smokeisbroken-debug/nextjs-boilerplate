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
