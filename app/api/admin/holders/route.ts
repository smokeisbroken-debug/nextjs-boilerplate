import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

type SolanaRpcResponse<T> = {
  result?: T;
  error?: {
    code?: number;
    message?: string;
  };
};

type TokenLargestAccountsResult = {
  value?: Array<{
    address?: string;
    amount?: string;
    decimals?: number;
    uiAmount?: number | null;
    uiAmountString?: string;
  }>;
};

type TokenSupplyResult = {
  value?: {
    amount?: string;
    decimals?: number;
    uiAmount?: number | null;
    uiAmountString?: string;
  };
};

type MultipleAccountsResult = {
  value?: Array<{
    data?: {
      parsed?: {
        info?: {
          owner?: string;
          mint?: string;
          tokenAmount?: {
            amount?: string;
            decimals?: number;
            uiAmount?: number | null;
            uiAmountString?: string;
          };
        };
      };
    };
  } | null>;
};

type TokenAccountsByOwnerResult = {
  value?: Array<{
    pubkey?: string;
    account?: {
      data?: {
        parsed?: {
          info?: {
            mint?: string;
            owner?: string;
            tokenAmount?: {
              amount?: string;
              decimals?: number;
              uiAmount?: number | null;
              uiAmountString?: string;
            };
          };
        };
      };
    };
  }>;
};

type SettingsRow = {
  telegram_id: number | string;
  app_state_payload?: unknown;
};

type UserRow = {
  telegram_id: number | string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type WalletLinkRow = {
  telegram_user_id?: number | string;
  wallet_address?: string;
  is_verified?: boolean;
  broke_balance?: number | string | null;
  holder_tier?: unknown;
  verified_at?: string | null;
  last_checked_at?: string | null;
  updated_at?: string | null;
};

type ActiveStreakProofAction = "track_leak" | "clean_day" | "one_fix" | "daily_challenge" | "daily_routine";

type ActiveStreakProofLog = {
  date: string;
  actions: ActiveStreakProofAction[];
};

type ActiveStreakProofState = {
  logs: ActiveStreakProofLog[];
  recoveredMissedDates: string[];
  recoveryUsedAt: string | null;
  updatedAt?: string;
};

type WebAuthSession = {
  user?: {
    id?: number;
  };
  expiresAt?: number;
};

const WEB_AUTH_COOKIE = "broke_tg_session";
const DEFAULT_BROKE_TOKEN_MINT = "9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray";
const DEFAULT_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
const FUTURE_HOLDER_REWARD_MIN_BALANCE = 100_000;
const ACTIVE_STREAK_ELIGIBILITY_DAYS = 7;
const ACTIVE_STREAK_ACTIONS: ActiveStreakProofAction[] = ["daily_routine"];

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string) {
  return process.env[name] || "";
}

function parseCsv(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAdminTelegramIds() {
  return parseCsv(
    [
      getOptionalEnv("BROKE_ADMIN_TELEGRAM_IDS"),
      getOptionalEnv("ADMIN_TELEGRAM_IDS"),
      getOptionalEnv("NEXT_PUBLIC_BROKE_ADMIN_TELEGRAM_IDS"),
      getOptionalEnv("NEXT_PUBLIC_ADMIN_TELEGRAM_IDS"),
    ]
      .filter(Boolean)
      .join(",")
  );
}

function getTreasuryWalletAddress() {
  return String(
    getOptionalEnv("TREASURY_WALLET_ADDRESS") ||
      getOptionalEnv("NEXT_PUBLIC_TREASURY_WALLET_ADDRESS") ||
      "5eniFeReK8v39tHavRpnsinoxQ6YV5ymw5RmVMA7PxC9"
  ).trim();
}


function getWebAuthSecret() {
  return getOptionalEnv("WEB_AUTH_SECRET") || getOptionalEnv("TELEGRAM_BOT_TOKEN");
}

function getRewardsAdminSecret() {
  return (
    getOptionalEnv("REWARDS_ADMIN_SECRET") ||
    getOptionalEnv("DIAGNOSTICS_SECRET") ||
    getOptionalEnv("TELEGRAM_SETUP_SECRET")
  );
}

function safeCompareString(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function parseWebAuthSession(request: NextRequest): WebAuthSession | null {
  const secret = getWebAuthSecret();
  const cookie = request.cookies.get(WEB_AUTH_COOKIE)?.value || "";

  if (!secret || !cookie || !cookie.includes(".")) return null;

  const [payloadBase64, signature] = cookie.split(".");
  const expected = crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");

  if (!safeCompareString(signature || "", expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as WebAuthSession;

    if (!session.expiresAt || session.expiresAt < Date.now()) return null;

    return session;
  } catch {
    return null;
  }
}

function isAuthorized(request: NextRequest) {
  const adminSecret = getRewardsAdminSecret();
  const key = request.nextUrl.searchParams.get("key") || "";
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const secretAuthorized = Boolean(adminSecret && (key === adminSecret || bearer === adminSecret));

  if (secretAuthorized) return true;

  const session = parseWebAuthSession(request);
  const telegramId = session?.user?.id ? String(session.user.id) : "";

  return Boolean(telegramId && getAdminTelegramIds().includes(telegramId));
}

function getSupabaseBaseUrl() {
  return getEnv("SUPABASE_URL")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

function getSupabaseHeaders(extra?: HeadersInit) {
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...(extra || {}),
  };
}

function supabaseUrl(path: string) {
  return `${getSupabaseBaseUrl()}/rest/v1/${path}`;
}

async function supabaseFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(supabaseUrl(path), {
    ...(init || {}),
    headers: getSupabaseHeaders(init?.headers),
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${text.slice(0, 700)}`);
  }

  if (!text) return null as T;

  return JSON.parse(text) as T;
}

async function rpc<T>(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "broke-admin-holders",
      method,
      params,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`RPC HTTP ${response.status}`);
  }

  const data = (await response.json()) as SolanaRpcResponse<T>;

  if (data.error) {
    throw new Error(data.error.message || "Solana RPC error");
  }

  if (!data.result) {
    throw new Error("Empty Solana RPC response");
  }

  return data.result;
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseUiAmountString(value?: string | number | null) {
  if (value === undefined || value === null) return 0;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeJson(value: unknown) {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function previousDayKey(dateKey: string, daysBack = 1) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - daysBack);
  return dayKey(date);
}

function normalizeProofAction(value: unknown): ActiveStreakProofAction | null {
  return ACTIVE_STREAK_ACTIONS.includes(value as ActiveStreakProofAction)
    ? (value as ActiveStreakProofAction)
    : null;
}

function normalizeProofState(input: unknown): ActiveStreakProofState {
  const raw = safeJson(input) || {};
  const logsInput = Array.isArray(raw.logs) ? raw.logs : [];
  const logs = logsInput
    .map((item) => {
      const log = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
      const date = String(log?.date || "");
      const actions = Array.isArray(log?.actions)
        ? Array.from(new Set(log.actions.map(normalizeProofAction).filter((action): action is ActiveStreakProofAction => Boolean(action))))
        : [];

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || actions.length === 0) return null;

      return { date, actions };
    })
    .filter((log): log is ActiveStreakProofLog => Boolean(log))
    .sort((a, b) => a.date.localeCompare(b.date));

  const recoveredMissedDates = Array.isArray(raw.recoveredMissedDates)
    ? Array.from(
        new Set(
          raw.recoveredMissedDates
            .map((date) => String(date || ""))
            .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
        )
      )
    : [];

  const recoveryUsedAt = raw.recoveryUsedAt && /^\d{4}-\d{2}-\d{2}$/.test(String(raw.recoveryUsedAt))
    ? String(raw.recoveryUsedAt)
    : null;

  return {
    logs: logs.slice(-90),
    recoveredMissedDates: recoveredMissedDates.sort().slice(-12),
    recoveryUsedAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  };
}

function getProofStateFromAppState(appStatePayload: unknown) {
  const appState = safeJson(appStatePayload);
  return normalizeProofState(appState?.activeStreakProof);
}

function getProofDateSet(state: ActiveStreakProofState) {
  return new Set([
    ...state.logs.map((log) => log.date),
    ...state.recoveredMissedDates,
  ]);
}

function calculateCurrentStreak(state: ActiveStreakProofState, snapshotDate: string) {
  const dateSet = getProofDateSet(state);
  let currentStreak = 0;
  const today = snapshotDate;
  const yesterday = previousDayKey(today);

  if (dateSet.has(today) || dateSet.has(yesterday)) {
    const cursor = new Date(`${dateSet.has(today) ? today : yesterday}T00:00:00.000Z`);

    while (dateSet.has(dayKey(cursor))) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  return currentStreak;
}

function getTodayProofActions(state: ActiveStreakProofState, snapshotDate: string) {
  return state.logs.find((log) => log.date === snapshotDate)?.actions || [];
}

function getDisplayName(user?: UserRow) {
  if (!user) return "App user";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || (user.username ? `@${user.username}` : "App user");
}

async function readSettingsRows() {
  return supabaseFetch<SettingsRow[]>(
    "broke_settings?select=telegram_id,app_state_payload&limit=5000"
  );
}

async function readWalletRows() {
  return supabaseFetch<WalletLinkRow[]>(
    "broke_wallet_links?select=telegram_user_id,wallet_address,is_verified,broke_balance,holder_tier,verified_at,last_checked_at,updated_at&is_verified=eq.true&limit=5000"
  );
}

async function readUserRows() {
  return supabaseFetch<UserRow[]>(
    "broke_users?select=telegram_id,username,first_name,last_name&limit=5000"
  );
}

function pickBestWalletByTelegramId(walletRows: WalletLinkRow[]) {
  const map = new Map<string, WalletLinkRow>();

  walletRows.forEach((wallet) => {
    const telegramId = String(wallet.telegram_user_id || "");
    if (!telegramId || !wallet.is_verified) return;

    const current = map.get(telegramId);
    const currentBalance = safeNumber(current?.broke_balance);
    const nextBalance = safeNumber(wallet.broke_balance);

    if (!current || nextBalance > currentBalance) {
      map.set(telegramId, wallet);
    }
  });

  return map;
}

async function buildTopAllHolders(args: { rpcUrl: string; mintAddress: string }) {
  const [largest, supply] = await Promise.all([
    rpc<TokenLargestAccountsResult>(args.rpcUrl, "getTokenLargestAccounts", [args.mintAddress]),
    rpc<TokenSupplyResult>(args.rpcUrl, "getTokenSupply", [args.mintAddress]),
  ]);
  const accounts = (largest.value || []).filter((account) => account.address);
  const tokenAccountAddresses = accounts.map((account) => String(account.address));
  const accountDetails = tokenAccountAddresses.length
    ? await rpc<MultipleAccountsResult>(args.rpcUrl, "getMultipleAccounts", [tokenAccountAddresses, { encoding: "jsonParsed" }])
    : { value: [] };
  const supplyAmount = parseUiAmountString(supply.value?.uiAmountString);
  const owners = new Map<string, { ownerAddress: string; balance: number; tokenAccounts: string[] }>();

  accounts.forEach((account, index) => {
    const details = accountDetails.value?.[index];
    const ownerAddress = details?.data?.parsed?.info?.owner || account.address || "unknown";
    const amount = parseUiAmountString(
      details?.data?.parsed?.info?.tokenAmount?.uiAmountString || account.uiAmountString || account.uiAmount
    );
    const current = owners.get(ownerAddress) || { ownerAddress, balance: 0, tokenAccounts: [] };

    current.balance += amount;
    if (account.address) current.tokenAccounts.push(String(account.address));
    owners.set(ownerAddress, current);
  });

  return {
    tokenSupply: supplyAmount,
    topAllHolders: Array.from(owners.values())
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10)
      .map((holder, index) => ({
        rank: index + 1,
        ownerAddress: holder.ownerAddress,
        balance: Number(holder.balance.toFixed(6)),
        percentOfSupply: supplyAmount > 0 ? Number(((holder.balance / supplyAmount) * 100).toFixed(8)) : 0,
        tokenAccounts: holder.tokenAccounts,
      })),
  };
}

async function buildTreasuryBrokeBalance(args: { rpcUrl: string; mintAddress: string; ownerAddress: string }) {
  if (!args.ownerAddress) return null;

  const tokenAccounts = await rpc<TokenAccountsByOwnerResult>(args.rpcUrl, "getTokenAccountsByOwner", [
    args.ownerAddress,
    { mint: args.mintAddress },
    { encoding: "jsonParsed" },
  ]);

  const balance = (tokenAccounts.value || []).reduce((sum, item) => {
    const amount = item.account?.data?.parsed?.info?.tokenAmount;
    return sum + parseUiAmountString(amount?.uiAmountString || amount?.uiAmount);
  }, 0);

  return Number(balance.toFixed(6));
}

async function buildLegitimateHolders(snapshotDate: string) {
  const [settingsRows, walletRows, userRows] = await Promise.all([readSettingsRows(), readWalletRows(), readUserRows()]);
  const walletByTelegramId = pickBestWalletByTelegramId(walletRows);
  const userByTelegramId = new Map(userRows.map((user) => [String(user.telegram_id || ""), user]));
  const participants = settingsRows.map((row) => {
    const telegramId = String(row.telegram_id || "");
    const wallet = walletByTelegramId.get(telegramId);
    const user = userByTelegramId.get(telegramId);
    const balance = wallet ? safeNumber(wallet.broke_balance) : 0;
    const proofState = getProofStateFromAppState(row.app_state_payload);
    const currentStreak = calculateCurrentStreak(proofState, snapshotDate);
    const todayActions = getTodayProofActions(proofState, snapshotDate);
    const eligible = Boolean(
      wallet?.is_verified &&
        wallet.wallet_address &&
        balance >= FUTURE_HOLDER_REWARD_MIN_BALANCE &&
        currentStreak >= ACTIVE_STREAK_ELIGIBILITY_DAYS
    );

    return {
      telegramId,
      username: String(user?.username || ""),
      displayName: getDisplayName(user),
      walletAddress: wallet?.wallet_address || "",
      verifiedBalance: balance,
      activeStreakDays: currentStreak,
      todayProtected: todayActions.includes("daily_routine"),
      verifiedAt: wallet?.verified_at || null,
      lastCheckedAt: wallet?.last_checked_at || wallet?.updated_at || null,
      eligible,
      balanceSharePercent: 0,
    };
  });
  const eligibleParticipants = participants.filter((participant) => participant.eligible);
  const totalEligibleBalance = eligibleParticipants.reduce((sum, participant) => sum + participant.verifiedBalance, 0);
  const eligiblePayoutCandidates = eligibleParticipants
    .map((participant) => ({
      ...participant,
      balanceSharePercent:
        totalEligibleBalance > 0 ? Number(((participant.verifiedBalance / totalEligibleBalance) * 100).toFixed(8)) : 0,
    }))
    .sort((a, b) => b.verifiedBalance - a.verifiedBalance)
    .map((participant, index) => ({
      rank: index + 1,
      telegramId: participant.telegramId,
      username: participant.username,
      displayName: participant.displayName,
      walletAddress: participant.walletAddress,
      verifiedBalance: Number(participant.verifiedBalance.toFixed(6)),
      activeStreakDays: participant.activeStreakDays,
      balanceSharePercent: participant.balanceSharePercent,
      todayProtected: participant.todayProtected,
      verifiedAt: participant.verifiedAt,
      lastCheckedAt: participant.lastCheckedAt,
    }));
  const topLegitimateHolders = eligiblePayoutCandidates.slice(0, 20);

  return {
    topLegitimateHolders,
    eligiblePayoutCandidates,
    summary: {
      snapshotDate,
      totalUsersScanned: settingsRows.length,
      totalVerifiedWallets: walletRows.length,
      totalEligibleHolders: eligibleParticipants.length,
      totalEligibleBalance: Number(totalEligibleBalance.toFixed(6)),
      minHold: FUTURE_HOLDER_REWARD_MIN_BALANCE,
      minStreak: ACTIVE_STREAK_ELIGIBILITY_DAYS,
    },
  };
}

export async function GET(request: NextRequest) {
  if (!getRewardsAdminSecret() && getAdminTelegramIds().length === 0) {
    return json({ ok: false, error: "Missing REWARDS_ADMIN_SECRET or configured admin Telegram IDs." }, 500);
  }

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized. Enter REWARDS_ADMIN_SECRET or open as a configured Telegram admin." }, 401);
  }

  try {
    const mintAddress = String(
      request.nextUrl.searchParams.get("mint") ||
        getOptionalEnv("BROKE_TOKEN_MINT") ||
        getOptionalEnv("NEXT_PUBLIC_BROKE_TOKEN_MINT") ||
        DEFAULT_BROKE_TOKEN_MINT
    ).trim();
    const rpcUrl = String(getOptionalEnv("SOLANA_RPC_URL") || DEFAULT_SOLANA_RPC_URL).trim();
    const treasuryWallet = getTreasuryWalletAddress();
    const snapshotDate = dayKey(new Date());
    const [allHoldersResult, treasuryBalanceResult, legitimate] = await Promise.allSettled([
      buildTopAllHolders({ rpcUrl, mintAddress }),
      buildTreasuryBrokeBalance({ rpcUrl, mintAddress, ownerAddress: treasuryWallet }),
      buildLegitimateHolders(snapshotDate),
    ]);

    if (legitimate.status !== "fulfilled") {
      throw legitimate.reason instanceof Error ? legitimate.reason : new Error("Could not load legitimate holder data.");
    }

    const allHolders =
      allHoldersResult.status === "fulfilled"
        ? allHoldersResult.value
        : { tokenSupply: null, topAllHolders: [] };
    const allHoldersRpcError =
      allHoldersResult.status === "rejected"
        ? allHoldersResult.reason instanceof Error
          ? allHoldersResult.reason.message
          : "Solana RPC holder read failed"
        : "";
    const treasuryBalanceRpcError =
      treasuryBalanceResult.status === "rejected"
        ? treasuryBalanceResult.reason instanceof Error
          ? treasuryBalanceResult.reason.message
          : "Solana RPC treasury balance read failed"
        : "";

    return json({
      ok: true,
      route: "/api/admin/holders",
      generatedAt: new Date().toISOString(),
      mintAddress,
      treasuryWallet,
      treasuryBrokeBalance: treasuryBalanceResult.status === "fulfilled" ? treasuryBalanceResult.value : null,
      treasuryBalanceRpcError,
      tokenSupply: allHolders.tokenSupply,
      tokenSupplyAvailable: allHolders.tokenSupply !== null,
      topAllHolders: allHolders.topAllHolders,
      topAllHoldersAvailable: allHoldersResult.status === "fulfilled",
      topLegitimateHolders: legitimate.value.topLegitimateHolders,
      eligiblePayoutCandidates: legitimate.value.eligiblePayoutCandidates,
      allHoldersRpcError,
      allHoldersRpcUrl: rpcUrl,
      rpcProviderStatus: rpcUrl === DEFAULT_SOLANA_RPC_URL ? "public_rpc" : "private_rpc",
      summary: legitimate.value.summary,
      notes: [
        allHoldersRpcError || treasuryBalanceRpcError
          ? "One or more live Solana RPC reads failed. Set SOLANA_RPC_URL to a private mainnet RPC endpoint for stable holder and treasury balance reads."
          : "Top all holders uses Solana RPC getTokenLargestAccounts and groups returned token accounts by owner where visible.",
        "Treasury balance is a live read for the configured treasury wallet and BROKE mint; it is separate from eligible holder balance.",
        "Top legitimate holders uses app eligibility: verified wallet, 100K+ BROKE, and 7+ Active Streak from Daily Routine proof.",
        "This endpoint is read-only. It does not send rewards, sign transactions, open claims, staking, or token transfers.",
      ],
      safety: {
        noPayouts: true,
        noClaims: true,
        noStaking: true,
        noTokenTransfers: true,
        noPrivateKey: true,
      },
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Could not load admin holder intelligence." }, 500);
  }
}
