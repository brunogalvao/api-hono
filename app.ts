import { Hono } from "hono";

export const app = new Hono();

// Rota simples para teste
app.get("/api/tasks", async (c) => {
  try {
    return c.json([
      {
        id: "1",
        title: "Tarefa de exemplo",
        done: false,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    return c.json({ error: "Erro interno" }, 500);
  }
});
