# v59.19.3 Testing Checklist

## Profile / Personal Cabinet
- [ ] Open Profile on Telegram mobile.
- [ ] Confirm top identity card is shorter than before.
- [ ] Confirm Wallet & $BROKE Balance appears as one collapsed premium row.
- [ ] Tap Wallet & $BROKE Balance and confirm wallet address, verify, sync, provider help, holder proof, and privacy controls still work.
- [ ] Confirm wallet security notes are small chips, not large empty pills.
- [ ] Confirm holder rewards remain visible only inside the expanded wallet section.
- [ ] Confirm Share Studio appears as one collapsed premium row.
- [ ] Tap Share Studio and confirm share item toggles still work.
- [ ] Confirm selected Share Studio items are dark/glass, not bright neon blocks.
- [ ] Confirm Open share card and Preview here still work.

## Settings
- [ ] Confirm Profile Settings sections remain collapsed by default.
- [ ] Confirm Quick Setup, Money Setup, Currency & Repair, Privacy & Public Proof, Personalization, Notifications & Sync, Progress Vault, and Data & Records can still open.

## Regression
- [ ] Add expense still works.
- [ ] Wallet HP / Home still renders.
- [ ] Chart still renders.
- [ ] Growth and Save tabs still open.
- [ ] No console error after opening/closing wallet and Share Studio.

## Recommended local checks
```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```
