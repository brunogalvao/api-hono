export const config = { runtime: "edge" };

export const GET = async () => {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Hono</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #ffffff;
            color: #333333;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #f9f9f9;
            padding: 30px;
            border: 1px solid #dddddd;
            text-align: center;
        }
        
        h1 {
            color: #333333;
            margin-bottom: 20px;
        }
        
        p {
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .buttons {
            margin: 30px 0;
        }
        
        .btn {
            display: inline-block;
            padding: 10px 20px;
            margin: 5px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }
        
        .btn-secondary {
            background: #6c757d;
        }
        
        .endpoints {
            background: #ffffff;
            padding: 20px;
            margin-top: 20px;
            border: 1px solid #dddddd;
        }
        
        .endpoint-item {
            background: #f8f9fa;
            padding: 8px;
            margin: 5px 0;
            border-left: 3px solid #007bff;
        }
        
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666666;
        }
        
        .footer a {
            color: #007bff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>API Hono</h1>
        <p>Gerenciamento de Tarefas e Rendimentos</p>
        
        <p>
            API serverless desenvolvida com Hono para gerenciamento completo de tarefas e rendimentos. 
            Integrada com Supabase e deployada na Vercel.
        </p>
        
        <div class="buttons">
            <a href="/api/docs-ui" class="btn">Ver Documentacao</a>
            <a href="/api/health" class="btn btn-secondary">Status da API</a>
        </div>
        
        <div class="endpoints">
            <h3>Endpoints Principais</h3>
            <div class="endpoint-item">
                <strong>GET</strong> /api/ping
            </div>
            <div class="endpoint-item">
                <strong>GET</strong> /api/health
            </div>
            <div class="endpoint-item">
                <strong>GET</strong> /api/tasks
            </div>
            <div class="endpoint-item">
                <strong>POST</strong> /api/tasks
            </div>
            <div class="endpoint-item">
                <strong>GET</strong> /api/incomes
            </div>
            <div class="endpoint-item">
                <strong>GET</strong> /api/user
            </div>
        </div>
        
        <div class="footer">
            <p>Desenvolvido por Bruno Galvao</p>
            <p><a href="https://github.com/brunogalvao/api-hono" target="_blank">Ver codigo no GitHub</a></p>
        </div>
    </div>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}; 