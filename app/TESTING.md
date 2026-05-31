# Smoke Is Broke — v59.45.3 Leak Score Card Polish + Bot Delivery Hotfix

v59.45.3 polishes the BROKE Leak Score share card for small mobile screens and adds direct Telegram bot delivery for the Leak Score PNG using the existing `/api/share-result` share-image flow.

## Scope

Patch-only release on top of v59.45.2.

## Changed files

- `app/page.tsx`
- `app/globals.css`
- `app/lib/brokeAdminRewards.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- Matching docs in `app/`

## What changed

- Added `shareInitData` to the Leak Score screen so Telegram Mini App sessions can send the card through the bot.
- Added `Send to TG bot` to the Leak Score share-card actions.
- Reused the existing `sendShareImageViaBot()` helper and `/api/share-result` endpoint; no new backend route was added.
- If Telegram initData is missing, the button saves the PNG locally and tells the user to open inside Telegram.
- If bot delivery fails, the PNG is saved locally as fallback.
- Polished mobile card layout so the score row stays compact on narrow screens.
- Added fixed capture sizing for the Leak Score PNG to reduce cropped/unstable exports from Telegram WebView.
- Updated shared build marker to `v59.45.3`.

## What did not change

- No new API route.
- No Leak Score API scanning.
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

Leak Score remains a manual DYOR checklist. The Telegram bot delivery sends the same neutral PNG card and caption text. The card still says it is a manual checklist, not an accusation, and not financial advice.

## Verification

Target checks for this patch:

```bash
npm run typecheck
npm run lint:quiet
```

Additional manual checks:

1. Open the app inside Telegram Mini App.
2. Enable Pro Mode.
3. Open the `Leak` tab.
4. Enter a project/token name.
5. Select several visible leak signals.
6. Confirm the mobile card preview fits without cutting the header/footer.
7. Press `Send to TG bot`.
8. Confirm the bot receives the Leak Score PNG card.
9. Forward the bot message to a private chat/group manually.
10. Test outside Telegram and confirm `Send to TG bot` falls back to local PNG save.
11. Press `Share card` and confirm native share/download fallback still works.
12. Press `Save PNG` and confirm `broke-leak-score-card.png` is created.
13. Confirm `Copy text` still works.
14. Confirm Rewards/Admin distribution flows still compile and remain unchanged.
