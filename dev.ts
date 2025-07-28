import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

// Rota simples para teste local
app.get("/api/tasks", async (c) => {
  return c.json([
    {
      id: "1",
      title: "Tarefa de exemplo",
      done: false,
      created_at: new Date().toISOString(),
    },
  ]);
});

// Rota para documentação
app.get("/api/docs", async (c) => {
  return c.redirect("/api/docs-ui");
});

serve({ fetch: app.fetch, port: 3000 });

console.log("🚀 API Rodando em http://localhost:3000");
console.log("📚 Documentação: http://localhost:3000/api/docs");
