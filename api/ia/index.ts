import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader"; // ajuste se o caminho for diferente

export const config = { runtime: "edge" };

const app = new Hono();

// CORS
app.options("/", () => handleOptions());

// GET para teste
app.get("/", (c) => {
  return c.json({ message: "GET da rota /api/ia funcionando ✅" });
});

// POST para teste
app.post("/", async (c) => {
  const body = await c.req.json();
  return c.json({
    message: "POST da rota /api/ia funcionando ✅",
    dataRecebida: body,
  });
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
