import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { createClientWithAuth } from "../config/creatClient";

export const config = { runtime: "edge" };

const app = new Hono();

// const url = "total-incomes";

// CORS
app.options("/api/income/total-income", () => handleOptions());

// GET /api/tasks/total-price – soma apenas tarefas do usuário autenticado
app.get("/api/income/total-income", async (c) => {
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
    .from("income")
    .select("valor")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  const total =
    data?.reduce((sum: number, item: any) => sum + (item.valor || 0), 0) ?? 0;

  return c.json({ totalPrice: total });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
