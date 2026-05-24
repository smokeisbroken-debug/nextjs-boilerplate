# v59.17.1 — Wallet Verify Fallback + Share Header Fit Hotfix

Patch-only hotfix from v59.17.

## What changed
- Wallet verification now handles missing wallet provider more clearly inside Telegram WebView.
- If Phantom/Solflare provider is not injected, the app shows a helper card instead of only a toast.
- Added quick actions: Open Phantom, Open Solflare, Copy app link.
- Watch-only balance still works; holder unlocks still require verified ownership.
- Profile share-card header has more safe vertical space so name/status text should not be cropped.

## Not changed
- No API changes.
- No Supabase migration.
- No wallet transaction logic.
- No seed phrase/private key handling.
- No token transfers, staking, claims, or custody.
