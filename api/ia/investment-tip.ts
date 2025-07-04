import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = async (req: Request) => {
  const { income, expenses } = await req.json();

  const prompt = `
    Usuário tem rendimento mensal de R$ ${income} e gastos totais de R$ ${expenses}.
    Sugira uma dica de investimento em até 2 frases considerando esse perfil.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return new Response(
    JSON.stringify({ advice: completion.choices[0].message.content }),
    { status: 200 },
  );
};
