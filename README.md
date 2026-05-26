# $BROKE Life Tracker — v59.25.1 Streak Proof Persistence Hotfix

Patch-only update on top of v59.25.

## What changed

- Fixed Active Streak proof actions being lost after cloud sync.
- Cloud `app_state_payload` no longer overwrites local Active Streak proof with an older or missing payload.
- Active Streak proof logs are now merged by date/action between local and cloud state.
- Server `saveAppState` also merges existing cloud proof state with incoming proof state before saving.
- Starting/opening a Daily Challenge from Rewards now logs `daily_challenge` proof and opens the challenge area.
- Existing Rewards UI, guide, balance-share wording, wallet verification, and future Holder Rewards wording remain unchanged.

## Not changed

- No Creator Fee distribution.
- No payouts, reward epochs, staking, claims, or token transfers.
- No Supabase migration.
- No wallet backend logic changes.
- No holder threshold enforcement changes.
- No balance formula changes.
- No avatar backend changes.
- No Telegram webhook changes.
- No share-card export changes.
