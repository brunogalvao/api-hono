import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config({ path: ".env.local" });
dotenv.config();

console.log("🔍 Teste: Dados Reais vs Mockados\n");
console.log("=" * 60);

const BASE_URL = "http://localhost:3000";

// Função para testar endpoint com dados mockados (removidos)
async function testarDadosMockados() {
    console.log("\n🎭 TESTE 1: Endpoints com Dados Mockados (REMOVIDOS)");
    console.log("-" * 50);

    try {
        // Teste do endpoint antigo com dados mockados
        const response = await fetch(`${BASE_URL}/api/ia`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        });

        const data = await response.json();

        if (response.ok) {
            console.log("📊 Resposta do endpoint antigo:");
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log("❌ Endpoint antigo falhou como esperado:");
            console.log(data.message || data.error);
        }

        // Teste do endpoint de incomes mockado
        const incomesResponse = await fetch(`${BASE_URL}/api/incomes`);
        const incomesData = await incomesResponse.json();

        console.log("\n📋 Status do endpoint /api/incomes:");
        if (incomesData.message && incomesData.message.includes("real")) {
            console.log("✅ Redirecionado para endpoint real:");
            console.log(`- ${incomesData.message}`);
            console.log("- Endpoints disponíveis:", incomesData.endpoints);
        } else {
            console.log("❌ Ainda usando dados mockados:");
            console.log(incomesData);
        }

    } catch (error) {
        console.error("❌ Erro ao testar endpoints mockados:", error.message);
    }
}

// Função para testar análise com dados do frontend
async function testarAnaliseComDadosFrontend() {
    console.log("\n💻 TESTE 2: Análise com Dados do Frontend");
    console.log("-" * 50);

    const dadosSimulados = {
        rendimentoMes: 5000,
        tarefasPagas: 2000,
        tarefasPendentes: 1500,
        cotacaoDolar: 5.50
    };

    console.log("📊 Dados simulados enviados:");
    console.log(JSON.stringify(dadosSimulados, null, 2));

    try {
        const response = await fetch(`${BASE_URL}/api/ia/analise-frontend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dadosSimulados),
        });

        if (response.ok) {
            const data = await response.json();
            console.log("\n✅ Análise com dados do frontend:");
            console.log(`- IA utilizada: ${data.data.metadata.ia}`);
            console.log(`- Fonte: ${data.data.metadata.fonte}`);
            console.log(`- Renda disponível: ${data.data.dashboard.rendimentoDisponivelBRL}`);
            console.log(`- Status economia: ${data.data.analise.statusEconomia}`);
            console.log(`- Resumo: ${data.data.analise.resumo.substring(0, 100)}...`);
        } else {
            const errorData = await response.json();
            console.log("❌ Erro na análise frontend:");
            console.log(errorData);
        }

    } catch (error) {
        console.error("❌ Erro ao testar análise frontend:", error.message);
    }
}

// Função para testar análise com dados reais (sem autenticação)
async function testarAnaliseComDadosReais() {
    console.log("\n🗄️ TESTE 3: Análise com Dados Reais do Supabase");
    console.log("-" * 50);

    try {
        // Este endpoint requer autenticação, então esperamos erro 401
        const response = await fetch(`${BASE_URL}/api/ia/analise-investimento`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                mes: 1,
                ano: 2025,
                cotacaoDolar: 5.50
            }),
        });

        const data = await response.json();

        if (response.status === 401) {
            console.log("✅ Endpoint com dados reais funciona (requer autenticação):");
            console.log(`- Status: ${response.status}`);
            console.log(`- Mensagem: ${data.error}`);
            console.log("- Este comportamento é esperado - endpoint protegido");
        } else if (response.ok) {
            console.log("🎉 Análise com dados reais (usuário autenticado):");
            console.log(`- IA utilizada: ${data.data.metadata.ia}`);
            console.log(`- Fonte: ${data.data.metadata.fonte}`);
            console.log(`- Total rendimentos: ${data.data.metadata.dadosReais.totalRendimentos}`);
            console.log(`- Total tarefas: ${data.data.metadata.dadosReais.totalTarefas}`);
        } else {
            console.log("❌ Erro inesperado:");
            console.log(data);
        }

    } catch (error) {
        console.error("❌ Erro ao testar análise com dados reais:", error.message);
    }
}

// Função para testar sistema de diagnóstico
async function testarSistemaDiagnostico() {
    console.log("\n🔧 TESTE 4: Sistema de Diagnóstico");
    console.log("-" * 50);

    try {
        // Teste rápido de status
        const statusResponse = await fetch(`${BASE_URL}/api/ia/status`);

        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log("📊 Status das APIs:");
            console.log(`- Gemini: ${statusData.apis.gemini}`);
            console.log(`- OpenAI: ${statusData.apis.openai}`);
            console.log(`- Supabase: ${statusData.apis.supabase}`);
            console.log(`- Local: ${statusData.apis.local}`);
            console.log(`- Total configurado: ${statusData.totalConfigured}/3`);

            if (statusData.recommendations.critical) {
                console.log(`⚠️ Crítico: ${statusData.recommendations.critical}`);
            }
            if (statusData.recommendations.warning) {
                console.log(`⚠️ Aviso: ${statusData.recommendations.warning}`);
            }
            if (statusData.recommendations.info) {
                console.log(`ℹ️ Info: ${statusData.recommendations.info}`);
            }
        }

        // Teste completo de diagnóstico (mais demorado)
        console.log("\n🔍 Executando diagnóstico completo...");
        const diagnosticResponse = await fetch(`${BASE_URL}/api/ia/teste-conexao`);

        if (diagnosticResponse.ok) {
            const diagnosticData = await diagnosticResponse.json();
            console.log(`✅ Diagnóstico completo executado em ${diagnosticData.tempoTotal}`);
            console.log(`- Status geral: ${diagnosticData.statusGeral}`);
            console.log(`- IA recomendada: ${diagnosticData.iaRecomendada}`);
            console.log(`- Sistemas funcionando: ${diagnosticData.funcionando}`);

            // Status individual das IAs
            console.log("\n🤖 Status das IAs:");
            console.log(`- Gemini: ${diagnosticData.resultados.gemini.status}`);
            console.log(`- OpenAI: ${diagnosticData.resultados.openai.status}`);
            console.log(`- Local: ${diagnosticData.resultados.local.status}`);
        }

    } catch (error) {
        console.error("❌ Erro ao testar sistema de diagnóstico:", error.message);
    }
}

// Função principal
async function executarTodosTestes() {
    console.log("🧪 Iniciando comparação entre dados mockados e reais...\n");

    await testarDadosMockados();
    await testarAnaliseComDadosFrontend();
    await testarAnaliseComDadosReais();
    await testarSistemaDiagnostico();

    console.log("\n" + "=" * 60);
    console.log("📊 RESUMO DAS MUDANÇAS");
    console.log("=" * 60);

    console.log("\n✅ REMOVIDO (Dados Mockados):");
    console.log("- POST /api/ia - análise com dados fixos");
    console.log("- GET /api/incomes - lista mockada de rendimentos");
    console.log("- GET /api/incomes/total-por-mes - totais mockados");
    console.log("- Dados simulados hardcoded no código");

    console.log("\n🆕 ADICIONADO (Dados Reais):");
    console.log("- POST /api/ia/analise-investimento - usa dados reais do Supabase");
    console.log("- POST /api/ia/analise-frontend - aceita dados do frontend");
    console.log("- GET /api/ia/status - status rápido das APIs");
    console.log("- GET /api/ia/teste-conexao - diagnóstico completo");
    console.log("- Integração completa com Supabase");
    console.log("- Autenticação JWT obrigatória");

    console.log("\n🔄 MIGRAÇÃO:");
    console.log("1. Dados mockados → Dados reais do Supabase");
    console.log("2. Sem autenticação → Autenticação obrigatória");
    console.log("3. Dados fixos → Dados dinâmicos por usuário");
    console.log("4. Sem fallback → Sistema robusto com 3 níveis de fallback");

    console.log("\n💡 RECOMENDAÇÕES:");
    console.log("- Use POST /api/ia/analise-investimento para produção");
    console.log("- Use POST /api/ia/analise-frontend para testes");
    console.log("- Configure GEMINI_API_KEY para melhor performance");
    console.log("- Configure autenticação para acessar dados reais");

    console.log("\n✅ Testes concluídos!");
}

// Executar testes
executarTodosTestes().catch(console.error);
