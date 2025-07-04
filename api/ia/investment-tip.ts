// api/ia/investment-tip.ts

import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono();

app.post("/api/ia/investment-tip", async (c) => {
  const body = await c.req.json();
  const { totalIncome, totalPaid } = body;

  const prompt = `
Você é um assistente financeiro. Com base nos dados abaixo, sugira uma dica de investimento simples e prática para o usuário.

- Rendimento total: R$${totalIncome}
- Total pago em despesas: R$${totalPaid}

A resposta deve ser breve (1 ou 2 frases) e em linguagem acessível.
`;

  const openAiResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Você é um consultor financeiro." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    },
  );

  const data = await openAiResponse.json();
  const suggestion = data.choices?.[0]?.message?.content;

  return c.json({ suggestion });
});

export const POST = handle(app);
