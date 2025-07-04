import { Hono } from "hono";
import { OpenAI } from "openai";
import { handleOptions } from "../config/apiHeader"; // ou ajuste o path se estiver diferente

export const config = { runtime: "edge" };

const app = new Hono();

// CORS (opcional)
app.options("/api/ia", () => handleOptions());

// POST route
app.post("/api/ia", async (c) => {
  const { income, expenses } = await c.req.json();

  if (!income || !expenses) {
    return c.json(
      { error: "Valores de income e expenses são obrigatórios." },
      400,
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const prompt = `Renda: R$ ${income}, Gastos: R$ ${expenses}. Sugira um investimento.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return c.json({ advice: completion.choices[0].message.content });
});

// Exporte corretamente
export const POST = app.fetch;
export const OPTIONS = app.fetch;
