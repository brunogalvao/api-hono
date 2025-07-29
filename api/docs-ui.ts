import { Hono } from "hono";

export const config = { runtime: "edge" };

const app = new Hono();

app.get("/api/docs", (c) => {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Financeira - Documentação</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .api-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .api-section:hover {
            transform: translateY(-5px);
        }
        
        .section-title {
            color: #667eea;
            font-size: 1.8rem;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .route {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        
        .method {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;
            margin-right: 10px;
        }
        
        .get { background: #28a745; color: white; }
        .post { background: #007bff; color: white; }
        .patch { background: #ffc107; color: #333; }
        .options { background: #6c757d; color: white; }
        
        .endpoint {
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
            font-weight: bold;
            color: #333;
        }
        
        .description {
            margin: 15px 0;
            color: #666;
            line-height: 1.8;
        }
        
        .features {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .features h4 {
            color: #1976d2;
            margin-bottom: 10px;
        }
        
        .features ul {
            list-style: none;
            padding-left: 0;
        }
        
        .features li {
            padding: 5px 0;
            position: relative;
            padding-left: 20px;
        }
        
        .features li:before {
            content: "✅";
            position: absolute;
            left: 0;
        }
        
        .example {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            overflow-x: auto;
        }
        
        .status {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-left: 10px;
        }
        
        .active { background: #d4edda; color: #155724; }
        .deprecated { background: #f8d7da; color: #721c24; }
        
        .footer {
            text-align: center;
            color: white;
            margin-top: 40px;
            padding: 20px;
            opacity: 0.8;
        }
        
        .tech-stack {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .tech-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .tech-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        
        .tech-item h4 {
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .tech-item p {
            font-size: 0.9rem;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 API Financeira</h1>
            <p>Documentação completa das rotas e funcionalidades</p>
        </div>
        
        <div class="tech-stack">
            <h2 class="section-title">🛠️ Stack Tecnológico</h2>
            <div class="tech-grid">
                <div class="tech-item">
                    <h4>Hono</h4>
                    <p>Framework web para APIs</p>
                </div>
                <div class="tech-item">
                    <h4>Supabase</h4>
                    <p>Banco de dados e autenticação</p>
                </div>
                <div class="tech-item">
                    <h4>Vercel</h4>
                    <p>Deploy e hospedagem</p>
                </div>
                <div class="tech-item">
                    <h4>Google Gemini</h4>
                    <p>IA para análise financeira</p>
                </div>
                <div class="tech-item">
                    <h4>TypeScript</h4>
                    <p>Tipagem estática</p>
                </div>
                <div class="tech-item">
                    <h4>Edge Runtime</h4>
                    <p>Execução serverless</p>
                </div>
            </div>
            </div>
            
        <div class="api-section">
            <h2 class="section-title">🔐 Autenticação</h2>
            <div class="route">
                <span class="method get">GET</span>
                <span class="endpoint">/api/user</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Retorna informações do usuário autenticado via Supabase.
                </div>
                <div class="features">
                    <h4>Funcionalidades:</h4>
                    <ul>
                        <li>Validação de token JWT</li>
                        <li>Retorno de dados do usuário</li>
                        <li>Tratamento de erros de autenticação</li>
                    </ul>
            </div>
            </div>
        </div>
        
        <div class="api-section">
            <h2 class="section-title">💰 Gestão de Rendimentos</h2>
            
            <div class="route">
                    <span class="method get">GET</span>
                <span class="endpoint">/api/incomes</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Lista todos os rendimentos do usuário autenticado.
                </div>
                <div class="features">
                    <h4>Funcionalidades:</h4>
                    <ul>
                        <li>Filtragem por usuário</li>
                        <li>Ordenação por data</li>
                        <li>Validação de autenticação</li>
                    </ul>
                </div>
            </div>
            
            <div class="route">
                <span class="method post">POST</span>
                <span class="endpoint">/api/incomes</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Cria um novo registro de rendimento.
                </div>
                <div class="features">
                    <h4>Funcionalidades:</h4>
                    <ul>
                        <li>Validação de campos obrigatórios</li>
                        <li>Associação automática ao usuário</li>
                        <li>Formatação de valores monetários</li>
                    </ul>
                </div>
                <div class="example">
POST /api/incomes
{
  "descricao": "Salário",
  "valor": "2500.00",
  "mes": "janeiro",
  "ano": 2024
}
                </div>
            </div>
            
            <div class="route">
                <span class="method patch">PATCH</span>
                <span class="endpoint">/api/incomes</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Atualiza um registro de rendimento existente.
                </div>
                <div class="features">
                    <h4>Funcionalidades:</h4>
                    <ul>
                        <li>Validação de ID</li>
                        <li>Verificação de propriedade</li>
                        <li>Atualização parcial</li>
                    </ul>
                </div>
            </div>
            
            <div class="route">
                    <span class="method get">GET</span>
                <span class="endpoint">/api/incomes/total-por-mes</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Retorna o total de rendimentos agrupados por mês e ano.
                </div>
                <div class="features">
                    <h4>Funcionalidades:</h4>
                    <ul>
                        <li>Agrupamento por mês/ano</li>
                        <li>Cálculo automático de totais</li>
                        <li>Ordenação cronológica</li>
                        <li>Contagem de registros por período</li>
                    </ul>
                </div>
                <div class="example">
GET /api/incomes/total-por-mes
Response:
[
  {
    "mes": "janeiro",
    "ano": 2024,
    "total": 2500.00,
    "quantidade": 1
  }
]
                </div>
            </div>
        </div>
            
        <div class="api-section">
            <h2 class="section-title">📋 Gestão de Tarefas</h2>
            
            <div class="route">
                <span class="method get">GET</span>
                <span class="endpoint">/api/tasks</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Lista todas as tarefas do usuário autenticado.
                </div>
            </div>

            <div class="route">
                <span class="method get">GET</span>
                <span class="endpoint">/api/tasks/total</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Retorna o valor total de todas as tarefas.
                </div>
            </div>
            
            <div class="route">
                    <span class="method get">GET</span>
                <span class="endpoint">/api/tasks/total-paid</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Retorna o valor total das tarefas pagas.
                </div>
            </div>

            <div class="route">
                <span class="method get">GET</span>
                <span class="endpoint">/api/tasks/total-price</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Retorna o valor total das tarefas pendentes.
                </div>
            </div>
        </div>
            
        <div class="api-section">
            <h2 class="section-title">🤖 Inteligência Artificial</h2>
            
            <div class="route">
                <span class="method post">POST</span>
                <span class="endpoint">/api/ia/analise-investimento</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Análise financeira inteligente com Google Gemini AI.
                </div>
                <div class="features">
                    <h4>Funcionalidades:</h4>
                    <ul>
                        <li>Análise de rendimentos vs despesas</li>
                        <li>Cálculo automático de investimento (30% do salário)</li>
                        <li>Conversão BRL ↔ USD em tempo real</li>
                        <li>Recomendações personalizadas de economia</li>
                        <li>Estratégia de investimento baseada no perfil</li>
                        <li>Distribuição de investimentos (dólar, poupança, outros)</li>
                        <li>Dicas de economia personalizadas</li>
                        <li>Status da situação financeira (bom/regular/crítico)</li>
                    </ul>
                </div>
                <div class="example">
POST /api/ia/analise-investimento
Response:
{
  "success": true,
  "data": {
    "dashboard": {
      "rendimentoMes": 2332.00,
      "rendimentoDisponivel": 2009.00,
      "percentualGasto": 13.9
    },
    "investimento": {
      "recomendado": 699.60,
      "recomendadoUSD": "$125.73"
    },
    "analise": {
      "statusEconomia": "bom",
      "estrategiaInvestimento": {...},
      "dicasEconomia": [...],
      "resumo": "..."
    }
  }
}
                </div>
            </div>
        </div>
            
        <div class="api-section">
            <h2 class="section-title">🔧 Utilitários</h2>
            
            <div class="route">
                <span class="method get">GET</span>
                <span class="endpoint">/api/ping</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Endpoint de teste para verificar se a API está funcionando.
                </div>
            </div>

            <div class="route">
                <span class="method get">GET</span>
                <span class="endpoint">/api/health</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Verificação de saúde da API e conectividade com Supabase.
                </div>
            </div>
            
            <div class="route">
                    <span class="method get">GET</span>
                <span class="endpoint">/api/supabase-test</span>
                <span class="status active">ATIVO</span>
                <div class="description">
                    Teste específico de conectividade com Supabase.
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>🚀 API desenvolvida com Hono, Supabase e Google Gemini</p>
            <p>📚 Versão 4.0 - Análise Financeira Inteligente</p>
        </div>
    </div>
</body>
</html>
  `;

  return c.html(html);
});

export const GET = app.fetch;
export default app.fetch; 