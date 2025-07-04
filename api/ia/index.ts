import { Hono } from "hono";
import { OpenAI } from "openai";

const app = new Hono();

app.post("/api/ia", async (c) => {
  const { income, expenses } = await c.req.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!, // Não depende do Supabase
  });

  const prompt = `Renda: R$ ${income}, Gastos: R$ ${expenses}. Sugira um investimento.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  return c.json({ advice: completion.choices[0].message.content });
});

export const POST = app.fetch;
