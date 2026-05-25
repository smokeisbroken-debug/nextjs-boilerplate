# TESTING — v59.20.2 Home Compact + Share Card Crop Hotfix

## Static checks performed in this environment

- `app/page.tsx` TSX transpile diagnostics: pass
- `app/globals.css` brace balance: pass

Full npm checks were not run in this patch workspace because installed project dependencies were not present here.

## Recommended local/Vercel checks

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Manual QA checklist

### Home

- Open Home on mobile.
- Confirm the visible screen is shorter than before.
- Confirm Wallet Snapshot is collapsed by default.
- Tap Wallet Snapshot and confirm income/life cost/leaks/real balance/day tabs are still available.
- Confirm Today’s Focus is collapsed by default.
- Tap Today’s Focus and confirm the existing focus logic/actions still work.
- Confirm Weekly Behavior Report is collapsed by default.
- Tap Weekly Behavior Report and confirm report/share actions still work.
- If Comeback Mode appears, confirm it is collapsed by default and opens correctly.

### Share cards

- Export Profile Share Card.
- Export Weekly Behavior Report share card.
- Export Daily/Weekly report cards.
- Export Mission Result card.
- Export Weekly Review and Monthly Leak History cards.
- Export Survival card.
- Confirm avatar/header/status line are not clipped at the top.
- Confirm custom avatar still appears when configured.

### Regression

- Track Leak still saves an expense.
- Chart still opens and shows data.
- Profile wallet verification controls still open inside Profile.
- Share Studio still opens and edits selected public items.
