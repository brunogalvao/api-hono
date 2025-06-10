import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { getSupabaseClient } from "../config/supabaseClient";

export const config = { runtime: "edge" };

const app = new Hono();

// CORS
app.options("/api/incomes", () => handleOptions());

// GET - listar rendimentos do usuário
app.get("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json({ error: "Usuário não autenticado" }, 401);
  }

  const { data, error: fetchError } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", user.id);

  if (fetchError) return c.json({ error: fetchError.message }, 500);
  return c.json(data);
});

// POST - cria rendimento
app.post("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);
  const body = await c.req.json();
  const { descricao, valor, mes, ano } = body;

  if (!valor || !mes || !ano) {
    return c.json({ error: "Campos obrigatórios ausentes" }, 400);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json({ error: "Usuário não autenticado" }, 401);
  }

  const { data, error: insertError } = await supabase
    .from("incomes")
    .insert([{ user_id: user.id, descricao, valor, mes, ano }])
    .select();

  if (insertError) return c.json({ error: insertError.message }, 500);
  return c.json(data?.[0]);
});

// PATCH - atualiza rendimento existente
app.patch("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);
  const { id, descricao, valor, mes, ano } = await c.req.json();

  if (!id) {
    return c.json({ error: "ID do rendimento ausente" }, 400);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json({ error: "Usuário não autenticado" }, 401);
  }

  const { data, error: updateError } = await supabase
    .from("incomes")
    .update({ descricao, valor, mes, ano })
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (updateError) return c.json({ error: updateError.message }, 500);
  if (!data.length) return c.json({ error: "Rendimento não encontrado" }, 404);

  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
