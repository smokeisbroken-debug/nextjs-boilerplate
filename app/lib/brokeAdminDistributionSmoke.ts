import { DEFAULT_TREASURY_WALLET_ADDRESS } from "./brokeAdminRewards";
import {
  buildAdminDistributionInsertBatch,
  getAdminDistributionListLimit,
  getAdminManualSendCompletion,
  normalizeAdminDistributionManifestRequest,
  summarizeAdminDistributionBatch,
} from "./brokeAdminDistributionRoute";
import { buildAdminDistributionGetPayload, buildAdminDistributionListPayload } from "./brokeAdminDistributionResponses";
import { normalizeAdminDistributionPatchAction, parseAdminManualSendRecords, type AdminDistributionManifestInput } from "./brokeAdminDistributionValidation";
import { type AdminPayoutRow } from "./brokeAdminDistributionStore";

export type AdminDistributionSmokeCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

export type AdminDistributionSmokeReport = {
  ok: boolean;
  total: number;
  passed: number;
  failed: number;
  checks: AdminDistributionSmokeCheck[];
};

function smokeCheck(name: string, ok: boolean, detail: string): AdminDistributionSmokeCheck {
  return { name, ok, detail };
}

export function getAdminDistributionRouteSmokeReport(): AdminDistributionSmokeReport {
  const smokeDistributionId = "11111111-1111-4111-8111-111111111111";
  const txSignatureA = "5".repeat(88);
  const txSignatureB = "6".repeat(88);
  const sampleWalletA = DEFAULT_TREASURY_WALLET_ADDRESS;
  const sampleWalletB = "7vJQkF6jH6VvU6nprXBiY1xkZgXj2eJxK1qPq8yB9sQ2";
  const sampleBody: AdminDistributionManifestInput = {
    type: "BROKE_REWARD_DISTRIBUTION_REAL_MANUAL_MANIFEST",
    mode: "real_manual",
    token: "BROKE",
    poolAmount: 10,
    generatedAt: "2026-05-31T00:00:00.000Z",
    treasuryWallet: DEFAULT_TREASURY_WALLET_ADDRESS,
    connectedWallet: DEFAULT_TREASURY_WALLET_ADDRESS,
    rules: {
      minHold: 250000,
      minStreak: 7,
    },
    payouts: [
      {
        rank: 1,
        telegramId: "1001",
        username: "holder_one",
        displayName: "Holder One",
        walletAddress: sampleWalletA,
        verifiedBalance: 1000000,
        balanceSharePercent: 70,
        rewardAmount: 7,
      },
      {
        rank: 2,
        telegramId: "1002",
        username: "holder_two",
        displayName: "Holder Two",
        walletAddress: sampleWalletB,
        verifiedBalance: 428571.42,
        balanceSharePercent: 30,
        rewardAmount: 3,
      },
    ],
  };

  const normalized = normalizeAdminDistributionManifestRequest(sampleBody);
  const batch = buildAdminDistributionInsertBatch(sampleBody, normalized);
  const summary = summarizeAdminDistributionBatch(batch);
  const manualRecords = parseAdminManualSendRecords({
    action: "record_manual_sends",
    distributionId: smokeDistributionId,
    signaturesText: `1 ${txSignatureA}\n${sampleWalletB},${txSignatureB}`,
  });
  const completionRows: AdminPayoutRow[] = [
    {
      id: 1,
      distribution_id: smokeDistributionId,
      rank: 1,
      wallet_address: sampleWalletA,
      reward_amount: 7,
      reward_token: "$BROKE",
      status: "manual_sent",
      tx_signature: txSignatureA,
      sent_at: "2026-05-31T00:01:00.000Z",
    },
    {
      id: 2,
      distribution_id: smokeDistributionId,
      rank: 2,
      wallet_address: sampleWalletB,
      reward_amount: 3,
      reward_token: "$BROKE",
      status: "pending_manual_send",
      tx_signature: null,
      sent_at: null,
    },
  ];
  const completion = getAdminManualSendCompletion(completionRows);
  const listPayload = buildAdminDistributionListPayload({ distributions: [], limit: getAdminDistributionListLimit("abc") });
  const missingGetPayload = buildAdminDistributionGetPayload({
    distributionId: smokeDistributionId,
    distribution: null,
    payouts: completionRows,
  });

  const checks = [
    smokeCheck(
      "list-limit-default",
      getAdminDistributionListLimit(undefined) === 8,
      "Default GET list limit should remain 8."
    ),
    smokeCheck(
      "list-limit-clamp-low",
      getAdminDistributionListLimit("0") === 1,
      "GET list limit should clamp to at least 1."
    ),
    smokeCheck(
      "list-limit-clamp-high",
      getAdminDistributionListLimit("999") === 30,
      "GET list limit should clamp to at most 30."
    ),
    smokeCheck(
      "list-limit-invalid-fallback",
      getAdminDistributionListLimit("abc") === 8,
      "Invalid GET list limit should fall back to 8 instead of NaN."
    ),
    smokeCheck(
      "list-response-shape",
      listPayload.ok === true && listPayload.count === 0 && listPayload.limit === 8 && Array.isArray(listPayload.distributions),
      "GET list payload should include ok/count/limit/distributions."
    ),
    smokeCheck(
      "missing-distribution-response-shape",
      missingGetPayload.ok === true && missingGetPayload.found === false && missingGetPayload.payouts.length === 0,
      "Missing GET distribution payload should return found=false and empty payouts."
    ),
    smokeCheck(
      "patch-action-normalization",
      normalizeAdminDistributionPatchAction("cancel_distribution") === "cancel_distribution" && normalizeAdminDistributionPatchAction("bad") === "",
      "PATCH action normalization should accept known actions and reject unsupported actions."
    ),
    smokeCheck(
      "manifest-token-normalization",
      normalized.token === "$BROKE",
      "BROKE token input should normalize to $BROKE."
    ),
    smokeCheck(
      "manifest-mode-normalization",
      normalized.mode === "real_manual",
      "real_manual mode should be preserved."
    ),
    smokeCheck(
      "manifest-treasury-match",
      normalized.treasuryMatched,
      "Connected wallet should match expected treasury wallet in the smoke fixture."
    ),
    smokeCheck(
      "manifest-payout-normalization",
      normalized.payouts.length === 2 && normalized.payouts[0]?.rewardAmount === 7,
      "Two valid payout rows should survive normalization."
    ),
    smokeCheck(
      "insert-batch-status",
      batch.status === "prepared" && batch.distributionRow.status === "prepared",
      "Real manual batches should be prepared, not draft."
    ),
    smokeCheck(
      "insert-batch-recipient-count",
      batch.distributionRow.recipient_count === 2 && batch.payoutRows.length === 2,
      "Distribution insert row and payout insert rows should agree on recipient count."
    ),
    smokeCheck(
      "insert-batch-total",
      batch.calculatedTotal === 10,
      "Calculated payout total should match the fixture total."
    ),
    smokeCheck(
      "summary-shape",
      summary.recipientCount === 2 && summary.calculatedTotal === 10 && summary.status === "prepared",
      "Distribution summary should keep expected recipient count, total, and status."
    ),
    smokeCheck(
      "manual-record-parsing",
      manualRecords.length === 2 && manualRecords[0]?.rank === 1 && manualRecords[1]?.walletAddress === sampleWalletB,
      "Manual send parser should support rank/signature and wallet/signature rows."
    ),
    smokeCheck(
      "manual-completion-status",
      completion.sentCount === 1 && completion.totalCount === 2 && completion.nextStatus === "prepared",
      "Partial manual sends should keep the distribution in prepared status."
    ),
  ];

  const passed = checks.filter((check) => check.ok).length;

  return {
    ok: passed === checks.length,
    total: checks.length,
    passed,
    failed: checks.length - passed,
    checks,
  };
}
