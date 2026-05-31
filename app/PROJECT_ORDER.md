# Smoke Is Broke — v59.50.1 Universal Leak Check + Token Auto Signal Engine

v59.50.1 moves the product back to the automatic flow: one main `Check` entry where a user can paste a Solana token mint, public wallet address, supported explorer/DEX URL, or text containing a Solana-format address and get a safe leak-context result.

## What changed

- Added a new `Check` bottom-nav entry as the main Universal Leak Check path.
- Added `app/lib/brokeUniversalLeakCheck.ts` for shared universal input cleanup, token/wallet path selection, token auto-signal scoring, wallet context scoring, result shaping, and copy text generation.
- Added `UniversalLeakCheckScreen` to `app/page.tsx`.
- Universal Check now auto-detects token-style inputs, wallet-style inputs, and ambiguous raw Solana addresses.
- Ambiguous raw addresses can check both existing paths and keep the stronger evidence result.
- Token results now use a dedicated Token Auto Signal Engine from existing token data: weak/very weak liquidity, high/extreme top-10 concentration, no visible DEX pair, young/recent pair age, volume/liquidity imbalance, and limited/partial source context.
- Wallet results stay read-only and public-context only: SOL balance, SPL token-account count, non-zero token-account count, and configured `$BROKE` visibility.
- Added result metrics, automatic signal evidence, safe next actions, copyable result text, and deep links into Project Research, Wallet Review, and Compare.
- Updated Help Guide coverage for the new Check path.
- Updated shared build marker to `v59.50.1`.

## Safety boundaries preserved

- No new data source was added.
- No Supabase persistence was added for Universal Check results.
- No public token/wallet database was added.
- No scam labels, wallet accusations, PnL claims, buy/sell timing analysis, or investment advice were added.
- No payout logic, reward eligibility formula, payout shares, Daily Routine, Active Streak, wallet verification, Admin distribution API behavior, payout-wallet env names, or server auto-send behavior changed.

## Verification

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- Targeted brace/paren balance passed for changed TS/CSS files.
- `NEXT_PRIVATE_BUILD_WORKER_COUNT=1 NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully, then timed out in this sandbox during Next.js `Running TypeScript ...`. Standalone `tsc --noEmit` passed.
