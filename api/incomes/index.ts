import { Hono } from "hono";

export const config = { runtime: "edge" };

const app = new Hono();

app.get("/api/incomes", async (c) => {
  console.log("🔍 ROTA incomes ativada");

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

export const GET = app.fetch;
export default app.fetch;
