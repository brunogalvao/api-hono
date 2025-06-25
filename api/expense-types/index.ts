import { Hono } from "hono";
import { handle } from "hono/vercel";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

// Supabase Clients
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

// ✅ CORS compatível com Vercel (manual)
app.use(async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }
  return next();
});

// GET tipos de gastos do usuário
app.get("/api/expense-types", async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const token = auth.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ error: "User not found" }, 404);
  }

  const { data: tipos, error: fetchError } = await supabase
    .from("expense_types")
    .select("id, nome")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: true });

  if (fetchError) {
    console.error("Erro ao buscar tipos:", fetchError.message);
    return c.json({ error: fetchError.message }, 400);
  }

  return c.json(tipos);
});

// POST novo tipo de gasto
app.post("/api/expense-types", async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const token = auth.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ error: "User not found" }, 404);
  }

  const body = await c.req.json();
  const { nome } = body;

  if (!nome) {
    return c.json({ error: "Nome do tipo de gasto é obrigatório." }, 400);
  }

  const { error: insertError } = await supabase.from("expense_types").insert({
    nome,
    user_id: data.user.id,
  });

  if (insertError) {
    console.error("Erro ao inserir tipo:", insertError.message);
    return c.json({ error: insertError.message }, 400);
  }

  return c.json({ success: true });
});

// Export Vercel handlers
export const GET = handle(app);
export const POST = handle(app);
export const OPTIONS = handle(app);
export default handle(app);
