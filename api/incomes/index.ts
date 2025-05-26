import { Hono } from "hono";

export const config = { runtime: "edge" };

const app = new Hono();

// Supabase Client Helper
const getSupabase = async (token?: string) => {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    token
      ? { global: { headers: { Authorization: `Bearer ${token}` } } }
      : undefined,
  );
};

// ✅ GET /api/incomes → lista todos os rendimentos
app.get("/api/incomes", async (c) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("incomes").select("*");

  if (error) {
    console.error("❌ Supabase GET error:", error);
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

// ✅ POST /api/incomes → cria um novo rendimento
app.post("/api/incomes", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Não autenticado" }, 401);

  const supabase = await getSupabase(token);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user)
    return c.json({ error: "Usuário inválido" }, 401);

  const uid = userData.user.id;
  const { descricao, valor, mes, ano } = await c.req.json();

  if (!valor || !mes || !ano)
    return c.json({ error: "Campos obrigatórios ausentes" }, 400);

  const { data, error } = await supabase
    .from("incomes")
    .insert([{ user_id: uid, descricao, valor, mes, ano }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

// ✅ DELETE /api/incomes → deleta um rendimento por ID (via ?id=)
app.delete("/api/incomes", async (c) => {
  const id = c.req.query("id");
  if (!id) return c.json({ error: "ID obrigatório" }, 400);

  const supabase = await getSupabase();
  const { error } = await supabase.from("incomes").delete().eq("id", id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// 👇 obrigatório para funcionar na Vercel
export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;
export default app.fetch;
