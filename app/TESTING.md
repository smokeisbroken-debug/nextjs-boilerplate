# TESTING — v59.20.3 Home Snapshot Open + Premium Details Rows

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
- Confirm Wallet Snapshot is open by default.
- Confirm Income, Life Cost, Money Leaks, Real Balance, day tabs, and today snapshot are visible without tapping.
- Confirm Today’s Focus is collapsed by default and opens correctly.
- Confirm Weekly Behavior Report is collapsed by default and opens correctly.
- If Comeback Mode appears, confirm it is collapsed by default and opens correctly.
- Confirm lower rows such as Biggest Leak Challenge, Daily Routine, Share Reports, Badges, Recent Expenses, and Account / Sync use the premium row style.
- Confirm old arrow/chevron details visuals are not visible on Home.

### Regression

- Track Leak still saves an expense.
- Chart still opens and shows data.
- Profile wallet verification controls still open inside Profile.
- Share Studio still opens and edits selected public items.
- Existing share-card exports still work as in v59.20.2.
