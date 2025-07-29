import { Hono } from "hono";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseClient } from "../config/supabaseClient";
// Função para formatar valores em BRL
const formatToBRL = (value: number | string) => {
  const number = typeof value === 'string' ? Number(value) : value;
  if (isNaN(number)) return 'Valor inválido';
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(number);
};

export const config = { runtime: "edge" };

const app = new Hono();

// Função para converter BRL para USD
const convertBRLtoUSD = (brlValue: number, dolarRate: number) => {
  const usdValue = brlValue / dolarRate;
  return {
    brl: formatToBRL(brlValue),
    usd: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdValue)
  };
};

app.post("/api/ia/analise-investimento", async (c) => {
  // Declarar variáveis no escopo da função
  let rendimentoMes = 0;
  let tarefasPagas = 0;
  let tarefasPendentes = 0;
  let totalTarefas = 0;
  let rendimentoDisponivel = 0;
  let percentualGasto = 0;
  let percentualDisponivel = 0;
  let investimentoRecomendado = 0;
  let investimentoDisponivel = 0;
  let cotacaoDolarReal = 0;
  let economiaRecomendada = 0;
  let precisaEconomizar = false;

  try {
    const supabase = getSupabaseClient(c);
    
    // Buscar dados reais do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return c.json({ error: "Usuário não autenticado" }, 401);
    }

    // Buscar rendimentos do usuário (sempre dados mais recentes)
    const { data: incomes, error: incomesError } = await supabase
      .from("incomes")
      .select("valor, mes, ano, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (incomesError) {
      return c.json({ error: "Erro ao buscar rendimentos", details: incomesError.message }, 500);
    }

    // Buscar tarefas do usuário (sempre dados mais recentes)
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("price, paid, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (tasksError) {
      return c.json({ error: "Erro ao buscar tarefas", details: tasksError.message }, 500);
    }

    // Calcular dados financeiros reais com logs para debug
    rendimentoMes = incomes?.reduce((sum, income) => sum + parseFloat(income.valor), 0) || 0;
    tarefasPagas = tasks?.filter(task => task.paid).reduce((sum, task) => sum + parseFloat(task.price), 0) || 0;
    tarefasPendentes = tasks?.filter(task => !task.paid).reduce((sum, task) => sum + parseFloat(task.price), 0) || 0;
    totalTarefas = tarefasPagas + tarefasPendentes;

    // Logs para debug
    console.log("Dados reais do Supabase:", {
      userId: user.id,
      totalIncomes: incomes?.length || 0,
      totalTasks: tasks?.length || 0,
      tasksPaid: tasks?.filter(t => t.paid).length || 0,
      tasksPending: tasks?.filter(t => !t.paid).length || 0,
      rendimentoMes,
      tarefasPagas,
      tarefasPendentes,
      totalTarefas
    });

    // Calcular dados financeiros
    rendimentoDisponivel = rendimentoMes - totalTarefas;
    percentualGasto = rendimentoMes > 0 ? (totalTarefas / rendimentoMes) * 100 : 0;
    percentualDisponivel = 100 - percentualGasto;

    // Obter cotação real do dólar
    const dolarResponse = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL");
    const dolarData = await dolarResponse.json();
    cotacaoDolarReal = parseFloat(dolarData.USDBRL.bid);

    // Calcular investimento recomendado (30% do salário)
    investimentoRecomendado = rendimentoMes * 0.30;
    investimentoDisponivel = Math.max(0, rendimentoDisponivel * 0.30);

    // Conversões para dólar
    const investimentoUSD = convertBRLtoUSD(investimentoRecomendado, cotacaoDolarReal);
    const investimentoDisponivelUSD = convertBRLtoUSD(investimentoDisponivel, cotacaoDolarReal);

    // Análise de economia - situação crítica se gastos > 100%
    precisaEconomizar = percentualGasto > 100;
    economiaRecomendada = percentualGasto > 100 ? (totalTarefas - rendimentoMes) : 0;

    // Construir prompt para Gemini com dados reais do banco
    const prompt = `
🚨 ANÁLISE FINANCEIRA CRÍTICA - DADOS REAIS DO BANCO:

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
          valor: cotacaoDolarReal,
          valorBRL: formatToBRL(cotacaoDolarReal),
          timestamp: dolarData.USDBRL.create_date
        },
        analise: analysisResult,
        metadata: {
          timestamp: new Date().toISOString(),
          fonte: "Dados Reais do Supabase",
          versao: "5.2",
          ia: "Google Gemini",
          respostaIA: aiResponse.substring(0, 200) + "...",
          dadosReais: {
            totalRendimentos: incomes?.length || 0,
            totalTarefas: tasks?.length || 0,
            tarefasPagasCount: tasks?.filter(t => t.paid).length || 0,
            tarefasPendentesCount: tasks?.filter(t => !t.paid).length || 0,
            ultimaAtualizacao: new Date().toISOString(),
            cacheControl: "no-cache"
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

app.get("/api/ia/analise-investimento", async (c) => {
  try {
    const supabase = getSupabaseClient(c);
    
    // Buscar dados reais do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return c.json({ error: "Usuário não autenticado" }, 401);
    }

    // Buscar rendimentos do usuário
    const { data: incomes, error: incomesError } = await supabase
      .from("incomes")
      .select("valor, mes, ano, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (incomesError) {
      return c.json({ error: "Erro ao buscar rendimentos", details: incomesError.message }, 500);
    }

    // Buscar tarefas do usuário
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("price, paid, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (tasksError) {
      return c.json({ error: "Erro ao buscar tarefas", details: tasksError.message }, 500);
    }

    // Calcular dados financeiros reais
    const rendimentoMes = incomes?.reduce((sum, income) => sum + parseFloat(income.valor), 0) || 0;
    const tarefasPagas = tasks?.filter(task => task.paid).reduce((sum, task) => sum + parseFloat(task.price), 0) || 0;
    const tarefasPendentes = tasks?.filter(task => !task.paid).reduce((sum, task) => sum + parseFloat(task.price), 0) || 0;
    const totalTarefas = tarefasPagas + tarefasPendentes;

    return c.json({
      success: true,
      debug: {
        userId: user.id,
        timestamp: new Date().toISOString(),
        dadosReais: {
          totalRendimentos: incomes?.length || 0,
          totalTarefas: tasks?.length || 0,
          tarefasPagasCount: tasks?.filter(t => t.paid).length || 0,
          tarefasPendentesCount: tasks?.filter(t => !t.paid).length || 0,
          rendimentoMes,
          tarefasPagas,
          tarefasPendentes,
        },
        rendimentos: incomes?.slice(0, 5),
        tarefas: tasks?.slice(0, 5)
      }
    });
  } catch (error: any) {
    return c.json({ error: "Erro no debug", details: error.message }, 500);
  }
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch; 