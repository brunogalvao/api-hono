import { createAuthApp } from "../config/baseApp";
import { getDolarQuote } from "../utils/currency";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.get("/api/currency/usd-brl", async (c) => {
  const quote = await getDolarQuote();

  if (quote.status === "unavailable") {
    return c.json(
      {
        error: "Cotação do dólar temporariamente indisponível",
        error_code: "dollar_rate_unavailable",
      },
      503,
    );
  }

  return c.json(quote);
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
