export const BROKE_APP_BUILD_VERSION = "v59.51.9";

export const BROKE_APP_BUILD_NOTE =
  "Bottom Nav Label Removal + Bigger Icon Fill";

export const DEFAULT_TREASURY_WALLET_ADDRESS = "5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9";
export const DEFAULT_BROKE_TOKEN_MINT_ADDRESS = "9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray";
export const DEFAULT_USDC_TOKEN_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const REAL_DISTRIBUTION_CONFIRM_PHRASE = "PREPARE REAL DISTRIBUTION";
export const SERVER_AUTO_SEND_CONFIRM_PHRASE = "SERVER AUTO SEND";

export type AdminDistributionMode = "test" | "real_manual";

export type AdminDistributionHolder = {
  rank: number;
  telegramId?: string;
  username?: string;
  displayName?: string;
  walletAddress: string;
  verifiedBalance?: number;
  activeStreakDays?: number;
  balanceSharePercent: number;
  todayProtected?: boolean;
  verifiedAt?: string | null;
  lastCheckedAt?: string | null;
};

export type AdminDistributionPayoutRow = AdminDistributionHolder & {
  rewardAmount: number;
};

export function parseAdminCsv(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function walletAddressEquals(a: string, b: string) {
  return a.trim() !== "" && b.trim() !== "" && a.trim() === b.trim();
}

export function calculateAdminPayoutRows<T extends AdminDistributionHolder>(
  holders: T[],
  rewardPoolValue: number
): Array<T & { rewardAmount: number }> {
  if (!Number.isFinite(rewardPoolValue) || rewardPoolValue <= 0) return [];

  return holders.map((holder) => ({
    ...holder,
    rewardAmount: Number(((rewardPoolValue * holder.balanceSharePercent) / 100).toFixed(6)),
  }));
}

export function getAdminRewardTokenMint(
  token: string,
  brokeMint = DEFAULT_BROKE_TOKEN_MINT_ADDRESS,
  usdcMint = DEFAULT_USDC_TOKEN_MINT_ADDRESS
) {
  const normalized = token.toUpperCase();
  if (normalized === "$BROKE" || normalized === "BROKE") return brokeMint;
  if (normalized === "USDC") return usdcMint;
  return "";
}

export function buildAdminPayoutPaymentLink({
  row,
  rewardPoolToken,
  distributionId,
  brokeMint = DEFAULT_BROKE_TOKEN_MINT_ADDRESS,
  usdcMint = DEFAULT_USDC_TOKEN_MINT_ADDRESS,
}: {
  row: Pick<AdminDistributionPayoutRow, "walletAddress" | "rewardAmount" | "rank">;
  rewardPoolToken: string;
  distributionId?: string | null;
  brokeMint?: string;
  usdcMint?: string;
}) {
  const params = new URLSearchParams();
  params.set("amount", String(row.rewardAmount));
  params.set("label", "Smoke Is Broke Rewards");
  params.set(
    "message",
    distributionId ? `BROKE reward distribution ${distributionId.slice(0, 8)}` : "BROKE reward distribution"
  );
  params.set("memo", `BROKE reward rank ${row.rank}`);

  const mint = getAdminRewardTokenMint(rewardPoolToken, brokeMint, usdcMint);
  if (mint) params.set("spl-token", mint);

  return `solana:${row.walletAddress}?${params.toString()}`;
}

export function buildAdminPayoutPaymentLinksCsv({
  rows,
  rewardPoolToken,
  distributionId,
}: {
  rows: AdminDistributionPayoutRow[];
  rewardPoolToken: string;
  distributionId?: string | null;
}) {
  const header = "rank,wallet,amount,token,share_percent,payment_link";
  const csvRows = rows.map((row) => [
    row.rank,
    row.walletAddress,
    row.rewardAmount,
    rewardPoolToken,
    row.balanceSharePercent,
    buildAdminPayoutPaymentLink({ row, rewardPoolToken, distributionId }),
  ].join(","));

  return [header, ...csvRows].join("\n");
}

export function buildAdminDistributionManifest({
  mode,
  rows,
  poolValue,
  rewardPoolToken,
  treasuryWallet,
  connectedWallet,
  confirmRealDistribution,
  minHold,
  minStreak,
}: {
  mode: AdminDistributionMode;
  rows: AdminDistributionPayoutRow[];
  poolValue: number;
  rewardPoolToken: string;
  treasuryWallet: string;
  connectedWallet: string;
  confirmRealDistribution: string;
  minHold: number;
  minStreak: number;
}) {
  return {
    type: mode === "real_manual" ? "BROKE_REWARD_DISTRIBUTION_REAL_MANUAL_MANIFEST" : "BROKE_REWARD_DISTRIBUTION_TEST_MANIFEST",
    mode,
    generatedAt: new Date().toISOString(),
    token: rewardPoolToken,
    poolAmount: poolValue,
    eligibleHolders: rows.length,
    treasuryWallet: treasuryWallet || "not_configured",
    connectedWallet: connectedWallet || "not_connected",
    confirmRealDistribution: mode === "real_manual" ? confirmRealDistribution : "",
    rules: {
      minHold,
      minStreak,
    },
    note:
      mode === "real_manual"
        ? "Real distribution batch prepared for the dedicated payout wallet sender."
        : "Manual test ledger only. No token transfer, claim, staking, wallet signing, or treasury spend was executed.",
    payouts: rows.map((row) => ({
      rank: row.rank,
      telegramId: row.telegramId,
      username: row.username,
      displayName: row.displayName,
      walletAddress: row.walletAddress,
      verifiedBalance: row.verifiedBalance,
      balanceSharePercent: row.balanceSharePercent,
      rewardAmount: row.rewardAmount,
      token: rewardPoolToken,
    })),
  };
}

export function buildAdminDistributionSendSheet(rows: AdminDistributionPayoutRow[], rewardPoolToken: string) {
  const header = "rank,wallet,amount,token,share_percent";
  const csvRows = rows.map((row) => [
    row.rank,
    row.walletAddress,
    row.rewardAmount,
    rewardPoolToken,
    row.balanceSharePercent,
  ].join(","));

  return [header, ...csvRows].join("\n");
}
