import { safeAdminNumber as safeNumber } from "./brokeAdminApi";
import { supabaseAdminFetch as supabaseFetch } from "./brokeAdminAuthSupabase";

export type AdminDistributionStatus = "draft" | "prepared" | "manual_sent" | "cancelled";

export type AdminDistributionRow = {
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

export type AdminPayoutRow = {
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

export type AdminDistributionInsertRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "prepared";
  pool_token: string;
  pool_amount: number;
  calculated_total: number;
  treasury_wallet: string;
  min_hold: number;
  min_streak: number;
  recipient_count: number;
  manifest_payload: unknown;
};

export type AdminPayoutInsertRow = {
  distribution_id: string;
  rank: number;
  telegram_id: string;
  username: string | null;
  display_name: string | null;
  wallet_address: string;
  verified_balance: number;
  balance_share_percent: number;
  reward_amount: number;
  reward_token: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AdminManualSendRecord = {
  rank?: number;
  walletAddress?: string;
  txSignature?: string;
};

export function formatAdminDistribution(row: AdminDistributionRow) {
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

export async function getAdminDistributionRows(limit = 10) {
  return supabaseFetch<AdminDistributionRow[]>(
    `broke_reward_distributions?select=*&order=created_at.desc&limit=${Math.max(1, Math.min(30, limit))}`
  );
}

export async function getAdminDistributionById(distributionId: string) {
  const rows = await supabaseFetch<AdminDistributionRow[]>(
    `broke_reward_distributions?select=*&id=eq.${encodeURIComponent(distributionId)}&limit=1`
  );

  return rows[0] || null;
}

export async function getAdminPayoutRows(distributionId: string) {
  return supabaseFetch<AdminPayoutRow[]>(
    `broke_reward_payouts?select=*&distribution_id=eq.${encodeURIComponent(distributionId)}&order=rank.asc`
  );
}

export async function insertAdminDistributionRow(row: AdminDistributionInsertRow) {
  await supabaseFetch("broke_reward_distributions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
}

export async function insertAdminPayoutRows(rows: AdminPayoutInsertRow[]) {
  await supabaseFetch("broke_reward_payouts", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
}

export async function updateAdminDistributionStatus(
  distributionId: string,
  status: "prepared" | "manual_sent" | "cancelled"
) {
  await supabaseFetch(`broke_reward_distributions?id=eq.${encodeURIComponent(distributionId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });
}

export async function cancelAdminPayoutRows(distributionId: string) {
  await supabaseFetch(`broke_reward_payouts?distribution_id=eq.${encodeURIComponent(distributionId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: "cancelled", updated_at: new Date().toISOString() }),
  });
}

export async function markAdminPayoutRanksSent(
  distributionId: string,
  records: Array<{ rank: number; txSignature: string }>
) {
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

export async function markAdminPayoutRanksFailed(distributionId: string, records: Array<{ rank: number }>) {
  const failedAt = new Date().toISOString();

  for (const record of records) {
    await supabaseFetch(`broke_reward_payouts?distribution_id=eq.${encodeURIComponent(distributionId)}&rank=eq.${record.rank}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "prepared",
        updated_at: failedAt,
      }),
    });
  }
}

export async function markAdminManualSendRecordsSent(distributionId: string, records: AdminManualSendRecord[]) {
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

  return updated;
}
