import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Currency =
  | "USD"
  | "EUR"
  | "MDL"
  | "NGN"
  | "PKR"
  | "GBP"
  | "INR"
  | "CAD"
  | "AUD"
  | "NZD"
  | "ZAR"
  | "GHS"
  | "KES"
  | "UGX"
  | "TZS"
  | "XAF"
  | "XOF"
  | "EGP"
  | "MAD"
  | "TRY"
  | "AED"
  | "SAR"
  | "PHP"
  | "IDR"
  | "VND"
  | "THB"
  | "MYR"
  | "SGD"
  | "BDT"
  | "LKR"
  | "NPR"
  | "BRL"
  | "MXN"
  | "UAH"
  | "PLN"
  | "RON"
  | "GEL"
  | "KZT";

const supportedCurrencies: Currency[] = [
  "USD",
  "EUR",
  "MDL",
  "NGN",
  "PKR",
  "GBP",
  "INR",
  "CAD",
  "AUD",
  "NZD",
  "ZAR",
  "GHS",
  "KES",
  "UGX",
  "TZS",
  "XAF",
  "XOF",
  "EGP",
  "MAD",
  "TRY",
  "AED",
  "SAR",
  "PHP",
  "IDR",
  "VND",
  "THB",
  "MYR",
  "SGD",
  "BDT",
  "LKR",
  "NPR",
  "BRL",
  "MXN",
  "UAH",
  "PLN",
  "RON",
  "GEL",
  "KZT",
];

const defaultCurrency: Currency = "USD";
const frankfurterBaseUrl = "https://api.frankfurter.dev/v2";
const cacheFreshnessHours = 20;

type ExchangeRatePayload = {
  ok: true;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  rate: number;
  amount: number;
  convertedAmount: number;
  rateDate: string;
  source: "frankfurter" | "identity";
  cached: boolean;
  cacheStatus: "hit" | "miss" | "bypass" | "missing-table";
  fetchedAt: string;
};

type CachedRateRow = {
  base_currency?: unknown;
  quote_currency?: unknown;
  rate?: unknown;
  rate_date?: unknown;
  source?: unknown;
  fetched_at?: unknown;
};

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function hasEnv(name: string) {
  return Boolean(process.env[name]);
}

function getSupabaseBaseUrl() {
  return getEnv("SUPABASE_URL")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

function supabaseUrl(path: string) {
  return `${getSupabaseBaseUrl()}/rest/v1/${path}`;
}

function getSupabaseHeaders() {
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
}

function normalizeCurrency(value: unknown, fallback: Currency = defaultCurrency): Currency {
  const candidate = String(value || "").trim().toUpperCase();

  return supportedCurrencies.includes(candidate as Currency) ? (candidate as Currency) : fallback;
}

function isSupportedCurrency(value: unknown): value is Currency {
  const candidate = String(value || "").trim().toUpperCase();

  return supportedCurrencies.includes(candidate as Currency);
}

function toPositiveNumber(value: unknown, fallback: number) {
  const numeric = Number(value);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function normalizeRateRow(row: CachedRateRow): ExchangeRatePayload | null {
  const baseCurrency = normalizeCurrency(row.base_currency);
  const quoteCurrency = normalizeCurrency(row.quote_currency);
  const rate = Number(row.rate);
  const rateDate = String(row.rate_date || "");
  const fetchedAt = String(row.fetched_at || "");

  if (!Number.isFinite(rate) || rate <= 0 || !rateDate || !fetchedAt) {
    return null;
  }

  return {
    ok: true,
    baseCurrency,
    quoteCurrency,
    rate,
    amount: 1,
    convertedAmount: rate,
    rateDate,
    source: "frankfurter",
    cached: true,
    cacheStatus: "hit",
    fetchedAt,
  };
}

function isMissingExchangeRateTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("broke_exchange_rates") &&
    (message.includes("Could not find") ||
      message.includes("relation") ||
      message.includes("schema cache") ||
      message.includes("PGRST") ||
      message.includes("does not exist"))
  );
}

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(supabaseUrl(path), {
    ...options,
    headers: {
      ...getSupabaseHeaders(),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  return text ? JSON.parse(text) : null;
}

function hasSupabaseConfig() {
  return hasEnv("SUPABASE_URL") && hasEnv("SUPABASE_SERVICE_ROLE_KEY");
}

function isCacheFresh(fetchedAt: string) {
  const fetchedTime = new Date(fetchedAt).getTime();

  if (!Number.isFinite(fetchedTime)) return false;

  return Date.now() - fetchedTime < cacheFreshnessHours * 60 * 60 * 1000;
}

async function getCachedRate(baseCurrency: Currency, quoteCurrency: Currency) {
  if (!hasSupabaseConfig()) return { status: "bypass" as const, payload: null };

  try {
    const rows = (await supabaseFetch(
      `broke_exchange_rates?base_currency=eq.${baseCurrency}&quote_currency=eq.${quoteCurrency}&source=eq.frankfurter&select=*&order=fetched_at.desc&limit=1`
    )) as CachedRateRow[];

    const payload = rows?.[0] ? normalizeRateRow(rows[0]) : null;

    if (!payload || !isCacheFresh(payload.fetchedAt)) {
      return { status: "miss" as const, payload: null };
    }

    return { status: "hit" as const, payload };
  } catch (error) {
    if (isMissingExchangeRateTableError(error)) {
      return { status: "missing-table" as const, payload: null };
    }

    throw error;
  }
}

async function saveCachedRate(payload: Omit<ExchangeRatePayload, "ok" | "amount" | "convertedAmount" | "cached" | "cacheStatus">) {
  if (!hasSupabaseConfig() || payload.source !== "frankfurter") return false;

  try {
    await supabaseFetch("broke_exchange_rates?on_conflict=base_currency,quote_currency,rate_date,source", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        base_currency: payload.baseCurrency,
        quote_currency: payload.quoteCurrency,
        rate_date: payload.rateDate,
        rate: payload.rate,
        source: payload.source,
        fetched_at: payload.fetchedAt,
        raw_payload: {
          provider: "frankfurter",
          baseCurrency: payload.baseCurrency,
          quoteCurrency: payload.quoteCurrency,
          rate: payload.rate,
          rateDate: payload.rateDate,
        },
      }),
    });

    return true;
  } catch (error) {
    if (isMissingExchangeRateTableError(error)) {
      return false;
    }

    throw error;
  }
}

async function fetchFrankfurterRate(baseCurrency: Currency, quoteCurrency: Currency) {
  const url = `${frankfurterBaseUrl}/rate/${baseCurrency}/${quoteCurrency}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Frankfurter error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    date?: unknown;
    rate?: unknown;
    rates?: Record<string, unknown>;
  };
  const rate = Number(data.rate ?? data.rates?.[quoteCurrency]);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Frankfurter response did not include a valid rate.");
  }

  return {
    baseCurrency,
    quoteCurrency,
    rate,
    rateDate: String(data.date || utcDateKey()),
    source: "frankfurter" as const,
    fetchedAt: new Date().toISOString(),
  };
}

function withAmount(
  payload: Omit<ExchangeRatePayload, "amount" | "convertedAmount">,
  amount: number
): ExchangeRatePayload {
  return {
    ...payload,
    amount,
    convertedAmount: Number((amount * payload.rate).toFixed(6)),
  };
}

function identityPayload(currency: Currency, amount: number): ExchangeRatePayload {
  const now = new Date().toISOString();

  return {
    ok: true,
    baseCurrency: currency,
    quoteCurrency: currency,
    rate: 1,
    amount,
    convertedAmount: amount,
    rateDate: utcDateKey(),
    source: "identity",
    cached: true,
    cacheStatus: "bypass",
    fetchedAt: now,
  };
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const rawBase = params.get("base") || params.get("from") || defaultCurrency;
    const rawQuote = params.get("quote") || params.get("to") || defaultCurrency;
    const amount = toPositiveNumber(params.get("amount"), 1);

    if (!isSupportedCurrency(rawBase) || !isSupportedCurrency(rawQuote)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unsupported currency pair",
          supportedCurrencies,
        },
        { status: 400 }
      );
    }

    const baseCurrency = normalizeCurrency(rawBase);
    const quoteCurrency = normalizeCurrency(rawQuote);

    if (baseCurrency === quoteCurrency) {
      return NextResponse.json(identityPayload(baseCurrency, amount));
    }

    const cached = await getCachedRate(baseCurrency, quoteCurrency);

    if (cached.payload) {
      return NextResponse.json(withAmount(cached.payload, amount));
    }

    const fresh = await fetchFrankfurterRate(baseCurrency, quoteCurrency);
    const saved = await saveCachedRate(fresh);

    return NextResponse.json(
      withAmount(
        {
          ok: true,
          ...fresh,
          cached: false,
          cacheStatus: saved ? "miss" : cached.status,
        },
        amount
      )
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown exchange-rate error",
      },
      { status: 500 }
    );
  }
}
