import { NextRequest, NextResponse } from "next/server";

import { BROKE_APP_BUILD_VERSION } from "@/app/lib/brokeAdminRewards";
import {
  COMMUNITY_BOSS_SYNC_ENABLED,
  getCommunityBossNoStoreHeaders,
  getCommunityBossProgressPercent,
  getCurrentCommunityBossWeek,
  getDryRunCommunityBossAggregate,
} from "@/app/lib/brokeCommunityBoss";

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  const week = getCurrentCommunityBossWeek();
  const aggregate = getDryRunCommunityBossAggregate(week);

  return NextResponse.json(
    {
      ok: true,
      buildVersion: BROKE_APP_BUILD_VERSION,
      mode: COMMUNITY_BOSS_SYNC_ENABLED ? "skeleton_enabled_no_writes" : "dry_run",
      syncEnabled: COMMUNITY_BOSS_SYNC_ENABLED,
      persisted: false,
      week,
      aggregate: {
        ...aggregate,
        progressPercent: getCommunityBossProgressPercent(aggregate.totalDamage, week.bossHp),
      },
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
        "No wallet value",
        "No balance",
        "No income",
        "No debt",
        "No payout math",
        "No PvP",
        "No database writes in this skeleton",
      ],
    },
    {
      headers: getCommunityBossNoStoreHeaders(),
    }
  );
}
