import { getSupabaseClient } from "../config/supabaseClient";
import { createBaseApp } from "../config/baseApp";
import { createTaskSchema } from "../model/task.schema";

export const config = { runtime: "edge" };

const app = createBaseApp();

// GET
app.get("/api/tasks", async (c) => {
  const supabase = getSupabaseClient(c);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado." }, 401);

  const month = Number(c.req.query("month"));
  const year = Number(c.req.query("year"));

  if (!month || !year) {
    return c.json({ error: "Parâmetros 'month' e 'year' são obrigatórios." }, 400);
  }
  if (month < 1 || month > 12 || year < 2000) {
    return c.json({ error: "Parâmetros 'month' ou 'year' inválidos." }, 400);
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("mes", month)
    .eq("ano", year)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// POST
app.post("/api/tasks", async (c) => {
  const supabase = getSupabaseClient(c);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado." }, 401);

  const body = await c.req.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert([{ ...parsed.data, user_id: user.id }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
