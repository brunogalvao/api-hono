import { createAuthApp } from "../config/baseApp";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.delete("/api/incomes/:id", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "ID do rendimento ausente" }, 400);

  const supabase = c.get("supabase");
  const user = c.get("user");

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
