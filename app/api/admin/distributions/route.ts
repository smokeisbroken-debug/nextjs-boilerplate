import { NextRequest } from "next/server";
import {
  REAL_DISTRIBUTION_CONFIRM_PHRASE,
  SERVER_AUTO_SEND_CONFIRM_PHRASE,
} from "../../../lib/brokeAdminRewards";
import {
  adminApiJson as json,
  cleanAdminString as cleanString,
  formatAdminError,
  formatAdminRewardDistributionError,
  normalizeAdminDistributionId as normalizeDistributionId,
} from "../../../lib/brokeAdminApi";
import { isBrokePayoutAutoSendEnabled } from "../../../lib/brokeAdminAuthSupabase";
import {
  cancelAdminPayoutRows,
  formatAdminDistribution,
  getAdminDistributionById,
  getAdminDistributionRows,
  getAdminPayoutRows,
  insertAdminDistributionRow,
  insertAdminPayoutRows,
  markAdminManualSendRecordsSent,
  updateAdminDistributionStatus,
} from "../../../lib/brokeAdminDistributionStore";
import {
  parseAdminManualSendRecords as parseManualSendRecords,
  type AdminDistributionManifestInput as DistributionManifestInput,
  type AdminDistributionPatchInput as DistributionPatchInput,
} from "../../../lib/brokeAdminDistributionValidation";
import {
  autoSendAdminPreparedDistribution,
  buildAdminDistributionInsertBatch,
  getAdminDistributionAccessError,
  getAdminDistributionListLimit,
  getAdminManualSendCompletion,
  normalizeAdminDistributionManifestRequest,
  summarizeAdminDistributionBatch,
} from "../../../lib/brokeAdminDistributionRoute";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const accessError = getAdminDistributionAccessError(request);
  if (accessError) return json(accessError.payload, accessError.status);

  try {
    const distributionId = normalizeDistributionId(request.nextUrl.searchParams.get("distributionId"));
    const limit = getAdminDistributionListLimit(request.nextUrl.searchParams.get("limit"));

    if (distributionId) {
      const distribution = await getAdminDistributionById(distributionId);
      const payouts = await getAdminPayoutRows(distributionId);

      return json({
        ok: true,
        distribution: distribution ? formatAdminDistribution(distribution) : null,
        payouts,
      });
    }

    const distributions = await getAdminDistributionRows(limit);

    return json({
      ok: true,
      distributions: distributions.map(formatAdminDistribution),
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: formatAdminRewardDistributionError(error, "Could not load distributions."),
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  const accessError = getAdminDistributionAccessError(request);
  if (accessError) return json(accessError.payload, accessError.status);

  try {
    const body = (await request.json()) as DistributionManifestInput;
    const normalized = normalizeAdminDistributionManifestRequest(body);

    if (normalized.poolAmount <= 0) {
      return json({ ok: false, error: "Pool amount must be greater than zero." }, 400);
    }

    if (normalized.payouts.length === 0) {
      return json({ ok: false, error: "No payout recipients were provided." }, 400);
    }

    if (normalized.mode === "real_manual") {
      if (body.confirmRealDistribution !== REAL_DISTRIBUTION_CONFIRM_PHRASE) {
        return json({ ok: false, error: `Type ${REAL_DISTRIBUTION_CONFIRM_PHRASE} before preparing a real distribution.` }, 400);
      }

      const serverAutoSendEnabled = isBrokePayoutAutoSendEnabled();
      if (!normalized.treasuryMatched && !serverAutoSendEnabled) {
        return json({ ok: false, error: "Connect and verify the configured treasury wallet, or enable BROKE_PAYOUT_AUTO_SEND_ENABLED for dedicated payout wallet distribution." }, 400);
      }
    }

    const batch = buildAdminDistributionInsertBatch(body, normalized);

    await insertAdminDistributionRow(batch.distributionRow);
    await insertAdminPayoutRows(batch.payoutRows);

    if (batch.mode === "real_manual" && body.serverAutoSend) {
      if (cleanString(body.serverAutoConfirm, 80) !== SERVER_AUTO_SEND_CONFIRM_PHRASE) {
        return json({ ok: false, error: `Type ${SERVER_AUTO_SEND_CONFIRM_PHRASE} before server auto-send.` }, 400);
      }

      const autoSend = await autoSendAdminPreparedDistribution(batch.id);

      return json({
        ok: true,
        distribution: summarizeAdminDistributionBatch(batch, autoSend.status),
        autoSend,
        updated: autoSend.updated,
        sentCount: autoSend.sentCount,
        totalCount: autoSend.totalCount,
        status: autoSend.status,
        payoutWallet: autoSend.payoutWallet,
        records: autoSend.records,
        safety: {
          noPrivateKey: false,
          noServerTokenTransfers: false,
          dedicatedPayoutWalletOnly: true,
          mainTreasuryKeyNotUsed: true,
        },
      });
    }

    return json({
      ok: true,
      distribution: summarizeAdminDistributionBatch(batch),
      safety: {
        noPrivateKey: true,
        noServerTokenTransfers: true,
        walletSigningNotExecutedByServer: true,
        readyForManualTreasurySend: batch.mode === "real_manual",
      },
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: formatAdminRewardDistributionError(error, "Could not save distribution batch."),
      },
      500
    );
  }
}

export async function PATCH(request: NextRequest) {
  const accessError = getAdminDistributionAccessError(request);
  if (accessError) return json(accessError.payload, accessError.status);

  try {
    const body = (await request.json()) as DistributionPatchInput;
    const distributionId = normalizeDistributionId(body.distributionId);

    if (!distributionId) {
      return json({ ok: false, error: "Valid distributionId is required." }, 400);
    }

    if (body.action === "cancel_distribution") {
      await updateAdminDistributionStatus(distributionId, "cancelled");
      await cancelAdminPayoutRows(distributionId);

      return json({ ok: true, distributionId, status: "cancelled" });
    }

    if (body.action === "server_auto_send") {
      if (cleanString(body.confirmPhrase, 80) !== SERVER_AUTO_SEND_CONFIRM_PHRASE) {
        return json({ ok: false, error: `Type ${SERVER_AUTO_SEND_CONFIRM_PHRASE} to unlock server auto-send.` }, 400);
      }

      const autoSend = await autoSendAdminPreparedDistribution(distributionId);

      return json({
        ok: true,
        distributionId,
        updated: autoSend.updated,
        sentCount: autoSend.sentCount,
        totalCount: autoSend.totalCount,
        status: autoSend.status,
        payoutWallet: autoSend.payoutWallet,
        records: autoSend.records,
      });
    }

    if (body.action !== "record_manual_sends") {
      return json({ ok: false, error: "Unsupported distribution action." }, 400);
    }

    const records = parseManualSendRecords(body);

    if (records.length === 0) {
      return json({ ok: false, error: "Paste at least one rank/signature or wallet/signature row." }, 400);
    }

    const updated = await markAdminManualSendRecordsSent(distributionId, records);
    const payouts = await getAdminPayoutRows(distributionId);
    const { sentCount, totalCount, nextStatus } = getAdminManualSendCompletion(payouts);

    await updateAdminDistributionStatus(distributionId, nextStatus);

    return json({
      ok: true,
      distributionId,
      updated,
      sentCount,
      totalCount,
      status: nextStatus,
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: formatAdminError(error, "Could not update distribution manual send status."),
      },
      500
    );
  }
}
