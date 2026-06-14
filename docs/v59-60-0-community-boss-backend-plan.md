# v59.60.0 — Community Boss Backend Plan / Schema Draft

Base: v59.59.3 — Rewards Layout Cleanup

## TRUTHMODE status

This is a planning/schema-draft patch only.

It does **not** enable backend community boss sync, does **not** write user boss proofs, does **not** create payout math, and does **not** change rewards/admin payout logic.

## Product goal

Community Boss should turn safe weekly app activity into shared public progress:

```text
Real app actions → personal boss proof → safe backend proof → community aggregate damage
```

The backend should support a public community boss without exposing private financial data.

## Non-goals

Do not add:

- PvP
- real-time multiplayer
- token reward promises
- payout math
- wallet value ranking
- balance/income/debt exposure
- game economy
- loot/chest/reward wording
- transaction history storage
- Universal Check scoring changes
- Daily Routine formula changes
- wallet verification changes

## Allowed backend data

Community Boss sync may store only public-safe proof fields:

| Field type | Allowed examples |
|---|---|
| Week identity | week key, start date, end date |
| Boss identity | boss code, boss name, boss HP, phase |
| Public-safe user proof | public display name or generated public handle |
| Progress proof | weekly damage, safe points, proof count |
| Habit flags | routine completed, tracking days count, challenge proof, weakness hit |
| Mascot summary | mascot stage, mascot power bucket, badge count |
| Share-safe text | short proof caption, no private numbers |
| Aggregates | total damage, participant count, total safe points |

## Forbidden backend data

Do not store in Community Boss tables:

- real wallet balance
- wallet value
- income
- debt details
- payday date
- private budget numbers
- transaction history
- token reward allocation
- payout amount
- payout wallet queue
- raw expense descriptions
- raw user settings payload
- raw app state payload

## Proposed data model

### 1. `broke_community_boss_weeks`

One row per weekly boss event.

Purpose:

- identify the weekly boss;
- hold boss HP and phase status;
- support current/history API reads.

### 2. `broke_community_boss_user_proofs`

One row per user per week.

Purpose:

- store the user's safe boss contribution;
- dedupe submissions;
- let the backend recompute aggregate damage.

Privacy:

- server-readable by service role;
- public UI should not read raw rows directly;
- public output should use aggregate endpoints/views only.

### 3. `broke_community_boss_aggregates`

One row per week.

Purpose:

- store total community progress;
- avoid expensive aggregate reads in the app;
- power public Community Boss UI.

### 4. `broke_community_boss_audit_events`

Optional server-only audit trail.

Purpose:

- track admin/system actions;
- debug suspicious proof changes;
- avoid silent backend drift.

## API contract draft

### `GET /api/community-boss/current`

Returns current week boss + aggregate.

Response should include:

```ts
{
  ok: true,
  buildVersion: string,
  week: {
    weekKey: string,
    bossCode: string,
    bossName: string,
    weekStartDate: string,
    weekEndDate: string,
    status: "draft" | "open" | "closed" | "archived",
    bossHp: number
  },
  aggregate: {
    totalDamage: number,
    totalSafePoints: number,
    participantCount: number,
    progressPercent: number,
    updatedAt: string | null
  },
  userProof?: {
    submitted: boolean,
    weeklyDamage: number,
    safePoints: number,
    proofCount: number,
    mascotStage: number,
    weaknessHit: boolean,
    updatedAt: string | null
  }
}
```

### `POST /api/community-boss/proof`

Submits or updates one safe proof row for the current week.

Server must:

- require Telegram auth/initData or future server session;
- derive the user identity server-side;
- clamp numbers;
- reject private fields;
- upsert by `(week_key, telegram_user_id)`;
- recompute or queue aggregate refresh.

Request should include only safe fields:

```ts
{
  weekKey: string,
  weeklyDamage: number,
  safePoints: number,
  proofCount: number,
  mascotStage: number,
  mascotPowerBucket: "low" | "medium" | "high" | "legend",
  badgeCount: number,
  routineCompleted: boolean,
  trackingDays: number,
  challengeCompleted: boolean,
  weaknessHit: boolean,
  publicHandle?: string
}
```

### `POST /api/community-boss/recalculate`

Admin/system only.

Purpose:

- recompute weekly aggregate from user proof rows;
- repair aggregate drift;
- close or archive week safely.

## Validation rules

Server must clamp all client-provided numbers:

| Field | Range |
|---|---:|
| `weekly_damage` | 0–10000 |
| `safe_points` | 0–10000 |
| `proof_count` | 0–20 |
| `mascot_stage` | 1–5 |
| `badge_count` | 0–50 |
| `tracking_days` | 0–7 |

Server must normalize:

- `week_key` to `YYYY-Www`;
- public handle to 2–32 safe characters;
- mascot power into a bucket, not raw private state.

## Public UI rules

Community Boss public UI may show:

- boss name;
- total damage;
- participant count;
- progress percent;
- weekly safe points;
- personal safe proof status;
- public-safe rank lane.

Community Boss public UI must not show:

- balance;
- wallet value;
- debt/income;
- payout tier;
- payout value;
- token reward estimate.

## Rollout sequence after this draft

1. `v59.60.1 — Community Boss Safe Sync API Skeleton`
   - add API routes;
   - no UI sync yet;
   - return safe mock/current data;
   - no schema auto-migration.

2. `v59.60.2 — Community Boss Supabase Migration`
   - add migration SQL after review;
   - enable RLS;
   - add indexes and constraints.

3. `v59.60.3 — Community Boss Proof Submit MVP`
   - submit safe proof only;
   - no payout;
   - no leaderboard rewards.

4. `v59.60.4 — Community Boss Aggregate UI`
   - read public aggregate;
   - show community damage;
   - no PvP.

5. `v59.60.5 — Community Boss QA / Abuse Guard`
   - rate limits;
   - duplicate prevention;
   - range clamps;
   - failure states.

## Decision

Proceed only when this contract is accepted.

Until then, keep Community Boss as local-only preview.
