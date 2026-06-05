import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type SolanaRpcResponse<T> = {
  result?: T;
  error?: {
    code?: number;
    message?: string;
  };
};

type TokenAccountResult = {
  value?: Array<{
    account?: {
      data?: {
        parsed?: {
          info?: {
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

type TokenSupplyResult = {
  value?: {
    amount?: string;
    decimals?: number;
    uiAmount?: number | null;
    uiAmountString?: string;
  };
};

const DEFAULT_BROKE_TOKEN_MINT = "9UjwQHUVbJtgdYhBSSpzBF4z9mBwFkBoT2RJroGwwray";
const DEFAULT_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function isLikelySolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

function parseUiAmountString(value?: string | number | null) {
  if (value === undefined || value === null) return 0;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getHolderTier(percentOfSupply: number, balance: number) {
  if (balance <= 0) {
    return {
      id: "none",
      label: "No BROKE yet",
      range: "0%",
      description: "No tracked $BROKE balance found for this wallet.",
    };
  }

  if (percentOfSupply >= 5) {
    return {
      id: "leviathan",
      label: "Leviathan Frog",
      range: "5%+",
      description: "Top holder tier based on current visible token supply.",
    };
  }

  if (percentOfSupply >= 2) {
    return {
      id: "whale",
      label: "Whale Frog",
      range: "2–5%",
      description: "Large holder tier based on current visible token supply.",
    };
  }

  if (percentOfSupply >= 0.75) {
    return {
      id: "shark",
      label: "Shark Frog",
      range: "0.75–2%",
      description: "Strong holder tier based on current visible token supply.",
    };
  }

  if (percentOfSupply >= 0.25) {
    return {
      id: "strong",
      label: "Strong Frog",
      range: "0.25–0.75%",
      description: "Committed holder tier based on current visible token supply.",
    };
  }

  if (percentOfSupply >= 0.05) {
    return {
      id: "frog",
      label: "Frog",
      range: "0.05–0.25%",
      description: "Holder tier based on current visible token supply.",
    };
  }

  return {
    id: "tadpole",
    label: "Tadpole",
    range: "<0.05%",
    description: "Entry holder tier based on current visible token supply.",
  };
}

async function rpc<T>(rpcUrl: string, method: string, params: unknown[]) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "broke-wallet-balance",
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      walletAddress?: string;
      mintAddress?: string;
    };

    const walletAddress = String(body.walletAddress || "").trim();
    const mintAddress = String(body.mintAddress || process.env.BROKE_TOKEN_MINT || DEFAULT_BROKE_TOKEN_MINT).trim();
    const rpcUrl = String(process.env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC_URL).trim();

    if (!isLikelySolanaAddress(walletAddress)) {
      return json({ ok: false, error: "Invalid Solana wallet address." }, 400);
    }

    if (!isLikelySolanaAddress(mintAddress)) {
      return json({ ok: false, error: "Invalid $BROKE token mint address." }, 500);
    }

    const [accountsResult, supplyResult] = await Promise.all([
      rpc<TokenAccountResult>(rpcUrl, "getTokenAccountsByOwner", [
        walletAddress,
        { mint: mintAddress },
        { encoding: "jsonParsed" },
      ]),
      rpc<TokenSupplyResult>(rpcUrl, "getTokenSupply", [mintAddress]),
    ]);

    const balances = (accountsResult.value || []).map((item) =>
      parseUiAmountString(item.account?.data?.parsed?.info?.tokenAmount?.uiAmountString)
    );
    const balance = balances.reduce((sum, value) => sum + value, 0);
    const tokenSupply = parseUiAmountString(supplyResult.value?.uiAmountString);
    const percentOfSupply = tokenSupply > 0 ? (balance / tokenSupply) * 100 : 0;
    const holderTier = getHolderTier(percentOfSupply, balance);
    const checkedAt = new Date().toISOString();

    return json({
      ok: true,
      walletAddress,
      mintAddress,
      balance,
      tokenSupply,
      percentOfSupply,
      holderTier,
      checkedAt,
      verified: false,
      readOnly: true,
    });
  } catch (error) {
    console.error("wallet balance check failed", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not check wallet balance.",
      },
      500
    );
  }
}
