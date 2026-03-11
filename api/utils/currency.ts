const DOLAR_FALLBACK_RATE = 5.0;
const DOLAR_FETCH_TIMEOUT_MS = 3000;

export async function getDolarRate(): Promise<number> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOLAR_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      "https://economia.awesomeapi.com.br/last/USD-BRL",
      { signal: controller.signal }
    );

    if (!response.ok) return DOLAR_FALLBACK_RATE;

    const data = await response.json();
    const rate = parseFloat(data?.USDBRL?.bid);

    return isNaN(rate) ? DOLAR_FALLBACK_RATE : rate;
  } catch {
    return DOLAR_FALLBACK_RATE;
  } finally {
    clearTimeout(timeoutId);
  }
}
