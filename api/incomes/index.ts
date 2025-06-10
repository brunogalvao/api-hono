import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { getSupabaseClient } from "../config/supabaseClient";

export const config = { runtime: "edge" };

const app = new Hono();

app.options("/api/incomes", () => handleOptions());

app.get("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);
  const token = c.req.header("Authorization")?.replace("Bearer ", "") || "";

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user)
    return c.json({ error: "Usuário inválido" }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", userData.user.id);
  if (error) return c.json({ error: error.message }, 500);

  return c.json(data);
});

app.post("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);
  const token = c.req.header("Authorization")?.replace("Bearer ", "") || "";

  const { descricao, valor, mes, ano } = await c.req.json();
  if (!valor || !mes || !ano)
    return c.json({ error: "Campos obrigatórios ausentes" }, 400);

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user)
    return c.json({ error: "Usuário inválido" }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .insert([{ user_id: userData.user.id, descricao, valor, mes, ano }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data?.[0]);
});

app.patch("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);
  const token = c.req.header("Authorization")?.replace("Bearer ", "") || "";

  const { id, descricao, valor, mes, ano } = await c.req.json();
  if (!id) return c.json({ error: "ID do rendimento ausente" }, 400);

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user)
    return c.json({ error: "Usuário inválido" }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .update({ descricao, valor, mes, ano })
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data.length) return c.json({ error: "Rendimento não encontrado" }, 404);

  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
