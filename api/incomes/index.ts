import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { getSupabaseClient, getUserOrThrow } from "../config/supabaseClient";

export const config = { runtime: "edge" };
const app = new Hono();

// OPTIONS – CORS
app.options("/api/incomes", () => handleOptions());

// GET – Listar rendimentos
app.get("/api/incomes", async (c) => {
  try {
    const supabase = getSupabaseClient(c);
    const { data, error } = await supabase.from("incomes").select("*");
    if (error) return c.json({ error: error.message }, 500);
    return c.json(data);
  } catch (err) {
    return c.json({ error: "Erro inesperado." }, 500);
  }
});

// POST – Criar rendimento
app.post("/api/incomes", async (c) => {
  try {
    const { supabase, user } = await getUserOrThrow(c);
    const { descricao, valor, mes, ano } = await c.req.json();

    if (!valor || !mes || !ano) {
      return c.json({ error: "Campos obrigatórios ausentes" }, 400);
    }

    const { data, error } = await supabase
      .from("incomes")
      .insert([{ user_id: user.id, descricao, valor, mes, ano }])
      .select();

    if (error) return c.json({ error: error.message }, 500);
    return c.json(data?.[0]);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Erro" }, 401);
  }
});

// PATCH – Atualizar rendimento
app.patch("/api/incomes", async (c) => {
  try {
    const { supabase, user } = await getUserOrThrow(c);
    const { id, descricao, valor, mes, ano } = await c.req.json();

    if (!id) return c.json({ error: "ID do rendimento ausente" }, 400);

    const { data, error } = await supabase
      .from("incomes")
      .update({ descricao, valor, mes, ano })
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) return c.json({ error: error.message }, 500);
    if (!data.length)
      return c.json({ error: "Rendimento não encontrado" }, 404);

    return c.json(data[0]);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Erro" }, 401);
  }
});

export const GET = app.fetch;
export const POST = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
