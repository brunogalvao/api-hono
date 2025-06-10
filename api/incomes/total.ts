import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { createClientWithAuth } from "../config/creatClient";

export const config = { runtime: "edge" };

const app = new Hono();

const pathTotalIncomes = "/api/incomes/total-incomes";

// CORS para a rota correta
app.options(pathTotalIncomes, () => handleOptions());

// GET da rota
app.get(pathTotalIncomes, async (c) => {
  try {
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
      .from("incomes")
      .select("valor")
      .eq("user_id", user.id);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    const total = data.reduce((acc, item) => acc + (item.valor ?? 0), 0);
    return c.json({ total_incomes: total });
  } catch (e: any) {
    return c.json({ error: "Erro interno no servidor." }, 500);
  }
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
