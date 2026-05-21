# v59.4 — Testing

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Expected:
- TypeScript passes.
- Quiet lint passes.
- Production build passes.

Manual checks:
1. Open Growth.
2. Create or save a Growth plan.
3. Confirm the saved plan is clickable.
4. Open the plan detail.
5. Add a progress amount.
6. Confirm the progress bar and receipt history update.
7. Tap Mark planned contribution.
8. Tap Update plan and confirm the builder fields load the selected plan.
9. Tap Share card and confirm existing Growth share flow still works.
10. Reload the app and confirm saved progress remains available.
