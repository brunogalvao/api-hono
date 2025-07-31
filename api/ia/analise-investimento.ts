import { Hono } from "hono";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getSupabaseClient } from "../config/supabaseClient";

export const config = { runtime: "edge" };

const app = new Hono();

// Função para formatar valores em BRL
const formatToBRL = (value: number | string) => {
    const number = typeof value === "string" ? Number(value) : value;
    if (isNaN(number)) return "Valor inválido";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(number);
};

// Função para converter BRL para USD
const convertBRLtoUSD = (brlValue: number, dolarRate: number) => {
    const usdValue = brlValue / dolarRate;
    return {
        brl: formatToBRL(brlValue),
        usd: new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(usdValue),
    };
};

// Função para análise local inteligente (sem IA externa)
const analiseLocalInteligente = (
    rendimentoMes: number,
    tarefasPagas: number,
    tarefasPendentes: number,
    totalTarefas: number,
    rendimentoDisponivel: number,
    percentualGasto: number,
    economiaRecomendada: number,
) => {
    // 🎯 ANÁLISE REFINADA POR CENÁRIOS

    // CENÁRIO 1: DÉFICIT (Gastos > Rendimento)
    if (rendimentoDisponivel < 0) {
        const deficitMensal = Math.abs(rendimentoDisponivel);
        const fatorRisco = percentualGasto / 100; // Quantas vezes gasta mais que ganha

        return {
            cenario: "DÉFICIT_CRÍTICO",
            statusEconomia: "CRÍTICO",
            precisaEconomizar: true,
            economiaRecomendada: deficitMensal,
            investimentoRecomendado: 0,
            rendimentoDisponivel: 0,

            analiseDetalhada: {
                rendimentoMensal: `${formatToBRL(rendimentoMes)} - Baixo para as despesas atuais`,
                gastoMensal: `${formatToBRL(totalTarefas)} - ${fatorRisco.toFixed(1)}x maior que a renda`,
                situacaoFinanceira: `DÉFICIT de ${formatToBRL(deficitMensal)} por mês`,
                nivelRisco:
                    fatorRisco > 3
                        ? "EXTREMO"
                        : fatorRisco > 2
                          ? "ALTO"
                          : "MÉDIO",
            },

            estrategiaRecuperacao: {
                prioridade1:
                    "🚨 EMERGÊNCIA: Cortar gastos em 80% imediatamente",
                prioridade2: `💰 URGENTE: Aumentar renda em pelo menos ${formatToBRL(deficitMensal)}`,
                prioridade3:
                    "📊 CRÍTICO: Renegociar todas as dívidas pendentes",
                metaMensal: `Reduzir déficit de ${formatToBRL(deficitMensal)} para zero`,
            },

            acoesPraticas: [
                `Cortar ${formatToBRL(deficitMensal)} em gastos mensais`,
                "Buscar renda extra: freelances, vendas, trabalho extra",
                "Renegociar prazos e valores das dívidas",
                "Cancelar assinaturas e serviços não essenciais",
                "Priorizar apenas gastos básicos (alimentação, moradia)",
                "Estabelecer plano de 90 dias para equilibrar contas",
            ],

            melhoriaEconomica: {
                aumentoRendaMinimo: formatToBRL(deficitMensal),
                reducaoGastosMinima: formatToBRL(deficitMensal * 0.7),
                tempoEstimadoRecuperacao: "3-6 meses com disciplina total",
            },

            resumo: `🚨 SITUAÇÃO CRÍTICA: Déficit mensal de ${formatToBRL(deficitMensal)}. ZERO investimentos. Foque em equilibrar receitas e despesas URGENTEMENTE.`,
        };
    }

    // CENÁRIO 2: EQUILÍBRIO (Gastos ≈ Rendimento)
    if (
        rendimentoDisponivel >= 0 &&
        rendimentoDisponivel <= rendimentoMes * 0.1
    ) {
        const margemSeguranca = rendimentoDisponivel;

        return {
            cenario: "EQUILÍBRIO_FRÁGIL",
            statusEconomia: "REGULAR",
            precisaEconomizar: false,
            economiaRecomendada: 0,
            investimentoRecomendado: 0,
            rendimentoDisponivel: margemSeguranca,

            analiseDetalhada: {
                rendimentoMensal: `${formatToBRL(rendimentoMes)} - Adequado para gastos atuais`,
                gastoMensal: `${formatToBRL(totalTarefas)} - ${percentualGasto.toFixed(1)}% da renda`,
                situacaoFinanceira: `Margem pequena de ${formatToBRL(margemSeguranca)}`,
                nivelRisco: "MÉDIO - Sem margem para emergências",
            },

            estrategiaOtimizacao: {
                foco1: "💰 Criar reserva de emergência de 6 meses",
                foco2: "📈 Aumentar renda em 20-30% para investimentos",
                foco3: "📊 Otimizar gastos para liberar 15% da renda",
                metaMensal: `Criar sobra de ${formatToBRL(rendimentoMes * 0.2)} para investir`,
            },

            acoesPraticas: [
                "Criar reserva de emergência antes de investir",
                `Buscar renda adicional de ${formatToBRL(rendimentoMes * 0.3)}`,
                "Otimizar gastos sem comprometer qualidade de vida",
                "Revisar contratos e negociar melhores preços",
                "Desenvolver habilidades para aumentar renda",
                "Estabelecer metas de economia de 15-20% da renda",
            ],

            melhoriaEconomica: {
                aumentoRendaRecomendado: formatToBRL(rendimentoMes * 0.3),
                reducaoGastosOtima: formatToBRL(totalTarefas * 0.15),
                potencialInvestimento: formatToBRL(rendimentoMes * 0.2),
                tempoParaInvestir: "6-12 meses construindo reserva",
            },

            resumo: `⚖️ EQUILÍBRIO FRÁGIL: Sobra apenas ${formatToBRL(margemSeguranca)}. Foque em aumentar renda e criar reserva antes de investir.`,
        };
    }

    // CENÁRIO 3: SUPERÁVIT (Rendimento > Gastos)
    if (rendimentoDisponivel > rendimentoMes * 0.1) {
        const percentualDisponivel =
            (rendimentoDisponivel / rendimentoMes) * 100;
        const investimentoSeguro = rendimentoDisponivel * 0.7; // 70% do disponível
        const reservaEmergencia = rendimentoDisponivel * 0.3; // 30% para reserva

        return {
            cenario: "SUPERÁVIT_SAUDÁVEL",
            statusEconomia: percentualDisponivel > 30 ? "EXCELENTE" : "BOM",
            precisaEconomizar: false,
            economiaRecomendada: 0,
            investimentoRecomendado: investimentoSeguro,
            rendimentoDisponivel: rendimentoDisponivel,

            analiseDetalhada: {
                rendimentoMensal: `${formatToBRL(rendimentoMes)} - Boa capacidade financeira`,
                gastoMensal: `${formatToBRL(totalTarefas)} - ${percentualGasto.toFixed(1)}% da renda (controle excelente)`,
                situacaoFinanceira: `Sobra de ${formatToBRL(rendimentoDisponivel)} (${percentualDisponivel.toFixed(1)}% da renda)`,
                nivelRisco: "BAIXO - Situação financeira saudável",
            },

            estrategiaInvestimento: {
                valorSeguroInvestir: formatToBRL(investimentoSeguro),
                valorReservaEmergencia: formatToBRL(reservaEmergencia),
                distribuicaoSugerida: {
                    emergencia: `${formatToBRL(reservaEmergencia)} (30% do disponível)`,
                    investimentoConservador: `${formatToBRL(investimentoSeguro * 0.4)} (28% do disponível - Poupança/CDB)`,
                    investimentoModerado: `${formatToBRL(investimentoSeguro * 0.4)} (28% do disponível - Fundos/Dólar)`,
                    investimentoArrojado: `${formatToBRL(investimentoSeguro * 0.2)} (14% do disponível - Ações/Cripto)`,
                },
            },

            acoesPraticas: [
                `Investir até ${formatToBRL(investimentoSeguro)} com segurança`,
                "Manter reserva de emergência sempre atualizada",
                "Diversificar investimentos por níveis de risco",
                "Considerar aumentar percentual investido gradualmente",
                "Estudar opções de investimento de longo prazo",
                "Reavaliar estratégia a cada 3-6 meses",
            ],

            melhoriaEconomica: {
                potencialMaximoInvestimento: formatToBRL(
                    rendimentoDisponivel * 0.8,
                ),
                metaRendimentoAnual: `${(investimentoSeguro * 12 * 0.12).toFixed(0)}% ao ano (estimativa conservadora)`,
                crescimentoPatrimonial: `${formatToBRL(investimentoSeguro * 12)} por ano em investimentos`,
                proximoNivel:
                    percentualDisponivel < 30
                        ? "Aumentar renda para investir mais"
                        : "Otimizar carteira de investimentos",
            },

            resumo: `✅ SITUAÇÃO EXCELENTE: Sobra de ${formatToBRL(rendimentoDisponivel)} mensais. Pode investir ${formatToBRL(investimentoSeguro)} com segurança total.`,
        };
    }

    // Fallback (não deveria chegar aqui)
    return {
        cenario: "INDEFINIDO",
        statusEconomia: "REGULAR",
        precisaEconomizar: false,
        economiaRecomendada: 0,
        investimentoRecomendado: 0,
        rendimentoDisponivel: rendimentoDisponivel,
        resumo: "Análise em processamento...",
    };
};

// Função para tentar Google Gemini com retry e fallback
const tentarGemini = async (prompt: string, tentativas: number = 3) => {
    // Verificar se a API key está disponível
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
        console.log("❌ GEMINI_API_KEY não configurada");
        return null;
    }

    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
        try {
            console.log(
                `🤖 Tentando usar Google Gemini (${tentativa}/${tentativas})...`,
            );

            const genAI = new GoogleGenerativeAI(apiKey);

            // Tentar diferentes modelos se necessário
            const modelosTeste = [
                "gemini-1.5-flash",
                "gemini-1.5-pro",
                "gemini-pro",
            ];

            let model;
            try {
                model = genAI.getGenerativeModel({
                    model: modelosTeste[tentativa - 1] || "gemini-1.5-flash",
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                });
            } catch (modelError) {
                console.log(
                    `⚠️ Modelo ${modelosTeste[tentativa - 1]} não disponível, usando padrão`,
                );
                model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                });
            }

            console.log("📝 Enviando prompt para Gemini...");
            const result = await model.generateContent(prompt);

            console.log("📨 Recebendo resposta do Gemini...");
            const response = await result.response;
            const aiResponse = response.text();

            console.log(
                "📄 Resposta bruta do Gemini:",
                aiResponse.substring(0, 200) + "...",
            );

            // Tentar extrair JSON com múltiplas estratégias
            let parsedResult = null;

            // Estratégia 1: JSON simples
            const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                try {
                    parsedResult = JSON.parse(jsonMatch[0]);
                    console.log("✅ JSON extraído (estratégia 1)");
                } catch (parseError) {
                    console.log("⚠️ Falha na estratégia 1 de parsing");
                }
            }

            // Estratégia 2: JSON em bloco de código
            if (!parsedResult) {
                const alternativeMatch = aiResponse.match(
                    /```json\s*(\{[\s\S]*?\})\s*```/,
                );
                if (alternativeMatch) {
                    try {
                        parsedResult = JSON.parse(alternativeMatch[1]);
                        console.log("✅ JSON extraído (estratégia 2)");
                    } catch (parseError) {
                        console.log("⚠️ Falha na estratégia 2 de parsing");
                    }
                }
            }

            // Estratégia 3: JSON mais permissivo
            if (!parsedResult) {
                const permissiveMatch = aiResponse.match(
                    /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/,
                );
                if (permissiveMatch) {
                    try {
                        parsedResult = JSON.parse(permissiveMatch[0]);
                        console.log("✅ JSON extraído (estratégia 3)");
                    } catch (parseError) {
                        console.log("⚠️ Falha na estratégia 3 de parsing");
                    }
                }
            }

            if (parsedResult) {
                console.log("🎉 Gemini respondeu com sucesso!");
                return parsedResult;
            }

            throw new Error("JSON não encontrado em nenhuma estratégia");
        } catch (error: any) {
            console.log(
                `❌ Erro no Gemini (tentativa ${tentativa}):`,
                error.message,
            );

            // Log detalhado do erro
            if (
                error.message.includes("overloaded") ||
                error.message.includes("503")
            ) {
                console.log(
                    "🔄 Servidor sobrecarregado - tentando novamente...",
                );
                if (tentativa < tentativas) {
                    const delay = Math.min(
                        1000 * Math.pow(2, tentativa - 1),
                        10000,
                    ); // Exponential backoff
                    console.log(
                        `⏳ Aguardando ${delay}ms antes da próxima tentativa...`,
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            } else if (error.message.includes("API_KEY_INVALID")) {
                console.log(
                    "🔑 Erro: API Key inválida - verifique se a chave está correta",
                );
                break; // Não tentar novamente para erros de API key
            } else if (error.message.includes("QUOTA_EXCEEDED")) {
                console.log(
                    "📊 Erro: Quota da API excedida - aguarde ou upgrade seu plano",
                );
                break; // Não tentar novamente para quota excedida
            } else if (error.message.includes("PERMISSION_DENIED")) {
                console.log(
                    "🚫 Erro: Permissão negada - verifique se a API está habilitada",
                );
                break; // Não tentar novamente para permissão negada
            } else if (error.message.includes("SAFETY")) {
                console.log(
                    "🛡️ Erro: Conteúdo bloqueado por segurança - ajuste o prompt",
                );
                break; // Não tentar novamente para filtro de segurança
            } else if (error.name === "SyntaxError") {
                console.log(
                    "📝 Erro: Falha ao parsear JSON - resposta em formato inválido",
                );
                if (tentativa < tentativas) {
                    console.log(
                        "🔄 Tentando novamente com parsing diferente...",
                    );
                    continue;
                }
            } else {
                console.log("🔧 Erro técnico:", error.name, "-", error.message);
                if (tentativa < tentativas) {
                    console.log("🔄 Tentando novamente...");
                    continue;
                }
            }

            // Se chegou até aqui e é a última tentativa, retornar null
            if (tentativa === tentativas) {
                console.log(`💀 Gemini falhou após ${tentativas} tentativas`);
                return null;
            }
        }
    }

    return null;
};

// Função para tentar OpenAI
const tentarOpenAI = async (prompt: string) => {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content:
                        "Você é um consultor financeiro especializado. Responda APENAS com JSON válido.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const aiResponse = completion.choices[0].message.content;
        const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("JSON não encontrado na resposta OpenAI");
    } catch (error: any) {
        console.log("OpenAI não disponível:", error.message);
        return null;
    }
};

app.post("/api/ia/analise-investimento", async (c) => {
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

        // Receber dados do frontend (pode incluir mês/ano específico)
        const requestBody = await c.req.json();
        const { mes, ano, cotacaoDolar } = requestBody;

        // Se não especificar mês/ano, usar atual
        const currentDate = new Date();
        const targetMonth = mes || currentDate.getMonth() + 1;
        const targetYear = ano || currentDate.getFullYear();

        // Buscar rendimentos reais do usuário no Supabase
        const { data: incomes, error: incomesError } = await supabase
            .from("incomes")
            .select("*")
            .eq("user_id", user.id);

        if (incomesError) {
            console.error("Erro ao buscar rendimentos:", incomesError);
            return c.json(
                { error: "Erro ao buscar dados de rendimentos" },
                500,
            );
        }

        // Buscar tarefas/despesas reais do usuário no Supabase
        const { data: tasks, error: tasksError } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", user.id);

        if (tasksError) {
            console.error("Erro ao buscar tarefas:", tasksError);
            return c.json({ error: "Erro ao buscar dados de tarefas" }, 500);
        }

        // Filtrar rendimentos do mês/ano específico
        const rendimentosDoMes =
            incomes?.filter((income) => {
                if (income.mes && income.ano) {
                    return (
                        income.mes === targetMonth && income.ano === targetYear
                    );
                }
                return true; // Se não tem mês/ano, considera todos
            }) || [];

        // Calcular rendimento do mês específico
        const rendimentoMes = rendimentosDoMes.reduce((total, income) => {
            return total + parseFloat(income.valor || "0");
        }, 0);

        // Filtrar tarefas do mês/ano específico se disponível
        const tarefasDoMes =
            tasks?.filter((task) => {
                if (task.mes && task.ano) {
                    return task.mes === targetMonth && task.ano === targetYear;
                }
                return true; // Se não tem mês/ano, considera todas
            }) || [];

        // Calcular tarefas pagas e pendentes
        const tarefasPagas = tarefasDoMes
            .filter((task) => task.done === true)
            .reduce((total, task) => {
                return total + parseFloat(task.price || "0");
            }, 0);

        const tarefasPendentes = tarefasDoMes
            .filter((task) => task.done === false)
            .reduce((total, task) => {
                return total + parseFloat(task.price || "0");
            }, 0);

        // Obter cotação do dólar se não fornecida
        let finalCotacaoDolar = cotacaoDolar;
        if (!finalCotacaoDolar) {
            try {
                const dolarResponse = await fetch(
                    "https://economia.awesomeapi.com.br/last/USD-BRL",
                );
                const dolarData = await dolarResponse.json();
                finalCotacaoDolar = parseFloat(dolarData.USDBRL.bid);
            } catch (error) {
                console.warn(
                    "Erro ao buscar cotação do dólar, usando valor padrão",
                );
                finalCotacaoDolar = 5.5; // Valor padrão
            }
        }

        // Validar se temos dados suficientes
        if (rendimentoMes === 0) {
            return c.json(
                {
                    error: "Nenhum rendimento encontrado",
                    message: "Cadastre seus rendimentos para gerar análise",
                    suggestion:
                        "Use POST /api/incomes para adicionar rendimentos",
                },
                400,
            );
        }

        // Calcular dados financeiros
        const totalTarefas = tarefasPagas + tarefasPendentes;
        const rendimentoDisponivel = rendimentoMes - totalTarefas;
        const percentualGasto =
            rendimentoMes > 0 ? (totalTarefas / rendimentoMes) * 100 : 0;
        const percentualDisponivel = 100 - percentualGasto;

        // Calcular investimento recomendado - ZERO se há déficit
        const investimentoRecomendado =
            rendimentoDisponivel > 0 ? rendimentoMes * 0.3 : 0;
        const investimentoDisponivel = Math.max(0, rendimentoDisponivel * 0.3);

        // Conversões para dólar
        const investimentoUSD = convertBRLtoUSD(
            investimentoRecomendado,
            finalCotacaoDolar,
        );
        const investimentoDisponivelUSD = convertBRLtoUSD(
            investimentoDisponivel,
            finalCotacaoDolar,
        );

        // Análise de economia - situação crítica se gastos > 100%
        const precisaEconomizar = percentualGasto > 100;
        const economiaRecomendada =
            percentualGasto > 100 ? Math.abs(rendimentoDisponivel) : 0;

        // Determinar status econômico baseado no percentual gasto
        let statusEconomico = "BOM";
        if (percentualGasto > 100) {
            statusEconomico = "CRÍTICO";
        } else if (percentualGasto > 80) {
            statusEconomico = "REGULAR";
        }

        // Construir prompt refinado baseado nos cenários financeiros
        const analiseRefinada = analiseLocalInteligente(
            rendimentoMes,
            tarefasPagas,
            tarefasPendentes,
            totalTarefas,
            rendimentoDisponivel,
            percentualGasto,
            economiaRecomendada,
        );

        const prompt = `
🎯 ANÁLISE FINANCEIRA REFINADA POR CENÁRIOS

📊 DADOS FUNDAMENTAIS:
- Rendimento Mensal: ${formatToBRL(rendimentoMes)}
- Gastos Mensais: ${formatToBRL(totalTarefas)}
- Resultado: ${rendimentoDisponivel >= 0 ? "SUPERÁVIT" : "DÉFICIT"} de ${formatToBRL(Math.abs(rendimentoDisponivel))}
- Cenário Identificado: ${analiseRefinada.cenario}

${
    analiseRefinada.cenario === "DÉFICIT_CRÍTICO"
        ? `
🚨 CENÁRIO: DÉFICIT CRÍTICO
O usuário está gastando ${(percentualGasto / 100).toFixed(1)}x mais do que ganha.

ESTRATÉGIA DE RECUPERAÇÃO NECESSÁRIA:
${analiseRefinada.estrategiaRecuperacao?.prioridade1}
${analiseRefinada.estrategiaRecuperacao?.prioridade2}
${analiseRefinada.estrategiaRecuperacao?.prioridade3}

ANÁLISE REQUERIDA:
- Investimento: ${formatToBRL(analiseRefinada.investimentoRecomendado)} (ZERO até equilibrar)
- Economia necessária: ${formatToBRL(analiseRefinada.economiaRecomendada)}
- Foco: Estratégias para eliminar déficit
- Prazo: Máximo 6 meses para equilibrar
`
        : analiseRefinada.cenario === "EQUILÍBRIO_FRÁGIL"
          ? `
⚖️ CENÁRIO: EQUILÍBRIO FRÁGIL
Situação controlada mas sem margem para investimentos seguros.

ESTRATÉGIA DE OTIMIZAÇÃO:
${analiseRefinada.estrategiaOtimizacao?.foco1}
${analiseRefinada.estrategiaOtimizacao?.foco2}
${analiseRefinada.estrategiaOtimizacao?.foco3}

ANÁLISE REQUERIDA:
- Investimento seguro: ${formatToBRL(analiseRefinada.investimentoRecomendado)} (apenas após reserva)
- Foco: Criar margem de segurança e reserva
- Meta: Aumentar renda em 20-30% para investir
`
          : `
✅ CENÁRIO: SUPERÁVIT SAUDÁVEL
Excelente controle financeiro com margem para investimentos.

ESTRATÉGIA DE INVESTIMENTO:
- Valor disponível: ${formatToBRL(rendimentoDisponivel)}
- Investimento seguro: ${formatToBRL(analiseRefinada.investimentoRecomendado)}
- Reserva emergência: ${formatToBRL(rendimentoDisponivel * 0.3)}

ANÁLISE REQUERIDA:
- Distribuição otimizada dos investimentos
- Estratégias de crescimento patrimonial
- Diversificação por perfil de risco
`
}

RESPONDA EM JSON ESTRUTURADO:
{
  "analise": {
    "cenario": "${analiseRefinada.cenario}",
    "statusEconomia": "${analiseRefinada.statusEconomia}",
    "precisaEconomizar": ${analiseRefinada.precisaEconomizar},
    "rendimentoAnalise": "análise do rendimento mensal",
    "gastoAnalise": "análise dos gastos mensais",
    "disponibilidadeInvestimento": "análise da capacidade de investir"
  },
  "recomendacoes": {
    "investimento": {
      "valor": ${analiseRefinada.investimentoRecomendado},
      "justificativa": "baseado na análise de cenário",
      "estrategia": "distribuição conforme perfil"
    },
    "melhoria": {
      "foco": "área prioritária para melhoria",
      "acoes": ["ação1", "ação2", "ação3"],
      "prazos": "cronograma de implementação"
    }
  },
  "resumo": "${analiseRefinada.resumo}"
}
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

        // Tentar múltiplas IAs em ordem de prioridade
        let analysisResult = null;
        let iaUsada = "local";

        // 1. Tentar Google Gemini com retry
        if (process.env.GEMINI_API_KEY) {
            console.log("🚀 Iniciando tentativas com Google Gemini...");
            analysisResult = await tentarGemini(prompt, 3);
            if (analysisResult) {
                iaUsada = "Google Gemini";
                console.log("✅ Análise gerada com sucesso pelo Gemini!");
            } else {
                console.log("⚠️ Gemini falhou, tentando fallback...");
            }
        }

        // 2. Tentar OpenAI se Gemini falhou
        if (!analysisResult && process.env.OPENAI_API_KEY) {
            console.log("🔄 Tentando OpenAI como fallback...");
            analysisResult = await tentarOpenAI(prompt);
            if (analysisResult) {
                iaUsada = "OpenAI";
                console.log("✅ Análise gerada com sucesso pelo OpenAI!");
            } else {
                console.log("⚠️ OpenAI também falhou, usando análise local...");
            }
        }

        // 3. Usar análise local inteligente como fallback garantido
        if (!analysisResult) {
            console.log("🧠 Usando análise local inteligente como fallback...");
            analysisResult = analiseLocalInteligente(
                rendimentoMes,
                tarefasPagas,
                tarefasPendentes,
                totalTarefas,
                rendimentoDisponivel,
                percentualGasto,
                economiaRecomendada,
            );
            iaUsada = "Análise Local Inteligente";
            console.log("✅ Análise local gerada com sucesso!");
        }

        return c.json(
            {
                success: true,
                data: {
                    dashboard: {
                        rendimentoMes: rendimentoMes,
                        rendimentoMesBRL: formatToBRL(rendimentoMes),
                        rendimentoDisponivel: rendimentoDisponivel,
                        rendimentoDisponivelBRL:
                            formatToBRL(rendimentoDisponivel),
                        percentualGasto: percentualGasto,
                        percentualDisponivel: percentualDisponivel,
                        tarefasPagas: tarefasPagas,
                        tarefasPagasBRL: formatToBRL(tarefasPagas),
                        tarefasPendentes: tarefasPendentes,
                        tarefasPendentesBRL: formatToBRL(tarefasPendentes),
                        totalTarefas: totalTarefas,
                        totalTarefasBRL: formatToBRL(totalTarefas),
                    },
                    investimento: {
                        recomendado: investimentoRecomendado,
                        recomendadoBRL: formatToBRL(investimentoRecomendado),
                        recomendadoUSD: investimentoUSD,
                        disponivel: investimentoDisponivel,
                        disponivelBRL: formatToBRL(investimentoDisponivel),
                        disponivelUSD: investimentoDisponivelUSD,
                        percentualSalario: 30,
                    },
                    cotacaoDolar: {
                        valor: finalCotacaoDolar,
                        valorBRL: formatToBRL(finalCotacaoDolar),
                        timestamp: new Date().toISOString(),
                    },
                    analise: analysisResult,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        fonte: "Dados Reais do Supabase",
                        versao: "8.0",
                        ia: iaUsada,
                        usuario: user.id,
                        dadosReais: {
                            totalRendimentos: incomes?.length || 0,
                            totalTarefas: tarefasDoMes.length,
                            mesAno: `${targetMonth}/${targetYear}`,
                            rendimentoMes,
                            tarefasPagas,
                            tarefasPendentes,
                            cotacaoDolar: finalCotacaoDolar,
                            ultimaAtualizacao: new Date().toISOString(),
                        },
                    },
                },
            },
            200,
            {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
            },
        );
    } catch (error: any) {
        return c.json(
            {
                error: "Erro na análise de investimento",
                details: error.message,
            },
            500,
        );
    }
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
