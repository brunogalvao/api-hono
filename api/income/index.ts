import { Hono } from "hono";

export const config = {
  runtime: "edge", // Vercel aceita apenas 'edge' aqui
};

const app = new Hono();

// 🔍 Logger global
app.use("*", async (c, next) => {
  const url = new URL(c.req.url, "http://localhost");
  console.log("📦 MÉTODO:", c.req.method);
  console.log("📦 PATH:", url.pathname);
  console.log("📦 URL:", url.toString());
  await next();
});

// ✅ CORS
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

// ✅ GET /api/income
app.get("/", async (c) => {
  const { createClient } = await import("@supabase/supabase-js");
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

// ✅ POST /api/income
app.post("/", async (c) => {
  const { createClient } = await import("@supabase/supabase-js");

  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Não autenticado" }, 401);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    },
  );

  try {
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

    const result = await Promise.race([
      supabase
        .from("incomes")
        .insert([{ user_id: uid, descricao, valor, mes, ano }])
        .select(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("⏱ Timeout no insert")), 7000),
      ),
    ]);

    const { data, error } = result as { data: any; error: any };

    if (error) return c.json({ error: error.message }, 500);
    return c.json(data[0]);
  } catch (err: any) {
    console.error("💥 POST Erro:", err.message || err);
    return c.json({ error: err.message || "Erro inesperado" }, 500);
  }
});

// 👇 Handlers para Vercel
export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
