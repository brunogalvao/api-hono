import { createClientWithAuth, getAuthenticatedUser } from "../config/supabaseClient";
import { createBaseApp } from "../config/baseApp";
import { updateTaskSchema } from "../model/task.schema";

export const config = { runtime: "edge" };

const app = createBaseApp();

// PUT /api/tasks/:id
app.put("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const token = c.req.header("Authorization");
  const supabase = createClientWithAuth(token);

  const {
    data: { user },
    error: authError,
  } = await getAuthenticatedUser(c);

  if (authError || !user) {
    return c.json({ error: "Usuário não autenticado." }, 401);
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(parsed.data)
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
  } = await getAuthenticatedUser(c);

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

export const OPTIONS = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;
export default app.fetch;
