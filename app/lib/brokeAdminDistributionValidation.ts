import {
  cleanAdminString as cleanString,
  normalizeAdminTxSignature as normalizeTxSignature,
  safeAdminNumber as safeNumber,
} from "./brokeAdminApi";

export type AdminPayoutInput = {
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

export type AdminDistributionMode = "test" | "real_manual";

export type AdminDistributionManifestInput = {
  type?: string;
  mode?: AdminDistributionMode;
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
  payouts?: AdminPayoutInput[];
  serverAutoSend?: boolean;
  serverAutoConfirm?: string;
};

export type AdminManualSendRecordInput = {
  rank?: number;
  walletAddress?: string;
  txSignature?: string;
};

export type AdminDistributionPatchAction = "record_manual_sends" | "cancel_distribution" | "server_auto_send";

export type AdminDistributionPatchInput = {
  action?: AdminDistributionPatchAction;
  distributionId?: string;
  records?: AdminManualSendRecordInput[];
  signaturesText?: string;
  confirmPhrase?: string;
};

export type AdminNormalizedPayout = {
  rank: number;
  telegramId: string;
  username: string;
  displayName: string;
  walletAddress: string;
  verifiedBalance: number;
  balanceSharePercent: number;
  rewardAmount: number;
};

export type AdminManualSendRecord = {
  rank?: number;
  walletAddress: string;
  txSignature: string;
};

export function normalizeAdminDistributionToken(value: unknown) {
  const token = cleanString(value || "USDC", 24).toUpperCase();
  if (["USDC", "SOL", "$BROKE", "BROKE"].includes(token)) return token === "BROKE" ? "$BROKE" : token;
  return "USDC";
}

export function normalizeAdminDistributionMode(value: unknown): AdminDistributionMode {
  return value === "real_manual" ? "real_manual" : "test";
}

export function normalizeAdminDistributionPayouts(input: unknown) {
  const rows = Array.isArray(input) ? input : [];

  return rows
    .map((row, index) => {
      const item = row && typeof row === "object" ? (row as AdminPayoutInput) : {};
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

export function normalizeAdminDistributionPatchAction(value: unknown): AdminDistributionPatchAction | "" {
  if (value === "record_manual_sends" || value === "cancel_distribution" || value === "server_auto_send") {
    return value;
  }

  return "";
}

export function parseAdminManualSendRecords(input: AdminDistributionPatchInput) {
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
