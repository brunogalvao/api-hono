const DOLAR_FALLBACK_RATE = 5.0;
const DOLAR_FETCH_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// Cache em memória — persiste entre invocações quentes no Edge Runtime
let cachedRate: number | null = null;
let cacheExpiry = 0;

export async function getDolarRate(): Promise<number> {
  if (cachedRate !== null && Date.now() < cacheExpiry) {
    return cachedRate;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOLAR_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      "https://economia.awesomeapi.com.br/last/USD-BRL",
      { signal: controller.signal }
    );

    if (!response.ok) return cachedRate ?? DOLAR_FALLBACK_RATE;

    const data = await response.json();
    const rate = parseFloat(data?.USDBRL?.bid);

    if (!isNaN(rate)) {
      cachedRate = rate;
      cacheExpiry = Date.now() + CACHE_TTL_MS;
      return cachedRate;
    }

    return cachedRate ?? DOLAR_FALLBACK_RATE;
  } catch {
    return cachedRate ?? DOLAR_FALLBACK_RATE;
  } finally {
    clearTimeout(timeoutId);
  }
}
