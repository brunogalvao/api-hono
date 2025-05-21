import { Hono } from "hono";
import { handle } from "hono/vercel";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

// Supabase Clients
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

  console.log("🔐 PATCH /api/user");
  console.log("🧪 Token recebido:", token.slice(0, 20), "...");

  try {
    const { data: userData, error: getUserError } =
      await supabase.auth.getUser(token);
    if (getUserError || !userData?.user) {
      console.error("❌ Erro ao buscar usuário:", getUserError?.message);
      return c.json({ error: "User not found" }, 404);
    }

    const { email, name, phone, avatar_url } = body;

    // Timeout explícito
    const result = await Promise.race([
      supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
        email,
        user_metadata: { name, phone, avatar_url },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Timeout: Supabase não respondeu")),
          7000,
        ),
      ),
    ]);

    console.log("✅ Atualização bem-sucedida");
    return c.json({ success: true, user: (result as any).data.user });
  } catch (error) {
    console.error("❌ Erro ao atualizar usuário:", error);
    return c.json(
      { error: (error as Error).message || "Erro inesperado" },
      400,
    );
  }
});

// Export Vercel handlers
export const GET = handle(app);
export const PATCH = handle(app);
export const OPTIONS = handle(app);
export default handle(app);
