# v59.60.7 — Community Boss Proof Submit Server Auth Prep

Base: v59.60.6 — Community Boss Proof Submit Dry-Run UI

## Status

This patch prepares server-side identity checks for future Community Boss proof persistence.

It still performs no Supabase write and returns `persisted:false`.

## Changes

- `POST /api/community-boss/proof` now checks Telegram WebApp `initData` or the existing web auth session cookie.
- The client dry-run submit sends Telegram `initData` when available.
- The route derives a server-side public user key from Telegram/user session identity without returning the raw Telegram ID.
- The route can optionally require auth with `COMMUNITY_BOSS_PROOF_AUTH_REQUIRED=true`.
- The dry-run UI now displays server auth status.
- The response guardrails include `Server auth checked`.

## Auth behavior

Default behavior:

- auth is checked;
- anonymous dry-run remains allowed;
- `persisted:false` remains true;
- no database write is performed.

Strict dry-run behavior:

```env
COMMUNITY_BOSS_PROOF_AUTH_REQUIRED=true
```

When enabled, unauthenticated proof submit returns `401` with no persistence.

## Response auth shape

```ts
auth: {
  checked: boolean;
  required: boolean;
  authenticated: boolean;
  source: "telegram_init_data" | "web_session" | "none";
  publicUserKey: string | null;
  publicDisplayName: string | null;
  publicHandle: string | null;
  reason: string | null;
}
```

## Guardrails

No changes to:

- Supabase schema;
- migration auto-run;
- proof persistence;
- aggregate writes;
- rewards/admin payout;
- wallet verification;
- PvP/multiplayer;
- wallet value/balance/income/debt exposure;
- token reward promises;
- Universal Check scoring;
- Daily Routine formula;
- transaction history/PnL/scam labels;
- game economy.

## Next stage

`v59.60.8 — Community Boss Proof Persistence Flag Prep`

Recommended scope:

- add explicit write-readiness gate for future persistence;
- keep writes disabled until Supabase migration is manually applied and confirmed;
- prepare tests for authenticated sanitized proof rows.
