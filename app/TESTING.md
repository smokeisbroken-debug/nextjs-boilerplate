# v59.19.4 Testing Checklist

## Share cards
- [ ] Open Profile → Share Studio → Preview here.
- [ ] Confirm the Profile Share Card width looks controlled and premium.
- [ ] If a custom avatar is active, confirm it appears on the Profile Share Card.
- [ ] Open Home → Weekly Behavior Report and confirm the weekly card uses the avatar and fits cleanly.
- [ ] Open reports and confirm Daily Report and Weekly Report share cards use avatar + secondary signal icon.
- [ ] Complete/open a Mission Result card and confirm the avatar appears in the header.
- [ ] Open Weekly Review and Monthly Leak History cards and confirm layout width is consistent.
- [ ] Open Survival Mode share card and confirm layout width is consistent.
- [ ] Create Growth Lab share preview and confirm it still renders; avatar should appear if it loads successfully.

## Image generation
- [ ] Tap share/download image for the Profile Share Card.
- [ ] Confirm the exported PNG is not too wide and text is not cropped.
- [ ] Repeat for Weekly Behavior Report, Daily Report, Weekly Report, and Mission Result.

## Regression
- [ ] Add expense still works.
- [ ] Wallet verification/sync still works.
- [ ] Custom avatar upload/remove still works.
- [ ] Share Studio toggles still work.
- [ ] Public Proof Mode still hides private numbers.
- [ ] No console error during share card image generation.

## Recommended local checks
```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```
