import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

// ENV obrigatórias no Vercel
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// CORS para toda a rota
app.use(
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "PATCH", "OPTIONS"],
  }),
);

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
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const token = auth.replace("Bearer ", "");
  const body = await c.req.json();

  const { data: userData, error: getError } =
    await supabase.auth.getUser(token);
  if (getError || !userData?.user)
    return c.json({ error: "User not found" }, 404);

  const { email, name, phone, avatar_url } = body;

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userData.user.id,
    {
      email,
      user_metadata: {
        name,
        phone,
        avatar_url,
      },
    },
  );

  if (error) {
    console.error("Erro ao atualizar user:", error);
    return c.json({ error: error.message }, 400);
  }

  return c.json({ success: true, user: data.user });
});

// Exportações para rotas HTTP específicas (ainda úteis para edge cases)
export const GET = handle(app);
export const PATCH = handle(app);
export const OPTIONS = handle(app);

// ✅ Export default exigido pelo Vercel
export default handle(app);
