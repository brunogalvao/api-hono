export const config = { runtime: "edge" };

export const GET = async () => {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Hono - Documentação</title>
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
        .method.put { background: #f59e0b; color: white; }
        .method.delete { background: #ef4444; color: white; }
        
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
        .status-500 { color: #ef4444; }
        
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
            <p>Documentação completa da API para gerenciamento de tarefas e rendimentos</p>
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
                <p>https://api-hono-jet.vercel.app</p>
            </div>
        </div>
        
        <div class="endpoints">
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/ping</span>
                </div>
                <div class="description">Endpoint de teste básico</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Resposta de sucesso</div>
                    <div class="example">"pong 🏓"</div>
                </div>
            </div>
            
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
                    <span class="path">/api/health</span>
                </div>
                <div class="description">Status de saúde da API e serviços</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - API saudável</div>
                    <div class="response status-500">503 - API com problemas</div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/tasks</span>
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
                    <span class="path">/api/incomes</span>
                </div>
                <div class="description">Listar rendimentos do usuário</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Lista de rendimentos</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/incomes</span>
                </div>
                <div class="description">Criar novo rendimento</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Rendimento criado</div>
                    <div class="response status-400">400 - Dados inválidos</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/user</span>
                </div>
                <div class="description">Obter dados do usuário logado</div>
                <div class="responses">
                    <h4>Respostas</h4>
                    <div class="response status-200">200 - Dados do usuário</div>
                    <div class="response status-401">401 - Usuário não autenticado</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>📚 Para mais detalhes, acesse: <a href="/api/doc" style="color: #667eea;">/api/doc</a></p>
            <p>🔧 Desenvolvido com Hono + Supabase + Vercel</p>
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