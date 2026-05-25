# PROJECT ORDER — v59.20 Detailed Button Guide Replacement

## Current patch

`v59.20.1 — Button Guide Build Hotfix`

## Build target

Apply this patch on top of the latest confirmed v59.19.6 line.

## What this patch does

1. Replaces the old short guide with a much more detailed in-app guide.
2. Keeps the guide inside the existing question-mark modal flow.
3. Explains every major tab and important button/action in practical language.
4. Renames the old Settings guide tab to Profile in the guide content, while preserving the internal `settings` tab id.
5. Adds compact premium styling for long guide content.

## What this patch intentionally does not do

- No new mechanics
- No reward pool logic
- No API changes
- No database changes
- No wallet verification changes
- No balance formula changes
- No share-card export logic changes

## Next recommended steps

After this guide is deployed and visually checked, the next safe step is either:

1. polish any guide wording based on user feedback, or
2. continue with future holder reward ledger foundation when the product flow is ready.


## v59.20.1 Build Hotfix

- Fixed the detailed Profile guide icon reference by adding `profile` to `SHARE_CARD_PUBLIC_ASSETS`.
- This resolves the TypeScript build error: `Property 'profile' does not exist on type ...`.
- No API, Supabase, wallet, holder rewards, avatar backend, Telegram webhook, or stored-data changes.
