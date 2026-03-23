import { createClientWithAuth, getAuthenticatedUser } from "../config/supabaseClient";
import { createBaseApp } from "../config/baseApp";

export const config = { runtime: "edge" };

const app = createBaseApp();

// DELETE - ROTA: /api/incomes/:id
app.delete("/api/incomes/:id", async (c) => {
  const token = c.req.header("Authorization") ?? "";
  if (!token) return c.json({ error: "Token ausente" }, 401);

  const id = c.req.param("id");
  if (!id) return c.json({ error: "ID do rendimento ausente" }, 400);

  const supabase = createClientWithAuth(token);

  const {
    data: { user },
    error: userError,
  } = await getAuthenticatedUser(c);

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
