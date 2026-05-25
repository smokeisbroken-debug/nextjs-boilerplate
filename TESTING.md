# TESTING — v59.20 Detailed Button Guide Replacement

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

Open the app and press the question-mark help button.

Check:

- Help modal opens normally.
- Close button works.
- `Got it` button closes the guide.
- Guide tabs work:
  - Home
  - Add
  - Chart
  - Growth
  - Save
  - Profile
- Each tab scrolls correctly.
- Sticky header/tabs do not block text.
- On mobile, the six guide tabs wrap into compact rows.
- Text does not overflow outside cards.
- Profile guide says never to enter seed phrase.
- Growth guide clearly says no staking, no custody, no investing, no guaranteed returns.
- Save guide keeps Debt & Bills Radar private-first.
- No app data, wallet data, share-card data, or records are changed by opening the guide.


## v59.20.1 Build Hotfix

- Fixed the detailed Profile guide icon reference by adding `profile` to `SHARE_CARD_PUBLIC_ASSETS`.
- This resolves the TypeScript build error: `Property 'profile' does not exist on type ...`.
- No API, Supabase, wallet, holder rewards, avatar backend, Telegram webhook, or stored-data changes.
