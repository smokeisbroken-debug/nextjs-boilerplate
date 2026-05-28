# v59.35 Testing

## Automated checks

```bash
npm run typecheck
npm run lint:quiet
```

Both passed. CSS brace balance passed.

`NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully, then timed out in this sandbox during Next.js TypeScript/build finalization. Standalone `tsc --noEmit` passed through `npm run typecheck`.

## Manual QA

Standard / Pro mode:

1. Open Home.
2. Confirm a compact mode button appears beside Guide.
3. In Standard Mode, confirm bottom nav shows Home, Add, Chart, Profile only.
4. Confirm Standard Home shows the core loop only and hides advanced blocks.
5. Tap Switch to Pro or the mode toggle.
6. Confirm Growth and Rewards return to bottom nav.
7. Confirm Pro Home shows advanced blocks again.
8. Switch back to Standard while on Growth or Rewards and confirm the app returns to Home.

Leak reflection prompts:

1. Add a test expense.
2. Confirm the leak reflection popup still opens.
3. Confirm it includes a practical “Leak check” question and example answer.
4. Confirm the popup still has Got it / Check history / Open Survival actions.

Regression:

1. Complete Daily Routine.
2. Confirm Active Streak still only protects after full Daily Routine.
3. Confirm admin modal and legitimate-holder controls remain available only to admin.
4. Confirm no payout, claim, transfer, or wallet-signing prompt is triggered by this patch.

---

# v59.34.2 Testing

## Checks run in patch workspace

```bash
npm run typecheck
npm run lint:quiet
```

Both passed.

CSS brace balance passed.

## Manual QA

Admin modal:

1. Open Profile as a normal user.
2. Confirm the Admin button is not visible.
3. Open as configured admin.
4. Confirm the Admin button is visible beside Guide.
5. Tap Admin and confirm the modal opens cleanly.

Legitimate holder controls:

1. Enter `REWARDS_ADMIN_SECRET` if needed.
2. Confirm there is no Top 10 all-holder section.
3. Confirm there is no RPC warning, token supply, treasury live balance, or RPC mode card.
4. Set minimum hold to `100000` and streak to `7`.
5. Tap Apply + load.
6. Confirm Top 20 legitimate holders loads or shows the empty state.
7. Lower the minimum hold/streak for testing and confirm the count recalculates.

Distribution draft:

1. Load legitimate holders.
2. Enter a pool amount.
3. Confirm payout rows use the loaded legitimate-holder rules.
4. Tap Prepare distribution.
5. Confirm a manifest is copied/prepared.
6. Confirm no wallet signature, token transfer, claim, staking, or treasury spend occurs.

---

# Testing — v59.33 Private Admin Holder Intelligence Panel

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

## Env setup checks

Recommended values:

```bash
NEXT_PUBLIC_TREASURY_WALLET_ADDRESS=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_ADMIN_WALLET_ADDRESSES=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
REWARDS_ADMIN_SECRET=<long random admin read key>
```

Optional:

```bash
BROKE_ADMIN_TELEGRAM_IDS=<comma-separated Telegram user IDs>
SOLANA_RPC_URL=<custom mainnet RPC endpoint>
```

## Admin visibility checks

- Open Profile as a normal user.
- Confirm no Admin Panel is visible.
- Verify the configured admin wallet.
- Confirm Admin Panel appears.
- Confirm the expected treasury wallet shows `5eni...PxC9` shortened.
- Confirm the $BROKE contract shows `9Ujw...wray` shortened.

## Holder intelligence checks

With `REWARDS_ADMIN_SECRET` configured:

- Open the Admin Panel.
- Enter the read key if the Telegram admin session is not active.
- Press Load.
- Confirm Top 10 all holders appears.
- Confirm Top 20 legitimate holders appears or shows an empty-state message if no eligible holders exist.
- Confirm the summary shows eligible holders, eligible balance, and token supply.

## API checks

Authorized:

```bash
curl -H "Authorization: Bearer $REWARDS_ADMIN_SECRET" "$WEBAPP_URL/api/admin/holders"
```

Expected:

- `ok: true`
- `topAllHolders`
- `topLegitimateHolders`
- `summary`
- `safety.noTokenTransfers: true`

Unauthorized:

```bash
curl "$WEBAPP_URL/api/admin/holders"
```

Expected if no Telegram admin session cookie is present:

- HTTP 401
- `ok: false`

## Regression checks

Confirm unchanged:

- Daily Routine remains the only Active Streak proof source.
- Final Daily Routine task remains Share on X.
- Wallet Standard/Jupiter detection from v59.31.2 still works.
- Watch-only wallet balance still works.
- Connect & verify still requests only one message signature.
- No token transaction is requested.
- No payout, claim, staking, or treasury signing button is visible.

# v59.34 Testing

## Checks run in patch workspace

```bash
npm run typecheck
npm run lint:quiet
```

Both passed.

CSS brace balance passed.

`NEXT_TELEMETRY_DISABLED=1 npm run build` compiled successfully, then timed out in the sandbox during the Next.js TypeScript/build finalization step. Standalone `tsc --noEmit` passed.

## Manual QA

Admin visibility:

1. Open Profile as a normal user.
2. Confirm no Admin button is visible beside Guide.
3. Open Profile as configured Telegram admin or verified admin wallet.
4. Confirm Admin button is visible beside the Guide button.
5. Tap Admin.
6. Confirm the private modal opens.
7. Close modal and confirm Profile remains clean.

Holder intelligence:

1. Enter `REWARDS_ADMIN_SECRET` if not authorized by Telegram admin session.
2. Tap Load.
3. If Solana RPC returns HTTP 429, confirm legitimate holders still load and a warning appears.
4. If a private `SOLANA_RPC_URL` is configured, confirm Top 10 all holders loads.

Distribution draft:

1. Load holder intelligence.
2. Enter a pool amount such as `100`.
3. Choose USDC, SOL, or $BROKE.
4. Confirm each legitimate holder receives reward amount based on balance-share percent.
5. Tap Prepare distribution.
6. Confirm a manifest is copied/prepared.
7. Confirm no wallet signature request appears.
8. Confirm no token transaction appears.
9. Confirm no claim, staking, or transfer is executed.


## v59.34.1 — Admin RPC Setup + Treasury Balance Clarity Hotfix

- Clarifies the private Admin holder view when Solana public RPC is rate-limited: token supply and Top 10 holder sections now show RPC unavailable instead of misleading `0 BROKE`.
- Adds a live treasury $BROKE balance read for the configured treasury wallet and BROKE mint when `SOLANA_RPC_URL` is available.
- Separates treasury balance from eligible reward balance: eligible balance remains only verified app users with 100K+ BROKE and a 7+ Daily Routine Active Streak.
- Reward Distribution Draft now clearly blocks when there are no eligible recipients, even if the treasury wallet has funds.
- Documents `SOLANA_RPC_URL` as a server-only private mainnet RPC env var for stable Top 10 holder, token supply, and treasury balance reads.
- No payouts, claims, staking, token transfers, treasury signing, private key storage, Supabase migration, wallet backend changes, holder threshold changes, balance formula changes, avatar backend, Telegram webhook, reward execution, or Daily Routine/Active Streak rule changes.

## v59.36 Smart Leak Excess + First Distribution Test Prep

- Added partial leak accounting: when a user marks an expense as Maybe or Not needed, they can enter the cheaper/necessary version of the same purchase. Only the excess counts as leak pressure. Example: $5 outside food with a $3 home baseline counts $2 as the actual leak.
- Added optional expense fields `necessary_amount` and `avoidable_leak_amount` with a Supabase migration and fallback behavior if the migration has not been applied yet.
- Leak reflection now shows tracked spend, necessary baseline, and leak counted. Wallet HP, Chart pressure, Growth Lab, category leak totals, and reports use the adjusted leak value.
- Admin distribution draft wording now supports a first test distribution workflow: enter a small pool, calculate legitimate holder shares, and copy a payout manifest for review. It still does not send tokens or request treasury signing.
- No live payouts, token transfers, claims, staking, treasury signing, private key storage, wallet backend changes, or Daily Routine / Active Streak rule changes.

