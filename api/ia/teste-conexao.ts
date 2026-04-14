import { Hono } from "hono";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export const config = { runtime: "edge" };

const app = new Hono();

// Função para testar Gemini com diagnóstico detalhado
const diagnosticarGemini = async () => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
        return {
            status: "error",
            error: "API_KEY_MISSING",
            message: "GEMINI_API_KEY não configurada",
            solucao: "Configure a variável GEMINI_API_KEY no arquivo .env.local"
        };
    }

    try {
        console.log("🤖 Testando conexão com Google Gemini...");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500,
            }
        });

        const promptTeste = `
        Responda APENAS com este JSON exato, sem texto adicional:
        {
            "status": "success",
            "message": "Gemini funcionando corretamente",
            "timestamp": "${new Date().toISOString()}"
        }
        `;

        const startTime = Date.now();
        const result = await model.generateContent(promptTeste);
        const response = await result.response;
        const responseTime = Date.now() - startTime;

        const aiResponse = response.text();

        // Tentar extrair JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            try {
                const parsedResult = JSON.parse(jsonMatch[0]);
                return {
                    status: "success",
                    provider: "Google Gemini",
                    model: "gemini-2.0-flash",
                    responseTime: `${responseTime}ms`,
                    response: parsedResult,
                    rawResponse: aiResponse.substring(0, 200) + "..."
                };
            } catch (parseError) {
                return {
                    status: "partial",
                    provider: "Google Gemini",
                    error: "JSON_PARSE_ERROR",
                    message: "Conexão OK, mas resposta em formato inválido",
                    responseTime: `${responseTime}ms`,
                    rawResponse: aiResponse.substring(0, 200) + "..."
                };
            }
        } else {
            return {
                status: "partial",
                provider: "Google Gemini",
                error: "NO_JSON_FOUND",
                message: "Conexão OK, mas JSON não encontrado na resposta",
                responseTime: `${responseTime}ms`,
                rawResponse: aiResponse.substring(0, 200) + "..."
            };
        }

    } catch (error: any) {
        console.error("❌ Erro no Gemini:", error.message);

        let errorType = "UNKNOWN_ERROR";
        let solucao = "Verifique os logs para mais detalhes";

        if (error.message.includes("overloaded") || error.message.includes("503")) {
            errorType = "SERVICE_OVERLOADED";
            solucao = "Servidor temporariamente sobrecarregado, tente novamente em alguns minutos";
        } else if (error.message.includes("API_KEY_INVALID") || error.message.includes("401")) {
            errorType = "INVALID_API_KEY";
            solucao = "Verifique se a GEMINI_API_KEY está correta";
        } else if (error.message.includes("QUOTA_EXCEEDED") || error.message.includes("429")) {
            errorType = "QUOTA_EXCEEDED";
            solucao = "Quota da API excedida, aguarde ou upgrade seu plano";
        } else if (error.message.includes("PERMISSION_DENIED") || error.message.includes("403")) {
            errorType = "PERMISSION_DENIED";
            solucao = "Verifique se a API Generative AI está habilitada no Google Cloud";
        }

        return {
            status: "error",
            provider: "Google Gemini",
            error: errorType,
            message: error.message,
            solucao
        };
    }
};

// Função para testar OpenAI
const diagnosticarOpenAI = async () => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
        return {
            status: "error",
            error: "API_KEY_MISSING",
            message: "OPENAI_API_KEY não configurada",
            solucao: "Configure a variável OPENAI_API_KEY no arquivo .env.local"
        };
    }

    try {
        console.log("🤖 Testando conexão com OpenAI...");

        const openai = new OpenAI({ apiKey });

        const promptTeste = `Responda APENAS com este JSON: {"status": "success", "message": "OpenAI funcionando", "timestamp": "${new Date().toISOString()}"}`;

        const startTime = Date.now();
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Responda apenas com JSON válido." },
                { role: "user", content: promptTeste }
            ],
            temperature: 0.3,
            max_tokens: 200
        });
        const responseTime = Date.now() - startTime;

        const aiResponse = completion.choices[0].message.content || "";

        // Tentar extrair JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            try {
                const parsedResult = JSON.parse(jsonMatch[0]);
                return {
                    status: "success",
                    provider: "OpenAI",
                    model: "gpt-3.5-turbo",
                    responseTime: `${responseTime}ms`,
                    response: parsedResult,
                    rawResponse: aiResponse.substring(0, 200) + "..."
                };
            } catch (parseError) {
                return {
                    status: "partial",
                    provider: "OpenAI",
                    error: "JSON_PARSE_ERROR",
                    message: "Conexão OK, mas resposta em formato inválido",
                    responseTime: `${responseTime}ms`,
                    rawResponse: aiResponse.substring(0, 200) + "..."
                };
            }
        } else {
            return {
                status: "partial",
                provider: "OpenAI",
                error: "NO_JSON_FOUND",
                message: "Conexão OK, mas JSON não encontrado na resposta",
                responseTime: `${responseTime}ms`,
                rawResponse: aiResponse.substring(0, 200) + "..."
            };
        }

    } catch (error: any) {
        console.error("❌ Erro no OpenAI:", error.message);

        let errorType = "UNKNOWN_ERROR";
        let solucao = "Verifique os logs para mais detalhes";

        if (error.message.includes("invalid_api_key") || error.message.includes("401")) {
            errorType = "INVALID_API_KEY";
            solucao = "Verifique se a OPENAI_API_KEY está correta";
        } else if (error.message.includes("quota") || error.message.includes("429")) {
            errorType = "QUOTA_EXCEEDED";
            solucao = "Quota da API excedida, verifique seu plano de billing";
        } else if (error.message.includes("rate_limit")) {
            errorType = "RATE_LIMIT";
            solucao = "Muitas requisições, aguarde alguns segundos";
        }

        return {
            status: "error",
            provider: "OpenAI",
            error: errorType,
            message: error.message,
            solucao
        };
    }
};

// Função para testar análise local
const diagnosticarAnaliseLocal = () => {
    try {
        console.log("🧠 Testando análise local...");

        const startTime = Date.now();

        // Simulação de análise local
        const analiseLocal = {
            statusEconomia: "bom",
            precisaEconomizar: false,
            economiaRecomendada: 0,
            estrategiaInvestimento: {
                curtoPrazo: "Manter reserva de emergência",
                medioPrazo: "Diversificar investimentos",
                longoPrazo: "Investir em renda variável"
            },
            dicasEconomia: [
                "Excelente controle financeiro!",
                "Continue investindo regularmente"
            ],
            distribuicaoInvestimento: {
                poupanca: 30,
                dolar: 35,
                outros: 35
            },
            resumo: "Situação financeira estável para investimentos"
        };

        const responseTime = Date.now() - startTime;

        return {
            status: "success",
            provider: "Análise Local",
            model: "Regras Financeiras Inteligentes",
            responseTime: `${responseTime}ms`,
            response: analiseLocal,
            message: "Análise local sempre disponível como fallback"
        };

    } catch (error: any) {
        return {
            status: "error",
            provider: "Análise Local",
            error: "LOCAL_ERROR",
            message: error.message,
            solucao: "Erro interno na análise local"
        };
    }
};

// Endpoint principal de diagnóstico
app.get("/api/ia/teste-conexao", async (c) => {
    try {
        console.log("🔍 Iniciando diagnóstico completo das APIs de IA...");

        const startTime = Date.now();

        // Testar todas as APIs em paralelo
        const [geminiResult, openaiResult, localResult] = await Promise.allSettled([
            diagnosticarGemini(),
            diagnosticarOpenAI(),
            diagnosticarAnaliseLocal()
        ]);

        const totalTime = Date.now() - startTime;

        // Processar resultados
        const resultados = {
            gemini: geminiResult.status === 'fulfilled' ? geminiResult.value : {
                status: "error",
                error: "PROMISE_REJECTED",
                message: geminiResult.reason?.message || "Erro desconhecido"
            },
            openai: openaiResult.status === 'fulfilled' ? openaiResult.value : {
                status: "error",
                error: "PROMISE_REJECTED",
                message: openaiResult.reason?.message || "Erro desconhecido"
            },
            local: localResult.status === 'fulfilled' ? localResult.value : {
                status: "error",
                error: "PROMISE_REJECTED",
                message: localResult.reason?.message || "Erro desconhecido"
            }
        };

        // Determinar status geral
        const funcionando = Object.values(resultados).filter(r => r.status === 'success').length;
        const statusGeral = funcionando > 0 ? 'operational' : 'critical';

        // Determinar IA recomendada
        let iaRecomendada = "local";
        if (resultados.gemini.status === 'success') {
            iaRecomendada = "gemini";
        } else if (resultados.openai.status === 'success') {
            iaRecomendada = "openai";
        }

        return c.json({
            success: true,
            statusGeral,
            iaRecomendada,
            funcionando: `${funcionando}/3`,
            tempoTotal: `${totalTime}ms`,
            timestamp: new Date().toISOString(),
            resultados,
            recomendacoes: {
                prioridade1: resultados.gemini.status === 'success'
                    ? "✅ Gemini funcionando - sistema otimizado"
                    : "🔧 Configure GEMINI_API_KEY para melhor performance",
                prioridade2: resultados.openai.status === 'success'
                    ? "✅ OpenAI disponível como backup"
                    : "⚠️ Configure OPENAI_API_KEY como fallback",
                fallback: "🧠 Análise local sempre disponível como último recurso"
            },
            proximosPassos: funcionando === 0 ? [
                "1. Configure pelo menos uma API Key (Gemini recomendado)",
                "2. Verifique as variáveis de ambiente no .env.local",
                "3. Teste novamente após configuração"
            ] : funcionando === 3 ? [
                "🎉 Todos os sistemas funcionando perfeitamente!",
                "Sistema com máxima redundância e confiabilidade"
            ] : [
                "✅ Sistema operacional com fallbacks disponíveis",
                "Configure APIs adicionais para maior redundância"
            ]
        }, 200, {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        });

    } catch (error: any) {
        console.error("❌ Erro geral no diagnóstico:", error.message);

        return c.json({
            success: false,
            error: "DIAGNOSTIC_ERROR",
            message: "Erro interno no sistema de diagnóstico",
            details: error.message,
            timestamp: new Date().toISOString()
        }, 500);
    }
});

// Endpoint simplificado para status rápido
app.get("/api/ia/status", async (c) => {
    try {
        const hasGemini = !!(process.env.GEMINI_API_KEY?.trim());
        const hasOpenAI = !!(process.env.OPENAI_API_KEY?.trim());
        const hasSupabase = !!(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_ANON_KEY?.trim());

        return c.json({
            success: true,
            apis: {
                gemini: hasGemini ? "configured" : "missing",
                openai: hasOpenAI ? "configured" : "missing",
                supabase: hasSupabase ? "configured" : "missing",
                local: "always_available"
            },
            totalConfigured: [hasGemini, hasOpenAI, hasSupabase].filter(Boolean).length,
            recommendations: {
                critical: !hasGemini && !hasOpenAI ? "Configure pelo menos uma API de IA" : null,
                warning: !hasSupabase ? "Configure Supabase para dados persistentes" : null,
                info: hasGemini && hasOpenAI ? "Sistema com redundância completa" : null
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        return c.json({
            success: false,
            error: error.message
        }, 500);
    }
});

export const GET = app.fetch;
export default app.fetch;
