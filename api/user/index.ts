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
  c.header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }
  return next();
});

// GET perfil
app.get("/api/user", async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const token = auth.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    console.error("Erro ao obter user:", error);
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    email: data.user.email,
    name: data.user.user_metadata?.name ?? "",
    phone: data.user.user_metadata?.phone ?? "",
    avatar_url: data.user.user_metadata?.avatar_url ?? "",
  });
});

// PATCH perfil
app.patch("/api/user", async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth) {
    console.warn("Authorization header ausente");
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = auth.replace("Bearer ", "");
  const body = await c.req.json();
  const { email, name, phone, avatar_url } = body;

  console.log("🔐 PATCH /api/user");
  console.log("🧪 Token recebido:", token.slice(0, 20), "...");

  // Cria client com token do usuário logado
  const client = createClient(
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

  try {
    const { data, error } = await client.auth.updateUser({
      email,
      phone,
      data: {
        name,
        phone,
        avatar_url,
      },
    });

    if (error) {
      console.error("❌ Erro no updateUser:", error.message);
      return c.json({ error: error.message }, 400);
    }

    console.log("✅ Usuário atualizado com sucesso");
    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.error("❌ Erro inesperado:", error);
    return c.json(
      { error: (error as Error).message || "Erro inesperado" },
      500,
    );
  }
});

// Export Vercel handlers
export const GET = handle(app);
export const PATCH = handle(app);
export const OPTIONS = handle(app);
export default handle(app);
