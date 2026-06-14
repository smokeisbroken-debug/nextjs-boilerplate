import { NextRequest, NextResponse } from "next/server";

import { BROKE_APP_BUILD_VERSION } from "@/app/lib/brokeAdminRewards";
import {
  COMMUNITY_BOSS_SYNC_ENABLED,
  getCommunityBossNoStoreHeaders,
  getCommunityBossSeedWeekPlan,
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
      }
    );
  }

  const seedPlan = getCommunityBossSeedWeekPlan();

  return NextResponse.json(
    {
      ok: true,
      buildVersion: BROKE_APP_BUILD_VERSION,
      mode: COMMUNITY_BOSS_SYNC_ENABLED ? "manual_seed_prep" : "dry_run_seed_prep",
      syncEnabled: COMMUNITY_BOSS_SYNC_ENABLED,
      persisted: false,
      manualApplyRequired: true,
      seedWriteReady: false,
      seedPlan,
      message: "Current Community Boss week seed is prepared for manual Supabase SQL review/apply. This endpoint does not write to Supabase in v59.60.4.",
    },
    {
      status: 202,
      headers: getCommunityBossNoStoreHeaders(),
    }
  );
}
