const DOLAR_FALLBACK_RATE = 4.94;
const DOLAR_FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// Cache em memória — persiste entre invocações quentes no Edge Runtime
let cachedRate: number | null = null;
let cacheExpiry = 0;

async function fetchFromErApi(signal: AbortSignal): Promise<number | null> {
  try {
    const response = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      { signal }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const rate = parseFloat(data?.rates?.BRL);
    return isNaN(rate) ? null : rate;
  } catch {
    return null;
  }
}

async function fetchFromAwesomeApi(signal: AbortSignal): Promise<number | null> {
  try {
    const response = await fetch(
      "https://economia.awesomeapi.com.br/last/USD-BRL",
      { signal }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const rate = parseFloat(data?.USDBRL?.bid);
    return isNaN(rate) ? null : rate;
  } catch {
    return null;
  }
}

export async function getDolarRate(): Promise<number> {
  if (cachedRate !== null && Date.now() < cacheExpiry) {
    return cachedRate;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOLAR_FETCH_TIMEOUT_MS);

  try {
    const rate =
      (await fetchFromErApi(controller.signal)) ??
      (await fetchFromAwesomeApi(controller.signal)) ??
      DOLAR_FALLBACK_RATE;

    if (rate !== DOLAR_FALLBACK_RATE) {
      cachedRate = rate;
      cacheExpiry = Date.now() + CACHE_TTL_MS;
    }

    return rate;
  } finally {
    clearTimeout(timeoutId);
  }
}
