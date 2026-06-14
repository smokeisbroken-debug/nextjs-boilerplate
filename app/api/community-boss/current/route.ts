import { NextRequest, NextResponse } from "next/server";

import { BROKE_APP_BUILD_VERSION } from "@/app/lib/brokeAdminRewards";
import {
  COMMUNITY_BOSS_SYNC_ENABLED,
  getCommunityBossNoStoreHeaders,
  getCurrentCommunityBossWeek,
  readCommunityBossPublicSnapshotFromSupabase,
} from "@/app/lib/brokeCommunityBoss";

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  const fallbackWeek = getCurrentCommunityBossWeek();
  const snapshot = await readCommunityBossPublicSnapshotFromSupabase(fallbackWeek);

  return NextResponse.json(
    {
      ok: true,
      buildVersion: BROKE_APP_BUILD_VERSION,
      mode: snapshot.source === "supabase"
        ? "read_only_supabase"
        : COMMUNITY_BOSS_SYNC_ENABLED
          ? "read_path_fallback_dry_run"
          : "dry_run",
      syncEnabled: COMMUNITY_BOSS_SYNC_ENABLED,
      persisted: snapshot.persisted,
      readAttempted: snapshot.readAttempted,
      readError: snapshot.readError,
      dataSource: snapshot.source,
      writePathReady: snapshot.backendReadiness.canWrite,
      backendReadiness: snapshot.backendReadiness,
      week: snapshot.week,
      aggregate: snapshot.aggregate,
      userProof: {
        submitted: false,
        weeklyDamage: 0,
        safePoints: 0,
        proofCount: 0,
        mascotStage: 1,
        mascotPowerBucket: "low",
        badgeCount: 0,
        routineCompleted: false,
        trackingDays: 0,
        challengeCompleted: false,
        weaknessHit: false,
        updatedAt: null,
      },
      guardrails: [
        "Read-only aggregate path only",
        "No wallet value",
        "No balance",
        "No income",
        "No debt",
        "No payout math",
        "No PvP",
        "No database writes in this patch",
      ],
    },
    {
      headers: getCommunityBossNoStoreHeaders(),
    }
  );
}
