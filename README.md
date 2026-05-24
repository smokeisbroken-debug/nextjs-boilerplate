# v59.15 — Holder Proof Profile Polish

Patch-only update from the v59.14.1 working checkpoint.

## What changed
- Holder display is now stricter and clearer after wallet verification was introduced.
- Public Share Studio holder metric now requires a verified wallet before showing holder tier.
- Watched wallets can still check balance, but public holder proof stays locked until verification.
- Profile wallet block now includes a compact Holder Proof dashboard.
- Added next holder tier progress with a progress bar and clear next-tier target.
- Share-card holder display now says Verified holder instead of showing raw range when exact balance is private.

## Not changed
- No API route changes.
- No Supabase schema changes.
- No migration required.
- No wallet transactions.
- No token transfers.
- No custom avatar upload logic changes.
