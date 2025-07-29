import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { getSupabaseClient } from "../config/supabaseClient";
import { formatToBRL, formatToUSD, convertBRLtoUSD } from "../utils/format";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "edge" };

const app = new Hono();

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

app.options("/api/ia/analise-investimento", () => handleOptions());

app.post("/api/ia/analise-investimento", async (c) => {
  try {
    const supabase = getSupabaseClient(c);
    
    // Simular dados do dashboard (em produção, viriam do frontend)
    const dashboardData = {
      rendimentoMes: 2332.00, // R$ 2.332,00 do dashboard
      tarefasPagas: 123.00,   // R$ 123,00 do dashboard
      tarefasPendentes: 200.00, // R$ 200,00 do dashboard
      totalTarefas: 323.00,   // R$ 323,00 do dashboard
      cotacaoDolar: 5.56      // R$ 5.56 do dashboard
    };

    // Calcular dados financeiros
    const rendimentoDisponivel = dashboardData.rendimentoMes - dashboardData.totalTarefas;
    const percentualGasto = (dashboardData.totalTarefas / dashboardData.rendimentoMes) * 100;
    const percentualDisponivel = 100 - percentualGasto;

    // Obter cotação real do dólar
    const dolarResponse = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL");
    const dolarData = await dolarResponse.json();
    const cotacaoDolarReal = parseFloat(dolarData.USDBRL.bid);

    // Calcular investimento recomendado (30% do salário)
    const investimentoRecomendado = dashboardData.rendimentoMes * 0.30;
    const investimentoDisponivel = Math.max(0, rendimentoDisponivel * 0.30);

    // Conversões para dólar
    const investimentoUSD = convertBRLtoUSD(investimentoRecomendado, cotacaoDolarReal);
    const investimentoDisponivelUSD = convertBRLtoUSD(investimentoDisponivel, cotacaoDolarReal);

    // Análise de economia
    const precisaEconomizar = percentualGasto > 70;
    const economiaRecomendada = precisaEconomizar ? (dashboardData.totalTarefas * 0.20) : 0;

    // Construir prompt para Gemini
    const prompt = `
Analise financeira detalhada:

RENDIMENTOS:
- Salário mensal: ${formatToBRL(dashboardData.rendimentoMes)}
- Rendimento disponível: ${formatToBRL(rendimentoDisponivel)}
- Percentual gasto: ${percentualGasto.toFixed(1)}%
- Percentual disponível: ${percentualDisponivel.toFixed(1)}%

DESPESAS:
- Tarefas pagas: ${formatToBRL(dashboardData.tarefasPagas)}
- Tarefas pendentes: ${formatToBRL(dashboardData.tarefasPendentes)}
- Total de despesas: ${formatToBRL(dashboardData.totalTarefas)}

INVESTIMENTO RECOMENDADO (30% do salário):
- Valor recomendado: ${formatToBRL(investimentoRecomendado)} (${investimentoUSD.usd})
- Valor disponível para investir: ${formatToBRL(investimentoDisponivel)} (${investimentoDisponivelUSD.usd})
- Cotação do dólar: ${formatToBRL(cotacaoDolarReal)}

ANÁLISE NECESSÁRIA:
1. Precisa economizar? ${precisaEconomizar ? 'SIM' : 'NÃO'}
2. Economia recomendada: ${formatToBRL(economiaRecomendada)}
3. Estratégia de investimento baseada na disponibilidade
4. Dicas de economia se necessário
5. Distribuição do investimento (dólar, poupança, outros)

Forneça uma análise completa em JSON com:
- statusEconomia (bom/regular/critico)
- precisaEconomizar (boolean)
- economiaRecomendada (number)
- estrategiaInvestimento (object)
- dicasEconomia (array)
- distribuicaoInvestimento (object)
- resumo (string)

Responda APENAS com o JSON válido, sem texto adicional.
`;

    // Chamar Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    let analysisResult;
    
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON não encontrado na resposta");
      }
    } catch (error) {
      // Fallback se a IA não retornar JSON válido
      const statusEconomia = percentualGasto > 70 ? "critico" : percentualGasto > 50 ? "regular" : "bom";
      
      analysisResult = {
        statusEconomia,
        precisaEconomizar,
        economiaRecomendada,
        estrategiaInvestimento: {
          curtoPrazo: percentualGasto > 70 
            ? "Focar em reduzir despesas antes de investir"
            : "Manter reserva de emergência de 6 meses",
          medioPrazo: percentualGasto > 50
            ? "Diversificar em CDB e fundos conservadores"
            : "Diversificar em CDB, fundos e Tesouro Direto",
          longoPrazo: "Investir em dólar para proteção cambial"
        },
        dicasEconomia: percentualGasto > 70 ? [
          "⚠️ Reduzir despesas urgentemente",
          "📊 Revisar todas as despesas mensais",
          "🎯 Estabelecer metas de economia de 20%"
        ] : percentualGasto > 50 ? [
          "📈 Você pode economizar mais",
          "💰 Identificar despesas desnecessárias",
          "📋 Criar um orçamento mensal"
        ] : [
          "✅ Excelente controle financeiro!",
          "💡 Continue mantendo as despesas baixas",
          "🚀 Aproveite para aumentar os investimentos"
        ],
        distribuicaoInvestimento: percentualGasto > 70 ? {
          poupanca: 60,
          dolar: 20,
          outros: 20
        } : percentualGasto > 50 ? {
          poupanca: 40,
          dolar: 30,
          outros: 30
        } : {
          poupanca: 30,
          dolar: 35,
          outros: 35
        },
        resumo: percentualGasto > 70 
          ? `Situação crítica: Você está gastando ${percentualGasto.toFixed(1)}% da renda. Foque em reduzir despesas.`
          : percentualGasto > 50
          ? `Situação regular: Você está gastando ${percentualGasto.toFixed(1)}% da renda. Pode investir ${formatToBRL(investimentoDisponivel)}.`
          : `Excelente controle! Você está gastando apenas ${percentualGasto.toFixed(1)}% da renda. Pode investir ${formatToBRL(investimentoRecomendado)}.`
      };
    }

    return c.json({
      success: true,
      data: {
        dashboard: {
          rendimentoMes: dashboardData.rendimentoMes,
          rendimentoMesBRL: formatToBRL(dashboardData.rendimentoMes),
          rendimentoDisponivel: rendimentoDisponivel,
          rendimentoDisponivelBRL: formatToBRL(rendimentoDisponivel),
          percentualGasto: percentualGasto,
          percentualDisponivel: percentualDisponivel,
          tarefasPagas: dashboardData.tarefasPagas,
          tarefasPagasBRL: formatToBRL(dashboardData.tarefasPagas),
          tarefasPendentes: dashboardData.tarefasPendentes,
          tarefasPendentesBRL: formatToBRL(dashboardData.tarefasPendentes),
          totalTarefas: dashboardData.totalTarefas,
          totalTarefasBRL: formatToBRL(dashboardData.totalTarefas)
        },
        investimento: {
          recomendado: investimentoRecomendado,
          recomendadoBRL: formatToBRL(investimentoRecomendado),
          recomendadoUSD: investimentoUSD,
          disponivel: investimentoDisponivel,
          disponivelBRL: formatToBRL(investimentoDisponivel),
          disponivelUSD: investimentoDisponivelUSD,
          percentualSalario: 30
        },
        cotacaoDolar: {
          valor: cotacaoDolarReal,
          valorBRL: formatToBRL(cotacaoDolarReal),
          timestamp: dolarData.USDBRL.create_date
        },
        analise: analysisResult,
        metadata: {
          timestamp: new Date().toISOString(),
          fonte: "Dashboard Financeiro",
          versao: "4.0",
          ia: "Google Gemini",
          respostaIA: aiResponse.substring(0, 200) + "..." // Primeiros 200 chars da resposta
        }
      }
    });

  } catch (error: any) {
    return c.json({
      error: "Erro na análise de investimento",
      details: error.message
    }, 500);
  }
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch; 