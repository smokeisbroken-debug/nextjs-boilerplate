export type CommunityBossStatus = "draft" | "open" | "closed" | "archived";
export type CommunityBossPowerBucket = "low" | "medium" | "high" | "legend";

export type CommunityBossWeek = {
  weekKey: string;
  bossCode: string;
  bossName: string;
  weekStartDate: string;
  weekEndDate: string;
  status: CommunityBossStatus;
  bossHp: number;
  phaseLabel: string;
};

export type CommunityBossAggregate = {
  totalDamage: number;
  totalSafePoints: number;
  participantCount: number;
  routineCount: number;
  challengeCount: number;
  weaknessHitCount: number;
  progressPercent: number;
  updatedAt: string | null;
};

export type CommunityBossSafeProof = {
  weekKey: string;
  weeklyDamage: number;
  safePoints: number;
  proofCount: number;
  mascotStage: number;
  mascotPowerBucket: CommunityBossPowerBucket;
  badgeCount: number;
  routineCompleted: boolean;
  trackingDays: number;
  challengeCompleted: boolean;
  weaknessHit: boolean;
  publicHandle: string | null;
  publicDisplayName: string | null;
};

export const COMMUNITY_BOSS_SYNC_ENABLED =
  process.env.COMMUNITY_BOSS_SYNC_ENABLED === "true";

export const COMMUNITY_BOSS_MIGRATION_REVIEWED =
  process.env.COMMUNITY_BOSS_MIGRATION_REVIEWED === "true";

export const COMMUNITY_BOSS_WRITE_PATH_ENABLED =
  process.env.COMMUNITY_BOSS_WRITE_PATH_ENABLED === "true";

export const COMMUNITY_BOSS_DB_READ_ENABLED =
  process.env.COMMUNITY_BOSS_DB_READ_ENABLED === "true";

export const COMMUNITY_BOSS_SEED_WRITE_ENABLED =
  process.env.COMMUNITY_BOSS_SEED_WRITE_ENABLED === "true";

export const COMMUNITY_BOSS_PROOF_PERSISTENCE_REVIEWED =
  process.env.COMMUNITY_BOSS_PROOF_PERSISTENCE_REVIEWED === "true";

export const COMMUNITY_BOSS_PROOF_WRITE_ENABLED =
  process.env.COMMUNITY_BOSS_PROOF_WRITE_ENABLED === "true";

export const COMMUNITY_BOSS_PROOF_PERSISTENCE_DRY_RUN_ENABLED =
  process.env.COMMUNITY_BOSS_PROOF_PERSISTENCE_DRY_RUN_ENABLED === "true";

export const COMMUNITY_BOSS_PROOF_MANUAL_WRITE_ENABLED =
  process.env.COMMUNITY_BOSS_PROOF_MANUAL_WRITE_ENABLED === "true";

export const COMMUNITY_BOSS_AGGREGATE_RECALC_REVIEWED =
  process.env.COMMUNITY_BOSS_AGGREGATE_RECALC_REVIEWED === "true";

export const COMMUNITY_BOSS_AGGREGATE_WRITE_ENABLED =
  process.env.COMMUNITY_BOSS_AGGREGATE_WRITE_ENABLED === "true";

export const COMMUNITY_BOSS_AGGREGATE_MANUAL_WRITE_ENABLED =
  process.env.COMMUNITY_BOSS_AGGREGATE_MANUAL_WRITE_ENABLED === "true";

export const COMMUNITY_BOSS_WRITE_PATH_IMPLEMENTED = false;
export const COMMUNITY_BOSS_SEED_WRITE_IMPLEMENTED = false;
export const COMMUNITY_BOSS_PROOF_WRITE_IMPLEMENTED = true;
export const COMMUNITY_BOSS_AGGREGATE_WRITE_IMPLEMENTED = true;

const COMMUNITY_BOSS_ROTATION = [
  { code: "subscription-leech", name: "Subscription Leech" },
  { code: "impulse-goblin", name: "Impulse Goblin" },
  { code: "weekend-drain", name: "Weekend Drain" },
  { code: "phantom-fee", name: "Phantom Fee" },
  { code: "delivery-demon", name: "Delivery Demon" },
  { code: "fomo-hydra", name: "FOMO Hydra" },
] as const;

const FORBIDDEN_FIELD_PATTERNS = [
  /balance/i,
  /wallet[_-]?value/i,
  /income/i,
  /debt/i,
  /payout/i,
  /reward[_-]?amount/i,
  /reward[_-]?allocation/i,
  /transaction/i,
  /expense[_-]?description/i,
  /real[_-]?balance/i,
  /private[_-]?budget/i,
  /payday/i,
];

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getMondayUtc(date: Date) {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = result.getUTCDay() || 7;
  result.setUTCDate(result.getUTCDate() - day + 1);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function getIsoWeekYearAndNumber(date: Date) {
  const normalized = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = normalized.getUTCDay() || 7;
  normalized.setUTCDate(normalized.getUTCDate() + 4 - day);
  const weekYear = normalized.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const weekNumber = Math.ceil(
    ((normalized.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { weekYear, weekNumber };
}

export function getCommunityBossWeekKey(date = new Date()) {
  const { weekYear, weekNumber } = getIsoWeekYearAndNumber(date);
  return `${weekYear}-W${pad2(weekNumber)}`;
}

export function getCommunityBossWeekWindow(date = new Date()) {
  const weekStart = getMondayUtc(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  return {
    weekStartDate: toDateOnly(weekStart),
    weekEndDate: toDateOnly(weekEnd),
  };
}

export function getCurrentCommunityBossWeek(
  date = new Date(),
): CommunityBossWeek {
  const weekKey = getCommunityBossWeekKey(date);
  const { weekStartDate, weekEndDate } = getCommunityBossWeekWindow(date);
  const { weekNumber } = getIsoWeekYearAndNumber(date);
  const boss =
    COMMUNITY_BOSS_ROTATION[weekNumber % COMMUNITY_BOSS_ROTATION.length];

  return {
    weekKey,
    bossCode: boss.code,
    bossName: boss.name,
    weekStartDate,
    weekEndDate,
    status: COMMUNITY_BOSS_SYNC_ENABLED ? "open" : "draft",
    bossHp: 100000,
    phaseLabel: "Backend prep",
  };
}

export function getDryRunCommunityBossAggregate(
  week: CommunityBossWeek,
): CommunityBossAggregate {
  return {
    totalDamage: 0,
    totalSafePoints: 0,
    participantCount: 0,
    routineCount: 0,
    challengeCount: 0,
    weaknessHitCount: 0,
    progressPercent: 0,
    updatedAt: null,
  };
}

function clampInt(value: unknown, min: number, max: number) {
  const parsed = Math.round(Number(value ?? 0));
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function cleanString(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanPublicHandle(value: unknown) {
  const cleaned = cleanString(value, 32).replace(/^@+/, "");
  return /^[A-Za-z0-9_.-]{2,32}$/.test(cleaned) ? cleaned : "";
}

function normalizePowerBucket(value: unknown): CommunityBossPowerBucket {
  const normalized = String(value ?? "").toLowerCase();
  if (
    normalized === "medium" ||
    normalized === "high" ||
    normalized === "legend"
  ) {
    return normalized;
  }
  return "low";
}

function toBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function findForbiddenCommunityBossFields(
  value: unknown,
  path: string[] = [],
): string[] {
  if (!value || typeof value !== "object") return [];

  const found: string[] = [];

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = [...path, key];
    if (FORBIDDEN_FIELD_PATTERNS.some((pattern) => pattern.test(key))) {
      found.push(nextPath.join("."));
    }

    if (child && typeof child === "object" && !Array.isArray(child)) {
      found.push(...findForbiddenCommunityBossFields(child, nextPath));
    }
  }

  return Array.from(new Set(found)).slice(0, 12);
}

export function sanitizeCommunityBossProof(
  input: unknown,
  currentWeek = getCurrentCommunityBossWeek(),
): CommunityBossSafeProof {
  const data =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const requestedWeekKey = cleanString(data.weekKey, 12);

  return {
    weekKey: requestedWeekKey || currentWeek.weekKey,
    weeklyDamage: clampInt(data.weeklyDamage, 0, 10000),
    safePoints: clampInt(data.safePoints, 0, 10000),
    proofCount: clampInt(data.proofCount, 0, 20),
    mascotStage: clampInt(data.mascotStage, 1, 5),
    mascotPowerBucket: normalizePowerBucket(data.mascotPowerBucket),
    badgeCount: clampInt(data.badgeCount, 0, 50),
    routineCompleted: toBoolean(data.routineCompleted),
    trackingDays: clampInt(data.trackingDays, 0, 7),
    challengeCompleted: toBoolean(data.challengeCompleted),
    weaknessHit: toBoolean(data.weaknessHit),
    publicHandle: cleanPublicHandle(data.publicHandle) || null,
    publicDisplayName: cleanString(data.publicDisplayName, 48) || null,
  };
}

export function getCommunityBossProgressPercent(
  totalDamage: number,
  bossHp: number,
) {
  if (!Number.isFinite(totalDamage) || !Number.isFinite(bossHp) || bossHp <= 0)
    return 0;
  return Math.min(100, Math.max(0, Math.round((totalDamage / bossHp) * 100)));
}

function getOptionalCommunityBossEnv(name: string) {
  return process.env[name] || "";
}

function getCommunityBossSupabaseBaseUrl() {
  const raw = getOptionalCommunityBossEnv("SUPABASE_URL");
  return raw
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

function getCommunityBossSupabaseServiceKey() {
  return getOptionalCommunityBossEnv("SUPABASE_SERVICE_ROLE_KEY");
}

function hasCommunityBossSupabaseReadEnv() {
  return Boolean(
    getCommunityBossSupabaseBaseUrl() && getCommunityBossSupabaseServiceKey(),
  );
}

export function getCommunityBossBackendReadiness() {
  const missing: string[] = [];
  const supabaseReadEnvReady = hasCommunityBossSupabaseReadEnv();

  if (!COMMUNITY_BOSS_SYNC_ENABLED)
    missing.push("COMMUNITY_BOSS_SYNC_ENABLED is not true");
  if (!COMMUNITY_BOSS_MIGRATION_REVIEWED)
    missing.push("COMMUNITY_BOSS_MIGRATION_REVIEWED is not true");
  if (!COMMUNITY_BOSS_DB_READ_ENABLED)
    missing.push("COMMUNITY_BOSS_DB_READ_ENABLED is not true");
  if (!supabaseReadEnvReady)
    missing.push(
      "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing for DB read",
    );
  if (!COMMUNITY_BOSS_WRITE_PATH_ENABLED)
    missing.push("COMMUNITY_BOSS_WRITE_PATH_ENABLED is not true");
  if (!COMMUNITY_BOSS_WRITE_PATH_IMPLEMENTED)
    missing.push("write path is intentionally not implemented in this patch");
  if (!COMMUNITY_BOSS_SEED_WRITE_ENABLED)
    missing.push("COMMUNITY_BOSS_SEED_WRITE_ENABLED is not true");
  if (!COMMUNITY_BOSS_SEED_WRITE_IMPLEMENTED)
    missing.push("seed write is intentionally not implemented in this patch");
  if (!COMMUNITY_BOSS_PROOF_PERSISTENCE_REVIEWED)
    missing.push("COMMUNITY_BOSS_PROOF_PERSISTENCE_REVIEWED is not true");
  if (!COMMUNITY_BOSS_PROOF_WRITE_ENABLED)
    missing.push("COMMUNITY_BOSS_PROOF_WRITE_ENABLED is not true");
  if (!COMMUNITY_BOSS_PROOF_PERSISTENCE_DRY_RUN_ENABLED)
    missing.push(
      "COMMUNITY_BOSS_PROOF_PERSISTENCE_DRY_RUN_ENABLED is not true",
    );
  if (!COMMUNITY_BOSS_PROOF_MANUAL_WRITE_ENABLED)
    missing.push("COMMUNITY_BOSS_PROOF_MANUAL_WRITE_ENABLED is not true");
  if (!COMMUNITY_BOSS_PROOF_WRITE_IMPLEMENTED)
    missing.push("proof write implementation is disabled");
  if (!COMMUNITY_BOSS_AGGREGATE_RECALC_REVIEWED)
    missing.push("COMMUNITY_BOSS_AGGREGATE_RECALC_REVIEWED is not true");
  if (!COMMUNITY_BOSS_AGGREGATE_WRITE_ENABLED)
    missing.push("COMMUNITY_BOSS_AGGREGATE_WRITE_ENABLED is not true");
  if (!COMMUNITY_BOSS_AGGREGATE_MANUAL_WRITE_ENABLED)
    missing.push("COMMUNITY_BOSS_AGGREGATE_MANUAL_WRITE_ENABLED is not true");
  if (!COMMUNITY_BOSS_AGGREGATE_WRITE_IMPLEMENTED)
    missing.push("aggregate write implementation is disabled");

  const canRead = Boolean(
    COMMUNITY_BOSS_SYNC_ENABLED &&
    COMMUNITY_BOSS_MIGRATION_REVIEWED &&
    COMMUNITY_BOSS_DB_READ_ENABLED &&
    supabaseReadEnvReady,
  );

  const proofPersistenceDryRunReady = Boolean(
    COMMUNITY_BOSS_SYNC_ENABLED &&
    COMMUNITY_BOSS_MIGRATION_REVIEWED &&
    COMMUNITY_BOSS_PROOF_PERSISTENCE_REVIEWED &&
    COMMUNITY_BOSS_PROOF_WRITE_ENABLED &&
    COMMUNITY_BOSS_PROOF_PERSISTENCE_DRY_RUN_ENABLED,
  );

  const proofManualWriteReady = Boolean(
    proofPersistenceDryRunReady &&
    COMMUNITY_BOSS_DB_READ_ENABLED &&
    supabaseReadEnvReady &&
    COMMUNITY_BOSS_WRITE_PATH_ENABLED &&
    COMMUNITY_BOSS_PROOF_MANUAL_WRITE_ENABLED &&
    COMMUNITY_BOSS_PROOF_WRITE_IMPLEMENTED,
  );

  const aggregateManualWriteReady = Boolean(
    COMMUNITY_BOSS_SYNC_ENABLED &&
    COMMUNITY_BOSS_MIGRATION_REVIEWED &&
    COMMUNITY_BOSS_DB_READ_ENABLED &&
    supabaseReadEnvReady &&
    COMMUNITY_BOSS_WRITE_PATH_ENABLED &&
    COMMUNITY_BOSS_AGGREGATE_RECALC_REVIEWED &&
    COMMUNITY_BOSS_AGGREGATE_WRITE_ENABLED &&
    COMMUNITY_BOSS_AGGREGATE_MANUAL_WRITE_ENABLED &&
    COMMUNITY_BOSS_AGGREGATE_WRITE_IMPLEMENTED,
  );

  return {
    syncEnabled: COMMUNITY_BOSS_SYNC_ENABLED,
    migrationReviewed: COMMUNITY_BOSS_MIGRATION_REVIEWED,
    dbReadEnabled: COMMUNITY_BOSS_DB_READ_ENABLED,
    supabaseReadEnvReady,
    canRead,
    writePathEnabled: COMMUNITY_BOSS_WRITE_PATH_ENABLED,
    writePathImplemented: COMMUNITY_BOSS_WRITE_PATH_IMPLEMENTED,
    seedWriteEnabled: COMMUNITY_BOSS_SEED_WRITE_ENABLED,
    seedWriteImplemented: COMMUNITY_BOSS_SEED_WRITE_IMPLEMENTED,
    proofPersistenceReviewed: COMMUNITY_BOSS_PROOF_PERSISTENCE_REVIEWED,
    proofWriteEnabled: COMMUNITY_BOSS_PROOF_WRITE_ENABLED,
    proofPersistenceDryRunEnabled:
      COMMUNITY_BOSS_PROOF_PERSISTENCE_DRY_RUN_ENABLED,
    proofPersistenceDryRunReady,
    proofManualWriteEnabled: COMMUNITY_BOSS_PROOF_MANUAL_WRITE_ENABLED,
    proofManualWriteReady,
    proofWriteImplemented: COMMUNITY_BOSS_PROOF_WRITE_IMPLEMENTED,
    aggregateRecalcReviewed: COMMUNITY_BOSS_AGGREGATE_RECALC_REVIEWED,
    aggregateWriteEnabled: COMMUNITY_BOSS_AGGREGATE_WRITE_ENABLED,
    aggregateManualWriteEnabled: COMMUNITY_BOSS_AGGREGATE_MANUAL_WRITE_ENABLED,
    aggregateWriteImplemented: COMMUNITY_BOSS_AGGREGATE_WRITE_IMPLEMENTED,
    aggregateManualWriteReady,
    canSeedWrite: false,
    canPersistProof: proofManualWriteReady,
    canRecalculateAggregate: aggregateManualWriteReady,
    canWrite: proofManualWriteReady || aggregateManualWriteReady,
    missing,
  };
}

export function getCommunityBossAggregateRecalculateGate() {
  const readiness = getCommunityBossBackendReadiness();
  const canRecalculate = Boolean(readiness.canRecalculateAggregate);

  return {
    status: canRecalculate
      ? ("manual_recalculate_ready" as const)
      : readiness.aggregateWriteEnabled
        ? ("flagged" as const)
        : ("locked" as const),
    persisted: false,
    recalculated: false,
    canRecalculate,
    aggregateRecalcReviewed: readiness.aggregateRecalcReviewed,
    aggregateWriteEnabled: readiness.aggregateWriteEnabled,
    aggregateManualWriteEnabled: readiness.aggregateManualWriteEnabled,
    aggregateWriteImplemented: readiness.aggregateWriteImplemented,
    reason: canRecalculate
      ? "Aggregate recalculation manual write gate is open. Admin route can recompute public aggregate from safe proof rows."
      : "Aggregate recalculation is locked until migration review, DB read, write path, aggregate review, and manual aggregate flags are enabled.",
    targetTable: "broke_community_boss_aggregates",
    sourceTable: "broke_community_boss_user_proofs",
    conflictTarget: "week_key",
    backendReadiness: readiness,
  };
}

export function getCommunityBossProofPersistenceGate() {
  const readiness = getCommunityBossBackendReadiness();
  const requiredFlags = {
    syncEnabled: COMMUNITY_BOSS_SYNC_ENABLED,
    migrationReviewed: COMMUNITY_BOSS_MIGRATION_REVIEWED,
    dbReadEnabled: COMMUNITY_BOSS_DB_READ_ENABLED,
    proofPersistenceReviewed: COMMUNITY_BOSS_PROOF_PERSISTENCE_REVIEWED,
    writePathEnabled: COMMUNITY_BOSS_WRITE_PATH_ENABLED,
    proofWriteEnabled: COMMUNITY_BOSS_PROOF_WRITE_ENABLED,
    proofPersistenceDryRunEnabled:
      COMMUNITY_BOSS_PROOF_PERSISTENCE_DRY_RUN_ENABLED,
    proofManualWriteEnabled: COMMUNITY_BOSS_PROOF_MANUAL_WRITE_ENABLED,
  };

  const dryRunReady = Boolean(readiness.proofPersistenceDryRunReady);
  const canPersist = Boolean(readiness.canPersistProof);

  return {
    status: canPersist
      ? ("manual_write_ready" as const)
      : dryRunReady
        ? ("dry_run_ready" as const)
        : ("locked" as const),
    persisted: false,
    wouldPersist: canPersist,
    canPersist,
    dryRunReady,
    manualWriteReady: canPersist,
    implemented: COMMUNITY_BOSS_PROOF_WRITE_IMPLEMENTED,
    requiredFlags,
    reason: canPersist
      ? "Proof persistence manual write gate is open. Authenticated safe proofs can be upserted to Supabase."
      : dryRunReady
        ? "Proof persistence dry-run server path is ready, but manual write gate is still closed."
        : "Proof persistence is still locked until migration review, write flags, and dry-run flag are enabled.",
    nextStep: canPersist
      ? "Submit authenticated safe proof to persist one Community Boss user proof row."
      : "Open the manual write gate only after migration apply, seeded week row, auth validation, and production approval.",
    backendReadiness: readiness,
  };
}

function cleanCommunityBossDbText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function buildCommunityBossProofPersistenceRow({
  proof,
  publicUserKey,
}: {
  proof: CommunityBossSafeProof;
  publicUserKey: string | null;
}) {
  return {
    week_key: proof.weekKey,
    telegram_user_id:
      cleanCommunityBossDbText(publicUserKey, 80) || "dry-run-unverified",
    public_handle: proof.publicHandle,
    public_display_name:
      cleanCommunityBossDbText(proof.publicDisplayName, 48) || null,
    weekly_damage: proof.weeklyDamage,
    safe_points: proof.safePoints,
    proof_count: proof.proofCount,
    mascot_stage: proof.mascotStage,
    mascot_power_bucket: proof.mascotPowerBucket,
    badge_count: proof.badgeCount,
    routine_completed: proof.routineCompleted,
    tracking_days: proof.trackingDays,
    challenge_completed: proof.challengeCompleted,
    weakness_hit: proof.weaknessHit,
    proof_hash: null,
  };
}

export function buildCommunityBossProofPersistenceDryRun({
  proof,
  publicUserKey,
  authenticated,
}: {
  proof: CommunityBossSafeProof;
  publicUserKey: string | null;
  authenticated: boolean;
}) {
  const gate = getCommunityBossProofPersistenceGate();
  const blockedReasons: string[] = [];

  if (!authenticated) blockedReasons.push("server auth is not verified");
  if (!gate.dryRunReady)
    blockedReasons.push("proof persistence dry-run gate is not ready");
  if (!COMMUNITY_BOSS_PROOF_WRITE_IMPLEMENTED)
    blockedReasons.push("real proof write implementation is disabled");
  if (gate.canPersist && !authenticated)
    blockedReasons.push("manual write gate requires server auth");

  const row = buildCommunityBossProofPersistenceRow({ proof, publicUserKey });
  const dryRunPrepared = Boolean(authenticated && gate.dryRunReady);

  return {
    status: dryRunPrepared ? ("prepared" as const) : ("blocked" as const),
    dryRun: true,
    dryRunPrepared,
    persisted: false,
    wouldPersist: false,
    canPersist: false,
    targetTable: "broke_community_boss_user_proofs",
    conflictTarget: "week_key, telegram_user_id",
    upsertMode: "dry_run_only",
    row,
    blockedReasons,
    gate,
    guardrails: [
      "Server-side persistence row prepared only",
      "No Supabase upsert executed",
      "No raw Telegram ID returned",
      "No wallet value",
      "No payout math",
    ],
  };
}

export async function persistCommunityBossProofToSupabase({
  proof,
  publicUserKey,
  authenticated,
}: {
  proof: CommunityBossSafeProof;
  publicUserKey: string | null;
  authenticated: boolean;
}) {
  const gate = getCommunityBossProofPersistenceGate();
  const row = buildCommunityBossProofPersistenceRow({ proof, publicUserKey });
  const blockedReasons: string[] = [];

  if (!gate.canPersist) blockedReasons.push("manual write gate is closed");
  if (!authenticated) blockedReasons.push("server auth is not verified");
  if (!publicUserKey) blockedReasons.push("public user key is missing");
  if (!hasCommunityBossSupabaseReadEnv())
    blockedReasons.push("Supabase service env is missing");

  if (blockedReasons.length > 0) {
    return {
      status: "blocked" as const,
      attempted: false,
      persisted: false,
      canPersist: gate.canPersist,
      targetTable: "broke_community_boss_user_proofs",
      conflictTarget: "week_key, telegram_user_id",
      upsertMode: "manual_write_gate",
      rowPreview: row,
      blockedReasons,
      error: null,
      returnedRow: null,
      gate,
      guardrails: [
        "No write without auth",
        "No write without manual gate",
        "No wallet value",
        "No payout math",
      ],
    };
  }

  try {
    const baseUrl = getCommunityBossSupabaseBaseUrl();
    const serviceKey = getCommunityBossSupabaseServiceKey();
    const response = await fetch(
      `${baseUrl}/rest/v1/broke_community_boss_user_proofs?on_conflict=week_key,telegram_user_id`,
      {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(row),
        cache: "no-store",
      },
    );

    const responseText = await response.text();

    if (!response.ok) {
      return {
        status: "failed" as const,
        attempted: true,
        persisted: false,
        canPersist: gate.canPersist,
        targetTable: "broke_community_boss_user_proofs",
        conflictTarget: "week_key, telegram_user_id",
        upsertMode: "manual_write_gate",
        rowPreview: row,
        blockedReasons: [],
        error: `Supabase proof upsert ${response.status}: ${responseText.slice(0, 260)}`,
        returnedRow: null,
        gate,
        guardrails: [
          "Supabase write attempted behind manual gate",
          "Write failed safely",
          "No wallet value",
          "No payout math",
        ],
      };
    }

    const returnedRows = responseText
      ? (JSON.parse(responseText) as unknown)
      : null;
    const returnedRow = Array.isArray(returnedRows)
      ? (returnedRows[0] ?? null)
      : returnedRows;

    return {
      status: "persisted" as const,
      attempted: true,
      persisted: true,
      canPersist: gate.canPersist,
      targetTable: "broke_community_boss_user_proofs",
      conflictTarget: "week_key, telegram_user_id",
      upsertMode: "manual_write_gate",
      rowPreview: row,
      blockedReasons: [],
      error: null,
      returnedRow,
      gate,
      guardrails: [
        "Authenticated safe proof persisted",
        "Server-side sanitized row only",
        "No raw Telegram ID returned",
        "No wallet value",
        "No payout math",
      ],
    };
  } catch (error) {
    return {
      status: "failed" as const,
      attempted: true,
      persisted: false,
      canPersist: gate.canPersist,
      targetTable: "broke_community_boss_user_proofs",
      conflictTarget: "week_key, telegram_user_id",
      upsertMode: "manual_write_gate",
      rowPreview: row,
      blockedReasons: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown Community Boss proof upsert error.",
      returnedRow: null,
      gate,
      guardrails: [
        "Supabase write attempted behind manual gate",
        "Write failed safely",
        "No wallet value",
        "No payout math",
      ],
    };
  }
}

function safeCommunityBossNumber(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeCommunityBossString(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function mapCommunityBossPublicWeekRow(
  row: Record<string, unknown>,
  fallbackWeek: CommunityBossWeek,
) {
  const bossHp = safeCommunityBossNumber(row.boss_hp, fallbackWeek.bossHp);
  const totalDamage = safeCommunityBossNumber(row.total_damage, 0);

  const week: CommunityBossWeek = {
    weekKey: safeCommunityBossString(row.week_key, fallbackWeek.weekKey),
    bossCode: safeCommunityBossString(row.boss_code, fallbackWeek.bossCode),
    bossName: safeCommunityBossString(row.boss_name, fallbackWeek.bossName),
    weekStartDate: safeCommunityBossString(
      row.week_start_date,
      fallbackWeek.weekStartDate,
    ),
    weekEndDate: safeCommunityBossString(
      row.week_end_date,
      fallbackWeek.weekEndDate,
    ),
    status: safeCommunityBossString(
      row.status,
      fallbackWeek.status,
    ) as CommunityBossStatus,
    bossHp,
    phaseLabel: safeCommunityBossString(
      row.phase_label,
      fallbackWeek.phaseLabel,
    ),
  };

  const aggregate: CommunityBossAggregate = {
    totalDamage,
    totalSafePoints: safeCommunityBossNumber(row.total_safe_points, 0),
    participantCount: safeCommunityBossNumber(row.participant_count, 0),
    routineCount: safeCommunityBossNumber(row.routine_count, 0),
    challengeCount: safeCommunityBossNumber(row.challenge_count, 0),
    weaknessHitCount: safeCommunityBossNumber(row.weakness_hit_count, 0),
    progressPercent: getCommunityBossProgressPercent(totalDamage, bossHp),
    updatedAt: row.aggregate_updated_at
      ? String(row.aggregate_updated_at)
      : null,
  };

  return { week, aggregate };
}

export async function readCommunityBossPublicSnapshotFromSupabase(
  fallbackWeek = getCurrentCommunityBossWeek(),
) {
  const readiness = getCommunityBossBackendReadiness();

  if (!readiness.canRead) {
    return {
      source: "dry_run" as const,
      persisted: false,
      readAttempted: false,
      readError: null,
      week: fallbackWeek,
      aggregate: getDryRunCommunityBossAggregate(fallbackWeek),
      backendReadiness: readiness,
    };
  }

  try {
    const baseUrl = getCommunityBossSupabaseBaseUrl();
    const serviceKey = getCommunityBossSupabaseServiceKey();
    const params = new URLSearchParams({
      select: [
        "week_key",
        "boss_code",
        "boss_name",
        "week_start_date",
        "week_end_date",
        "status",
        "boss_hp",
        "phase_label",
        "total_damage",
        "total_safe_points",
        "participant_count",
        "routine_count",
        "challenge_count",
        "weakness_hit_count",
        "aggregate_updated_at",
      ].join(","),
      week_key: `eq.${fallbackWeek.weekKey}`,
      limit: "1",
    });

    const response = await fetch(
      `${baseUrl}/rest/v1/broke_community_boss_public_weeks?${params.toString()}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      return {
        source: "dry_run" as const,
        persisted: false,
        readAttempted: true,
        readError: `Supabase read ${response.status}: ${detail.slice(0, 220)}`,
        week: fallbackWeek,
        aggregate: getDryRunCommunityBossAggregate(fallbackWeek),
        backendReadiness: readiness,
      };
    }

    const rows = (await response.json()) as Record<string, unknown>[];
    const firstRow = rows[0];

    if (!firstRow) {
      return {
        source: "dry_run" as const,
        persisted: false,
        readAttempted: true,
        readError: "No community boss row found for current week.",
        week: fallbackWeek,
        aggregate: getDryRunCommunityBossAggregate(fallbackWeek),
        backendReadiness: readiness,
      };
    }

    const snapshot = mapCommunityBossPublicWeekRow(firstRow, fallbackWeek);

    return {
      source: "supabase" as const,
      persisted: true,
      readAttempted: true,
      readError: null,
      ...snapshot,
      backendReadiness: readiness,
    };
  } catch (error) {
    return {
      source: "dry_run" as const,
      persisted: false,
      readAttempted: true,
      readError:
        error instanceof Error
          ? error.message
          : "Unknown Community Boss DB read error.",
      week: fallbackWeek,
      aggregate: getDryRunCommunityBossAggregate(fallbackWeek),
      backendReadiness: readiness,
    };
  }
}

type CommunityBossProofAggregateRow = {
  weekly_damage?: number | string | null;
  safe_points?: number | string | null;
  routine_completed?: boolean | null;
  challenge_completed?: boolean | null;
  weakness_hit?: boolean | null;
  tracking_days?: number | string | null;
};

function buildCommunityBossAggregateUpsertRow({
  weekKey,
  rows,
}: {
  weekKey: string;
  rows: CommunityBossProofAggregateRow[];
}) {
  const totalDamage = rows.reduce(
    (sum, row) => sum + Math.max(0, safeCommunityBossNumber(row.weekly_damage, 0)),
    0,
  );
  const totalSafePoints = rows.reduce(
    (sum, row) => sum + Math.max(0, safeCommunityBossNumber(row.safe_points, 0)),
    0,
  );
  const routineCount = rows.filter((row) => row.routine_completed === true).length;
  const challengeCount = rows.filter((row) => row.challenge_completed === true).length;
  const weaknessHitCount = rows.filter((row) => row.weakness_hit === true).length;
  const trackingDayTotal = rows.reduce(
    (sum, row) => sum + Math.min(7, Math.max(0, safeCommunityBossNumber(row.tracking_days, 0))),
    0,
  );

  return {
    week_key: weekKey,
    total_damage: Math.round(totalDamage),
    total_safe_points: Math.round(totalSafePoints),
    participant_count: rows.length,
    routine_count: routineCount,
    challenge_count: challengeCount,
    weakness_hit_count: weaknessHitCount,
    tracking_day_total: Math.round(trackingDayTotal),
    updated_at: new Date().toISOString(),
  };
}

export async function recalculateCommunityBossAggregateInSupabase({
  weekKey,
}: {
  weekKey?: string;
}) {
  const week = getCurrentCommunityBossWeek();
  const targetWeekKey = cleanCommunityBossDbText(weekKey, 12) || week.weekKey;
  const gate = getCommunityBossAggregateRecalculateGate();
  const blockedReasons: string[] = [];

  if (!gate.canRecalculate) blockedReasons.push("aggregate manual write gate is closed");
  if (!hasCommunityBossSupabaseReadEnv())
    blockedReasons.push("Supabase service env is missing");
  if (targetWeekKey !== week.weekKey)
    blockedReasons.push("only current week aggregate can be recalculated by this endpoint");

  if (blockedReasons.length > 0) {
    return {
      status: "blocked" as const,
      attempted: false,
      persisted: false,
      recalculated: false,
      targetTable: "broke_community_boss_aggregates",
      sourceTable: "broke_community_boss_user_proofs",
      conflictTarget: "week_key",
      weekKey: targetWeekKey,
      proofRowsRead: 0,
      aggregateRow: null,
      returnedRow: null,
      blockedReasons,
      error: null,
      gate,
      guardrails: [
        "No aggregate write without manual gate",
        "Reads safe proof rows only",
        "No wallet value",
        "No payout math",
      ],
    };
  }

  try {
    const baseUrl = getCommunityBossSupabaseBaseUrl();
    const serviceKey = getCommunityBossSupabaseServiceKey();
    const readParams = new URLSearchParams({
      select: [
        "weekly_damage",
        "safe_points",
        "routine_completed",
        "challenge_completed",
        "weakness_hit",
        "tracking_days",
      ].join(","),
      week_key: `eq.${targetWeekKey}`,
      limit: "10000",
    });
    const readResponse = await fetch(
      `${baseUrl}/rest/v1/broke_community_boss_user_proofs?${readParams.toString()}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    const readText = await readResponse.text();

    if (!readResponse.ok) {
      return {
        status: "failed" as const,
        attempted: true,
        persisted: false,
        recalculated: false,
        targetTable: "broke_community_boss_aggregates",
        sourceTable: "broke_community_boss_user_proofs",
        conflictTarget: "week_key",
        weekKey: targetWeekKey,
        proofRowsRead: 0,
        aggregateRow: null,
        returnedRow: null,
        blockedReasons: [],
        error: `Supabase proof aggregate read ${readResponse.status}: ${readText.slice(0, 260)}`,
        gate,
        guardrails: [
          "Aggregate read attempted behind manual gate",
          "Read failed safely",
          "No wallet value",
          "No payout math",
        ],
      };
    }

    const proofRows = readText
      ? (JSON.parse(readText) as CommunityBossProofAggregateRow[])
      : [];
    const aggregateRow = buildCommunityBossAggregateUpsertRow({
      weekKey: targetWeekKey,
      rows: Array.isArray(proofRows) ? proofRows : [],
    });
    const writeResponse = await fetch(
      `${baseUrl}/rest/v1/broke_community_boss_aggregates?on_conflict=week_key`,
      {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(aggregateRow),
        cache: "no-store",
      },
    );
    const writeText = await writeResponse.text();

    if (!writeResponse.ok) {
      return {
        status: "failed" as const,
        attempted: true,
        persisted: false,
        recalculated: false,
        targetTable: "broke_community_boss_aggregates",
        sourceTable: "broke_community_boss_user_proofs",
        conflictTarget: "week_key",
        weekKey: targetWeekKey,
        proofRowsRead: Array.isArray(proofRows) ? proofRows.length : 0,
        aggregateRow,
        returnedRow: null,
        blockedReasons: [],
        error: `Supabase aggregate upsert ${writeResponse.status}: ${writeText.slice(0, 260)}`,
        gate,
        guardrails: [
          "Aggregate write attempted behind manual gate",
          "Write failed safely",
          "No wallet value",
          "No payout math",
        ],
      };
    }

    const returnedRows = writeText ? (JSON.parse(writeText) as unknown) : null;
    const returnedRow = Array.isArray(returnedRows)
      ? (returnedRows[0] ?? null)
      : returnedRows;

    return {
      status: "recalculated" as const,
      attempted: true,
      persisted: true,
      recalculated: true,
      targetTable: "broke_community_boss_aggregates",
      sourceTable: "broke_community_boss_user_proofs",
      conflictTarget: "week_key",
      weekKey: targetWeekKey,
      proofRowsRead: Array.isArray(proofRows) ? proofRows.length : 0,
      aggregateRow,
      returnedRow,
      blockedReasons: [],
      error: null,
      gate,
      guardrails: [
        "Public aggregate recalculated from safe proof rows",
        "Manual aggregate write gate was open",
        "No wallet value",
        "No payout math",
      ],
    };
  } catch (error) {
    return {
      status: "failed" as const,
      attempted: true,
      persisted: false,
      recalculated: false,
      targetTable: "broke_community_boss_aggregates",
      sourceTable: "broke_community_boss_user_proofs",
      conflictTarget: "week_key",
      weekKey: targetWeekKey,
      proofRowsRead: 0,
      aggregateRow: null,
      returnedRow: null,
      blockedReasons: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown Community Boss aggregate recalculation error.",
      gate,
      guardrails: [
        "Aggregate recalculation attempted behind manual gate",
        "Operation failed safely",
        "No wallet value",
        "No payout math",
      ],
    };
  }
}

function escapeCommunityBossSqlString(value: string) {
  return value.replace(/'/g, "''");
}

export function buildCommunityBossSeedWeekSql(
  week = getCurrentCommunityBossWeek(),
) {
  const values = {
    weekKey: escapeCommunityBossSqlString(week.weekKey),
    bossCode: escapeCommunityBossSqlString(week.bossCode),
    bossName: escapeCommunityBossSqlString(week.bossName),
    weekStartDate: escapeCommunityBossSqlString(week.weekStartDate),
    weekEndDate: escapeCommunityBossSqlString(week.weekEndDate),
    phaseLabel: escapeCommunityBossSqlString(week.phaseLabel),
    status: escapeCommunityBossSqlString(week.status),
  };

  return `-- Manual Community Boss current-week seed generated by app helper.
-- Review before running in Supabase SQL editor.
-- Public-safe boss metadata only. No user proof, no wallet value, no payout math.

insert into public.broke_community_boss_weeks (
  week_key,
  boss_code,
  boss_name,
  week_start_date,
  week_end_date,
  status,
  boss_hp,
  phase_label
) values (
  '${values.weekKey}',
  '${values.bossCode}',
  '${values.bossName}',
  '${values.weekStartDate}'::date,
  '${values.weekEndDate}'::date,
  '${values.status}',
  ${week.bossHp},
  '${values.phaseLabel}'
)
on conflict (week_key) do update set
  boss_code = excluded.boss_code,
  boss_name = excluded.boss_name,
  week_start_date = excluded.week_start_date,
  week_end_date = excluded.week_end_date,
  status = excluded.status,
  boss_hp = excluded.boss_hp,
  phase_label = excluded.phase_label,
  updated_at = now();

insert into public.broke_community_boss_aggregates (
  week_key,
  total_damage,
  total_safe_points,
  participant_count,
  routine_count,
  challenge_count,
  weakness_hit_count,
  tracking_day_total
) values (
  '${values.weekKey}',
  0,
  0,
  0,
  0,
  0,
  0,
  0
)
on conflict (week_key) do nothing;`;
}

export function getCommunityBossSeedWeekPlan(
  week = getCurrentCommunityBossWeek(),
) {
  const readiness = getCommunityBossBackendReadiness();

  return {
    manualApplyRequired: true,
    persisted: false,
    seedWriteReady: false,
    seedWriteEnabled: COMMUNITY_BOSS_SEED_WRITE_ENABLED,
    seedWriteImplemented: COMMUNITY_BOSS_SEED_WRITE_IMPLEMENTED,
    week,
    sql: buildCommunityBossSeedWeekSql(week),
    backendReadiness: readiness,
    guardrails: [
      "Admin/manual seed prep only",
      "No automatic Supabase write",
      "No user proof rows",
      "No aggregate damage write beyond zero-row seed SQL",
      "No wallet value",
      "No payout math",
      "No PvP",
    ],
  };
}

export function getCommunityBossNoStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
  };
}
