import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { supabase } from "./supabase/client";

export const app = new OpenAPIHono();

// Documentação Swagger JSON
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "API Hono Supabase CRUD",
    version: "1.0.0",
  },
});

// Swagger visual
app.get("/ui", swaggerUI({ url: "/doc" }));

// Definição da rota com OpenAPI
const listTasks = createRoute({
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

app.openapi(listTasks, async (c) => {
  const { data, error } = await supabase.from("tasks").select("*");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});
