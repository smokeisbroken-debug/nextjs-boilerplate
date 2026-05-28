# TESTING — v59.31 Wallet Connect Verify + Button Alignment Hotfix

## Build checks

Run:

```bash
npm run typecheck
npm run lint:quiet
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Wallet verification checks

Confirm:

- With no address pasted but a supported wallet provider detected, **Verify wallet** is enabled.
- Pressing **Verify wallet** opens/connects the selected wallet.
- The wallet public address is inserted into the Profile wallet field automatically.
- The wallet asks for a message signature only.
- Verification succeeds after the signed message is confirmed.
- No transaction approval appears.
- No token movement occurs.
- If several wallet providers are detected, changing the selector changes which wallet is used for verification.
- If the typed address differs from the connected wallet, the connected wallet address is used and shown.
- If no signing provider is available, the provider help card appears.

## Button/layout checks

Confirm on mobile width:

- Wallet action buttons are not cramped or crooked.
- Verify wallet button text wraps cleanly if needed.
- Check balance / Connect & verify / Sync verification / Remove wallet are easy to tap.
- Provider actions are aligned cleanly.
- Wallet selector does not overflow the card.

## Non-regression checks

Confirm v59.30 still holds:

- Daily Routine does not require adding/tracking an expense.
- Active Streak protects only after full 7/7 Daily Routine completion.
- Final Daily Routine task remains Share on X.
- Track Leak, Clean Day, One Fix, Daily Challenge, copy text, Telegram share, native share, and image download do not directly protect Active Streak.
- Growth Lab still uses base saving + redirected leaks.

Confirm v59.29.1 still holds:

- Phantom provider detection still works.
- Solflare provider detection still works.
- Backpack provider detection still works.
- Jupiter Wallet provider detection still works when injected.
- OKX / Glow / Exodus / Coinbase / Brave / Trust / Magic Eden / generic injected Solana provider detection remains available.
