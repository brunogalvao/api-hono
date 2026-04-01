import { createAuthApp } from "../config/baseApp";
import { createIncomeSchema, updateIncomeSchema } from "../model/income.schema";

export const config = { runtime: "edge" };

const app = createAuthApp();

// GET - listar rendimentos
app.get("/api/incomes", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

// POST - cria novo rendimento
app.post("/api/incomes", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const body = await c.req.json();
  const parsed = createIncomeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  const { data, error } = await supabase
    .from("incomes")
    .insert([{ user_id: user.id, ...parsed.data }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data?.[0]);
});

// PATCH - atualiza rendimento existente
app.patch("/api/incomes", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const body = await c.req.json();
  const parsed = updateIncomeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  const { id, ...updateData } = parsed.data;

  const { data, error } = await supabase
    .from("incomes")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data || !data.length) return c.json({ error: "Rendimento não encontrado" }, 404);

  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
