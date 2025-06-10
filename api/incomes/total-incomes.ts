import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";

export const config = { runtime: "edge" };

const app = new Hono();

const path = "/api/incomes/total-incomes";

// ✅ REGISTRA ROTA OPTIONS PARA CORS
app.options(path, () => handleOptions());

// ✅ ROTA GET - retorna total de rendimentos
app.get(path, async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Token ausente" }, 401);

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    },
  );

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user)
    return c.json({ error: "Usuário inválido" }, 401);

  const uid = userData.user.id;

  const { data, error } = await supabase
    .from("incomes")
    .select("valor")
    .eq("user_id", uid);

  if (error) return c.json({ error: error.message }, 500);

  const total = data?.reduce((acc, item) => acc + (item.valor ?? 0), 0) ?? 0;

  return c.json({ total_incomes: total });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
