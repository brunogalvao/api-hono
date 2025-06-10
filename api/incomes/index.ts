import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";

export const config = { runtime: "edge" };

const app = new Hono();

// ✅ Rota OPTIONS necessária para CORS
app.options("/api/incomes", () => handleOptions());

// ✅ GET - listar rendimento
app.get("/api/incomes", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Token ausente" }, 401);

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );

  const { data, error } = await supabase.from("incomes").select("*");

  if (error) {
    console.error("❌ Erro Supabase:", error);
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

// ✅ POST - cria novo rendimento
app.post("/api/incomes", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Token ausente" }, 401);

  const { descricao, valor, mes, ano } = await c.req.json();
  if (!valor || !mes || !ano)
    return c.json({ error: "Campos obrigatórios ausentes" }, 400);

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user)
    return c.json({ error: "Usuário inválido" }, 401);

  const uid = userData.user.id;

  const { data, error } = await supabase
    .from("incomes")
    .insert([{ user_id: uid, descricao, valor, mes, ano }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data?.[0]);
});

// ✅ PATCH - atualiza rendimento existente
app.patch("/api/incomes", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Token ausente" }, 401);

  const { id, descricao, valor, mes, ano } = await c.req.json();
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

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user)
    return c.json({ error: "Usuário inválido" }, 401);

  const uid = userData.user.id;

  const { data, error } = await supabase
    .from("incomes")
    .update({ descricao, valor, mes, ano })
    .eq("id", id)
    .eq("user_id", uid) // garante que só edita o próprio rendimento
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
