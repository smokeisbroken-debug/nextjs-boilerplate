# v59.18 — Wallet Provider Help + Verification Stability

## Purpose
Make wallet verification clearer and more stable across Telegram WebView, normal web browsers, and Solana wallet browsers.

The app already supported watch-only wallet checks and verified ownership through signed messages. This patch improves the user-facing bridge between those states so users understand why Telegram may show watch-only and how to complete verification safely.

## Files changed
- `app/page.tsx`
- `app/globals.css`
- `app/api/broke/route.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Deploy order
1. Replace the patch files.
2. Deploy to Vercel.
3. No SQL is required for this patch.
4. Run diagnostics:

```bash
/api/broke?check=supabase&key=YOUR_DIAGNOSTICS_SECRET
```

5. Confirm that these wallet tables return `ok: true` if wallet verification is already installed in Supabase:
   - `broke_wallet_links`
   - `broke_wallet_verifications`
6. Test Profile → Wallet & $BROKE balance from Telegram and from a Solana wallet browser.

## Safety boundaries
- Wallet verification remains message-signature only.
- Users are never asked for seed phrases.
- No transaction request is created.
- Holder perks remain gated by verified wallet ownership, not watch-only addresses.
