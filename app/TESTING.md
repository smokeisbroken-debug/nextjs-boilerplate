# TESTING — v59.29.1 Jupiter Wallet Provider Hotfix

## Build checks

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Wallet provider checks

Confirm:

- Jupiter Wallet appears in supported wallet help/copy.
- Jupiter Wallet can be detected if the browser injects a Jupiter Solana provider through `window.jupiter`, `window.jupiterWallet`, `window.jupiterSolana`, provider flags/names, or `window.solana.providers[]`.

- Profile still opens normally.
- Existing pasted wallet address flow still works.
- Check $BROKE balance still works as watch-only.
- Rescan provider still works when no wallet is injected.
- Provider Help appears when no signing provider is available.
- In Phantom browser/extension, provider is detected and Verify wallet can request a message signature.
- In Solflare browser/extension, provider is detected and Verify wallet can request a message signature.
- In Backpack browser/extension, provider is detected when injected and Verify wallet can request a message signature.
- In Jupiter Wallet browser/extension, provider is detected when injected and Verify wallet can request a message signature.
- If the browser exposes multiple Solana providers, the provider selector appears.
- Selecting a provider changes the wallet used for verification.
- Use wallet address connects the selected provider and pastes the connected public address.
- Verification rejects if the connected wallet address does not match the pasted address.

## Daily Routine / Rewards checks

Confirm v59.28 rules still hold:

- Track Leak does not directly protect Active Streak.
- Mark Clean Day does not directly protect Active Streak.
- One Fix does not directly protect Active Streak.
- Daily Challenge does not directly protect Active Streak.
- Completing all 7 Daily Routine actions records Daily Routine proof.
- The final Daily Routine action is completed only by Share on X.

## Non-regression checks

Confirm existing flows still work:

- expense save/delete;
- Daily Routine checklist;
- share cards;
- wallet verification display;
- reward snapshot ledger display;
- Supabase sync;
- Telegram Mini App loading;
- external-site/iframe display guard.
