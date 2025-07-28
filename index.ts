export const config = { runtime: "edge" };

export const GET = async () => {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Hono - Gerenciamento de Tarefas e Rendimentos</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .logo {
            font-size: 3rem;
            margin-bottom: 20px;
        }
        
        .title {
            font-size: 2rem;
            color: #333;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 30px;
        }
        
        .description {
            font-size: 1rem;
            color: #555;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 30px;
        }
        
        .btn {
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-secondary {
            background: #f8f9fa;
            color: #667eea;
            border: 1px solid #667eea;
        }
        
        .endpoints {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .endpoints h3 {
            color: #333;
            margin-bottom: 15px;
        }
        
        .endpoint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .endpoint-item {
            background: white;
            padding: 10px;
            border-radius: 6px;
            border-left: 3px solid #667eea;
        }
        
        .endpoint-method {
            font-weight: 600;
            color: #667eea;
            font-size: 0.8rem;
        }
        
        .endpoint-path {
            font-family: monospace;
            color: #333;
            font-size: 0.8rem;
        }
        
        .footer {
            margin-top: 30px;
            color: #666;
            font-size: 0.8rem;
        }
        
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h1 class="title">API Hono</h1>
        <p class="subtitle">Gerenciamento de Tarefas e Rendimentos</p>
        
        <p class="description">
            API serverless desenvolvida com <strong>Hono</strong> para gerenciamento completo de tarefas e rendimentos. 
            Integrada com <strong>Supabase</strong> e deployada na <strong>Vercel</strong>.
        </p>
        
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
}; 