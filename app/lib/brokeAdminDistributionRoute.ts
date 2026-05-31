import { NextRequest } from "next/server";
import crypto from "crypto";

import { cleanAdminString as cleanString, safeAdminNumber as safeNumber } from "./brokeAdminApi";
import {
  getTreasuryWalletAddress,
  isAdminDistributionAuthConfigured,
  isAdminDistributionRequestAuthorized,
} from "./brokeAdminAuthSupabase";
import {
  getAdminDistributionById,
  getAdminPayoutRows,
  markAdminPayoutRanksSent,
  updateAdminDistributionStatus,
  type AdminDistributionInsertRow,
  type AdminDistributionRow,
  type AdminPayoutInsertRow,
  type AdminPayoutRow,
} from "./brokeAdminDistributionStore";
import {
  normalizeAdminDistributionMode,
  normalizeAdminDistributionPayouts,
  normalizeAdminDistributionToken,
  type AdminDistributionManifestInput,
  type AdminDistributionMode,
  type AdminNormalizedPayout,
} from "./brokeAdminDistributionValidation";
import { serverAutoSendPreparedDistribution } from "./brokeAdminServerPayout";

export type AdminDistributionAccessError = {
  status: 401 | 500;
  payload: {
    ok: false;
    error: string;
  };
};

export type NormalizedAdminDistributionManifestRequest = {
  token: string;
  mode: AdminDistributionMode;
  poolAmount: number;
  payouts: AdminNormalizedPayout[];
  minHold: number;
  minStreak: number;
  treasuryWallet: string;
  connectedWallet: string;
  treasuryMatched: boolean;
};

export type AdminDistributionInsertBatch = NormalizedAdminDistributionManifestRequest & {
  id: string;
  createdAt: string;
  calculatedTotal: number;
  status: "draft" | "prepared";
  distributionRow: AdminDistributionInsertRow;
  payoutRows: AdminPayoutInsertRow[];
};

export function getAdminDistributionAccessError(request: NextRequest): AdminDistributionAccessError | null {
  if (!isAdminDistributionAuthConfigured()) {
    return {
      status: 500,
      payload: {
        ok: false,
        error: "Missing REWARDS_ADMIN_SECRET or configured admin Telegram IDs.",
      },
    };
  }

  if (!isAdminDistributionRequestAuthorized(request)) {
    return {
      status: 401,
      payload: {
        ok: false,
        error: "Unauthorized. Enter REWARDS_ADMIN_SECRET or open as a configured Telegram admin.",
      },
    };
  }

  return null;
}

export function getAdminDistributionListLimit(value: unknown) {
  const parsed = Number(value ?? 8);
  const safeLimit = Number.isFinite(parsed) ? parsed : 8;

  return Math.max(1, Math.min(30, Math.round(safeLimit)));
}

export function normalizeAdminDistributionManifestRequest(
  body: AdminDistributionManifestInput
): NormalizedAdminDistributionManifestRequest {
  const token = normalizeAdminDistributionToken(body.token);
  const mode = normalizeAdminDistributionMode(body.mode);
  const poolAmount = safeNumber(body.poolAmount);
  const payouts = normalizeAdminDistributionPayouts(body.payouts);
  const minHold = Math.max(0, safeNumber(body.rules?.minHold));
  const minStreak = Math.max(0, Math.round(safeNumber(body.rules?.minStreak)));
  const treasuryWallet = cleanString(body.treasuryWallet || getTreasuryWalletAddress(), 90);
  const connectedWallet = cleanString(body.connectedWallet, 90);
  const treasuryMatched = Boolean(
    treasuryWallet && connectedWallet && treasuryWallet.toLowerCase() === connectedWallet.toLowerCase()
  );

  return {
    token,
    mode,
    poolAmount,
    payouts,
    minHold,
    minStreak,
    treasuryWallet,
    connectedWallet,
    treasuryMatched,
  };
}

export function buildAdminDistributionInsertBatch(
  body: AdminDistributionManifestInput,
  normalized: NormalizedAdminDistributionManifestRequest
): AdminDistributionInsertBatch {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const calculatedTotal = Number(normalized.payouts.reduce((sum, row) => sum + row.rewardAmount, 0).toFixed(9));
  const status = normalized.mode === "real_manual" ? "prepared" : "draft";
  const distributionRow: AdminDistributionInsertRow = {
    id,
    created_at: createdAt,
    updated_at: createdAt,
    status,
    pool_token: normalized.token,
    pool_amount: normalized.poolAmount,
    calculated_total: calculatedTotal,
    treasury_wallet: normalized.treasuryWallet,
    min_hold: normalized.minHold,
    min_streak: normalized.minStreak,
    recipient_count: normalized.payouts.length,
    manifest_payload: {
      type:
        body.type ||
        (normalized.mode === "real_manual"
          ? "BROKE_REWARD_DISTRIBUTION_REAL_MANUAL_MANIFEST"
          : "BROKE_REWARD_DISTRIBUTION_TEST_MANIFEST"),
      mode: normalized.mode,
      generatedAt: body.generatedAt || createdAt,
      adminNote: cleanString(body.adminNote, 500),
      note:
        body.note ||
        (normalized.mode === "real_manual"
          ? "Real distribution prepared for manual treasury signing/sending. No token transfer was executed by the server."
          : "Manual test ledger only. No token transfer was executed."),
      treasury: {
        expectedWallet: normalized.treasuryWallet,
        connectedWallet: normalized.connectedWallet,
        matched: normalized.treasuryMatched,
      },
      safety: {
        noPrivateKey: true,
        noServerTokenTransfers: true,
        walletSigningNotExecutedByServer: true,
        readyForManualTreasurySend: normalized.mode === "real_manual",
      },
    },
  };

  const payoutRows: AdminPayoutInsertRow[] = normalized.payouts.map((row) => ({
    distribution_id: id,
    rank: row.rank,
    telegram_id: row.telegramId,
    username: row.username || null,
    display_name: row.displayName || null,
    wallet_address: row.walletAddress,
    verified_balance: row.verifiedBalance,
    balance_share_percent: row.balanceSharePercent,
    reward_amount: row.rewardAmount,
    reward_token: normalized.token,
    status: "pending_manual_send",
    created_at: createdAt,
    updated_at: createdAt,
  }));

  return {
    ...normalized,
    id,
    createdAt,
    calculatedTotal,
    status,
    distributionRow,
    payoutRows,
  };
}

export function summarizeAdminDistributionBatch(batch: AdminDistributionInsertBatch, status: string = batch.status) {
  return {
    id: batch.id,
    status,
    mode: batch.mode,
    poolToken: batch.token,
    poolAmount: batch.poolAmount,
    recipientCount: batch.payouts.length,
    calculatedTotal: batch.calculatedTotal,
    createdAt: batch.createdAt,
  };
}

export function getAdminManualSendCompletion(payouts: AdminPayoutRow[]) {
  const sentCount = payouts.filter((row) => row.status === "manual_sent" && row.tx_signature).length;
  const totalCount = payouts.length;
  const nextStatus: "prepared" | "manual_sent" = totalCount > 0 && sentCount >= totalCount ? "manual_sent" : "prepared";

  return { sentCount, totalCount, nextStatus };
}

export async function autoSendAdminPreparedDistribution(distributionId: string) {
  return serverAutoSendPreparedDistribution(distributionId, {
    getDistributionRows: async (id) => {
      const distribution = await getAdminDistributionById(id);
      return distribution ? [distribution as AdminDistributionRow] : [];
    },
    getPayoutRows: getAdminPayoutRows,
    markPayoutRowsSent: markAdminPayoutRanksSent,
    updateDistributionStatus: updateAdminDistributionStatus,
  });
}
