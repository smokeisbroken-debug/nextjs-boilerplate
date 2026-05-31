# Smoke Is Broke — v59.45.2 Leak Score Shareable Card

v59.45.2 continues the BROKE Leak Score feature as a safe local-only DYOR tool. It adds a visual shareable PNG card for the manual Leak Score draft while keeping the feature educational, non-accusatory, and fully local.

## Scope

Patch-only release on top of v59.45.1.

## Changed files

- `app/page.tsx`
- `app/globals.css`
- `app/lib/brokeAdminRewards.ts`
- `app/lib/brokeLeakScore.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- Matching docs in `app/`

## What changed

- Added a visual `BROKE Leak Score` share-card preview to the Leak Score screen.
- Added local PNG export through the existing html2canvas capture helper.
- Added `Share card` action using native file share when supported.
- Added `Save PNG` fallback for browsers/WebViews that block native file share.
- Updated share-card capture helper to accept a custom file name while preserving the existing default filename for other share cards.
- Updated Leak Score roadmap copy from “share card later” to “share card now, signal fetch later.”
- Updated shared build marker to `v59.45.2`.

## What did not change

- No API calls from Leak Score.
- No Supabase persistence.
- No public project database.
- No automated on-chain scanning.
- No scam labels.
- No project accusations.
- No investment advice.
- No payout logic changes.
- No reward eligibility formula changes.
- No payout share math changes.
- No Daily Routine changes.
- No Active Streak changes.
- No wallet verification changes.
- No Admin distribution API changes.
- No payout-wallet env changes.
- No server auto-send changes.

## Safety notes

Leak Score remains a manual DYOR checklist. The generated card says it is a manual checklist and not an accusation or financial advice. The PNG is generated locally from the browser screen.

## Verification

Target checks for this patch:

```bash
npm run typecheck
npm run lint:quiet
```

Additional manual checks:

1. Open the app.
2. Enable Pro Mode.
3. Open the `Leak` tab.
4. Enter a project/token name.
5. Select several visible leak signals.
6. Confirm the score/tier changes.
7. Confirm the visual card updates with project, chain, score, tier, and signals.
8. Press `Share card`.
9. If native sharing is unsupported, confirm PNG download fallback works.
10. Press `Save PNG` and confirm `broke-leak-score-card.png` is created.
11. Press `Copy text` and confirm neutral DYOR text is copied.
12. Reload app and confirm local draft remains.
13. Press `Clear` and confirm the card resets.
14. Confirm there are no API calls or Supabase writes from the Leak Score screen.
15. Confirm Rewards/Admin distribution flows still compile and remain unchanged.
