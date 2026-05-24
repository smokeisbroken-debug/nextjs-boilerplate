# v59.14 — Verified Holder Guard

Patch-only package for the current stable $BROKE Mini App line.

## Purpose

This patch separates wallet balance display from ownership-based holder unlocks.

Before this patch, a user could paste any public Solana wallet address and unlock holder features based only on its visible balance. This patch fixes that product/security gap by adding ownership verification.

## User-facing changes

- Wallet balance can still be checked as a read-only **watched wallet**.
- Holder unlocks now require **verified wallet ownership**.
- Profile → Wallet has a new **Verify wallet** button.
- Verification uses a wallet message signature only.
- No transaction, token transfer, seed phrase, or private key is involved.
- Custom avatar upload now requires:
  - verified wallet ownership;
  - at least 500,000 BROKE balance.

## Backend changes

New routes:

```txt
app/api/wallet/verify/nonce/route.ts
app/api/wallet/verify/confirm/route.ts
```

Updated route:

```txt
app/api/avatar/upload/route.ts
```

New Supabase tables:

```txt
broke_wallet_verifications
broke_wallet_links
```

## Deployment order

1. Run the Supabase migration.
2. Replace files from this patch.
3. Deploy to Vercel.
4. Verify a wallet from Profile → Wallet & $BROKE balance.
5. Run the audit SQL.

## Supabase migration

Run:

```txt
supabase/migrations/20260524_v59_14_verified_holder_guard.sql
```

Then audit:

```txt
supabase/review/20260524_v59_14_verified_holder_guard_audit.sql
```

## Required env

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
```

Recommended/optional:

```txt
WEB_AUTH_SECRET
BROKE_TOKEN_MINT
SOLANA_RPC_URL
```
