# v59.15 — Holder Proof Profile Polish

## Goal
After v59.14 introduced watched vs verified wallets, public holder display needed to respect that distinction. This patch makes the profile/share layer cleaner and safer.

## Files changed
- app/page.tsx
- app/globals.css
- README.md
- PROJECT_ORDER.md
- TESTING.md

## Product behavior
- Watch wallet: balance can be viewed, but public holder status says verification is needed.
- Verified wallet: holder tier can be used in profile/share identity.
- Holder Proof dashboard shows tier, verification state, and next-tier progress.

## No backend changes
This is a UI/logic polish patch only. It relies on the verification foundation from v59.14.
