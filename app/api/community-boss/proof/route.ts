import { NextRequest, NextResponse } from "next/server";

import { BROKE_APP_BUILD_VERSION } from "@/app/lib/brokeAdminRewards";
import {
  COMMUNITY_BOSS_SYNC_ENABLED,
  findForbiddenCommunityBossFields,
  getCommunityBossBackendReadiness,
  getCommunityBossNoStoreHeaders,
  getCurrentCommunityBossWeek,
  sanitizeCommunityBossProof,
} from "@/app/lib/brokeCommunityBoss";

export const runtime = "nodejs";

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const currentWeek = getCurrentCommunityBossWeek();
  const readiness = getCommunityBossBackendReadiness();
  const body = await readJson(request);
  const forbiddenFields = findForbiddenCommunityBossFields(body);

  if (forbiddenFields.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        buildVersion: BROKE_APP_BUILD_VERSION,
        error: "Forbidden Community Boss fields were rejected.",
        forbiddenFields,
        guardrail: "Community Boss proof cannot include balance, wallet value, income, debt, transactions, payout, or private budget data.",
      },
      {
        status: 400,
        headers: getCommunityBossNoStoreHeaders(),
      }
    );
  }

  const proof = sanitizeCommunityBossProof(body, currentWeek);

  if (proof.weekKey !== currentWeek.weekKey) {
    return NextResponse.json(
      {
        ok: false,
        buildVersion: BROKE_APP_BUILD_VERSION,
        error: "Week key mismatch.",
        expectedWeekKey: currentWeek.weekKey,
        receivedWeekKey: proof.weekKey,
      },
      {
        status: 409,
        headers: getCommunityBossNoStoreHeaders(),
      }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      buildVersion: BROKE_APP_BUILD_VERSION,
      mode: COMMUNITY_BOSS_SYNC_ENABLED ? "skeleton_enabled_no_writes" : "dry_run",
      syncEnabled: COMMUNITY_BOSS_SYNC_ENABLED,
      persisted: false,
      wouldWrite: false,
      writePathReady: readiness.canWrite,
      backendReadiness: readiness,
      week: currentWeek,
      proof,
      nextStep: "A later patch can connect this sanitized proof payload to Supabase only after migration review, manual apply, and explicit write-path implementation.",
      guardrails: [
        "Payload sanitized",
        "Numbers clamped",
        "Forbidden private fields rejected",
        "No database write performed",
        "No payout math",
        "No wallet value",
      ],
    },
    {
      status: 202,
      headers: getCommunityBossNoStoreHeaders(),
    }
  );
}
