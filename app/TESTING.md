# v59.19.5 Testing Checklist

## Profile Share Card
- [ ] Open Profile → Share Studio → Preview here.
- [ ] Confirm the card is not excessively tall.
- [ ] Confirm the header has no large empty vertical gap.
- [ ] Confirm selected metrics fit cleanly when 7/8 or 8/8 items are selected.
- [ ] Confirm the active preset/custom avatar appears in the card header.
- [ ] Tap share/download image and confirm the exported PNG is wider and cleaner than v59.19.4.
- [ ] Confirm footer and potential savings block fit without looking stretched.

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
