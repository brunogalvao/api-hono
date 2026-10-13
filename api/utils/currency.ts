const DOLAR_FALLBACK_RATE = 4.94;
const DOLAR_FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 60 * 60 * 1000; // a fonte principal atualiza uma vez ao dia

type AvailableDollarRateQuote = {
  status: "available";
  rate: number;
  source: "exchange-rate-api" | "awesome-api";
  sourceLabel: string;
  sourceUrl: string;
  marketUpdatedAt: string | null;
  fetchedAt: string;
};

export type DollarRateQuote =
  | AvailableDollarRateQuote
  | {
      status: "unavailable";
      rate: null;
      source: null;
      sourceLabel: null;
      sourceUrl: null;
      marketUpdatedAt: null;
      fetchedAt: string;
    };

// Cache em memória — persiste entre invocações quentes no Edge Runtime
let cachedQuote: AvailableDollarRateQuote | null = null;
let cacheExpiry = 0;

async function withTimeout<T>(
  request: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    DOLAR_FETCH_TIMEOUT_MS,
  );

  try {
    return await request(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

function unixSecondsToIso(value: unknown): string | null {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

async function fetchFromErApi(
  signal: AbortSignal,
): Promise<AvailableDollarRateQuote | null> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    const rate = parseFloat(data?.rates?.BRL);
    if (!Number.isFinite(rate) || rate <= 0) return null;

    return {
      status: "available",
      rate,
      source: "exchange-rate-api",
      sourceLabel: "ExchangeRate-API",
      sourceUrl: "https://www.exchangerate-api.com",
      marketUpdatedAt: unixSecondsToIso(data?.time_last_update_unix),
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchFromAwesomeApi(
  signal: AbortSignal,
): Promise<AvailableDollarRateQuote | null> {
  try {
    const response = await fetch(
      "https://economia.awesomeapi.com.br/last/USD-BRL",
      { signal },
    );
    if (!response.ok) return null;
    const data = await response.json();
    const rate = parseFloat(data?.USDBRL?.bid);
    if (!Number.isFinite(rate) || rate <= 0) return null;

    return {
      status: "available",
      rate,
      source: "awesome-api",
      sourceLabel: "AwesomeAPI",
      sourceUrl: "https://docs.awesomeapi.com.br/api-de-moedas",
      marketUpdatedAt: unixSecondsToIso(data?.USDBRL?.timestamp),
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getDolarQuote(): Promise<DollarRateQuote> {
  if (cachedQuote !== null && Date.now() < cacheExpiry) {
    return cachedQuote;
  }

  const quote =
    (await withTimeout(fetchFromErApi)) ??
    (await withTimeout(fetchFromAwesomeApi));

  if (quote) {
    cachedQuote = quote;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return quote;
  }

  return {
    status: "unavailable",
    rate: null,
    source: null,
    sourceLabel: null,
    sourceUrl: null,
    marketUpdatedAt: null,
    fetchedAt: new Date().toISOString(),
  };
}

// Compatibilidade com as análises existentes. Interfaces voltadas ao usuário
// devem consumir getDolarQuote para não apresentar o fallback como cotação real.
export async function getDolarRate(): Promise<number> {
  const quote = await getDolarQuote();
  return quote.status === "available" ? quote.rate : DOLAR_FALLBACK_RATE;
}
