import { Hono } from "hono";
import { OpenAI } from "openai";
import { handleOptions } from "../config/apiHeader"; // se tiver CORS

export const config = { runtime: "edge" };

const app = new Hono();

app.options("/api/ia", () => handleOptions()); // opcional, se usar CORS

app.post("/api/ia", async (c) => {
  const { income, expenses } = await c.req.json();

  if (!income || !expenses) {
    return c.json({ error: "Dados obrigatórios." }, 400);
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

  const advice = completion.choices[0].message.content;

  return c.json({ advice });
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
