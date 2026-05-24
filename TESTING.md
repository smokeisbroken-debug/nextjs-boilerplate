# v59.11 Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Manual checks:

1. Open Home.
2. Find Weekly Behavior Report.
3. Confirm the Safe Weekly Share Card appears inside the report.
4. Confirm it does not show income, real balance, payday, or debt details.
5. Tap Copy safe text.
6. Tap Share weekly card.
7. Confirm image generation/share/download works in Telegram WebView.
8. Change Profile → Share Studio checkboxes and confirm selected public items appear in the weekly card.
