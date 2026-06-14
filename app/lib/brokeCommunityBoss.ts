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

export function getCommunityBossNoStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
  };
}
