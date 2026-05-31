# Smoke Is Broke — v59.46.6 Token Data Address Helpers + Paste Cleanup

v59.46.6 improves the Basic Token Data input flow in BROKE Leak Research. Users can paste a clean Solana mint, a Solscan/Solana explorer token URL, or text that contains a mint-like address; the app cleans/extracts the address locally before fetch. Auto data remains a read-only research snapshot, not a verdict, scam label, or investment recommendation.

## Changes

- Added local paste cleanup for the Leak Research contract/mint field.
- Auto-trims whitespace, trailing punctuation, invisible zero-width characters, and surrounding quotes.
- Extracts Solana-format addresses from Solscan/Solana explorer-style token/account URLs and query parameters such as `mint`, `token`, `address`, `contract`, and `ca`.
- Adds cautious extraction from DEX-style/token URLs with a visible warning that DEX URLs can contain pair addresses and the user should confirm the token mint.
- Added an inline address helper message explaining what was cleaned or extracted.
- Server route now also uses the same cleanup helper before validation, so direct requests get the same safer normalization.
- Kept empty mint, invalid mint, unsupported chain, source-health, fetched-at display, 12-second cooldown, 10-minute same-mint cache, Force refresh, Clear cache, and two-step Apply hints controls.
- Updated shared build marker to `v59.46.6`.

## No changes

- No new token-data source.
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
- `NEXT_TELEMETRY_DISABLED=1 npm run build` passed.
- Targeted brace/paren balance passed for changed files.
- Targeted scan found no BigInt literal suffixes.
- Zip integrity test passed.

## Manual test checklist

1. Open Pro Mode → Leak.
2. Keep contract/mint empty and confirm Fetch data / Force refresh are disabled with mint-needed guidance.
3. Paste a clean Solana mint with spaces before/after and confirm it is trimmed.
4. Paste a Solscan token/account URL and confirm the mint-like address is extracted.
5. Paste text containing a mint-like address and confirm the first Solana-format address is extracted.
6. Paste a DEX Screener-style Solana URL and confirm the helper warns that DEX URLs may contain pair addresses.
7. Paste invalid text like `BONK` or a website URL without a mint and confirm invalid-mint guidance appears.
8. Switch chain away from Solana and confirm unsupported-chain guidance appears while manual checklist remains usable.
9. Paste a valid Solana mint and confirm Fetch data / Force refresh enable.
10. Click Fetch data and confirm metric cards/source health still work.
11. Test cache reuse, Force refresh, Clear cache, Review hints → Confirm apply, Save PNG, and Send to TG bot.
