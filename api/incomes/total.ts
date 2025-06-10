import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader"; // ajuste se for caminho relativo
import { createClientWithAuth } from "../config/creatClient";

export const config = { runtime: "edge" };

const app = new Hono();

const path = "/api/incomes/total-incomes";

app.options(path, () => handleOptions());

app.get(path, async (c) => {
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

export default app.fetch;
