import { NextRequest } from "next/server";
import crypto from "crypto";
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
  normalizeAdminTxSignature as normalizeTxSignature,
  safeAdminNumber as safeNumber,
} from "../../../lib/brokeAdminApi";
import {
  getTreasuryWalletAddress,
  isAdminDistributionAuthConfigured,
  isBrokePayoutAutoSendEnabled,
  isAdminDistributionRequestAuthorized as isAuthorized,
  supabaseAdminFetch as supabaseFetch,
} from "../../../lib/brokeAdminAuthSupabase";
import { serverAutoSendPreparedDistribution } from "../../../lib/brokeAdminServerPayout";

export const runtime = "nodejs";

type PayoutInput = {
  rank?: number;
  telegramId?: string;
  username?: string;
  displayName?: string;
  walletAddress?: string;
  verifiedBalance?: number;
  balanceSharePercent?: number;
  rewardAmount?: number;
  token?: string;
};

type DistributionMode = "test" | "real_manual";

type DistributionManifestInput = {
  type?: string;
  mode?: DistributionMode;
  generatedAt?: string;
  token?: string;
  poolAmount?: number;
  eligibleHolders?: number;
  treasuryWallet?: string;
  connectedWallet?: string;
  confirmRealDistribution?: string;
  adminNote?: string;
  rules?: {
    minHold?: number;
    minStreak?: number;
  };
  note?: string;
  payouts?: PayoutInput[];
  serverAutoSend?: boolean;
  serverAutoConfirm?: string;
};

type ManualSendRecord = {
  rank?: number;
  walletAddress?: string;
  txSignature?: string;
};

type DistributionPatchInput = {
  action?: "record_manual_sends" | "cancel_distribution" | "server_auto_send";
  distributionId?: string;
  records?: ManualSendRecord[];
  signaturesText?: string;
  confirmPhrase?: string;
};

type DistributionRow = {
  id: string;
  status: string;
  pool_token: string;
  pool_amount: number | string;
  calculated_total: number | string;
  treasury_wallet?: string | null;
  min_hold: number | string;
  min_streak: number;
  recipient_count: number;
  created_at: string;
  updated_at: string;
  manifest_payload?: unknown;
};

type PayoutRow = {
  id: number;
  distribution_id: string;
  rank: number;
  wallet_address: string;
  reward_amount: number | string;
  reward_token: string;
  status: string;
  tx_signature?: string | null;
  sent_at?: string | null;
};

function normalizeToken(value: unknown) {
  const token = cleanString(value || "USDC", 24).toUpperCase();
  if (["USDC", "SOL", "$BROKE", "BROKE"].includes(token)) return token === "BROKE" ? "$BROKE" : token;
  return "USDC";
}

function normalizeMode(value: unknown): DistributionMode {
  return value === "real_manual" ? "real_manual" : "test";
}

function normalizePayouts(input: unknown) {
  const rows = Array.isArray(input) ? input : [];

  return rows
    .map((row, index) => {
      const item = row && typeof row === "object" ? (row as PayoutInput) : {};
      const walletAddress = cleanString(item.walletAddress, 90);
      const rewardAmount = safeNumber(item.rewardAmount);
      const balanceSharePercent = safeNumber(item.balanceSharePercent);
      const verifiedBalance = safeNumber(item.verifiedBalance);
      const telegramId = cleanString(item.telegramId, 40);

      if (!walletAddress || rewardAmount <= 0 || balanceSharePercent < 0 || !telegramId) return null;

      return {
        rank: Math.max(1, Math.round(safeNumber(item.rank, index + 1))),
        telegramId,
        username: cleanString(item.username, 80),
        displayName: cleanString(item.displayName, 120),
        walletAddress,
        verifiedBalance: Number(verifiedBalance.toFixed(6)),
        balanceSharePercent: Number(balanceSharePercent.toFixed(8)),
        rewardAmount: Number(rewardAmount.toFixed(9)),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .slice(0, 500);
}

function parseManualSendRecords(input: DistributionPatchInput) {
  const explicitRecords = Array.isArray(input.records) ? input.records : [];
  const parsedRecords = explicitRecords.map((record) => ({
    rank: record.rank && Number.isFinite(Number(record.rank)) ? Math.max(1, Math.round(Number(record.rank))) : undefined,
    walletAddress: cleanString(record.walletAddress, 90),
    txSignature: normalizeTxSignature(record.txSignature),
  }));

  const text = cleanString(input.signaturesText, 10000);
  const textRecords = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const normalized = line.replace(/^#/, "");
      const parts = normalized.includes(",")
        ? normalized.split(",")
        : normalized.includes("=")
          ? normalized.split("=")
          : normalized.split(/\s+/);
      const target = cleanString(parts[0], 100).replace(/^rank:/i, "");
      const txSignature = normalizeTxSignature(parts.slice(1).join(" ").trim());
      const rank = /^\d+$/.test(target) ? Number(target) : undefined;
      const walletAddress = rank ? "" : target;

      return { rank, walletAddress, txSignature };
    });

  return [...parsedRecords, ...textRecords]
    .filter((record) => record.txSignature && (record.rank || record.walletAddress))
    .slice(0, 500);
}

async function serverMarkPayoutRowsSent(distributionId: string, records: Array<{ rank: number; txSignature: string }>) {
  const sentAt = new Date().toISOString();

  for (const record of records) {
    await supabaseFetch(`broke_reward_payouts?distribution_id=eq.${encodeURIComponent(distributionId)}&rank=eq.${record.rank}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "manual_sent",
        tx_signature: record.txSignature,
        sent_at: sentAt,
        updated_at: sentAt,
      }),
    });
  }
}

async function getDistributionRows(limit = 10) {
  return supabaseFetch<DistributionRow[]>(
    `broke_reward_distributions?select=*&order=created_at.desc&limit=${Math.max(1, Math.min(30, limit))}`
  );
}

async function getPayoutRows(distributionId: string) {
  return supabaseFetch<PayoutRow[]>(
    `broke_reward_payouts?select=*&distribution_id=eq.${encodeURIComponent(distributionId)}&order=rank.asc`
  );
}

async function updateDistributionStatus(distributionId: string, status: "prepared" | "manual_sent" | "cancelled") {
  await supabaseFetch(`broke_reward_distributions?id=eq.${encodeURIComponent(distributionId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });
}

function formatDistribution(row: DistributionRow) {
  return {
    id: row.id,
    status: row.status,
    poolToken: row.pool_token,
    poolAmount: safeNumber(row.pool_amount),
    calculatedTotal: safeNumber(row.calculated_total),
    treasuryWallet: row.treasury_wallet || "",
    minHold: safeNumber(row.min_hold),
    minStreak: Number(row.min_streak || 0),
    recipientCount: Number(row.recipient_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    manifest: row.manifest_payload || {},
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminDistributionAuthConfigured()) {
    return json({ ok: false, error: "Missing REWARDS_ADMIN_SECRET or configured admin Telegram IDs." }, 500);
  }

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized. Enter REWARDS_ADMIN_SECRET or open as a configured Telegram admin." }, 401);
  }

  try {
    const distributionId = normalizeDistributionId(request.nextUrl.searchParams.get("distributionId"));
    const limit = Math.max(1, Math.min(30, Number(request.nextUrl.searchParams.get("limit") || 8)));

    if (distributionId) {
      const distributions = await supabaseFetch<DistributionRow[]>(
        `broke_reward_distributions?select=*&id=eq.${encodeURIComponent(distributionId)}&limit=1`
      );
      const payouts = await getPayoutRows(distributionId);

      return json({
        ok: true,
        distribution: distributions[0] ? formatDistribution(distributions[0]) : null,
        payouts,
      });
    }

    const distributions = await getDistributionRows(limit);

    return json({
      ok: true,
      distributions: distributions.map(formatDistribution),
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
  if (!isAdminDistributionAuthConfigured()) {
    return json({ ok: false, error: "Missing REWARDS_ADMIN_SECRET or configured admin Telegram IDs." }, 500);
  }

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized. Enter REWARDS_ADMIN_SECRET or open as a configured Telegram admin." }, 401);
  }

  try {
    const body = (await request.json()) as DistributionManifestInput;
    const token = normalizeToken(body.token);
    const mode = normalizeMode(body.mode);
    const poolAmount = safeNumber(body.poolAmount);
    const payouts = normalizePayouts(body.payouts);
    const minHold = Math.max(0, safeNumber(body.rules?.minHold));
    const minStreak = Math.max(0, Math.round(safeNumber(body.rules?.minStreak)));
    const treasuryWallet = cleanString(body.treasuryWallet || getTreasuryWalletAddress(), 90);
    const connectedWallet = cleanString(body.connectedWallet, 90);
    const treasuryMatched = Boolean(
      treasuryWallet && connectedWallet && treasuryWallet.toLowerCase() === connectedWallet.toLowerCase()
    );

    if (poolAmount <= 0) {
      return json({ ok: false, error: "Pool amount must be greater than zero." }, 400);
    }

    if (payouts.length === 0) {
      return json({ ok: false, error: "No payout recipients were provided." }, 400);
    }

    if (mode === "real_manual") {
      if (body.confirmRealDistribution !== REAL_DISTRIBUTION_CONFIRM_PHRASE) {
        return json({ ok: false, error: `Type ${REAL_DISTRIBUTION_CONFIRM_PHRASE} before preparing a real distribution.` }, 400);
      }

      const serverAutoSendEnabled = isBrokePayoutAutoSendEnabled();
      if (!treasuryMatched && !serverAutoSendEnabled) {
        return json({ ok: false, error: "Connect and verify the configured treasury wallet, or enable BROKE_PAYOUT_AUTO_SEND_ENABLED for dedicated payout wallet distribution." }, 400);
      }
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const calculatedTotal = Number(payouts.reduce((sum, row) => sum + row.rewardAmount, 0).toFixed(9));
    const status = mode === "real_manual" ? "prepared" : "draft";
    const distributionRow = {
      id,
      created_at: createdAt,
      updated_at: createdAt,
      status,
      pool_token: token,
      pool_amount: poolAmount,
      calculated_total: calculatedTotal,
      treasury_wallet: treasuryWallet,
      min_hold: minHold,
      min_streak: minStreak,
      recipient_count: payouts.length,
      manifest_payload: {
        type:
          body.type ||
          (mode === "real_manual"
            ? "BROKE_REWARD_DISTRIBUTION_REAL_MANUAL_MANIFEST"
            : "BROKE_REWARD_DISTRIBUTION_TEST_MANIFEST"),
        mode,
        generatedAt: body.generatedAt || createdAt,
        adminNote: cleanString(body.adminNote, 500),
        note:
          body.note ||
          (mode === "real_manual"
            ? "Real distribution prepared for manual treasury signing/sending. No token transfer was executed by the server."
            : "Manual test ledger only. No token transfer was executed."),
        treasury: {
          expectedWallet: treasuryWallet,
          connectedWallet,
          matched: treasuryMatched,
        },
        safety: {
          noPrivateKey: true,
          noServerTokenTransfers: true,
          walletSigningNotExecutedByServer: true,
          readyForManualTreasurySend: mode === "real_manual",
        },
      },
    };

    await supabaseFetch("broke_reward_distributions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(distributionRow),
    });

    const payoutRows = payouts.map((row) => ({
      distribution_id: id,
      rank: row.rank,
      telegram_id: row.telegramId,
      username: row.username || null,
      display_name: row.displayName || null,
      wallet_address: row.walletAddress,
      verified_balance: row.verifiedBalance,
      balance_share_percent: row.balanceSharePercent,
      reward_amount: row.rewardAmount,
      reward_token: token,
      status: "pending_manual_send",
      created_at: createdAt,
      updated_at: createdAt,
    }));

    await supabaseFetch("broke_reward_payouts", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payoutRows),
    });

    if (mode === "real_manual" && body.serverAutoSend) {
      if (cleanString(body.serverAutoConfirm, 80) !== SERVER_AUTO_SEND_CONFIRM_PHRASE) {
        return json({ ok: false, error: `Type ${SERVER_AUTO_SEND_CONFIRM_PHRASE} before server auto-send.` }, 400);
      }

      const autoSend = await autoSendPreparedDistribution(id);

      return json({
        ok: true,
        distribution: {
          id,
          status: autoSend.status,
          mode,
          poolToken: token,
          poolAmount,
          recipientCount: payouts.length,
          calculatedTotal,
          createdAt,
        },
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
      distribution: {
        id,
        status,
        mode,
        poolToken: token,
        poolAmount,
        recipientCount: payouts.length,
        calculatedTotal,
        createdAt,
      },
      safety: {
        noPrivateKey: true,
        noServerTokenTransfers: true,
        walletSigningNotExecutedByServer: true,
        readyForManualTreasurySend: mode === "real_manual",
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

async function autoSendPreparedDistribution(distributionId: string) {
  return serverAutoSendPreparedDistribution(distributionId, {
    getDistributionRows: async (id) =>
      supabaseFetch<DistributionRow[]>(`broke_reward_distributions?select=*&id=eq.${encodeURIComponent(id)}&limit=1`),
    getPayoutRows,
    markPayoutRowsSent: serverMarkPayoutRowsSent,
    updateDistributionStatus,
  });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminDistributionAuthConfigured()) {
    return json({ ok: false, error: "Missing REWARDS_ADMIN_SECRET or configured admin Telegram IDs." }, 500);
  }

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized. Enter REWARDS_ADMIN_SECRET or open as a configured Telegram admin." }, 401);
  }

  try {
    const body = (await request.json()) as DistributionPatchInput;
    const distributionId = normalizeDistributionId(body.distributionId);

    if (!distributionId) {
      return json({ ok: false, error: "Valid distributionId is required." }, 400);
    }

    if (body.action === "cancel_distribution") {
      await updateDistributionStatus(distributionId, "cancelled");

      await supabaseFetch(`broke_reward_payouts?distribution_id=eq.${encodeURIComponent(distributionId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "cancelled", updated_at: new Date().toISOString() }),
      });

      return json({ ok: true, distributionId, status: "cancelled" });
    }

    if (body.action === "server_auto_send") {
      if (cleanString(body.confirmPhrase, 80) !== SERVER_AUTO_SEND_CONFIRM_PHRASE) {
        return json({ ok: false, error: `Type ${SERVER_AUTO_SEND_CONFIRM_PHRASE} to unlock server auto-send.` }, 400);
      }

      const autoSend = await autoSendPreparedDistribution(distributionId);

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

    const sentAt = new Date().toISOString();
    let updated = 0;

    for (const record of records) {
      const filter = record.rank
        ? `distribution_id=eq.${encodeURIComponent(distributionId)}&rank=eq.${record.rank}`
        : `distribution_id=eq.${encodeURIComponent(distributionId)}&wallet_address=eq.${encodeURIComponent(record.walletAddress || "")}`;

      if (!record.txSignature) continue;

      await supabaseFetch(`broke_reward_payouts?${filter}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "manual_sent",
          tx_signature: record.txSignature,
          sent_at: sentAt,
          updated_at: sentAt,
        }),
      });
      updated += 1;
    }

    const payouts = await getPayoutRows(distributionId);
    const sentCount = payouts.filter((row) => row.status === "manual_sent" && row.tx_signature).length;
    const totalCount = payouts.length;
    const nextStatus = totalCount > 0 && sentCount >= totalCount ? "manual_sent" : "prepared";

    await updateDistributionStatus(distributionId, nextStatus);

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
