import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config({ path: ".env.local" });
dotenv.config();

console.log("🚀 Teste do Endpoint de Análise Financeira\n");

// Configuração do teste
const BASE_URL = "http://localhost:3000"; // Ajuste conforme necessário
const ENDPOINT = "/api/ia/analise-investimento";

// Dados de teste financeiro
const dadosTeste = {
    rendimentoMes: 5000,
    tarefasPagas: 2000,
    tarefasPendentes: 1500,
    cotacaoDolar: 5.50
};

console.log("📊 Dados de teste:");
console.log(JSON.stringify(dadosTeste, null, 2));

async function testarEndpoint() {
    try {
        console.log("\n🔍 Enviando requisição para o endpoint...");
        console.log(`URL: ${BASE_URL}${ENDPOINT}`);

        const startTime = Date.now();

        const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dadosTeste)
        });

        const responseTime = Date.now() - startTime;

        console.log(`\n📨 Resposta recebida em ${responseTime}ms`);
        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Erro na requisição:");
            console.error(errorText);
            return;
        }

        const data = await response.json();

        console.log("\n✅ Resposta do servidor:");
        console.log("=".repeat(60));

        // Exibir informações principais
        if (data.success) {
            console.log("🎉 Análise concluída com sucesso!");

            // Dashboard financeiro
            console.log("\n📊 DASHBOARD FINANCEIRO:");
            console.log(`- Renda mensal: ${data.data.dashboard.rendimentoMesBRL}`);
            console.log(`- Despesas totais: ${data.data.dashboard.totalTarefasBRL}`);
            console.log(`- Disponível: ${data.data.dashboard.rendimentoDisponivelBRL}`);
            console.log(`- Percentual gasto: ${data.data.dashboard.percentualGasto.toFixed(1)}%`);

            // Investimentos
            console.log("\n💰 INVESTIMENTOS:");
            console.log(`- Recomendado (30%): ${data.data.investimento.recomendadoBRL}`);
            console.log(`- Disponível: ${data.data.investimento.disponivelBRL}`);
            console.log(`- Em dólar: ${data.data.investimento.recomendadoUSD.usd}`);

            // Análise da IA
            console.log("\n🤖 ANÁLISE DA IA:");
            console.log(`- IA utilizada: ${data.data.metadata.ia}`);
            console.log(`- Status economia: ${data.data.analise.statusEconomia}`);
            console.log(`- Precisa economizar: ${data.data.analise.precisaEconomizar ? 'SIM' : 'NÃO'}`);

            if (data.data.analise.resumo) {
                console.log(`- Resumo: ${data.data.analise.resumo}`);
            }

            // Estratégia de investimento
            if (data.data.analise.estrategiaInvestimento) {
                console.log("\n📈 ESTRATÉGIA DE INVESTIMENTO:");
                console.log(`- Curto prazo: ${data.data.analise.estrategiaInvestimento.curtoPrazo}`);
                console.log(`- Médio prazo: ${data.data.analise.estrategiaInvestimento.medioPrazo}`);
                console.log(`- Longo prazo: ${data.data.analise.estrategiaInvestimento.longoPrazo}`);
            }

            // Dicas de economia
            if (data.data.analise.dicasEconomia && data.data.analise.dicasEconomia.length > 0) {
                console.log("\n💡 DICAS DE ECONOMIA:");
                data.data.analise.dicasEconomia.forEach((dica, index) => {
                    console.log(`${index + 1}. ${dica}`);
                });
            }

            // Distribuição de investimento
            if (data.data.analise.distribuicaoInvestimento) {
                console.log("\n📊 DISTRIBUIÇÃO RECOMENDADA:");
                console.log(`- Poupança: ${data.data.analise.distribuicaoInvestimento.poupanca}%`);
                console.log(`- Dólar: ${data.data.analise.distribuicaoInvestimento.dolar}%`);
                console.log(`- Outros: ${data.data.analise.distribuicaoInvestimento.outros}%`);
            }

            // Metadados
            console.log("\n📋 METADADOS:");
            console.log(`- Versão: ${data.data.metadata.versao}`);
            console.log(`- Timestamp: ${data.data.metadata.timestamp}`);
            console.log(`- Fonte: ${data.data.metadata.fonte}`);

            // Validar estrutura da resposta
            console.log("\n🔍 VALIDAÇÃO DA ESTRUTURA:");
            const camposObrigatorios = [
                'data.dashboard',
                'data.investimento',
                'data.analise',
                'data.metadata'
            ];

            let estruturaValida = true;
            for (const campo of camposObrigatorios) {
                const valor = campo.split('.').reduce((obj, key) => obj?.[key], data);
                if (valor === undefined) {
                    console.log(`❌ Campo ausente: ${campo}`);
                    estruturaValida = false;
                } else {
                    console.log(`✅ Campo presente: ${campo}`);
                }
            }

            if (estruturaValida) {
                console.log("\n🎉 TESTE PASSOU: Estrutura da resposta está correta!");
            } else {
                console.log("\n⚠️ TESTE PARCIAL: Alguns campos estão ausentes");
            }

        } else {
            console.log("❌ Falha na análise:");
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("\n❌ Erro durante o teste:");
        console.error("Tipo:", error.constructor.name);
        console.error("Mensagem:", error.message);

        if (error.message.includes("fetch")) {
            console.log("\n💡 Possíveis soluções:");
            console.log("1. Verifique se o servidor está rodando");
            console.log("2. Confirme a URL base (atualmente: " + BASE_URL + ")");
            console.log("3. Verifique se a porta está correta");
        }
    }
}

// Teste adicional com dados críticos (gastos > 100%)
async function testarSituacaoCritica() {
    console.log("\n" + "=".repeat(60));
    console.log("🚨 TESTE 2: Situação Financeira Crítica");
    console.log("=".repeat(60));

    const dadosCriticos = {
        rendimentoMes: 3000,
        tarefasPagas: 2500,
        tarefasPendentes: 1500, // Total: 4000 (133% da renda)
        cotacaoDolar: 5.50
    };

    console.log("📊 Dados críticos:");
    console.log(JSON.stringify(dadosCriticos, null, 2));
    console.log("⚠️ Gastos representam 133% da renda (situação crítica)");

    try {
        const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dadosCriticos)
        });

        if (response.ok) {
            const data = await response.json();

            console.log("\n🤖 Análise da situação crítica:");
            console.log(`- IA utilizada: ${data.data.metadata.ia}`);
            console.log(`- Status: ${data.data.analise.statusEconomia}`);
            console.log(`- Déficit: ${data.data.dashboard.rendimentoDisponivelBRL}`);

            if (data.data.analise.statusEconomia === 'critico') {
                console.log("✅ Sistema detectou corretamente situação crítica");
            } else {
                console.log("⚠️ Sistema não detectou situação crítica como esperado");
            }

            if (data.data.analise.dicasEconomia && data.data.analise.dicasEconomia.length > 0) {
                console.log("\n🚨 Dicas de emergência:");
                data.data.analise.dicasEconomia.slice(0, 3).forEach((dica, index) => {
                    console.log(`${index + 1}. ${dica}`);
                });
            }

        } else {
            console.log("❌ Erro no teste crítico:", response.status);
        }

    } catch (error) {
        console.error("❌ Erro no teste crítico:", error.message);
    }
}

// Executar testes
async function executarTodosTestes() {
    console.log("🧪 Iniciando bateria de testes...\n");

    await testarEndpoint();
    await testarSituacaoCritica();

    console.log("\n" + "=".repeat(60));
    console.log("✅ Testes concluídos!");
    console.log("=".repeat(60));

    console.log("\n💡 Para rodar o servidor (se não estiver rodando):");
    console.log("npm run dev");
    console.log("ou");
    console.log("pnpm dev");
}

// Executar testes
executarTodosTestes().catch(console.error);
