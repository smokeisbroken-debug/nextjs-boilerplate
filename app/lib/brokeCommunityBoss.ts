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

export const COMMUNITY_BOSS_WRITE_PATH_IMPLEMENTED = false;
export const COMMUNITY_BOSS_SEED_WRITE_IMPLEMENTED = false;

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
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = result.getUTCDay() || 7;
  result.setUTCDate(result.getUTCDate() - day + 1);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function getIsoWeekYearAndNumber(date: Date) {
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = normalized.getUTCDay() || 7;
  normalized.setUTCDate(normalized.getUTCDate() + 4 - day);
  const weekYear = normalized.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const weekNumber = Math.ceil((((normalized.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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

export function getCurrentCommunityBossWeek(date = new Date()): CommunityBossWeek {
  const weekKey = getCommunityBossWeekKey(date);
  const { weekStartDate, weekEndDate } = getCommunityBossWeekWindow(date);
  const { weekNumber } = getIsoWeekYearAndNumber(date);
  const boss = COMMUNITY_BOSS_ROTATION[weekNumber % COMMUNITY_BOSS_ROTATION.length];

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

export function getDryRunCommunityBossAggregate(week: CommunityBossWeek): CommunityBossAggregate {
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
  if (normalized === "medium" || normalized === "high" || normalized === "legend") {
    return normalized;
  }
  return "low";
}

function toBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function findForbiddenCommunityBossFields(value: unknown, path: string[] = []): string[] {
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

export function sanitizeCommunityBossProof(input: unknown, currentWeek = getCurrentCommunityBossWeek()): CommunityBossSafeProof {
  const data = input && typeof input === "object" ? input as Record<string, unknown> : {};
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

export function getCommunityBossProgressPercent(totalDamage: number, bossHp: number) {
  if (!Number.isFinite(totalDamage) || !Number.isFinite(bossHp) || bossHp <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((totalDamage / bossHp) * 100)));
}


function getOptionalCommunityBossEnv(name: string) {
  return process.env[name] || "";
}

function getCommunityBossSupabaseBaseUrl() {
  const raw = getOptionalCommunityBossEnv("SUPABASE_URL");
  return raw.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
}

function getCommunityBossSupabaseServiceKey() {
  return getOptionalCommunityBossEnv("SUPABASE_SERVICE_ROLE_KEY");
}

function hasCommunityBossSupabaseReadEnv() {
  return Boolean(getCommunityBossSupabaseBaseUrl() && getCommunityBossSupabaseServiceKey());
}

export function getCommunityBossBackendReadiness() {
  const missing: string[] = [];
  const supabaseReadEnvReady = hasCommunityBossSupabaseReadEnv();

  if (!COMMUNITY_BOSS_SYNC_ENABLED) missing.push("COMMUNITY_BOSS_SYNC_ENABLED is not true");
  if (!COMMUNITY_BOSS_MIGRATION_REVIEWED) missing.push("COMMUNITY_BOSS_MIGRATION_REVIEWED is not true");
  if (!COMMUNITY_BOSS_DB_READ_ENABLED) missing.push("COMMUNITY_BOSS_DB_READ_ENABLED is not true");
  if (!supabaseReadEnvReady) missing.push("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing for DB read");
  if (!COMMUNITY_BOSS_WRITE_PATH_ENABLED) missing.push("COMMUNITY_BOSS_WRITE_PATH_ENABLED is not true");
  if (!COMMUNITY_BOSS_WRITE_PATH_IMPLEMENTED) missing.push("write path is intentionally not implemented in this patch");
  if (!COMMUNITY_BOSS_SEED_WRITE_ENABLED) missing.push("COMMUNITY_BOSS_SEED_WRITE_ENABLED is not true");
  if (!COMMUNITY_BOSS_SEED_WRITE_IMPLEMENTED) missing.push("seed write is intentionally not implemented in this patch");

  const canRead = Boolean(
    COMMUNITY_BOSS_SYNC_ENABLED &&
    COMMUNITY_BOSS_MIGRATION_REVIEWED &&
    COMMUNITY_BOSS_DB_READ_ENABLED &&
    supabaseReadEnvReady
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
    canSeedWrite: false,
    canWrite: false,
    missing,
  };
}

function safeCommunityBossNumber(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeCommunityBossString(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function mapCommunityBossPublicWeekRow(row: Record<string, unknown>, fallbackWeek: CommunityBossWeek) {
  const bossHp = safeCommunityBossNumber(row.boss_hp, fallbackWeek.bossHp);
  const totalDamage = safeCommunityBossNumber(row.total_damage, 0);

  const week: CommunityBossWeek = {
    weekKey: safeCommunityBossString(row.week_key, fallbackWeek.weekKey),
    bossCode: safeCommunityBossString(row.boss_code, fallbackWeek.bossCode),
    bossName: safeCommunityBossString(row.boss_name, fallbackWeek.bossName),
    weekStartDate: safeCommunityBossString(row.week_start_date, fallbackWeek.weekStartDate),
    weekEndDate: safeCommunityBossString(row.week_end_date, fallbackWeek.weekEndDate),
    status: safeCommunityBossString(row.status, fallbackWeek.status) as CommunityBossStatus,
    bossHp,
    phaseLabel: safeCommunityBossString(row.phase_label, fallbackWeek.phaseLabel),
  };

  const aggregate: CommunityBossAggregate = {
    totalDamage,
    totalSafePoints: safeCommunityBossNumber(row.total_safe_points, 0),
    participantCount: safeCommunityBossNumber(row.participant_count, 0),
    routineCount: safeCommunityBossNumber(row.routine_count, 0),
    challengeCount: safeCommunityBossNumber(row.challenge_count, 0),
    weaknessHitCount: safeCommunityBossNumber(row.weakness_hit_count, 0),
    progressPercent: getCommunityBossProgressPercent(totalDamage, bossHp),
    updatedAt: row.aggregate_updated_at ? String(row.aggregate_updated_at) : null,
  };

  return { week, aggregate };
}

export async function readCommunityBossPublicSnapshotFromSupabase(fallbackWeek = getCurrentCommunityBossWeek()) {
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

    const response = await fetch(`${baseUrl}/rest/v1/broke_community_boss_public_weeks?${params.toString()}`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

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

    const rows = await response.json() as Record<string, unknown>[];
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
      readError: error instanceof Error ? error.message : "Unknown Community Boss DB read error.",
      week: fallbackWeek,
      aggregate: getDryRunCommunityBossAggregate(fallbackWeek),
      backendReadiness: readiness,
    };
  }
}


function escapeCommunityBossSqlString(value: string) {
  return value.replace(/'/g, "''");
}

export function buildCommunityBossSeedWeekSql(week = getCurrentCommunityBossWeek()) {
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

export function getCommunityBossSeedWeekPlan(week = getCurrentCommunityBossWeek()) {
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
