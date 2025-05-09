import { serve } from "@hono/node-server";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

const app = new OpenAPIHono();

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "API local Hono CRUD",
    version: "1.0.0",
  },
});

app.get("/swagger-tasks", swaggerUI({ url: "/doc" }));

// Exemplo de rota
const route = createRoute({
  method: "get",
  path: "/api/tasks",
  responses: {
    200: {
      description: "Lista de tarefas",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              done: z.boolean(),
              created_at: z.string(),
            }),
          ),
        },
      },
    },
  },
});

app.openapi(route, async (c) => {
  return c.json([
    {
      id: "1",
      title: "Tarefa de exemplo",
      done: false,
      created_at: new Date().toISOString(),
    },
  ]);
});

serve({ fetch: app.fetch, port: 3000 });

console.log("API Rodando");
