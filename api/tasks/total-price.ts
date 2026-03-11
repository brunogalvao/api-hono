import { createClientWithAuth } from "../config/supabaseClient";
import { createBaseApp } from "../config/baseApp";

export const config = { runtime: "edge" };

const app = createBaseApp();

// GET /api/tasks/total-price – soma apenas tarefas do usuário autenticado
app.get("/api/tasks/total-price", async (c) => {
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
    .select("price")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  const total =
    data?.reduce((sum: number, item: any) => sum + (item.price || 0), 0) ?? 0;

  return c.json({ totalPrice: total });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
