import { createClientWithAuth, getAuthenticatedUser } from "../config/supabaseClient";
import { createBaseApp } from "../config/baseApp";

export const config = { runtime: "edge" };

const app = createBaseApp();

const path = "/api/incomes/total-incomes";

app.get(path, async (c) => {
  const token = c.req.header("Authorization") ?? "";
  if (!token) return c.json({ error: "Token ausente" }, 401);

  const supabase = createClientWithAuth(token);

  const {
    data: { user },
    error: userError,
  } = await getAuthenticatedUser(c);

  if (userError || !user) return c.json({ error: "Usuário inválido" }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .select("valor")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  const total = data?.reduce((acc, item) => acc + (item.valor ?? 0), 0) ?? 0;

  return c.json({ total_incomes: total });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
