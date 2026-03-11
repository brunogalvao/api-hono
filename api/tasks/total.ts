import { createClientWithAuth } from "../config/supabaseClient";
import { createBaseApp } from "../config/baseApp";

export const config = { runtime: "edge" };

const app = createBaseApp();

// GET /api/tasks/total – conta apenas tarefas do usuário logado
app.get("/api/tasks/total", async (c) => {
  const token = c.req.header("Authorization");
  const supabase = createClientWithAuth(token);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return c.json({ error: "Usuário não autenticado." }, 401);
  }

  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ total: count ?? 0 });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
