import { Hono } from "hono";
import { OpenAI } from "openai";
import { handleOptions } from "../config/apiHeader";

export const config = { runtime: "edge" };

const app = new Hono();

// CORS
app.options("/api/ia/investment-tip", () => handleOptions());

app.post("/api/ia/investment-tip", async (c) => {
  try {
    const { income, expenses } = await c.req.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const prompt = `
      Usuário possui rendimento de R$ ${income} e gastos de R$ ${expenses}.
      Com base nesses valores, sugira um investimento simples e inteligente.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const advice = completion.choices[0].message.content;

    return c.json({ advice });
  } catch (e: any) {
    console.error("❌ Erro ao gerar dica:", e.message);
    return c.json({ error: "Erro ao gerar dica de investimento" }, 500);
  }
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
