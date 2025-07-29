import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { getSupabaseClient } from "../config/supabaseClient";
import { formatToBRL, formatToUSD, convertBRLtoUSD } from "../utils/format";

export const config = { runtime: "edge" };

const app = new Hono();

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

    // Determinar status da economia
    let statusEconomia = "bom";
    if (percentualGasto > 70) statusEconomia = "critico";
    else if (percentualGasto > 50) statusEconomia = "regular";

    // Gerar dicas de economia baseadas nos dados
    const dicasEconomia = [];
    if (percentualGasto > 70) {
      dicasEconomia.push("⚠️ Reduzir despesas urgentemente - você está gastando mais de 70% da renda");
      dicasEconomia.push("📊 Revisar todas as despesas mensais");
      dicasEconomia.push("🎯 Estabelecer metas de economia de 20%");
    } else if (percentualGasto > 50) {
      dicasEconomia.push("📈 Você pode economizar mais - está gastando mais de 50% da renda");
      dicasEconomia.push("💰 Identificar despesas desnecessárias");
      dicasEconomia.push("📋 Criar um orçamento mensal");
    } else {
      dicasEconomia.push("✅ Excelente controle financeiro!");
      dicasEconomia.push("💡 Continue mantendo as despesas baixas");
      dicasEconomia.push("🚀 Aproveite para aumentar os investimentos");
    }

    // Estratégia de investimento baseada na disponibilidade
    const estrategiaInvestimento = {
      curtoPrazo: percentualGasto > 70 
        ? "Focar em reduzir despesas antes de investir"
        : "Manter reserva de emergência de 6 meses",
      medioPrazo: percentualGasto > 50
        ? "Diversificar em CDB e fundos conservadores"
        : "Diversificar em CDB, fundos e Tesouro Direto",
      longoPrazo: "Investir em dólar para proteção cambial"
    };

    // Distribuição do investimento baseada no perfil
    const distribuicaoInvestimento = percentualGasto > 70 ? {
      poupanca: 60, // Mais conservador se gastar muito
      dolar: 20,
      outros: 20
    } : percentualGasto > 50 ? {
      poupanca: 40,
      dolar: 30,
      outros: 30
    } : {
      poupanca: 30, // Mais agressivo se gastar pouco
      dolar: 35,
      outros: 35
    };

    // Resumo personalizado
    const resumo = percentualGasto > 70 
      ? `Situação crítica: Você está gastando ${percentualGasto.toFixed(1)}% da renda. Foque em reduzir despesas antes de investir.`
      : percentualGasto > 50
      ? `Situação regular: Você está gastando ${percentualGasto.toFixed(1)}% da renda. Pode investir ${formatToBRL(investimentoDisponivel)} (${investimentoDisponivelUSD.usd}).`
      : `Excelente controle! Você está gastando apenas ${percentualGasto.toFixed(1)}% da renda. Pode investir ${formatToBRL(investimentoRecomendado)} (${investimentoUSD.usd}).`;

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
        analise: {
          statusEconomia,
          precisaEconomizar,
          economiaRecomendada,
          economiaRecomendadaBRL: formatToBRL(economiaRecomendada),
          estrategiaInvestimento,
          dicasEconomia,
          distribuicaoInvestimento,
          resumo
        },
        metadata: {
          timestamp: new Date().toISOString(),
          fonte: "Dashboard Financeiro",
          versao: "3.0",
          ia: "Cálculos Automáticos",
          nota: "Configure GEMINI_API_KEY no Vercel para análise com IA"
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