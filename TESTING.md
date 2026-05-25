# v59.19.6 Testing Checklist

## Profile Share Card
- [ ] Open Profile → Share Studio → Preview here.
- [ ] Confirm the top rounded border is visible and not cropped.
- [ ] Confirm avatar is fully visible.
- [ ] Confirm `$BROKE PROFILE` pill is fully visible.
- [ ] Confirm nickname is fully visible.
- [ ] Confirm status text is not cut.
- [ ] Confirm identity style badge is not cut.
- [ ] Confirm selected metrics still fit cleanly when 7/8 or 8/8 items are selected.
- [ ] Confirm Biggest leak category text does not split awkwardly when possible.
- [ ] Export/share image and confirm the PNG has safe top breathing room.

## Regression
- [ ] Share Studio toggles still work.
- [ ] Public Proof Mode still hides private numbers.
- [ ] Wallet verification/sync still works.
- [ ] Custom avatar upload/remove still works.
- [ ] Other share cards still open and generate.

## Recommended local checks
```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```
