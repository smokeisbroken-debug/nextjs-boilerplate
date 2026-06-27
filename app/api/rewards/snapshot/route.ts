import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ActiveStreakProofAction = "track_leak" | "clean_day" | "one_fix" | "daily_challenge" | "daily_routine";

type ActiveStreakProofLog = {
  date: string;
  actions: ActiveStreakProofAction[];
};

type ActiveStreakProofState = {
  logs: ActiveStreakProofLog[];
  recoveredMissedDates: string[];
  recoveryUsedAt: string | null;
  updatedAt?: string;
};

type SettingsRow = {
  telegram_id: number | string;
  settings_payload?: unknown;
  app_state_payload?: unknown;
};

type WalletLinkRow = {
  telegram_user_id?: number | string;
  wallet_address?: string;
  is_verified?: boolean;
  broke_balance?: number | string | null;
  holder_tier?: unknown;
  verified_at?: string | null;
  last_checked_at?: string | null;
  updated_at?: string | null;
};

type RewardEpochRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  snapshot_at?: string | null;
  volume_24h_usd?: number | string | null;
  volume_trigger_usd?: number | string | null;
  max_creator_fee_pool_percent?: number | string | null;
  minimum_hold_broke?: number | string | null;
  minimum_active_streak_days?: number | string | null;
};

const FUTURE_HOLDER_REWARD_MIN_BALANCE = 250_000;
const ACTIVE_STREAK_ELIGIBILITY_DAYS = 7;
const ACTIVE_STREAK_ACTIONS: ActiveStreakProofAction[] = ["daily_routine"];

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string) {
  return process.env[name] || "";
}

function getSupabaseBaseUrl() {
  return getEnv("SUPABASE_URL")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

function getSupabaseHeaders(extra?: HeadersInit) {
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...(extra || {}),
  };
}

function supabaseUrl(path: string) {
  return `${getSupabaseBaseUrl()}/rest/v1/${path}`;
}

function getRewardsAdminSecret() {
  return (
    getOptionalEnv("REWARDS_ADMIN_SECRET") ||
    getOptionalEnv("DIAGNOSTICS_SECRET") ||
    getOptionalEnv("TELEGRAM_SETUP_SECRET")
  );
}

function isAuthorized(request: NextRequest) {
  const secret = getRewardsAdminSecret();
  if (!secret) return false;

  const key = request.nextUrl.searchParams.get("key") || "";
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  return key === secret || bearer === secret;
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeJson(value: unknown) {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function previousDayKey(dateKey: string, daysBack = 1) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - daysBack);
  return dayKey(date);
}

function getDayDistance(fromKey: string, toKey: string) {
  const from = new Date(`${fromKey}T00:00:00.000Z`).getTime();
  const to = new Date(`${toKey}T00:00:00.000Z`).getTime();

  if (!Number.isFinite(from) || !Number.isFinite(to)) return 999;

  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

function normalizeProofAction(value: unknown): ActiveStreakProofAction | null {
  return ACTIVE_STREAK_ACTIONS.includes(value as ActiveStreakProofAction)
    ? (value as ActiveStreakProofAction)
    : null;
}

function normalizeProofState(input: unknown): ActiveStreakProofState {
  const raw = safeJson(input) || {};
  const logsInput = Array.isArray(raw.logs) ? raw.logs : [];
  const logs = logsInput
    .map((item) => {
      const log = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
      const date = String(log?.date || "");
      const actions = Array.isArray(log?.actions)
        ? Array.from(new Set(log.actions.map(normalizeProofAction).filter((action): action is ActiveStreakProofAction => Boolean(action))))
        : [];

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || actions.length === 0) return null;

      return { date, actions };
    })
    .filter((log): log is ActiveStreakProofLog => Boolean(log))
    .sort((a, b) => a.date.localeCompare(b.date));

  const recoveredMissedDates = Array.isArray(raw.recoveredMissedDates)
    ? Array.from(
        new Set(
          raw.recoveredMissedDates
            .map((date) => String(date || ""))
            .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
        )
      )
    : [];

  const recoveryUsedAt = raw.recoveryUsedAt && /^\d{4}-\d{2}-\d{2}$/.test(String(raw.recoveryUsedAt))
    ? String(raw.recoveryUsedAt)
    : null;

  return {
    logs: logs.slice(-90),
    recoveredMissedDates: recoveredMissedDates.sort().slice(-12),
    recoveryUsedAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  };
}

function getProofStateFromAppState(appStatePayload: unknown) {
  const appState = safeJson(appStatePayload);
  return normalizeProofState(appState?.activeStreakProof);
}

function getProofDateSet(state: ActiveStreakProofState) {
  return new Set([
    ...state.logs.map((log) => log.date),
    ...state.recoveredMissedDates,
  ]);
}

function calculateCurrentStreak(state: ActiveStreakProofState, snapshotDate: string) {
  const dateSet = getProofDateSet(state);
  let currentStreak = 0;
  const today = snapshotDate;
  const yesterday = previousDayKey(today);

  if (dateSet.has(today) || dateSet.has(yesterday)) {
    const cursor = new Date(`${dateSet.has(today) ? today : yesterday}T00:00:00.000Z`);

    while (dateSet.has(dayKey(cursor))) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  return currentStreak;
}

function getTodayProofActions(state: ActiveStreakProofState, snapshotDate: string) {
  return state.logs.find((log) => log.date === snapshotDate)?.actions || [];
}

async function supabaseFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(supabaseUrl(path), {
    ...(init || {}),
    headers: getSupabaseHeaders(init?.headers),
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${text.slice(0, 700)}`);
  }

  if (!text) return null as T;

  return JSON.parse(text) as T;
}

async function readSettingsRows() {
  return supabaseFetch<SettingsRow[]>(
    "broke_settings?select=telegram_id,settings_payload,app_state_payload&limit=5000"
  );
}

async function readWalletRows() {
  return supabaseFetch<WalletLinkRow[]>(
    "broke_wallet_links?select=telegram_user_id,wallet_address,is_verified,broke_balance,holder_tier,verified_at,last_checked_at,updated_at&is_verified=eq.true&limit=5000"
  );
}

async function readLatestEpoch() {
  const rows = await supabaseFetch<RewardEpochRow[]>(
    "broke_reward_epochs?select=*&order=created_at.desc&limit=1"
  );

  return rows[0] || null;
}

async function upsertEpoch(payload: Record<string, unknown>) {
  const rows = await supabaseFetch<RewardEpochRow[]>("broke_reward_epochs?on_conflict=code", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([payload]),
  });

  return rows[0];
}

async function upsertSnapshotRows(rows: Record<string, unknown>[]) {
  if (!rows.length) return [];

  return supabaseFetch<unknown[]>("broke_reward_snapshots?on_conflict=epoch_id,telegram_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
}

function pickBestWalletByTelegramId(walletRows: WalletLinkRow[]) {
  const map = new Map<string, WalletLinkRow>();

  walletRows.forEach((wallet) => {
    const telegramId = String(wallet.telegram_user_id || "");
    if (!telegramId || !wallet.is_verified) return;

    const current = map.get(telegramId);
    const currentBalance = safeNumber(current?.broke_balance);
    const nextBalance = safeNumber(wallet.broke_balance);

    if (!current || nextBalance > currentBalance) {
      map.set(telegramId, wallet);
    }
  });

  return map;
}

function buildEligibilityReason(args: {
  wallet?: WalletLinkRow;
  balance: number;
  currentStreak: number;
  minHold: number;
  minStreak: number;
}) {
  const reasons: string[] = [];

  if (!args.wallet) reasons.push("wallet_not_verified");
  if (args.wallet && args.balance < args.minHold) reasons.push("below_minimum_hold");
  if (args.currentStreak < args.minStreak) reasons.push("active_streak_below_7_days");

  return reasons;
}

async function buildSnapshot(args: {
  snapshotDate: string;
  minHold: number;
  minStreak: number;
}) {
  const [settingsRows, walletRows] = await Promise.all([readSettingsRows(), readWalletRows()]);
  const walletByTelegramId = pickBestWalletByTelegramId(walletRows);

  const participants = settingsRows.map((row) => {
    const telegramId = String(row.telegram_id || "");
    const wallet = walletByTelegramId.get(telegramId);
    const balance = wallet ? safeNumber(wallet.broke_balance) : 0;
    const proofState = getProofStateFromAppState(row.app_state_payload);
    const currentStreak = calculateCurrentStreak(proofState, args.snapshotDate);
    const reasons = buildEligibilityReason({
      wallet,
      balance,
      currentStreak,
      minHold: args.minHold,
      minStreak: args.minStreak,
    });
    const eligible = reasons.length === 0;

    return {
      telegramId,
      walletAddress: wallet?.wallet_address || "",
      verifiedBalance: balance,
      holderTier: wallet?.holder_tier || null,
      activeStreakDays: currentStreak,
      todayActions: getTodayProofActions(proofState, args.snapshotDate),
      eligible,
      ineligibleReasons: reasons,
      verifiedAt: wallet?.verified_at || null,
      lastCheckedAt: wallet?.last_checked_at || wallet?.updated_at || null,
      balanceSharePercent: 0,
    };
  });

  const totalEligibleBalance = participants
    .filter((participant) => participant.eligible)
    .reduce((sum, participant) => sum + participant.verifiedBalance, 0);

  const withShares = participants.map((participant) => ({
    ...participant,
    balanceSharePercent:
      participant.eligible && totalEligibleBalance > 0
        ? Number(((participant.verifiedBalance / totalEligibleBalance) * 100).toFixed(8))
        : 0,
  }));

  return {
    participants: withShares,
    totalUsersScanned: settingsRows.length,
    totalVerifiedWallets: walletRows.length,
    totalEligibleHolders: withShares.filter((participant) => participant.eligible).length,
    totalEligibleBalance,
  };
}

export async function GET(request: NextRequest) {
  if (!getRewardsAdminSecret()) {
    return json({ ok: false, error: "Missing REWARDS_ADMIN_SECRET, DIAGNOSTICS_SECRET, or TELEGRAM_SETUP_SECRET." }, 500);
  }

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  try {
    const epoch = await readLatestEpoch();

    return json({
      ok: true,
      route: "/api/rewards/snapshot",
      mode: "admin-ledger-foundation",
      latestEpoch: epoch,
      notes: [
        "POST dryRun=true to preview eligible holders without writing rows.",
        "POST commit=true to upsert an epoch and snapshot ledger rows.",
        "This route does not send tokens, claims, staking, or payouts.",
      ],
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Could not read reward snapshot status." }, 500);
  }
}

export async function POST(request: NextRequest) {
  if (!getRewardsAdminSecret()) {
    return json({ ok: false, error: "Missing REWARDS_ADMIN_SECRET, DIAGNOSTICS_SECRET, or TELEGRAM_SETUP_SECRET." }, 500);
  }

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const now = new Date();
    const snapshotDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.snapshotDate || ""))
      ? String(body.snapshotDate)
      : dayKey(now);
    const minHold = Math.max(0, safeNumber(body.minimumHoldBroke, FUTURE_HOLDER_REWARD_MIN_BALANCE));
    const minStreak = Math.max(1, Math.round(safeNumber(body.minimumActiveStreakDays, ACTIVE_STREAK_ELIGIBILITY_DAYS)));
    const volume24hUsd = Math.max(0, safeNumber(body.volume24hUsd, 0));
    const volumeTriggerUsd = Math.max(0, safeNumber(body.volumeTriggerUsd, 50_000));
    const code = String(body.epochCode || `reward-epoch-${snapshotDate}`).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const name = String(body.epochName || "Reward Snapshot Prep").trim() || "Reward Snapshot Prep";
    const commit = Boolean(body.commit) && body.dryRun !== true;

    const snapshot = await buildSnapshot({ snapshotDate, minHold, minStreak });
    const eligibleParticipants = snapshot.participants.filter((participant) => participant.eligible);
    let epoch: RewardEpochRow | null = null;
    let rowsWritten = 0;

    if (commit) {
      epoch = await upsertEpoch({
        code,
        name,
        status: "snapshotted",
        snapshot_at: `${snapshotDate}T00:00:00.000Z`,
        volume_24h_usd: volume24hUsd,
        volume_trigger_usd: volumeTriggerUsd,
        max_creator_fee_pool_percent: 50,
        minimum_hold_broke: minHold,
        minimum_active_streak_days: minStreak,
        created_by: "admin_snapshot_route",
        payload: {
          notes: "Snapshot ledger only. No payouts, claims, staking, token transfers, or Creator Fee distribution executed.",
          total_users_scanned: snapshot.totalUsersScanned,
          total_verified_wallets: snapshot.totalVerifiedWallets,
          total_eligible_holders: snapshot.totalEligibleHolders,
          total_eligible_balance: snapshot.totalEligibleBalance,
        },
      });

      const snapshotRows = snapshot.participants.map((participant) => ({
        epoch_id: epoch?.id,
        telegram_id: Number(participant.telegramId),
        wallet_address: participant.walletAddress || null,
        verified_balance: participant.verifiedBalance,
        active_streak_days: participant.activeStreakDays,
        eligible: participant.eligible,
        ineligible_reason: participant.ineligibleReasons.join(",") || null,
        balance_share_percent: participant.balanceSharePercent,
        snapshot_payload: {
          today_actions: participant.todayActions,
          holder_tier: participant.holderTier,
          verified_at: participant.verifiedAt,
          wallet_last_checked_at: participant.lastCheckedAt,
          minimum_hold_broke: minHold,
          minimum_active_streak_days: minStreak,
          total_eligible_balance: snapshot.totalEligibleBalance,
        },
      }));

      const written = await upsertSnapshotRows(snapshotRows);
      rowsWritten = Array.isArray(written) ? written.length : snapshotRows.length;
    }

    return json({
      ok: true,
      dryRun: !commit,
      committed: commit,
      epoch: epoch || {
        code,
        name,
        status: commit ? "snapshotted" : "dry_run",
        snapshot_at: `${snapshotDate}T00:00:00.000Z`,
        volume_24h_usd: volume24hUsd,
        volume_trigger_usd: volumeTriggerUsd,
        max_creator_fee_pool_percent: 50,
        minimum_hold_broke: minHold,
        minimum_active_streak_days: minStreak,
      },
      summary: {
        snapshotDate,
        totalUsersScanned: snapshot.totalUsersScanned,
        totalVerifiedWallets: snapshot.totalVerifiedWallets,
        totalEligibleHolders: snapshot.totalEligibleHolders,
        totalEligibleBalance: snapshot.totalEligibleBalance,
        rowsWritten,
      },
      eligiblePreview: eligibleParticipants.slice(0, 50).map((participant) => ({
        telegramId: participant.telegramId,
        walletAddress: participant.walletAddress,
        verifiedBalance: participant.verifiedBalance,
        activeStreakDays: participant.activeStreakDays,
        balanceSharePercent: participant.balanceSharePercent,
      })),
      ineligiblePreview: snapshot.participants
        .filter((participant) => !participant.eligible)
        .slice(0, 50)
        .map((participant) => ({
          telegramId: participant.telegramId,
          walletAddress: participant.walletAddress,
          verifiedBalance: participant.verifiedBalance,
          activeStreakDays: participant.activeStreakDays,
          reasons: participant.ineligibleReasons,
        })),
      safety: {
        noPayouts: true,
        noClaims: true,
        noStaking: true,
        noTokenTransfers: true,
        noCreatorFeeDistribution: true,
      },
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Could not build reward snapshot." }, 500);
  }
}
