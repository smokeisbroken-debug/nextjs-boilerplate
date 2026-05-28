# $BROKE Life Tracker — v59.34.2 Admin Legitimate-Only Controls Hotfix

Patch-only update on top of confirmed v59.34.1.

## What changed

- Removed the live blockchain **Top 10 all holders** section from the private Admin Panel.
- Removed the Admin UI dependency on Solana RPC for holder intelligence.
- Removed treasury live balance, token supply, RPC mode, and RPC warning cards from the Admin holder view.
- Admin holder intelligence now focuses only on **Top 20 legitimate holders** from app data.
- Added editable private Admin eligibility controls:
  - minimum $BROKE hold;
  - required Daily Routine Active Streak days.
- `/api/admin/holders` now accepts admin-only query params:
  - `minHold`;
  - `minStreak`.
- Reward Distribution Draft now uses the currently loaded legitimate-holder rules.
- The admin modal copy was simplified so the panel is cleaner on mobile.

## Current legitimate-holder rule

The default remains:

```text
verified wallet + 100,000+ $BROKE + 7+ Daily Routine Active Streak
```

Inside the private Admin Panel, the admin can temporarily load another rule for preview/distribution draft math. Example:

```text
minimum hold: 50,000 BROKE
required streak: 3 days
```

The split formula remains unchanged:

```text
user reward = pool amount × user verified eligible BROKE / total verified eligible BROKE
```

## Important boundary

This still does not send real rewards. It only calculates eligible recipients and creates/copies a draft manifest. Real payout execution still requires a later treasury signing flow.

## What did not change

- No Creator Fee distribution.
- No live payouts.
- No claims.
- No staking.
- No token transfers.
- No treasury signing.
- No private key storage.
- No WalletConnect/Reown dependency.
- No Jupiter Wallet Kit dependency.
- No Supabase migration.
- No wallet verification backend changes.
- No Daily Routine / Active Streak proof logic changes.

---

# $BROKE Life Tracker — v59.33 Private Admin Holder Intelligence Panel

Patch-only update on top of confirmed v59.32.

## What changed

- Added the provided admin/treasury public wallet as the default admin wallet fallback:
  - `5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9`
- Added the provided $BROKE contract/mint as the default token mint fallback:
  - `9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray`
- Added a private Admin Panel holder intelligence block inside Profile.
- Added a new read-only admin route:
  - `/api/admin/holders`
- Admin Panel can now show:
  - **Top 10 all holders** from Solana RPC largest token accounts, grouped by visible owner address;
  - **Top 20 legitimate holders** from app eligibility logic.
- Legitimate holder logic stays aligned with Rewards:
  - verified app wallet;
  - 100,000+ $BROKE;
  - 7+ Active Streak;
  - streak based on completed Daily Routine proof.
- Admin holder data requires backend authorization through `REWARDS_ADMIN_SECRET` or a configured Telegram admin session.
- The feature is read-only. It does not send rewards, sign transactions, open claims, or transfer tokens.

## Admin config

The default wallet and mint are now embedded as public fallbacks, but Vercel env values can still override them.

Recommended Vercel env values:

```bash
NEXT_PUBLIC_TREASURY_WALLET_ADDRESS=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_ADMIN_WALLET_ADDRESSES=5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9
NEXT_PUBLIC_BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
BROKE_TOKEN_MINT=9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray
REWARDS_ADMIN_SECRET=<long random admin read key>
```

Optional:

```bash
NEXT_PUBLIC_BROKE_ADMIN_TELEGRAM_IDS=<comma-separated Telegram user IDs>
BROKE_ADMIN_TELEGRAM_IDS=<comma-separated Telegram user IDs>
SOLANA_RPC_URL=<custom mainnet RPC endpoint>
```

Notes:

- Public wallet addresses and public token mint addresses are safe to show shortened in the admin UI.
- Do not store seed phrases or private keys in Vercel, Supabase, code, or client env.
- `REWARDS_ADMIN_SECRET` is server-side and should not use the `NEXT_PUBLIC_` prefix.
- If the Admin Panel is unlocked by wallet only, enter the `REWARDS_ADMIN_SECRET` in the panel to load server-side holder data.
- If the Admin Panel is unlocked by a configured Telegram admin session, the endpoint can load without manually entering the read key.

## What did not change

- No Creator Fee distribution.
- No payouts.
- No claims.
- No staking.
- No token transfers.
- No treasury signing.
- No WalletConnect/Reown integration.
- No Jupiter Wallet Kit dependency.
- No wallet verification backend flow changes.
- No Supabase migration required.
- No holder threshold changes.
- No balance formula changes.
- No avatar backend changes.
- No Telegram webhook changes.
- No Daily Routine / Active Streak rule changes.

# v59.34 — Admin Panel Launcher + Distribution Draft Prep

Patch-only update on top of v59.33.

## What changed

- Moved the private Admin Panel out of the Profile page body.
- Added a compact **Admin** header button beside the Profile guide button.
- The Admin button is still visible only to configured Telegram admins or verified admin/treasury wallets.
- Admin content now opens in a private modal instead of occupying the Profile page.
- Fixed the `RPC HTTP 429` experience: Solana Top 10 all-holder RPC failures no longer break the full admin load.
  - Legitimate app holders can still load from Supabase/app data.
  - The UI now shows a warning and recommends setting `SOLANA_RPC_URL` to a private RPC endpoint for stable holder reads.
- Added a safe **Reward distribution draft** window:
  - admin enters a reward pool amount;
  - chooses USDC, SOL, or $BROKE as the draft token label;
  - the app calculates each legitimate holder's payout using balance-share percentage;
  - the app prepares/copies a payout manifest.

## Important safety boundary

The distribution draft does **not** send tokens. It does not sign wallet transactions, open claims, stake, transfer, or spend treasury funds.

Current behavior:

```text
Load legitimate holders → enter pool amount → calculate each % → copy payout manifest
```

Future real payout behavior should still be:

```text
Create payout batch → connect verified treasury wallet → manual wallet signing → save tx signatures
```

## What did not change

- No Creator Fee distribution.
- No live payouts.
- No token transfers.
- No treasury signing.
- No private key storage.
- No WalletConnect/Reown dependency.
- No Jupiter Wallet Kit dependency.
- No Supabase migration.
- No reward eligibility formula change.
- No Daily Routine / Active Streak rule change.


## v59.34.1 — Admin RPC Setup + Treasury Balance Clarity Hotfix

- Clarifies the private Admin holder view when Solana public RPC is rate-limited: token supply and Top 10 holder sections now show RPC unavailable instead of misleading `0 BROKE`.
- Adds a live treasury $BROKE balance read for the configured treasury wallet and BROKE mint when `SOLANA_RPC_URL` is available.
- Separates treasury balance from eligible reward balance: eligible balance remains only verified app users with 100K+ BROKE and a 7+ Daily Routine Active Streak.
- Reward Distribution Draft now clearly blocks when there are no eligible recipients, even if the treasury wallet has funds.
- Documents `SOLANA_RPC_URL` as a server-only private mainnet RPC env var for stable Top 10 holder, token supply, and treasury balance reads.
- No payouts, claims, staking, token transfers, treasury signing, private key storage, Supabase migration, wallet backend changes, holder threshold changes, balance formula changes, avatar backend, Telegram webhook, reward execution, or Daily Routine/Active Streak rule changes.
