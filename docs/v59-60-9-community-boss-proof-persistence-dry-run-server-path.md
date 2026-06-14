# v59.60.9 — Community Boss Proof Persistence Dry-Run Server Path

Base: v59.60.8 — Community Boss Proof Persistence Flag Prep

## Status

This patch prepares the server-side proof persistence path, but it still performs **no Supabase write**.

The goal is to make the future write path concrete and testable before enabling real persistence.

## What changed

- Added `COMMUNITY_BOSS_PROOF_PERSISTENCE_DRY_RUN_ENABLED`.
- Added a server-side builder for the future `broke_community_boss_user_proofs` upsert row.
- `POST /api/community-boss/proof` now returns `persistenceDryRun`.
- The dry-run object includes target table, conflict target, prepared row, blocked reasons, and guardrails.
- UI shows whether the server path is `Prepared` or `Blocked`.

## Hard rule

Even when all flags are enabled, this patch returns:

```text
persisted: false
wouldPersist: false
canPersist: false
upsertMode: dry_run_only
```

No `fetch` to Supabase write endpoints is performed in this patch.

## Future flags

The dry-run path can be marked ready only when all required flags are enabled:

```env
COMMUNITY_BOSS_SYNC_ENABLED=true
COMMUNITY_BOSS_MIGRATION_REVIEWED=true
COMMUNITY_BOSS_PROOF_PERSISTENCE_REVIEWED=true
COMMUNITY_BOSS_WRITE_PATH_ENABLED=true
COMMUNITY_BOSS_PROOF_WRITE_ENABLED=true
COMMUNITY_BOSS_PROOF_PERSISTENCE_DRY_RUN_ENABLED=true
```

Real writes remain blocked because `COMMUNITY_BOSS_PROOF_WRITE_IMPLEMENTED` is still false.

## Public-safe row fields

The prepared row includes only safe fields:

- week key
- hashed/public user key
- public handle/display name
- weekly damage
- safe points
- proof count
- mascot stage/power bucket
- badge count
- routine/tracking/challenge/weakness proof

It does not include wallet balance, wallet value, income, debt, transactions, payout math, or private budget data.

## Next stage

`v59.61.0 — Community Boss Proof Persistence Manual Write Gate`

Only after manual migration review/apply and production confirmation should the server path be allowed to perform a real Supabase upsert.
