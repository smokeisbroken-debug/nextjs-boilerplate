export const WALLET_LEAK_BASIC_DATA_ROUTE = "/api/leak-score/wallet-data";

export type WalletLeakDataSourceHealth = "complete" | "partial" | "limited";

export type WalletLeakDataSource = {
  id: "solana_balance" | "solana_token_accounts";
  label: string;
  ok: boolean;
  helper: string;
};

export type WalletLeakVisibleTokenAccount = {
  mint: string;
  amount: string;
  decimals: number | null;
  accountAddress: string;
  isBroke: boolean;
};

export type WalletLeakBasicData = {
  chain: "Solana";
  walletAddress: string;
  fetchedAt: string;
  solBalance: number | null;
  tokenAccountsCount: number | null;
  nonZeroTokenAccountsCount: number | null;
  brokeMint: string;
  brokeBalance: string | null;
  brokeTokenAccountFound: boolean;
  visibleTokenAccounts: WalletLeakVisibleTokenAccount[];
  warnings: string[];
  sources: WalletLeakDataSource[];
  sourceHealth: WalletLeakDataSourceHealth;
  sourceHealthLabel: string;
  sourceHealthHelper: string;
};

export type WalletLeakBasicDataResponse = {
  ok: boolean;
  code?: string;
  error?: string;
  data?: WalletLeakBasicData;
};

export type WalletLeakDataInputStatus = {
  status: "empty" | "invalid_wallet" | "ready";
  canFetch: boolean;
  label: string;
  helper: string;
};

const SOLANA_BASE58_ADDRESS_PATTERN = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

function stripWalletLeakAddressNoise(value: string) {
  return value
    .trim()
    .replace(/^['"`]+|['"`,;:.]+$/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

export function isLikelySolanaWalletAddress(value: unknown) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(value || "").trim());
}

export type WalletLeakAddressCleanupResult = {
  original: string;
  cleanedAddress: string;
  changed: boolean;
  sourceLabel: string;
  helper: string;
};

function getFirstValidWalletCandidate(values: string[]) {
  for (const value of values) {
    const candidate = stripWalletLeakAddressNoise(value);
    if (isLikelySolanaWalletAddress(candidate)) return candidate;
  }

  return "";
}

export function cleanupWalletLeakAddressInput(value: unknown): WalletLeakAddressCleanupResult {
  const original = String(value || "");
  const trimmed = stripWalletLeakAddressNoise(original);

  if (!trimmed) {
    return {
      original,
      cleanedAddress: "",
      changed: original !== "",
      sourceLabel: "Empty input",
      helper: "Paste a public Solana wallet address. Never paste seed phrases or private keys.",
    };
  }

  if (isLikelySolanaWalletAddress(trimmed)) {
    return {
      original,
      cleanedAddress: trimmed,
      changed: trimmed !== original,
      sourceLabel: trimmed !== original ? "Whitespace cleaned" : "Wallet address detected",
      helper: "Ready as a Solana-format public wallet address. This is read-only public context.",
    };
  }

  const decoded = (() => {
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  })();

  try {
    const parsedUrl = new URL(decoded);
    const queryCandidates: string[] = [];
    parsedUrl.searchParams.forEach((paramValue, paramKey) => {
      const key = paramKey.toLowerCase().replace(/[^a-z]/g, "");
      if (["address", "wallet", "owner", "account", "holder"].includes(key)) {
        queryCandidates.push(paramValue);
      }
    });

    const queryAddress = getFirstValidWalletCandidate(queryCandidates);
    if (queryAddress) {
      return {
        original,
        cleanedAddress: queryAddress,
        changed: queryAddress !== original,
        sourceLabel: "Wallet extracted from URL",
        helper: "Extracted a Solana-format address from a URL query. Confirm this is the public wallet you want to check.",
      };
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const markerCandidates: string[] = [];
    for (let index = 0; index < pathParts.length; index += 1) {
      const part = pathParts[index].toLowerCase();
      if (["account", "address", "wallet", "owner", "holder"].includes(part) && pathParts[index + 1]) {
        markerCandidates.push(pathParts[index + 1]);
      }
    }

    const markerAddress = getFirstValidWalletCandidate(markerCandidates);
    if (markerAddress) {
      return {
        original,
        cleanedAddress: markerAddress,
        changed: markerAddress !== original,
        sourceLabel: "Wallet extracted from explorer URL",
        helper: "Cleaned a Solana explorer-style URL into a public wallet-like address.",
      };
    }

    const pathCandidates = pathParts.flatMap((part) => part.match(SOLANA_BASE58_ADDRESS_PATTERN) || []);
    const pathAddress = getFirstValidWalletCandidate(pathCandidates);
    if (pathAddress) {
      return {
        original,
        cleanedAddress: pathAddress,
        changed: pathAddress !== original,
        sourceLabel: "Address extracted from URL",
        helper: "Extracted a Solana-format address from the pasted URL. Confirm it is the wallet, not a token mint or pair address.",
      };
    }
  } catch {
    // Not a URL; fall through to plain text extraction.
  }

  const textCandidates = decoded.match(SOLANA_BASE58_ADDRESS_PATTERN) || [];
  const textAddress = getFirstValidWalletCandidate(textCandidates);
  if (textAddress) {
    return {
      original,
      cleanedAddress: textAddress,
      changed: textAddress !== original,
      sourceLabel: "Wallet extracted from pasted text",
      helper: "Removed surrounding text and kept the first Solana-format address. Confirm this is the wallet, not a token mint.",
    };
  }

  return {
    original,
    cleanedAddress: trimmed,
    changed: trimmed !== original,
    sourceLabel: trimmed !== original ? "Paste cleaned" : "No wallet extracted",
    helper: "No Solana wallet-like address could be extracted. Paste a public wallet address, not a username, ticker, or seed phrase.",
  };
}

export function getWalletLeakAddressPasteHelper(value: unknown) {
  const result = cleanupWalletLeakAddressInput(value);
  if (!result.cleanedAddress) return result.helper;
  if (result.changed) return `${result.sourceLabel}: ${result.cleanedAddress.slice(0, 4)}…${result.cleanedAddress.slice(-4)}. ${result.helper}`;
  return result.helper;
}

export function getWalletLeakDataInputStatus(walletAddress: unknown): WalletLeakDataInputStatus {
  const cleaned = cleanupWalletLeakAddressInput(walletAddress).cleanedAddress;

  if (!cleaned) {
    return {
      status: "empty",
      canFetch: false,
      label: "Wallet address needed",
      helper: "Paste a public Solana wallet address to fetch read-only SOL balance and token-account context.",
    };
  }

  if (!isLikelySolanaWalletAddress(cleaned)) {
    return {
      status: "invalid_wallet",
      canFetch: false,
      label: "Check wallet format",
      helper: "This does not look like a Solana public wallet address. Never paste seed phrases or private keys.",
    };
  }

  return {
    status: "ready",
    canFetch: true,
    label: "Ready to fetch",
    helper: "Read-only public wallet context. No signature, no transaction, no private key, and no publishing.",
  };
}

export function getWalletLeakDataSourceHealth(sources: WalletLeakDataSource[]): {
  sourceHealth: WalletLeakDataSourceHealth;
  sourceHealthLabel: string;
  sourceHealthHelper: string;
} {
  const okCount = sources.filter((source) => source.ok).length;

  if (okCount === sources.length && okCount > 0) {
    return {
      sourceHealth: "complete",
      sourceHealthLabel: "Good context",
      sourceHealthHelper: "SOL balance and token-account context were both available from public Solana RPC.",
    };
  }

  if (okCount > 0) {
    return {
      sourceHealth: "partial",
      sourceHealthLabel: "Partial context",
      sourceHealthHelper: "Some public wallet context loaded, but one source path was limited or unavailable.",
    };
  }

  return {
    sourceHealth: "limited",
    sourceHealthLabel: "Limited context",
    sourceHealthHelper: "Public Solana RPC did not provide usable wallet context for this snapshot.",
  };
}

export function getWalletLeakDataErrorCopy(code: string | undefined, fallback: string | undefined) {
  switch (code) {
    case "invalid_json_body":
      return "Wallet data request could not be read. Reload and try again.";
    case "empty_wallet_address":
      return "Paste a public Solana wallet address before fetching wallet context.";
    case "invalid_solana_wallet":
      return "This does not look like a valid Solana public wallet address. Never paste private keys or seed phrases.";
    case "wallet_data_fetch_failed":
      return fallback || "Wallet data sources are unavailable right now. Continue with the manual self-check or try again later.";
    default:
      return fallback || "Basic wallet data is unavailable right now. Continue with the manual self-check or try again later.";
  }
}

export function formatWalletLeakFetchedAt(value: unknown) {
  const timestamp = new Date(String(value || "")).getTime();
  if (!Number.isFinite(timestamp)) return "Fetched time unavailable";

  return `Fetched ${new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function formatWalletLeakSol(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Unavailable";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: value >= 10 ? 2 : 4 }).format(value)} SOL`;
}

export function formatWalletLeakTokenAmount(value: string | null | undefined) {
  if (!value) return "Unavailable";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return new Intl.NumberFormat("en-US", {
    notation: numeric >= 100000 ? "compact" : "standard",
    maximumFractionDigits: numeric >= 100000 ? 2 : 4,
  }).format(numeric);
}

export function buildWalletLeakDataMetricCards(data: WalletLeakBasicData | null): Array<{
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: "ready" | "caution" | "pending";
}> {
  if (!data) {
    return [
      {
        id: "empty",
        label: "Wallet context",
        value: "Not loaded",
        helper: "Paste a public wallet address to fetch a read-only context snapshot.",
        tone: "pending",
      },
    ];
  }

  return [
    {
      id: "sol_balance",
      label: "SOL balance",
      value: formatWalletLeakSol(data.solBalance),
      helper: "Point-in-time public SOL balance from Solana RPC.",
      tone: data.solBalance !== null ? "ready" : "pending",
    },
    {
      id: "token_accounts",
      label: "Token accounts",
      value: data.tokenAccountsCount === null ? "Unavailable" : String(data.tokenAccountsCount),
      helper: "SPL token accounts currently visible for this public wallet.",
      tone: data.tokenAccountsCount !== null ? "ready" : "pending",
    },
    {
      id: "nonzero_tokens",
      label: "Non-zero tokens",
      value: data.nonZeroTokenAccountsCount === null ? "Unavailable" : String(data.nonZeroTokenAccountsCount),
      helper: "Token accounts with a non-zero visible balance. Not a PnL or quality score.",
      tone: data.nonZeroTokenAccountsCount !== null ? "ready" : "pending",
    },
    {
      id: "broke_balance",
      label: "$BROKE visible",
      value: data.brokeTokenAccountFound ? formatWalletLeakTokenAmount(data.brokeBalance) : "Not found",
      helper: "Checks only the configured $BROKE mint in visible SPL token accounts.",
      tone: data.brokeTokenAccountFound ? "ready" : "caution",
    },
  ];
}

export function summarizeWalletLeakData(data: WalletLeakBasicData | null) {
  if (!data) return "Basic wallet context not loaded yet.";

  return `${data.sourceHealthLabel} · ${formatWalletLeakSol(data.solBalance)} · ${data.nonZeroTokenAccountsCount ?? "?"} non-zero token accounts · $BROKE ${data.brokeTokenAccountFound ? "visible" : "not found"}`;
}
