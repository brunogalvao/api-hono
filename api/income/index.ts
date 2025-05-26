import { Hono } from "hono";

export const config = {
  runtime: "nodejs", // troca de edge para nodejs
};

const app = new Hono();

// 🔍 Log de path
app.use("*", async (c, next) => {
  const url = new URL(c.req.url, "http://localhost"); // usa base fictícia

  console.log("🔎 MÉTODO:", c.req.method);
  console.log("🔎 PATH:", url.pathname);
  console.log("🔎 URL:", c.req.url);
  await next();
});

// CORS
app.options(
  "/api/income",
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

// GET rendimentos
app.get("/", async (c) => {
  const { createClient } = await import("@supabase/supabase-js");

  const url = new URL(c.req.url, "http://localhost");
  console.log("🔎 MÉTODO:", c.req.method);
  console.log("🔎 PATH:", url.pathname);
  console.log("🔎 URL:", url.toString());

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  try {
    const result = await Promise.race([
      supabase.from("incomes").select("*"),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("⏱ Timeout: Supabase não respondeu")),
          7000,
        ),
      ),
    ]);

    const { data, error } = result as { data: any; error: any };

    if (error) {
      console.error("❌ Erro Supabase:", error);
      return c.json({ error: error.message }, 500);
    }

    console.log("✅ Registros retornados:", data.length);
    return c.json(data);
  } catch (err: any) {
    console.error("💥 Erro inesperado:", err.message || err);
    return c.json({ error: err.message || "Erro inesperado" }, 500);
  }
});

// POST rendimento
app.post("/api/income", async (c) => {
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
