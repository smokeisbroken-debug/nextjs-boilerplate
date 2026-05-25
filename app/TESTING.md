# v59.19 Testing Checklist

## Build checks

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Visual smoke test

Check these areas on mobile width and desktop/web width:

- Home hero and Today’s Focus.
- Wallet Snapshot and Wallet HP.
- Track Leak amount input, category buttons, need-type choices, trigger chips, and save CTA.
- Wallet Pressure Chart and selected day details.
- Leak Pattern Lab / Weekly Behavior Report.
- Growth / Save / Debt & Bills Radar blocks.
- Profile / Personal Cabinet.
- Wallet provider help and Sync verification flow.
- Share Studio and inline share preview.
- Bottom navigation.
- Help guide modal.

## Share image safety

Open/create share cards and confirm that image capture still renders text/card layers correctly. The patch avoids blur inside share-capture surfaces for this reason.

## Expected result

The app should feel like one premium dark dashboard system, not separate visual eras, while all existing behavior remains unchanged.
