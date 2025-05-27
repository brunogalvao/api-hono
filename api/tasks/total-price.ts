import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { createClientWithAuth } from "../config/creatClient";

export const config = { runtime: "edge" };

const app = new Hono();

// CORS
app.options("/api/tasks/total-price", () => handleOptions());

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
