import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { createClientWithAuth } from "../config/creatClient";

export const config = { runtime: "edge" };

const app = new Hono();

// CORS
app.options("/api/tasks/:id", () => handleOptions());

// PUT /api/tasks/:id
app.put("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const token = c.req.header("Authorization");
  const supabase = createClientWithAuth(token);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return c.json({ error: "Usuário não autenticado." }, 401);
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data.length) return c.json({ error: "Tarefa não encontrada." }, 404);

  return c.json(data[0]);
});

// DELETE /api/tasks/:id
app.delete("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");

  const token = c.req.header("Authorization");
  const supabase = createClientWithAuth(token);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return c.json({ error: "Usuário não autenticado." }, 401);
  }

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data.length)
    return c.json({ error: "Tarefa não encontrada ou acesso negado." }, 404);

  return c.json({ message: "Tarefa deletada com sucesso." });
});

// Exports
export const OPTIONS = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;
