import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

// Página inicial
app.get("/", async (c) => {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 API Hono - Gerenciamento de Tarefas e Rendimentos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 800px;
            width: 90%;
            text-align: center;
        }
        
        .logo {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        
        .title {
            font-size: 2.5rem;
            color: #333;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .subtitle {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 30px;
        }
        
        .description {
            font-size: 1.1rem;
            color: #555;
            margin-bottom: 40px;
            line-height: 1.8;
        }
        
        .tech-stack {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 40px;
            flex-wrap: wrap;
        }
        
        .tech-item {
            background: #f8f9fa;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 0.9rem;
            color: #667eea;
            font-weight: 600;
            border: 2px solid #e9ecef;
        }
        
        .buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 40px;
        }
        
        .btn {
            padding: 15px 30px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary {
            background: #f8f9fa;
            color: #667eea;
            border: 2px solid #667eea;
        }
        
        .btn-secondary:hover {
            background: #667eea;
            color: white;
        }
        
        .endpoints {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 30px;
            margin-top: 30px;
        }
        
        .endpoints h3 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.3rem;
        }
        
        .endpoint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .endpoint-item {
            background: white;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        
        .endpoint-method {
            font-weight: 600;
            color: #667eea;
            font-size: 0.9rem;
        }
        
        .endpoint-path {
            font-family: 'Monaco', 'Menlo', monospace;
            color: #333;
            font-size: 0.9rem;
        }
        
        .status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #d4edda;
            color: #155724;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            background: #28a745;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .footer {
            margin-top: 40px;
            color: #666;
            font-size: 0.9rem;
        }
        
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        
        @media (max-width: 768px) {
            .container { padding: 30px 20px; }
            .title { font-size: 2rem; }
            .buttons { flex-direction: column; }
            .tech-stack { gap: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h1 class="title">API Hono</h1>
        <p class="subtitle">Gerenciamento de Tarefas e Rendimentos</p>
        
        <div class="status">
            <div class="status-dot"></div>
            API Online e Funcionando
        </div>
        
        <p class="description">
            API serverless desenvolvida com <strong>Hono</strong> para gerenciamento completo de tarefas e rendimentos. 
            Integrada com <strong>Supabase</strong> e deployada na <strong>Vercel</strong> com Edge Runtime para máxima performance.
        </p>
        
        <div class="tech-stack">
            <span class="tech-item">Hono</span>
            <span class="tech-item">TypeScript</span>
            <span class="tech-item">Supabase</span>
            <span class="tech-item">Vercel</span>
            <span class="tech-item">Edge Runtime</span>
        </div>
        
        <div class="buttons">
            <a href="/api/docs-ui" class="btn btn-primary">
                📚 Ver Documentação
            </a>
            <a href="/api/health" class="btn btn-secondary">
                🔍 Status da API
            </a>
        </div>
        
        <div class="endpoints">
            <h3>📡 Endpoints Principais</h3>
            <div class="endpoint-grid">
                <div class="endpoint-item">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/api/ping</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/api/health</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/api/tasks</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">POST</div>
                    <div class="endpoint-path">/api/tasks</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/api/incomes</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/api/user</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>🔧 Desenvolvido com ❤️ por <a href="https://github.com/brunogalvao" target="_blank">Bruno Galvão</a></p>
            <p>📖 <a href="https://github.com/brunogalvao/api-hono" target="_blank">Ver código no GitHub</a></p>
        </div>
    </div>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
});

// Rota simples para teste local
app.get("/api/tasks", async (c) => {
  return c.json([
    {
      id: "1",
      title: "Tarefa de exemplo",
      done: false,
      created_at: new Date().toISOString(),
    }
  ]);
});

// Rota de teste POST
app.post("/api/test", async (c) => {
  return c.json({ message: "POST funcionando!" });
});

// Rota POST para incomes
app.post("/api/incomes", async (c) => {
  const body = await c.req.json();
  const { descricao, valor, mes, ano } = body;
  
  if (!valor || !mes || !ano) {
    return c.json({ error: "Campos obrigatórios ausentes" }, 400);
  }

  // Simular criação de rendimento
  const newIncome = {
    id: Date.now().toString(),
    descricao: descricao || "Rendimento",
    valor,
    mes,
    ano,
    user_id: "user123",
    created_at: new Date().toISOString()
  };

  return c.json(newIncome);
});

// Rota PATCH para incomes
app.patch("/api/incomes", async (c) => {
  const body = await c.req.json();
  const { id, descricao, valor, mes, ano } = body;
  
  if (!id) {
    return c.json({ error: "ID do rendimento ausente" }, 400);
  }

  // Simular atualização de rendimento
  const updatedIncome = {
    id,
    descricao: descricao || "Rendimento atualizado",
    valor: valor || "1000.00",
    mes: mes || "Janeiro",
    ano: ano || 2025,
    user_id: "user123",
    updated_at: new Date().toISOString()
  };

  return c.json(updatedIncome);
});

// Rota GET para incomes (mock)
app.get("/api/incomes", async (c) => {
  return c.json([
    {
      id: "1",
      descricao: "Salário Principal",
      valor: "3822.00",
      mes: "Janeiro",
      ano: 2025,
      user_id: "user123"
    },
    {
      id: "2", 
      descricao: "Freelance",
      valor: "2333.00",
      mes: "Abril",
      ano: 2025,
      user_id: "user123"
    },
    {
      id: "3",
      descricao: "Bônus",
      valor: "2332.00", 
      mes: "Julho",
      ano: 2025,
      user_id: "user123"
    }
  ]);
});

// Rota para total por mês
app.get("/api/incomes/total-por-mes", async (c) => {
  // Dados de exemplo baseados na interface
  const mockData = [
    { mes: "Janeiro", ano: 2025, valor: "3822.00" },
    { mes: "Abril", ano: 2025, valor: "2333.00" },
    { mes: "Julho", ano: 2025, valor: "2332.00" },
  ];

  // Define o tipo para o objeto de agrupamento
  type MonthlyTotal = {
    mes: string;
    ano: number;
    total: number;
    quantidade: number;
  };

  // Agrupa por mês e ano, somando os valores
  const totalsByMonth: Record<string, MonthlyTotal> = mockData.reduce((acc, income) => {
    const key = `${income.mes}_${income.ano}`;
    if (!acc[key]) {
      acc[key] = {
        mes: income.mes,
        ano: income.ano,
        total: 0,
        quantidade: 0
      };
    }
    acc[key].total += parseFloat(income.valor);
    acc[key].quantidade += 1;
    return acc;
  }, {} as Record<string, MonthlyTotal>);

  // Converte para array e ordena por ano e mês
  const result = Object.values(totalsByMonth).sort((a: MonthlyTotal, b: MonthlyTotal) => {
    if (a.ano !== b.ano) return a.ano - b.ano;
    return a.mes.localeCompare(b.mes);
  });

  return c.json(result);
});

// Rota de IA para análise de investimentos
app.post("/api/ia", async (c) => {
  try {
    // Simular dados de rendimentos
    const mockIncomes = [
      { mes: "Janeiro", ano: 2025, valor: "3822.00" },
      { mes: "Abril", ano: 2025, valor: "2333.00" },
      { mes: "Julho", ano: 2025, valor: "2332.00" },
    ];

    // Calcular totais
    const totalAnual = mockIncomes.reduce((sum, income) => sum + parseFloat(income.valor), 0);
    const mediaMensal = totalAnual / 12;

    // Obter cotação do dólar
    const dolarResponse = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL");
    const dolarData = await dolarResponse.json();
    const cotacaoDolar = parseFloat(dolarData.USDBRL.bid);

    // Simular análise da IA
    const analysisResult = {
      analise: {
        estabilidade: "Renda variável com 3 fontes diferentes",
        tendencia: "Crescimento moderado",
        risco: "Médio - diversificação adequada"
      },
      recomendacoes: {
        dolar: {
          percentual: 25,
          justificativa: "Proteção cambial e diversificação",
          risco: "Médio"
        },
        poupanca: {
          percentual: 35,
          justificativa: "Reserva de emergência e segurança",
          risco: "Baixo"
        },
        outros: {
          sugestoes: ["CDB", "Fundos de investimento", "Tesouro Direto"],
          justificativa: "Diversificação e crescimento"
        }
      },
      estrategia: {
        curtoPrazo: "Manter 6 meses de despesas em poupança",
        medioPrazo: "Diversificar em CDB e fundos",
        longoPrazo: "Investir em dólar para proteção cambial"
      },
      cotacaoDolar: cotacaoDolar,
      resumo: "Perfil conservador com boa diversificação. Recomenda-se 35% poupança, 25% dólar e 40% outros investimentos."
    };

    return c.json({
      success: true,
      data: analysisResult,
      metadata: {
        totalRendimentos: mockIncomes.length,
        totalAnual,
        mediaMensal,
        cotacaoDolar,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    return c.json({ 
      error: "Erro na análise de investimentos",
      details: error.message 
    }, 500);
  }
});

// Rota para documentação
app.get("/api/docs", async (c) => {
  return c.redirect("/api/docs-ui");
});

serve({ fetch: app.fetch, port: 3000 });

console.log("🚀 API Rodando em http://localhost:3000");
console.log("📚 Documentação: http://localhost:3000/api/docs");
