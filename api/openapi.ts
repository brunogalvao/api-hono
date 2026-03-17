export const config = { runtime: "edge" };

const spec = {
  openapi: "3.0.3",
  info: {
    title: "API Financeira",
    description: "API para gerenciamento financeiro pessoal com análise inteligente via Google Gemini.",
    version: "1.0.0",
  },
  servers: [
    { url: "https://api-hono-jet.vercel.app", description: "Produção" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT do Supabase Auth",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Usuário não autenticado." },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", example: "Aluguel" },
          price: { type: "number", example: 1500.00 },
          done: { type: "string", enum: ["Pago", "Fixo", "Pendente"], example: "Pendente" },
          mes: { type: "integer", minimum: 1, maximum: 12, example: 3 },
          ano: { type: "integer", minimum: 2000, example: 2026 },
          user_id: { type: "string", format: "uuid" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      CreateTask: {
        type: "object",
        required: ["title", "mes", "ano"],
        properties: {
          title: { type: "string", example: "Aluguel" },
          price: { type: "number", example: 1500.00 },
          done: { type: "string", enum: ["Pago", "Fixo", "Pendente"], example: "Pendente" },
          mes: { type: "integer", minimum: 1, maximum: 12, example: 3 },
          ano: { type: "integer", minimum: 2000, example: 2026 },
        },
      },
      Income: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          descricao: { type: "string", example: "Salário" },
          valor: { type: "number", example: 5000.00 },
          mes: { type: "integer", minimum: 1, maximum: 12, example: 3 },
          ano: { type: "integer", minimum: 2000, example: 2026 },
          user_id: { type: "string", format: "uuid" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      CreateIncome: {
        type: "object",
        required: ["valor", "mes", "ano"],
        properties: {
          descricao: { type: "string", example: "Salário" },
          valor: { type: "number", example: 5000.00 },
          mes: { type: "integer", minimum: 1, maximum: 12, example: 3 },
          ano: { type: "integer", minimum: 2000, example: 2026 },
        },
      },
      UpdateIncome: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" },
          descricao: { type: "string", example: "Salário atualizado" },
          valor: { type: "number", example: 5500.00 },
          mes: { type: "integer", minimum: 1, maximum: 12 },
          ano: { type: "integer", minimum: 2000 },
        },
      },
    },
  },
  paths: {
    "/api/ping": {
      get: {
        tags: ["Utilitários"],
        summary: "Ping",
        description: "Verifica se a API está no ar.",
        responses: {
          "200": { description: "pong", content: { "text/plain": { schema: { type: "string", example: "pong 🏓" } } } },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["Utilitários"],
        summary: "Health check",
        description: "Retorna o status da API e da conexão com o Supabase.",
        responses: {
          "200": {
            description: "API saudável",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["healthy", "degraded"], example: "healthy" },
                    timestamp: { type: "string", format: "date-time" },
                    uptime: { type: "integer" },
                    services: {
                      type: "object",
                      properties: {
                        supabase: {
                          type: "object",
                          properties: {
                            status: { type: "string", enum: ["connected", "error"] },
                            error: { type: "string", nullable: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "503": { description: "Serviço degradado" },
        },
      },
    },
    "/api/user": {
      get: {
        tags: ["Autenticação"],
        summary: "Dados do usuário",
        description: "Retorna os dados do usuário autenticado.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Dados do usuário",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    email: { type: "string", format: "email" },
                    created_at: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/tasks": {
      get: {
        tags: ["Tarefas"],
        summary: "Listar tarefas",
        description: "Retorna as tarefas do usuário filtradas por mês e ano.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "month", in: "query", required: true, schema: { type: "integer", minimum: 1, maximum: 12 }, example: 3 },
          { name: "year", in: "query", required: true, schema: { type: "integer", minimum: 2000 }, example: 2026 },
        ],
        responses: {
          "200": {
            description: "Lista de tarefas",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Task" } } } },
          },
          "400": { description: "Parâmetros inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Tarefas"],
        summary: "Criar tarefa",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateTask" } } },
        },
        responses: {
          "200": { description: "Tarefa criada", content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } } },
          "400": { description: "Dados inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/tasks/total": {
      get: {
        tags: ["Tarefas"],
        summary: "Total de tarefas",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Total",
            content: { "application/json": { schema: { type: "object", properties: { total: { type: "integer" } } } } },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/tasks/total-paid": {
      get: {
        tags: ["Tarefas"],
        summary: "Total de tarefas pagas",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Total pago",
            content: { "application/json": { schema: { type: "object", properties: { total: { type: "number" } } } } },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/tasks/total-price": {
      get: {
        tags: ["Tarefas"],
        summary: "Total de tarefas pendentes",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Total pendente",
            content: { "application/json": { schema: { type: "object", properties: { total: { type: "number" } } } } },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/incomes": {
      get: {
        tags: ["Rendimentos"],
        summary: "Listar rendimentos",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista de rendimentos",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Income" } } } },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Rendimentos"],
        summary: "Criar rendimento",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateIncome" } } },
        },
        responses: {
          "200": { description: "Rendimento criado", content: { "application/json": { schema: { $ref: "#/components/schemas/Income" } } } },
          "400": { description: "Dados inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Rendimentos"],
        summary: "Atualizar rendimento",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateIncome" } } },
        },
        responses: {
          "200": { description: "Rendimento atualizado", content: { "application/json": { schema: { $ref: "#/components/schemas/Income" } } } },
          "400": { description: "Dados inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Rendimento não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/incomes/total-por-mes": {
      get: {
        tags: ["Rendimentos"],
        summary: "Total de rendimentos por mês",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Totais agrupados por mês/ano",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      mes: { type: "integer" },
                      ano: { type: "integer" },
                      total: { type: "number" },
                      quantidade: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/ia/analise-investimento": {
      post: {
        tags: ["IA"],
        summary: "Análise de investimento",
        description: "Análise financeira personalizada com Google Gemini baseada nos dados reais do usuário.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Análise gerada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        dashboard: { type: "object" },
                        investimento: { type: "object" },
                        cotacaoDolar: { type: "object" },
                        analise: { type: "object" },
                      },
                    },
                    metadata: { type: "object" },
                  },
                },
              },
            },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
};

export const GET = () =>
  new Response(JSON.stringify(spec, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
