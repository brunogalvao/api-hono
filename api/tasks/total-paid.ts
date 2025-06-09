import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { createClientWithAuth } from "../config/creatClient";

export const config = { runtime: "edge" };

const app = new Hono();

// CORS
app.options("/api/tasks/total-paid", () => handleOptions());

// GET /api/tasks/total-paid – soma o valor das tarefas marcadas como feitas (done = true)
app.get("/api/tasks/total-paid", async (c) => {
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
    .select("valor")
    .eq("user_id", user.id)
    .eq("done", true);

  if (error) return c.json({ error: error.message }, 500);

  const totalPago = data?.reduce((acc, item) => acc + (item.valor ?? 0), 0);

  return c.json({ total_paid: totalPago ?? 0 });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
