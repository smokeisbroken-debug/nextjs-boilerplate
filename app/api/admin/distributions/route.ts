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
  getAdminDistributionById,
  getAdminDistributionRows,
  getAdminPayoutRows,
  insertAdminDistributionRow,
  insertAdminPayoutRows,
  markAdminManualSendRecordsSent,
  updateAdminDistributionStatus,
} from "../../../lib/brokeAdminDistributionStore";
import {
  normalizeAdminDistributionPatchAction,
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
import {
  buildAdminDistributionGetPayload,
  buildAdminDistributionListPayload,
  getAdminDistributionEmptyPayoutsError,
  getAdminDistributionIdQuery,
  getAdminDistributionNotFoundError,
  getAdminDistributionPatchActionError,
  readAdminDistributionJsonBody,
} from "../../../lib/brokeAdminDistributionResponses";
import { getAdminDistributionRouteSmokeReport } from "../../../lib/brokeAdminDistributionSmoke";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const accessError = getAdminDistributionAccessError(request);
  if (accessError) return json(accessError.payload, accessError.status);

  try {
    if (request.nextUrl.searchParams.get("smoke") === "1") {
      return json({
        ok: true,
        smoke: getAdminDistributionRouteSmokeReport(),
      });
    }

    const distributionIdResult = getAdminDistributionIdQuery(request);
    if (!distributionIdResult.ok) return json(distributionIdResult.payload, distributionIdResult.status);

    const distributionId = distributionIdResult.distributionId;
    const limit = getAdminDistributionListLimit(request.nextUrl.searchParams.get("limit"));

    if (distributionId) {
      const distribution = await getAdminDistributionById(distributionId);
      const payouts = distribution ? await getAdminPayoutRows(distributionId) : [];

      return json(buildAdminDistributionGetPayload({ distributionId, distribution, payouts }));
    }

    const distributions = await getAdminDistributionRows(limit);

    return json(buildAdminDistributionListPayload({ distributions, limit }));
  } catch (error) {
    return json(
      {
        ok: false,
        error: formatAdminRewardDistributionError(error, "Could not load distributions."),
        code: "distribution_get_failed",
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  const accessError = getAdminDistributionAccessError(request);
  if (accessError) return json(accessError.payload, accessError.status);

  try {
    const jsonBody = await readAdminDistributionJsonBody<DistributionManifestInput>(
      request,
      "Invalid distribution manifest JSON body."
    );
    if (!jsonBody.ok) return json(jsonBody.payload, jsonBody.status);

    const body = jsonBody.body;
    const normalized = normalizeAdminDistributionManifestRequest(body);

    if (normalized.poolAmount <= 0) {
      return json({ ok: false, error: "Pool amount must be greater than zero.", code: "invalid_pool_amount" }, 400);
    }

    if (normalized.payouts.length === 0) {
      return json({ ok: false, error: "No payout recipients were provided.", code: "empty_payout_recipients" }, 400);
    }

    if (normalized.mode === "real_manual") {
      if (body.confirmRealDistribution !== REAL_DISTRIBUTION_CONFIRM_PHRASE) {
        return json({ ok: false, error: `Type ${REAL_DISTRIBUTION_CONFIRM_PHRASE} before preparing a real distribution.`, code: "missing_real_distribution_confirm_phrase" }, 400);
      }

      const serverAutoSendEnabled = isBrokePayoutAutoSendEnabled();
      if (!normalized.treasuryMatched && !serverAutoSendEnabled) {
        return json({ ok: false, error: "Connect and verify the configured treasury wallet, or enable BROKE_PAYOUT_AUTO_SEND_ENABLED for dedicated payout wallet distribution.", code: "treasury_wallet_not_verified" }, 400);
      }
    }

    const batch = buildAdminDistributionInsertBatch(body, normalized);

    await insertAdminDistributionRow(batch.distributionRow);
    await insertAdminPayoutRows(batch.payoutRows);

    if (batch.mode === "real_manual" && body.serverAutoSend) {
      if (cleanString(body.serverAutoConfirm, 80) !== SERVER_AUTO_SEND_CONFIRM_PHRASE) {
        return json({ ok: false, error: `Type ${SERVER_AUTO_SEND_CONFIRM_PHRASE} before server auto-send.`, code: "missing_server_auto_send_confirm_phrase" }, 400);
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
        code: "distribution_post_failed",
      },
      500
    );
  }
}

export async function PATCH(request: NextRequest) {
  const accessError = getAdminDistributionAccessError(request);
  if (accessError) return json(accessError.payload, accessError.status);

  try {
    const jsonBody = await readAdminDistributionJsonBody<DistributionPatchInput>(
      request,
      "Invalid distribution patch JSON body."
    );
    if (!jsonBody.ok) return json(jsonBody.payload, jsonBody.status);

    const body = jsonBody.body;
    const distributionId = normalizeDistributionId(body.distributionId);

    if (!distributionId) {
      return json({ ok: false, error: "Valid distributionId is required.", code: "invalid_distribution_id" }, 400);
    }

    const action = normalizeAdminDistributionPatchAction(body.action);
    if (!action) {
      const actionError = getAdminDistributionPatchActionError(body.action);
      return json(actionError.payload, actionError.status);
    }

    const distribution = await getAdminDistributionById(distributionId);
    if (!distribution) {
      const notFound = getAdminDistributionNotFoundError(distributionId);
      return json(notFound.payload, notFound.status);
    }

    if (action === "cancel_distribution") {
      await updateAdminDistributionStatus(distributionId, "cancelled");
      await cancelAdminPayoutRows(distributionId);

      return json({ ok: true, action, distributionId, status: "cancelled" });
    }

    const existingPayouts = await getAdminPayoutRows(distributionId);
    if (existingPayouts.length === 0) {
      const emptyPayouts = getAdminDistributionEmptyPayoutsError(distributionId);
      return json(emptyPayouts.payload, emptyPayouts.status);
    }

    if (action === "server_auto_send") {
      if (cleanString(body.confirmPhrase, 80) !== SERVER_AUTO_SEND_CONFIRM_PHRASE) {
        return json({ ok: false, error: `Type ${SERVER_AUTO_SEND_CONFIRM_PHRASE} to unlock server auto-send.`, code: "missing_server_auto_send_confirm_phrase" }, 400);
      }

      const autoSend = await autoSendAdminPreparedDistribution(distributionId);

      return json({
        ok: true,
        action,
        distributionId,
        updated: autoSend.updated,
        sentCount: autoSend.sentCount,
        totalCount: autoSend.totalCount,
        status: autoSend.status,
        payoutWallet: autoSend.payoutWallet,
        records: autoSend.records,
      });
    }

    const records = parseManualSendRecords(body);

    if (records.length === 0) {
      return json({ ok: false, error: "Paste at least one rank/signature or wallet/signature row.", code: "empty_manual_send_records" }, 400);
    }

    const updated = await markAdminManualSendRecordsSent(distributionId, records);
    const payouts = await getAdminPayoutRows(distributionId);
    const { sentCount, totalCount, nextStatus } = getAdminManualSendCompletion(payouts);

    await updateAdminDistributionStatus(distributionId, nextStatus);

    return json({
      ok: true,
      action,
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
        code: "distribution_patch_failed",
      },
      500
    );
  }
}
