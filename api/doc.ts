export const config = { runtime: "edge" };

// Interface para definir uma rota
interface RouteInfo {
  path: string;
  method: string;
  description: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requestBody?: {
    type: string;
    required: boolean;
    description: string;
  };
  responses: {
    [statusCode: string]: {
      description: string;
      example?: any;
    };
  };
}

// Definição das rotas da API
const routes: RouteInfo[] = [
  {
    path: "/api/ping",
    method: "GET",
    description: "Endpoint de teste básico",
    responses: {
      "200": {
        description: "Resposta de sucesso",
        example: "pong 🏓"
      }
    }
  },
  {
    path: "/api/test",
    method: "GET",
    description: "Endpoint de teste simples",
    responses: {
      "200": {
        description: "Resposta de sucesso",
        example: "ok"
      }
    }
  },
  {
    path: "/api/health",
    method: "GET",
    description: "Status de saúde da API e serviços",
    responses: {
      "200": {
        description: "API saudável",
        example: {
          status: "healthy",
          timestamp: "2025-07-28T12:00:00.000Z",
          services: {
            supabase: { status: "connected" }
          }
        }
      },
      "503": {
        description: "API com problemas",
        example: {
          status: "unhealthy",
          error: "Erro de conexão com Supabase"
        }
      }
    }
  },
  {
    path: "/api/supabase-test",
    method: "GET",
    description: "Teste de conexão com Supabase",
    responses: {
      "200": {
        description: "Conexão bem-sucedida",
        example: {
          status: "success",
          message: "Conexão com Supabase estabelecida com sucesso!"
        }
      },
      "500": {
        description: "Erro de conexão",
        example: {
          status: "error",
          message: "SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios"
        }
      }
    }
  },
  {
    path: "/api/tasks",
    method: "GET",
    description: "Listar tarefas do usuário",
    parameters: [
      {
        name: "month",
        type: "number",
        required: true,
        description: "Mês (1-12)"
      },
      {
        name: "year",
        type: "number",
        required: true,
        description: "Ano (>= 2000)"
      }
    ],
    responses: {
      "200": {
        description: "Lista de tarefas",
        example: [
          {
            id: "1",
            title: "Tarefa exemplo",
            done: false,
            created_at: "2025-07-28T12:00:00.000Z"
          }
        ]
      },
      "400": {
        description: "Parâmetros inválidos",
        example: {
          error: "Campo obrigatório ausente: month"
        }
      },
      "401": {
        description: "Usuário não autenticado",
        example: {
          error: "Usuário não autenticado."
        }
      }
    }
  },
  {
    path: "/api/tasks",
    method: "POST",
    description: "Criar nova tarefa",
    requestBody: {
      type: "object",
      required: true,
      description: "Dados da tarefa"
    },
    responses: {
      "200": {
        description: "Tarefa criada",
        example: {
          id: "1",
          title: "Nova tarefa",
          done: false,
          user_id: "user123"
        }
      },
      "400": {
        description: "Dados inválidos",
        example: {
          error: "Campos 'mes' e 'ano' inválidos."
        }
      },
      "401": {
        description: "Usuário não autenticado",
        example: {
          error: "Usuário não autenticado."
        }
      }
    }
  },
  {
    path: "/api/tasks/total",
    method: "GET",
    description: "Contar total de tarefas do usuário",
    responses: {
      "200": {
        description: "Total de tarefas",
        example: {
          total: 5
        }
      },
      "401": {
        description: "Usuário não autenticado",
        example: {
          error: "Usuário não autenticado."
        }
      }
    }
  },
  {
    path: "/api/incomes",
    method: "GET",
    description: "Listar rendimentos do usuário",
    responses: {
      "200": {
        description: "Lista de rendimentos",
        example: [
          {
            id: "1",
            descricao: "Salário",
            valor: 5000,
            mes: 7,
            ano: 2025
          }
        ]
      },
      "401": {
        description: "Usuário não autenticado",
        example: {
          error: "Usuário não autenticado"
        }
      }
    }
  },
  {
    path: "/api/incomes",
    method: "POST",
    description: "Criar novo rendimento",
    requestBody: {
      type: "object",
      required: true,
      description: "Dados do rendimento"
    },
    responses: {
      "200": {
        description: "Rendimento criado",
        example: {
          id: "1",
          descricao: "Salário",
          valor: 5000,
          mes: 7,
          ano: 2025
        }
      },
      "400": {
        description: "Dados inválidos",
        example: {
          error: "Campos obrigatórios ausentes"
        }
      },
      "401": {
        description: "Usuário não autenticado",
        example: {
          error: "Usuário não autenticado"
        }
      }
    }
  },
  {
    path: "/api/user",
    method: "GET",
    description: "Obter dados do usuário logado",
    responses: {
      "200": {
        description: "Dados do usuário",
        example: {
          id: "user123",
          email: "user@example.com",
          created_at: "2025-01-01T00:00:00.000Z"
        }
      },
      "401": {
        description: "Usuário não autenticado",
        example: {
          error: "Usuário não autenticado"
        }
      }
    }
  }
];

export const GET = async () => {
  const documentation = {
    title: "API Hono - Documentação",
    version: "1.0.0",
    description: "API para gerenciamento de tarefas e rendimentos",
    baseUrl: "https://api-hono-jet.vercel.app",
    endpoints: routes,
    info: {
      authentication: "Bearer Token no header Authorization",
      cors: "Habilitado para todos os domínios",
      runtime: "Edge Runtime (Vercel)"
    },
    examples: {
      headers: {
        "Authorization": "Bearer seu-token-aqui",
        "Content-Type": "application/json"
      }
    }
  };

  return new Response(
    JSON.stringify(documentation, null, 2),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    }
  );
};
