import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { getSupabaseClient } from "../config/supabaseClient";
import OpenAI from "openai";

export const config = { runtime: "edge" };

const app = new Hono();

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// CORS
app.options("/", () => handleOptions());

// GET para teste
app.get("/", (c) => {
  return c.json({ message: "GET da rota /api/ia funcionando ✅" });
});

// POST para análise de investimentos
app.post("/", async (c) => {
  try {
    const supabase = getSupabaseClient(c);

    // Verificar autenticação
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return c.json({ error: "Usuário não autenticado" }, 401);
    }

    // Buscar rendimentos do usuário
    const { data: incomes, error: incomesError } = await supabase
      .from("incomes")
      .select("*")
      .eq("user_id", user.id);

    if (incomesError) {
      return c.json({ error: "Erro ao buscar rendimentos" }, 500);
    }

    // Define o tipo para o objeto de agrupamento
    type MonthlyTotal = {
      mes: string;
      ano: number;
      total: number;
      quantidade: number;
    };

    // Calcular totais por mês
    const monthlyTotals: Record<string, MonthlyTotal> = incomes.reduce((acc, income) => {
      const key = `${income.mes}_${income.ano}`;
      if (!acc[key]) {
        acc[key] = {
          mes: income.mes,
          ano: income.ano,
          total: 0,
          quantidade: 0
        };
      }
      acc[key].total += parseFloat(income.valor);
      acc[key].quantidade += 1;
      return acc;
    }, {} as Record<string, MonthlyTotal>);

    const totalsArray = Object.values(monthlyTotals);
    const totalAnual = totalsArray.reduce((sum: number, month: MonthlyTotal) => sum + month.total, 0);
    const mediaMensal = totalAnual / 12;

    // Obter cotação do dólar
    const dolarResponse = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL");
    const dolarData = await dolarResponse.json();
    const cotacaoDolar = parseFloat(dolarData.USDBRL.bid);

    // Preparar dados para análise da IA
    const analysisData = {
      rendimentos: incomes,
      totaisMensais: totalsArray,
      totalAnual,
      mediaMensal,
      cotacaoDolar,
      perfilUsuario: {
        rendaMensal: mediaMensal,
        estabilidade: incomes.length > 6 ? "Estável" : "Variável",
        diversificacao: incomes.length > 3 ? "Boa" : "Limitada"
      }
    };

    // Prompt para análise da IA
    const prompt = `
Analise os dados financeiros do usuário e forneça recomendações de investimento:

DADOS DO USUÁRIO:
- Total Anual: R$ ${totalAnual.toFixed(2)}
- Média Mensal: R$ ${mediaMensal.toFixed(2)}
- Cotação do Dólar: R$ ${cotacaoDolar.toFixed(2)}
- Quantidade de rendimentos: ${incomes.length}
- Perfil: ${analysisData.perfilUsuario.estabilidade}

RENDIMENTOS POR MÊS:
${totalsArray.map((m: MonthlyTotal) => `- ${m.mes}/${m.ano}: R$ ${m.total.toFixed(2)}`).join('\n')}

ANÁLISE DETALHADA:
1. Avalie a estabilidade dos rendimentos
2. Compare investimento em dólar vs poupança
3. Considere a inflação brasileira
4. Sugira estratégias de diversificação
5. Recomende percentuais de alocação

Responda em JSON com a seguinte estrutura:
{
  "analise": {
    "estabilidade": "texto",
    "tendencia": "texto",
    "risco": "texto"
  },
  "recomendacoes": {
    "dolar": {
      "percentual": 0-100,
      "justificativa": "texto",
      "risco": "texto"
    },
    "poupanca": {
      "percentual": 0-100,
      "justificativa": "texto",
      "risco": "texto"
    },
    "outros": {
      "sugestoes": ["texto"],
      "justificativa": "texto"
    }
  },
  "estrategia": {
    "curtoPrazo": "texto",
    "medioPrazo": "texto",
    "longoPrazo": "texto"
  },
  "cotacaoDolar": ${cotacaoDolar},
  "resumo": "texto resumido"
}
`;

    // Chamar OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Você é um consultor financeiro especializado em análise de rendimentos e recomendações de investimento. Seja objetivo, prático e baseado em dados reais."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = completion.choices[0].message.content;
    let analysisResult;

    try {
      // Tentar fazer parse do JSON da resposta da IA
      analysisResult = JSON.parse(aiResponse || "{}");
    } catch (error) {
      // Se não conseguir fazer parse, criar uma resposta estruturada
      analysisResult = {
        analise: {
          estabilidade: "Análise baseada nos dados fornecidos",
          tendencia: "Tendência calculada pelos dados",
          risco: "Avaliação de risco"
        },
        recomendacoes: {
          dolar: {
            percentual: 30,
            justificativa: "Diversificação cambial recomendada",
            risco: "Médio"
          },
          poupanca: {
            percentual: 40,
            justificativa: "Segurança e liquidez",
            risco: "Baixo"
          },
          outros: {
            sugestoes: ["Fundos de investimento", "CDB"],
            justificativa: "Diversificação adicional"
          }
        },
        estrategia: {
          curtoPrazo: "Manter reserva de emergência",
          medioPrazo: "Diversificar investimentos",
          longoPrazo: "Foco em crescimento patrimonial"
        },
        cotacaoDolar: cotacaoDolar,
        resumo: aiResponse || "Análise financeira personalizada"
      };
    }

    return c.json({
      success: true,
      data: analysisResult,
      metadata: {
        totalRendimentos: incomes.length,
        totalAnual,
        mediaMensal,
        cotacaoDolar,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("Erro na análise IA:", error);
    return c.json({ 
      error: "Erro na análise de investimentos",
      details: error.message 
    }, 500);
  }
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
