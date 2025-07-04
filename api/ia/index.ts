import { Hono } from "hono";
import { OpenAI } from "openai";
import { handleOptions } from "../config/apiHeader";

export const config = { runtime: "edge" };

const app = new Hono();

app.options("/api/ia", () => handleOptions());

app.post("/api/ia", async (c) => {
  const { income, expenses } = await c.req.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const prompt = `Renda: R$ ${income}, Gastos: R$ ${expenses}. Sugira um investimento.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  return c.json({ advice: completion.choices[0].message.content });
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
