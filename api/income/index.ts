import { Hono } from "hono";

export const config = {
  runtime: "edge",
};

const app = new Hono();

app.options(
  "/",
  () =>
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }),
);

app.get("/", async (c) => {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase.from("incomes").select("*");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post("/", async (c) => {
  const { createClient } = await import("@supabase/supabase-js");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return c.json({ error: "Não autenticado" }, 401);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return c.json({ error: "Usuário inválido" }, 401);
  }

  const uid = userData.user.id;
  const body = await c.req.json();
  const { descricao, valor, mes, ano } = body;

  if (!valor || !mes || !ano) {
    return c.json({ error: "Campos obrigatórios ausentes" }, 400);
  }

  const { data, error } = await supabase
    .from("incomes")
    .insert([{ user_id: uid, descricao, valor, mes, ano }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
