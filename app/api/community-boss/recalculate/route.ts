import { NextRequest, NextResponse } from "next/server";

import { BROKE_APP_BUILD_VERSION } from "@/app/lib/brokeAdminRewards";
import {
  COMMUNITY_BOSS_SYNC_ENABLED,
  getCommunityBossBackendReadiness,
  getCommunityBossNoStoreHeaders,
  getCurrentCommunityBossWeek,
  recalculateCommunityBossAggregateInSupabase,
} from "@/app/lib/brokeCommunityBoss";

export const runtime = "nodejs";

function getOptionalEnv(name: string) {
  return process.env[name] || "";
}

function getAdminSecret() {
  return (
    getOptionalEnv("COMMUNITY_BOSS_ADMIN_SECRET") ||
    getOptionalEnv("REWARDS_ADMIN_SECRET") ||
    getOptionalEnv("DIAGNOSTICS_SECRET") ||
    getOptionalEnv("TELEGRAM_SETUP_SECRET")
  );
}

function isAuthorized(request: NextRequest) {
  const secret = getAdminSecret();
  if (!secret) return false;

  const key = request.nextUrl.searchParams.get("key") || "";
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  return key === secret || bearer === secret;
}

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        buildVersion: BROKE_APP_BUILD_VERSION,
        error: "Unauthorized.",
      },
      {
        status: 401,
        headers: getCommunityBossNoStoreHeaders(),
      },
    );
  }

  const body = await readJson(request);
  const requestedWeekKey =
    body && typeof body === "object" && "weekKey" in body
      ? String((body as Record<string, unknown>).weekKey || "")
      : "";
  const currentWeek = getCurrentCommunityBossWeek();
  const result = await recalculateCommunityBossAggregateInSupabase({
    weekKey: requestedWeekKey || currentWeek.weekKey,
  });
  const readiness = getCommunityBossBackendReadiness();

  return NextResponse.json(
    {
      ok: result.status !== "failed",
      buildVersion: BROKE_APP_BUILD_VERSION,
      mode: COMMUNITY_BOSS_SYNC_ENABLED
        ? "manual_aggregate_recalculate_gate"
        : "dry_run",
      syncEnabled: COMMUNITY_BOSS_SYNC_ENABLED,
      persisted: result.persisted,
      recalculated: result.recalculated,
      writePathReady: readiness.canWrite,
      aggregateRecalculateReady: readiness.canRecalculateAggregate,
      backendReadiness: readiness,
      week: currentWeek,
      aggregateRecalculate: result,
      message: result.recalculated
        ? "Community Boss aggregate recalculated from safe proof rows behind manual write gate."
        : "Community Boss aggregate recalculation did not write. Check gate readiness, flags, current week seed, and Supabase response.",
      nextStep: result.recalculated
        ? "Next patch can refresh the live UI after proof submit or add controlled post-proof aggregate refresh."
        : "Enable aggregate manual write gate only after migration, current week seed, proof persistence test, and production approval.",
    },
    {
      status: result.status === "failed" ? 502 : result.recalculated ? 200 : 202,
      headers: getCommunityBossNoStoreHeaders(),
    },
  );
}
