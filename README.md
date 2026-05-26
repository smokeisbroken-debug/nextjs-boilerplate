# v59.22.1 — Rewards UI Placement Hotfix

Patch focus: keeps the new Rewards Hub direction, but removes the large BROKE Active Streak card from Home so Home stays focused on Wallet Snapshot and wallet context. The full Active Streak / Recovery / proof-action flow remains inside Rewards.

UI polish included:

- Removed the large Active Streak card from Home.
- Kept Wallet Snapshot open on Home.
- Rewards remains the main place for Active Streak, recovery, proof actions, future Holder Rewards readiness, and old Save tools.
- Fixed Rewards collapsible action pills so `Open` / `Close` render horizontally instead of cramped vertical labels.
- Tightened the Rewards proof-action buttons into a cleaner 2x2 mobile layout.

This patch does not change Creator Fee distribution, payouts, reward epochs, staking, claims, token transfers, Supabase migrations, wallet verification backend, holder thresholds, balance formula, avatar backend, Telegram webhook, share-card export logic, or stored data.

Verification in this environment: TypeScript TSX transpile diagnostics pass for `app/page.tsx`; CSS brace balance passes for `app/globals.css`. Full npm checks were not rerun because this is a small UI placement/CSS hotfix.

---

# v59.22 — Rewards Hub Foundation

Patch focus: turns the old Save tab into a dedicated Rewards Hub without adding a seventh bottom-nav button. The bottom nav now shows `Rewards`, while the underlying tab id remains `whatif` for compatibility with existing state and tracking logic.

The Rewards Hub now brings the main activity/reward preparation systems into one place:

- BROKE Active Streak card with 7+ day rolling eligibility status.
- Recovery Mode visibility: one recovery per 7 days, two proof actions required.
- Quick proof actions: Track Leak, Mark Clean Day, One Fix, and Daily Challenge/Challenges area.
- Reward foundation cards for verified wallet, $BROKE balance, active streak, and locked reward epoch.
- Future Creator Fee Reward Pool teaser: planned activation after $BROKE reaches $50K / 24h volume, with up to 50% of Creator Fee potentially allocated to verified active holders later.
- Holder tier / reward weight preview using the existing verified wallet balance tier.
- Existing Save systems remain inside Rewards: Survival Mode, Debt & Bills Radar, Home Habit Leaks, Pattern Challenge Coach, Challenges, Public Leaderboard, and Leak Cut Scenarios.

This patch does not add real payouts, Creator Fee distribution, reward epochs, claims, staking, token transfers, wallet threshold changes, Supabase migrations, Telegram webhook changes, balance formula changes, avatar backend changes, or share-card export changes.

Verification completed in this environment: `npm run typecheck`, `npm run lint:quiet`, and `NEXT_TELEMETRY_DISABLED=1 npm run build` all passed.

---

# v59.21 — BROKE Active Streak Foundation

Patch focus: adds the 7-day rolling active streak foundation for future Holder Rewards eligibility. Eligibility is not a one-time unlock: users must keep a live 7+ day active streak. A missed day enters recovery logic, where one recovery can be used per 7 days if the user completes two proof actions during the recovery day. The patch stores proof activity inside the existing synced app-state payload, so no Supabase migration is required.

Counts as proof actions in this foundation: Track Leak, Mark Clean Day, One Fix, and Daily Challenge completion. No Creator Fee distribution, on-chain payout, staking, claim, token transfer, holder threshold, wallet verification, avatar backend, or balance formula changes were added.

Verification completed in this environment: `npm run typecheck`, `npm run lint:quiet`, and `NEXT_TELEMETRY_DISABLED=1 npm run build` all passed.

---

# v59.20.4 — Streak Sync Stability Hotfix

Patch-only update for the $BROKE / SmokeIsBroke Telegram Mini App.

## Purpose

This patch fixes cases where a user could see a valid streak locally in the morning, then see `0 days` after cloud sync later. The issue was caused by streak display depending too strongly on cloud-calculated streak data and by sync importing local expenses only when the cloud account was completely empty.

## Files changed

- `app/page.tsx`
- `app/api/broke/route.ts`
- `README.md`
- `PROJECT_ORDER.md`
- `TESTING.md`
- `app/README.md`
- `app/PROJECT_ORDER.md`
- `app/TESTING.md`

## Product changes

- Cloud sync now imports missing local expenses by dedupe signature, not only when the cloud expense table is empty.
- The app no longer replaces a stronger local streak display with a weaker/stale cloud streak during sync.
- Streak display now merges local and cloud streak safely and keeps the strongest current/best streak available from synced data.
- Cloud expense results are merged with local cached expenses during sync so a temporary server gap does not visually wipe local progress.
- This reduces false `0d` streak states caused by sync timing, failed previous cloud saves, or local/server date-boundary differences.

## Not changed

- No Supabase migration.
- No wallet verification logic changes.
- No holder reward logic changes.
- No balance formula changes.
- No avatar backend changes.
- No Telegram webhook changes.
- No share-card export changes.
- No 7-day reward eligibility mechanics yet.
