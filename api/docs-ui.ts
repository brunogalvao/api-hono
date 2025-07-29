export const config = { runtime: "edge" };

export const GET = async () => {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Hono - Documentação Completa</title>
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
            background: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .info-card h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .endpoints {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .endpoint {
            border-bottom: 1px solid #eee;
            padding: 20px;
        }
        
        .endpoint:last-child {
            border-bottom: none;
        }
        
        .endpoint-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .method {
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.9rem;
            margin-right: 15px;
        }
        
        .method.get { background: #10b981; color: white; }
        .method.post { background: #3b82f6; color: white; }
        .method.patch { background: #f59e0b; color: white; }
        .method.delete { background: #ef4444; color: white; }
        .method.options { background: #8b5cf6; color: white; }
        
        .path {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 1.1rem;
            color: #374151;
        }
        
        .description {
            color: #6b7280;
            margin-bottom: 15px;
        }
        
        .parameters, .responses {
            margin-top: 15px;
        }
        
        .parameters h4, .responses h4 {
            color: #374151;
            margin-bottom: 10px;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .parameter, .response {
            background: #f9fafb;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 8px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
        }
        
        .example {
            background: #1f2937;
            color: #f9fafb;
            padding: 15px;
            border-radius: 4px;
            margin-top: 10px;
            overflow-x: auto;
        }
        
        .status-200 { color: #10b981; }
        .status-400 { color: #f59e0b; }
        .status-401 { color: #ef4444; }
        .status-404 { color: #ef4444; }
        .status-500 { color: #ef4444; }
        
        .section-title {
            background: #667eea;
            color: white;
            padding: 15px 20px;
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .feature-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: bold;
            margin-left: 10px;
        }
        
        .feature-new { background: #10b981; color: white; }
        .feature-ai { background: #8b5cf6; color: white; }
        .feature-auth { background: #f59e0b; color: white; }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #6b7280;
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header h1 { font-size: 2rem; }
            .endpoint-header { flex-direction: column; align-items: flex-start; }
            .method { margin-bottom: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Finance API Hono</h1>
            <p>Documentação completa da API para gerenciamento de tarefas, rendimentos e análise inteligente</p>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>🔐 Autenticação</h3>
                <p>Bearer Token no header Authorization</p>
                <div class="example">
Authorization: Bearer seu-token-aqui
                </div>
            </div>
            
            <div class="info-card">
                <h3>🌐 CORS</h3>
                <p>Habilitado para todos os domínios</p>
            </div>
            
            <div class="info-card">
                <h3>⚡ Runtime</h3>
                <p>Edge Runtime (Vercel)</p>
            </div>
            
            <div class="info-card">
                <h3>📡 Base URL</h3>
                <p>https://api-hono-fx59wgb2e-bruno-galvos-projects.vercel.app</p>
            </div>
        </div>
        
        <div class="endpoints">
            <div class="section-title">🔍 Endpoints de Status</div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/ping</span>
                </div>
                <div class="description">Endpoint de teste básico para verificar conectividade</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Resposta de sucesso</div>
                    <div class="example">"pong 🏓"</div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/health</span>
                </div>
                <div class="description">Status de saúde da API e serviços conectados</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - API saudável</div>
                    <div class="response status-500">503 - API com problemas</div>
                    <div class="example">
{
  "status": "healthy",
  "timestamp": "2025-07-29T14:12:01.643Z",
  "services": {
    "supabase": {
      "status": "connected",
      "error": null
    }
  }
}
                    </div>
                </div>
            </div>
            
            <div class="section-title">💰 Gestão de Rendimentos</div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/incomes</span>
                    <span class="feature-badge feature-auth">Auth</span>
                </div>
                <div class="description">Listar todos os rendimentos do usuário autenticado</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Lista de rendimentos</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                    <div class="example">
[
  {
    "id": "1",
    "descricao": "Salário Principal",
    "valor": "3822.00",
    "mes": "Janeiro",
    "ano": 2025,
    "user_id": "user123"
  }
]
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/incomes</span>
                    <span class="feature-badge feature-auth">Auth</span>
                </div>
                <div class="description">Criar novo rendimento</div>
                <div class="parameters">
                    <h4>Parâmetros (JSON)</h4>
                    <div class="parameter">descricao (string, obrigatório) - Descrição do rendimento</div>
                    <div class="parameter">valor (string, obrigatório) - Valor do rendimento</div>
                    <div class="parameter">mes (string, obrigatório) - Mês do rendimento</div>
                    <div class="parameter">ano (number, obrigatório) - Ano do rendimento</div>
                </div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Rendimento criado</div>
                    <div class="response status-400">400 - Dados inválidos</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method patch">PATCH</span>
                    <span class="path">/api/incomes</span>
                    <span class="feature-badge feature-auth">Auth</span>
                </div>
                <div class="description">Atualizar rendimento existente</div>
                <div class="parameters">
                    <h4>Parâmetros (JSON)</h4>
                    <div class="parameter">id (string, obrigatório) - ID do rendimento</div>
                    <div class="parameter">descricao (string, opcional) - Nova descrição</div>
                    <div class="parameter">valor (string, opcional) - Novo valor</div>
                    <div class="parameter">mes (string, opcional) - Novo mês</div>
                    <div class="parameter">ano (number, opcional) - Novo ano</div>
                </div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Rendimento atualizado</div>
                    <div class="response status-400">400 - Dados inválidos</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                    <div class="response status-404">404 - Rendimento não encontrado</div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/incomes/total-por-mes</span>
                    <span class="feature-badge feature-auth">Auth</span>
                    <span class="feature-badge feature-new">NOVO</span>
                </div>
                <div class="description">Obter total de rendimentos agrupados por mês e ano</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Totais por mês</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                    <div class="example">
[
  {
    "mes": "Janeiro",
    "ano": 2025,
    "total": 3822,
    "quantidade": 1
  },
  {
    "mes": "Abril",
    "ano": 2025,
    "total": 2333,
    "quantidade": 1
  }
]
                    </div>
                </div>
            </div>
            
            <div class="section-title">🤖 Análise Inteligente</div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/ia</span>
                    <span class="feature-badge feature-auth">Auth</span>
                    <span class="feature-badge feature-ai">IA</span>
                    <span class="feature-badge feature-new">NOVO</span>
                </div>
                <div class="description">Análise inteligente de rendimentos com recomendações de investimento usando OpenAI</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Análise completa</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                    <div class="response status-500">500 - Erro na análise</div>
                    <div class="example">
{
  "success": true,
  "data": {
    "analise": {
      "estabilidade": "Renda variável com 3 fontes diferentes",
      "tendencia": "Crescimento moderado",
      "risco": "Médio - diversificação adequada"
    },
    "recomendacoes": {
      "dolar": {
        "percentual": 25,
        "justificativa": "Proteção cambial e diversificação",
        "risco": "Médio"
      },
      "poupanca": {
        "percentual": 35,
        "justificativa": "Reserva de emergência e segurança",
        "risco": "Baixo"
      },
      "outros": {
        "sugestoes": ["CDB", "Fundos de investimento", "Tesouro Direto"],
        "justificativa": "Diversificação e crescimento"
      }
    },
    "estrategia": {
      "curtoPrazo": "Manter 6 meses de despesas em poupança",
      "medioPrazo": "Diversificar em CDB e fundos",
      "longoPrazo": "Investir em dólar para proteção cambial"
    },
    "cotacaoDolar": 5.5823,
    "resumo": "Perfil conservador com boa diversificação"
  },
  "metadata": {
    "totalRendimentos": 3,
    "totalAnual": 8487,
    "mediaMensal": 707.25,
    "cotacaoDolar": 5.5823,
    "timestamp": "2025-07-29T14:09:20.499Z"
  }
}
                    </div>
                </div>
            </div>
            
            <div class="section-title">📋 Gestão de Tarefas</div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/tasks</span>
                    <span class="feature-badge feature-auth">Auth</span>
                </div>
                <div class="description">Listar tarefas do usuário</div>
                <div class="parameters">
                    <h4>Parâmetros</h4>
                    <div class="parameter">month (number, obrigatório) - Mês (1-12)</div>
                    <div class="parameter">year (number, obrigatório) - Ano (>= 2000)</div>
                </div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Lista de tarefas</div>
                    <div class="response status-400">400 - Parâmetros inválidos</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/tasks</span>
                    <span class="feature-badge feature-auth">Auth</span>
                </div>
                <div class="description">Criar nova tarefa</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Tarefa criada</div>
                    <div class="response status-400">400 - Dados inválidos</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/tasks/total</span>
                    <span class="feature-badge feature-auth">Auth</span>
                </div>
                <div class="description">Contar total de tarefas do usuário</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Total de tarefas</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/tasks/total-paid</span>
                    <span class="feature-badge feature-auth">Auth</span>
                </div>
                <div class="description">Contar total de tarefas pagas do usuário</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Total de tarefas pagas</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/tasks/total-price</span>
                    <span class="feature-badge feature-auth">Auth</span>
                </div>
                <div class="description">Calcular valor total das tarefas do usuário</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Valor total das tarefas</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                </div>
            </div>
            
            <div class="section-title">👤 Gestão de Usuários</div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/user</span>
                    <span class="feature-badge feature-auth">Auth</span>
                </div>
                <div class="description">Obter dados do usuário logado</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Dados do usuário</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                </div>
            </div>
            
            <div class="section-title">🔧 Endpoints de Sistema</div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/test</span>
                </div>
                <div class="description">Endpoint de teste simples</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Resposta de sucesso</div>
                    <div class="example">"ok"</div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/supabase-test</span>
                </div>
                <div class="description">Testar conexão com Supabase</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Conexão OK</div>
                    <div class="response status-500">500 - Erro de conexão</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>📚 Para mais detalhes, acesse: <a href="/api/doc" style="color: #667eea;">/api/doc</a></p>
            <p>🔧 Desenvolvido com Hono + Supabase + OpenAI + Vercel</p>
            <p>🚀 <strong>Novidades:</strong> Análise de IA, Total por Mês, Cotação do Dólar</p>
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
}; 