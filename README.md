# Smoke Is Broke — v59.46.5 Token Data Error States + Empty Mint UX

v59.46.5 hardens the Basic Token Data experience in BROKE Leak Research. Empty mint, unsupported chain, invalid Solana mint, invalid JSON, and source/error states now show clearer local guidance instead of generic failed-fetch behavior. Auto data remains a read-only research snapshot, not a verdict, scam label, or investment recommendation.

## Changes

- Added local input-state guidance for Basic Token Data: mint missing, unsupported chain, invalid mint format, and ready-to-fetch.
- Disabled `Fetch data` and `Force refresh` until the current chain/address can be fetched safely.
- Added clearer retryable error panel for failed token-data loads: continue manually, fix the mint, or retry/force-refresh later.
- Hardened `/api/leak-score/token-data` request validation with stable error codes for invalid JSON body, empty contract address, unsupported chain, and invalid Solana mint.
- Client now maps token-data error codes to safer user-facing copy instead of exposing raw source errors as the main UX.
- Kept source-health, fetched-at display, 12-second fetch cooldown, 10-minute same-mint cache, Force refresh, Clear cache, and two-step Apply hints controls.
- Updated shared build marker to `v59.46.5`.

## No changes

- No Supabase persistence.
- No public project database.
- No automated scam detection.
- No project accusation labels.
- No investment advice.
- No payout logic changes.
- No reward eligibility formula changes.
- No payout share changes.
- No Daily Routine changes.
- No Active Streak changes.
- No wallet verification changes.
- No Admin distribution API changes.
- No payout-wallet env changes.
- No server auto-send changes.

## Verification

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- `NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully and finished TypeScript, then timed out during Next.js page-data/static generation in the sandbox, consistent with the existing large monolithic `page.tsx` build-time issue.
- Targeted brace/paren balance passed for changed files.
- Targeted scan found no BigInt literal suffixes.
- Zip integrity test passed.

## Manual test checklist

1. Open Pro Mode → Leak.
2. Keep contract/mint empty and confirm Fetch data / Force refresh are disabled with mint-needed guidance.
3. Paste an invalid value like a ticker, URL, or short text and confirm invalid-mint guidance appears.
4. Switch chain away from Solana and confirm unsupported-chain guidance appears while manual checklist remains usable.
5. Paste a valid Solana mint and confirm buttons enable.
6. Click Fetch data and confirm metric cards/source health still work.
7. Trigger cache reuse, Force refresh, and Clear cache.
8. If source fetch fails, confirm the retryable error panel appears.
9. Confirm two-step Review hints → Confirm apply still works when hints exist.
10. Test Save PNG / Send to TG bot.
