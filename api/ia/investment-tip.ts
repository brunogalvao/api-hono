import { Hono } from "hono";
import { OpenAI } from "openai";
import { handleOptions } from "../config/apiHeader";

export const config = { runtime: "edge" };

const app = new Hono();

// CORS
app.options("/api/ia/investment-tip", () => handleOptions());

// POST: Gera sugestão de investimento
app.post("/api/ia/investment-tip", async (c) => {
  try {
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

    const prompt = `
      Usuário tem um rendimento mensal de R$ ${income} e gastos mensais de R$ ${expenses}.
      Com base nesses dados, forneça uma sugestão de investimento em até duas frases, de forma direta e acessível.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const advice = completion.choices[0].message.content;
    return c.json({ advice });
  } catch (err) {
    console.error("Erro ao gerar sugestão de investimento:", err);
    return c.json({ error: "Erro ao processar sugestão." }, 500);
  }
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
