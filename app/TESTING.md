# Testing — v59.31.2 Wallet Standard + Jupiter Detection Hotfix

## Automated checks

Run:

```bash
npm run typecheck
npm run lint:quiet
```

Optional:

```bash
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## Jupiter / Wallet Standard checks

Open the app inside Jupiter Mobile dApp browser and go to Profile → Wallet & $BROKE balance.

Confirm:

- The app no longer relies only on direct `window.jupiter` / `window.solana` checks.
- **Rescan** runs Wallet Standard detection again.
- If Jupiter exposes `standard:connect` + `solana:signMessage`, it appears as a detected wallet and Verify wallet can connect/sign.
- If Jupiter still does not expose a signer, the app shows a direct “signer not exposed” message instead of Telegram-only copy.
- The compact wallet UI remains readable and does not restore the large old help block.

## Other wallet browser checks

Open the app inside Phantom, Solflare, Backpack, OKX, Glow, Exodus, Coinbase Wallet, Brave, Trust, Magic Eden, or another Solana wallet browser.

Confirm:

- Direct injected providers still appear.
- Wallet Standard providers can also appear in the selector.
- **Connect & verify** opens the selected wallet and asks for one message signature.
- Address is inserted automatically after wallet connection.
- No token transaction is requested.

## Telegram WebView checks

Open the app inside Telegram mobile WebView.

Confirm:

- Telegram still shows only the compact wallet connection card when no provider is available.
- **Verify wallet** is not stuck disabled.
- Pressing **Verify wallet** inside Telegram still explains that a wallet browser is required.
- Bottom nav does not aggressively cover wallet controls.

## Regression checks

Confirm unchanged:

- Daily Routine remains the only Active Streak proof source.
- Final Daily Routine task remains Share on X.
- Rewards snapshot ledger behavior is unchanged.
- Wallet balance watch-only mode still works by public address.
- No payout, claim, staking, or treasury transfer flow appears.
