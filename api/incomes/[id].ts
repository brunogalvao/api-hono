import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader"; // ajuste o caminho se for diferente

export const config = { runtime: "edge" };

const app = new Hono();

// ✅ CORS para DELETE /api/incomes/:id
app.options("/api/incomes/:id", () => handleOptions());

// ✅ DELETE - ROTA: /api/incomes/:id
app.delete("/api/incomes/:id", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Token ausente" }, 401);

  const id = c.req.param("id");
  if (!id) return c.json({ error: "ID do rendimento ausente" }, 400);

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

  // Verifica o usuário autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return c.json({ error: "Usuário não autenticado." }, 401);
  }

  const { data, error } = await supabase
    .from("incomes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data?.length) return c.json({ error: "Rendimento não encontrado ou acesso negado." }, 404);

  return c.json({ success: true });
});

export const OPTIONS = app.fetch;
export const DELETE = app.fetch;
export default app.fetch;
