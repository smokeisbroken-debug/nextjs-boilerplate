# Smoke Is Broke — v59.50.2 Wallet Auto Signal Engine

v59.50.2 continues the automatic product path without adding another manual screen. Token checks already had the Token Auto Signal Engine in v59.50.1; this patch strengthens the wallet side so Universal Check can give a more useful public wallet-context result after a user pastes a wallet address or wallet-style URL.

## What changed

- Added a dedicated `buildWalletAutoSignals()` engine inside `app/lib/brokeUniversalLeakCheck.ts`.
- Wallet Universal Check now derives automatic wallet-context signals from the existing read-only wallet data layer.
- New wallet-side automatic prompts include:
  - critical / low SOL gas runway;
  - very wide / heavy / wide visible token exposure;
  - high token-account clutter;
  - empty token-account clutter;
  - no active SPL exposure visible;
  - limited / partial wallet source context;
  - configured `$BROKE` visibility context.
- Wallet result metrics now show exposure breadth instead of only a raw non-zero token count.
- Universal Check UI now labels the engine dynamically as `Token Auto Signal Engine` or `Wallet Auto Signal Engine`.
- Help Guide copy now explains that wallet checks cover gas runway, exposure breadth, account clutter, and source confidence.
- Updated shared build marker to `v59.50.2`.

## Safety boundaries preserved

- No transaction-history scan was added.
- No PnL, buy/sell timing, or trade-quality analysis was added.
- No wallet surveillance, identity claim, intent claim, or wallet accusation was added.
- No new data source was added.
- No Supabase persistence was added for Universal Check results.
- No public token/wallet database was added.
- No scam labels or investment advice were added.
- No payout logic, reward eligibility formula, payout shares, Daily Routine, Active Streak, wallet verification, Admin distribution API behavior, payout-wallet env names, or server auto-send behavior changed.

## Verification

- `npm run typecheck` passed.
- `npm run lint:quiet` passed.
- Targeted brace/paren balance passed for changed TS files.
- Targeted scan found no BigInt literal suffixes in changed TS files.
- Zip integrity test passed.
