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
    // Receber dados do dashboard do frontend
    const dashboardData = await c.req.json();
    
    // Validar dados obrigatórios
    if (!dashboardData.rendimentoMes || !dashboardData.totalTarefas) {
      return c.json({ 
        error: "Dados obrigatórios ausentes", 
        required: ["rendimentoMes", "totalTarefas"],
        received: Object.keys(dashboardData)
      }, 400);
    }

    // Dados do dashboard (agora vindos do frontend)
    const {
      rendimentoMes = 0,
      tarefasPagas = 0,
      tarefasPendentes = 0,
      totalTarefas = 0,
      cotacaoDolar = 5.57
    } = dashboardData;

    // Calcular dados financeiros
    const rendimentoDisponivel = rendimentoMes - totalTarefas;
    const percentualGasto = rendimentoMes > 0 ? (totalTarefas / rendimentoMes) * 100 : 0;
    const percentualDisponivel = 100 - percentualGasto;

    // Obter cotação real do dólar
    const dolarResponse = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL");
    const dolarData = await dolarResponse.json();
    const cotacaoDolarReal = parseFloat(dolarData.USDBRL.bid);

    // Calcular investimento recomendado (30% do salário)
    const investimentoRecomendado = rendimentoMes * 0.30;
    const investimentoDisponivel = Math.max(0, rendimentoDisponivel * 0.30);

    // Conversões para dólar
    const investimentoUSD = convertBRLtoUSD(investimentoRecomendado, cotacaoDolarReal);
    const investimentoDisponivelUSD = convertBRLtoUSD(investimentoDisponivel, cotacaoDolarReal);

    // Análise de economia - situação crítica se gastos > 100%
    const precisaEconomizar = percentualGasto > 100;
    const economiaRecomendada = percentualGasto > 100 ? (totalTarefas - rendimentoMes) : 0;

    // Construir prompt para Gemini com dados dinâmicos
    const prompt = `
ANÁLISE FINANCEIRA DINÂMICA:

RENDIMENTOS:
- Salário mensal: ${formatToBRL(rendimentoMes)}
- Rendimento disponível: ${formatToBRL(rendimentoDisponivel)} ${rendimentoDisponivel < 0 ? '(NEGATIVO!)' : ''}
- Percentual gasto: ${percentualGasto.toFixed(1)}% ${percentualGasto > 100 ? '(CRÍTICO!)' : ''}
- Percentual disponível: ${percentualDisponivel.toFixed(1)}% ${percentualDisponivel < 0 ? '(NEGATIVO!)' : ''}

DESPESAS:
- Tarefas pagas: ${formatToBRL(tarefasPagas)}
- Tarefas pendentes: ${formatToBRL(tarefasPendentes)}
- Total de despesas: ${formatToBRL(totalTarefas)}

SITUAÇÃO:
- Déficit mensal: ${formatToBRL(Math.abs(rendimentoDisponivel))}
- Despesas são ${percentualGasto.toFixed(1)}% do rendimento
- Necessário economizar: ${formatToBRL(economiaRecomendada)}

INVESTIMENTO:
- Valor recomendado: ${formatToBRL(investimentoRecomendado)} (${investimentoUSD.usd})
- Valor disponível para investir: ${formatToBRL(investimentoDisponivel)} (${investimentoDisponivelUSD.usd})
- Cotação do dólar: ${formatToBRL(cotacaoDolarReal)}

ANÁLISE NECESSÁRIA:
1. Precisa economizar? ${precisaEconomizar ? 'SIM' : 'NÃO'} ${percentualGasto > 100 ? '(CRÍTICO)' : ''}
2. Economia recomendada: ${formatToBRL(economiaRecomendada)}
3. Estratégia baseada na situação atual
4. Dicas de economia apropriadas
5. Priorização de pagamentos
6. Redução de despesas se necessário

Forneça uma análise personalizada em JSON com:
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
      // Fallback se a IA não retornar JSON válido - ANÁLISE DINÂMICA
      const statusEconomia = percentualGasto > 100 ? "critico" : percentualGasto > 70 ? "regular" : "bom";
      
      analysisResult = {
        statusEconomia,
        precisaEconomizar: percentualGasto > 70,
        economiaRecomendada,
        estrategiaInvestimento: {
          curtoPrazo: percentualGasto > 100 
            ? "🚨 EMERGÊNCIA: Reduzir despesas imediatamente"
            : percentualGasto > 70
            ? "⚠️ ATENÇÃO: Reduzir despesas urgentemente"
            : "✅ Manter reserva de emergência de 6 meses",
          medioPrazo: percentualGasto > 70
            ? "📊 Reestruturar orçamento completamente"
            : "💰 Diversificar em CDB e fundos conservadores",
          longoPrazo: percentualGasto > 70
            ? "💰 Focar em aumentar renda e reduzir dívidas"
            : "🚀 Investir em dólar para proteção cambial"
        },
        dicasEconomia: percentualGasto > 100 ? [
          "🚨 URGENTE: Reduzir despesas em pelo menos 80%",
          "📋 Priorizar pagamento das dívidas mais caras",
          "💰 Negociar parcelamento das despesas pendentes",
          "📊 Revisar TODAS as despesas mensais",
          "🎯 Estabelecer metas de economia de 90%",
          "⚠️ Não fazer novos gastos até equilibrar"
        ] : percentualGasto > 70 ? [
          "⚠️ Reduzir despesas urgentemente",
          "📊 Revisar todas as despesas mensais",
          "🎯 Estabelecer metas de economia de 20%",
          "💰 Identificar despesas desnecessárias"
        ] : [
          "✅ Excelente controle financeiro!",
          "💡 Continue mantendo as despesas baixas",
          "🚀 Aproveite para aumentar os investimentos",
          "📈 Considere diversificar mais os investimentos"
        ],
        distribuicaoInvestimento: percentualGasto > 100 ? {
          poupanca: 0, // Foco em reserva de emergência
          dolar: 0,    // Não investir até equilibrar
          outros: 0    // Foco total em economia
        } : percentualGasto > 70 ? {
          poupanca: 60, // Foco em segurança
          dolar: 20,    // Proteção cambial
          outros: 20    // Diversificação
        } : {
          poupanca: 30, // Reserva de emergência
          dolar: 35,    // Proteção cambial
          outros: 35    // Diversificação
        },
        resumo: percentualGasto > 100 
          ? `🚨 SITUAÇÃO CRÍTICA: Você está gastando ${percentualGasto.toFixed(1)}% da renda (déficit de ${formatToBRL(Math.abs(rendimentoDisponivel))}). Ação imediata necessária.`
          : percentualGasto > 70
          ? `⚠️ SITUAÇÃO REGULAR: Você está gastando ${percentualGasto.toFixed(1)}% da renda. Foque em reduzir despesas.`
          : `✅ EXCELENTE CONTROLE: Você está gastando apenas ${percentualGasto.toFixed(1)}% da renda. Pode investir ${formatToBRL(investimentoRecomendado)}.`
      };
    }

    return c.json({
      success: true,
      data: {
        dashboard: {
          rendimentoMes: rendimentoMes,
          rendimentoMesBRL: formatToBRL(rendimentoMes),
          rendimentoDisponivel: rendimentoDisponivel,
          rendimentoDisponivelBRL: formatToBRL(rendimentoDisponivel),
          percentualGasto: percentualGasto,
          percentualDisponivel: percentualDisponivel,
          tarefasPagas: tarefasPagas,
          tarefasPagasBRL: formatToBRL(tarefasPagas),
          tarefasPendentes: tarefasPendentes,
          tarefasPendentesBRL: formatToBRL(tarefasPendentes),
          totalTarefas: totalTarefas,
          totalTarefasBRL: formatToBRL(totalTarefas)
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