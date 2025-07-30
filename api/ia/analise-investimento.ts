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
    const statusEconomia =
        percentualGasto > 100
            ? "critico"
            : percentualGasto > 70
              ? "regular"
              : "bom";

    // Análise baseada em regras financeiras inteligentes
    const analise = {
        statusEconomia,
        precisaEconomizar: percentualGasto > 70,
        economiaRecomendada,
        estrategiaInvestimento: {
            curtoPrazo:
                percentualGasto > 100
                    ? "🚨 EMERGÊNCIA: Reduzir despesas imediatamente"
                    : percentualGasto > 70
                      ? "⚠️ ATENÇÃO: Reduzir despesas urgentemente"
                      : "✅ Manter reserva de emergência de 6 meses",
            medioPrazo:
                percentualGasto > 70
                    ? "📊 Reestruturar orçamento completamente"
                    : "💰 Diversificar em CDB e fundos conservadores",
            longoPrazo:
                percentualGasto > 70
                    ? "💰 Focar em aumentar renda e reduzir dívidas"
                    : "🚀 Investir em dólar para proteção cambial",
        },
        dicasEconomia:
            percentualGasto > 100
                ? [
                      "🚨 URGENTE: Reduzir despesas em pelo menos 80%",
                      "📋 Priorizar pagamento das dívidas mais caras",
                      "💰 Negociar parcelamento das despesas pendentes",
                      "📊 Revisar TODAS as despesas mensais",
                      "🎯 Estabelecer metas de economia de 90%",
                      "⚠️ Não fazer novos gastos até equilibrar",
                  ]
                : percentualGasto > 70
                  ? [
                        "⚠️ Reduzir despesas urgentemente",
                        "📊 Revisar todas as despesas mensais",
                        "🎯 Estabelecer metas de economia de 20%",
                        "💰 Identificar despesas desnecessárias",
                    ]
                  : [
                        "✅ Excelente controle financeiro!",
                        "💡 Continue mantendo as despesas baixas",
                        "🚀 Aproveite para aumentar os investimentos",
                        "📈 Considere diversificar mais os investimentos",
                    ],
        distribuicaoInvestimento:
            percentualGasto > 100
                ? {
                      poupanca: 0,
                      dolar: 0,
                      outros: 0,
                  }
                : percentualGasto > 70
                  ? {
                        poupanca: 60,
                        dolar: 20,
                        outros: 20,
                    }
                  : {
                        poupanca: 30,
                        dolar: 35,
                        outros: 35,
                    },
        resumo:
            percentualGasto > 100
                ? `🚨 SITUAÇÃO CRÍTICA: Você está gastando ${percentualGasto.toFixed(1)}% da renda (déficit de ${formatToBRL(Math.abs(rendimentoDisponivel))}). Ação imediata necessária.`
                : percentualGasto > 70
                  ? `⚠️ SITUAÇÃO REGULAR: Você está gastando ${percentualGasto.toFixed(1)}% da renda. Foque em reduzir despesas.`
                  : `✅ EXCELENTE CONTROLE: Você está gastando apenas ${percentualGasto.toFixed(1)}% da renda. Pode investir ${formatToBRL(rendimentoMes * 0.3)}.`,
    };

    return analise;
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

        // Calcular investimento recomendado (30% do salário)
        const investimentoRecomendado = rendimentoMes * 0.3;
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
            percentualGasto > 100 ? totalTarefas - rendimentoMes : 0;

        // Construir prompt para IA
        const prompt = `
🚨 ANÁLISE FINANCEIRA CRÍTICA - DADOS DO FRONTEND:

SITUAÇÃO ATUAL:
- Renda mensal: ${formatToBRL(rendimentoMes)}
- Despesas totais: ${formatToBRL(totalTarefas)}
- Déficit mensal: ${formatToBRL(Math.abs(rendimentoDisponivel))}
- Percentual gasto: ${percentualGasto.toFixed(1)}% ${percentualGasto > 100 ? "🚨 CRÍTICO - GASTANDO MAIS QUE GANHA!" : ""}

DETALHAMENTO:
- Tarefas pagas: ${formatToBRL(tarefasPagas)}
- Tarefas pendentes: ${formatToBRL(tarefasPendentes)}
- Rendimento disponível: ${formatToBRL(rendimentoDisponivel)} ${rendimentoDisponivel < 0 ? "🚨 NEGATIVO!" : ""}

SITUAÇÃO CRÍTICA:
${percentualGasto > 100 ? "🚨 EMERGÊNCIA: Você está gastando " + percentualGasto.toFixed(1) + "% da renda!" : ""}
${rendimentoDisponivel < 0 ? "🚨 DÉFICIT: Você precisa de " + formatToBRL(Math.abs(rendimentoDisponivel)) + " a mais por mês!" : ""}

ANÁLISE NECESSÁRIA:
1. Status da economia: ${percentualGasto > 100 ? "CRÍTICO" : percentualGasto > 70 ? "REGULAR" : "BOM"}
2. Precisa economizar: ${precisaEconomizar ? "SIM - URGENTE!" : "NÃO"}
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
