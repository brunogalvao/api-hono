import { Hono } from "hono";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "edge" };

const app = new Hono();

// Função para formatar valores em BRL
const formatToBRL = (value: number | string) => {
  const number = typeof value === 'string' ? Number(value) : value;
  if (isNaN(number)) return 'Valor inválido';
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(number);
};

// Função para converter BRL para USD
const convertBRLtoUSD = (brlValue: number, dolarRate: number) => {
  const usdValue = brlValue / dolarRate;
  return {
    brl: formatToBRL(brlValue),
    usd: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdValue)
  };
};

app.post("/api/ia/analise-investimento", async (c) => {
  try {
    // Receber dados do frontend
    const { rendimentoMes, tarefasPagas, tarefasPendentes, cotacaoDolar } = await c.req.json();
    
    // Validar dados obrigatórios
    if (!rendimentoMes || !tarefasPagas || !tarefasPendentes || !cotacaoDolar) {
      return c.json({ 
        error: "Dados obrigatórios ausentes", 
        required: ["rendimentoMes", "tarefasPagas", "tarefasPendentes", "cotacaoDolar"] 
      }, 400);
    }

    // Calcular dados financeiros
    const totalTarefas = tarefasPagas + tarefasPendentes;
    const rendimentoDisponivel = rendimentoMes - totalTarefas;
    const percentualGasto = rendimentoMes > 0 ? (totalTarefas / rendimentoMes) * 100 : 0;
    const percentualDisponivel = 100 - percentualGasto;

    // Calcular investimento recomendado (30% do salário)
    const investimentoRecomendado = rendimentoMes * 0.30;
    const investimentoDisponivel = Math.max(0, rendimentoDisponivel * 0.30);

    // Conversões para dólar
    const investimentoUSD = convertBRLtoUSD(investimentoRecomendado, cotacaoDolar);
    const investimentoDisponivelUSD = convertBRLtoUSD(investimentoDisponivel, cotacaoDolar);

    // Análise de economia - situação crítica se gastos > 100%
    const precisaEconomizar = percentualGasto > 100;
    const economiaRecomendada = percentualGasto > 100 ? (totalTarefas - rendimentoMes) : 0;

    // Construir prompt para Gemini com dados do frontend
    const prompt = `
🚨 ANÁLISE FINANCEIRA CRÍTICA - DADOS DO FRONTEND:

SITUAÇÃO ATUAL:
- Renda mensal: ${formatToBRL(rendimentoMes)}
- Despesas totais: ${formatToBRL(totalTarefas)}
- Déficit mensal: ${formatToBRL(Math.abs(rendimentoDisponivel))}
- Percentual gasto: ${percentualGasto.toFixed(1)}% ${percentualGasto > 100 ? '🚨 CRÍTICO - GASTANDO MAIS QUE GANHA!' : ''}

DETALHAMENTO:
- Tarefas pagas: ${formatToBRL(tarefasPagas)}
- Tarefas pendentes: ${formatToBRL(tarefasPendentes)}
- Rendimento disponível: ${formatToBRL(rendimentoDisponivel)} ${rendimentoDisponivel < 0 ? '🚨 NEGATIVO!' : ''}

SITUAÇÃO CRÍTICA:
${percentualGasto > 100 ? '🚨 EMERGÊNCIA: Você está gastando ' + percentualGasto.toFixed(1) + '% da renda!' : ''}
${rendimentoDisponivel < 0 ? '🚨 DÉFICIT: Você precisa de ' + formatToBRL(Math.abs(rendimentoDisponivel)) + ' a mais por mês!' : ''}

ANÁLISE NECESSÁRIA:
1. Status da economia: ${percentualGasto > 100 ? 'CRÍTICO' : percentualGasto > 70 ? 'REGULAR' : 'BOM'}
2. Precisa economizar: ${precisaEconomizar ? 'SIM - URGENTE!' : 'NÃO'}
3. Economia recomendada: ${formatToBRL(economiaRecomendada)}
4. Estratégia de emergência se necessário
5. Priorização de pagamentos críticos
6. Redução imediata de despesas

Forneça uma análise personalizada em JSON com:
- statusEconomia (bom/regular/critico)
- precisaEconomizar (boolean)
- economiaRecomendada (number)
- estrategiaInvestimento (object com curtoPrazo, medioPrazo, longoPrazo)
- dicasEconomia (array de strings)
- distribuicaoInvestimento (object com poupanca, dolar, outros)
- resumo (string)

IMPORTANTE: Se percentualGasto > 100%, a situação é CRÍTICA e precisa de ação imediata!
Responda APENAS com o JSON válido, sem texto adicional.
`;

    // Chamar Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
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
          poupanca: 0,
          dolar: 0,
          outros: 0
        } : percentualGasto > 70 ? {
          poupanca: 60,
          dolar: 20,
          outros: 20
        } : {
          poupanca: 30,
          dolar: 35,
          outros: 35
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
          valor: cotacaoDolar,
          valorBRL: formatToBRL(cotacaoDolar),
          timestamp: new Date().toISOString()
        },
        analise: analysisResult,
        metadata: {
          timestamp: new Date().toISOString(),
          fonte: "Dados do Frontend",
          versao: "6.0",
          ia: "Google Gemini",
          respostaIA: aiResponse.substring(0, 200) + "...",
          dadosRecebidos: {
            rendimentoMes,
            tarefasPagas,
            tarefasPendentes,
            cotacaoDolar,
            ultimaAtualizacao: new Date().toISOString()
          }
        }
      }
    }, 200, {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
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