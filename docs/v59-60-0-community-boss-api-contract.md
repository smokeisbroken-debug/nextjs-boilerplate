# v59.60.0 — Community Boss API Contract Draft

Status: draft only. No routes are enabled by this patch.

## Guardrail

The API must never accept, store, or return:

- wallet balance;
- wallet value;
- income;
- debt;
- private budget;
- payout value;
- reward amount;
- transaction history;
- raw expense descriptions.

## `GET /api/community-boss/current`

Purpose:

- read current boss week;
- read public aggregate;
- optionally read the current user's own safe proof if authenticated.

Public response fields:

```ts
type CommunityBossCurrentResponse = {
  ok: true;
  buildVersion: string;
  week: {
    weekKey: string;
    bossCode: string;
    bossName: string;
    weekStartDate: string;
    weekEndDate: string;
    status: "draft" | "open" | "closed" | "archived";
    bossHp: number;
    phaseLabel: string;
  };
  aggregate: {
    totalDamage: number;
    totalSafePoints: number;
    participantCount: number;
    routineCount: number;
    challengeCount: number;
    weaknessHitCount: number;
    progressPercent: number;
    updatedAt: string | null;
  };
  userProof?: {
    submitted: boolean;
    weeklyDamage: number;
    safePoints: number;
    proofCount: number;
    mascotStage: number;
    mascotPowerBucket: "low" | "medium" | "high" | "legend";
    badgeCount: number;
    routineCompleted: boolean;
    trackingDays: number;
    challengeCompleted: boolean;
    weaknessHit: boolean;
    updatedAt: string | null;
  };
};
```

## `POST /api/community-boss/proof`

Purpose:

- submit one safe proof row for the current user/week;
- update existing row rather than insert duplicates.

Auth:

- require Telegram `initData` or future authenticated session;
- derive `telegram_user_id` server-side;
- reject anonymous writes.

Request draft:

```ts
type CommunityBossProofRequest = {
  weekKey: string;
  weeklyDamage: number;
  safePoints: number;
  proofCount: number;
  mascotStage: number;
  mascotPowerBucket: "low" | "medium" | "high" | "legend";
  badgeCount: number;
  routineCompleted: boolean;
  trackingDays: number;
  challengeCompleted: boolean;
  weaknessHit: boolean;
  publicHandle?: string;
  publicDisplayName?: string;
};
```

Server behavior:

1. Validate Telegram/session identity.
2. Load current week.
3. Reject if requested `weekKey` is not the current open week.
4. Clamp all numbers.
5. Strip all unknown fields.
6. Upsert `(week_key, telegram_user_id)`.
7. Recompute or update aggregate.
8. Return safe response.

## `POST /api/community-boss/recalculate`

Purpose:

- admin/system only aggregate repair endpoint.

Auth:

- `COMMUNITY_BOSS_ADMIN_SECRET` or existing admin secret pattern.

Behavior:

- recompute total damage/safe points/participants from user proof rows;
- write `broke_community_boss_aggregates`;
- write an audit event.

## Rate limiting draft

- Max proof submissions: 10 per Telegram user per hour.
- Max aggregate recalculations: admin only.
- Client should debounce submit button.
- Server should reject repeated identical submissions too quickly.

## Abuse handling

Reject submissions when:

- damage is above clamp;
- proof count is above clamp;
- tracking days > 7;
- mascot stage outside 1–5;
- week is closed;
- user identity missing;
- request includes forbidden field names such as `balance`, `income`, `debt`, `payout`, `walletValue`.

## Next implementation patch

`v59.60.1 — Community Boss Safe Sync API Skeleton`

- add route files;
- return current local/draft boss data;
- no database writes until migration is reviewed/applied.
