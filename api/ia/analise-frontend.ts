import { Hono } from "hono";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

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
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
            });

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
                    );
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
                break;
            } else if (error.message.includes("QUOTA_EXCEEDED")) {
                console.log(
                    "📊 Erro: Quota da API excedida - aguarde ou upgrade seu plano",
                );
                break;
            }

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

// Endpoint para análise com dados fornecidos pelo frontend
app.post("/api/ia/analise-frontend", async (c) => {
    try {
        console.log("📊 Iniciando análise com dados do frontend...");

        // Receber dados do frontend
        const { rendimentoMes, tarefasPagas, tarefasPendentes, cotacaoDolar } =
            await c.req.json();

        // Validar dados obrigatórios
        if (
            !rendimentoMes ||
            tarefasPagas === undefined ||
            tarefasPendentes === undefined ||
            !cotacaoDolar
        ) {
            return c.json(
                {
                    error: "Dados obrigatórios ausentes",
                    required: [
                        "rendimentoMes",
                        "tarefasPagas",
                        "tarefasPendentes",
                        "cotacaoDolar",
                    ],
                    received: {
                        rendimentoMes: !!rendimentoMes,
                        tarefasPagas: tarefasPagas !== undefined,
                        tarefasPendentes: tarefasPendentes !== undefined,
                        cotacaoDolar: !!cotacaoDolar,
                    },
                },
                400,
            );
        }

        console.log("📋 Dados recebidos:", {
            rendimentoMes,
            tarefasPagas,
            tarefasPendentes,
            cotacaoDolar,
        });

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
            cotacaoDolar,
        );
        const investimentoDisponivelUSD = convertBRLtoUSD(
            investimentoDisponivel,
            cotacaoDolar,
        );

        // Análise de economia
        const precisaEconomizar = percentualGasto > 100;
        const economiaRecomendada =
            percentualGasto > 100 ? totalTarefas - rendimentoMes : 0;

        // Construir prompt para IA
        const prompt = `
🚨 ANÁLISE FINANCEIRA - DADOS DO FRONTEND:

SITUAÇÃO ATUAL:
- Renda mensal: ${formatToBRL(rendimentoMes)}
- Despesas totais: ${formatToBRL(totalTarefas)}
- Saldo disponível: ${formatToBRL(rendimentoDisponivel)}
- Percentual gasto: ${percentualGasto.toFixed(1)}% ${percentualGasto > 100 ? "🚨 CRÍTICO!" : ""}

DETALHAMENTO:
- Tarefas pagas: ${formatToBRL(tarefasPagas)}
- Tarefas pendentes: ${formatToBRL(tarefasPendentes)}
- Cotação do dólar: ${formatToBRL(cotacaoDolar)}

ANÁLISE NECESSÁRIA:
1. Status da economia: ${percentualGasto > 100 ? "CRÍTICO" : percentualGasto > 70 ? "REGULAR" : "BOM"}
2. Precisa economizar: ${precisaEconomizar ? "SIM - URGENTE!" : "NÃO"}
3. Economia recomendada: ${formatToBRL(economiaRecomendada)}

Forneça uma análise personalizada em JSON com:
- statusEconomia (bom/regular/critico)
- precisaEconomizar (boolean)
- economiaRecomendada (number)
- estrategiaInvestimento (object com curtoPrazo, medioPrazo, longoPrazo)
- dicasEconomia (array de strings)
- distribuicaoInvestimento (object com poupanca, dolar, outros)
- resumo (string)

IMPORTANTE: Se percentualGasto > 100%, a situação é CRÍTICA!
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
                        valor: cotacaoDolar,
                        valorBRL: formatToBRL(cotacaoDolar),
                        timestamp: new Date().toISOString(),
                    },
                    analise: analysisResult,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        fonte: "Dados do Frontend",
                        versao: "8.0",
                        ia: iaUsada,
                        dadosRecebidos: {
                            rendimentoMes,
                            tarefasPagas,
                            tarefasPendentes,
                            cotacaoDolar,
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
        console.error("❌ Erro na análise de investimento:", error);
        return c.json(
            {
                error: "Erro na análise de investimento",
                details: error.message,
                timestamp: new Date().toISOString(),
            },
            500,
        );
    }
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
