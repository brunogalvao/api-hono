import { Hono } from "hono";
import { cors } from "hono/cors";
const { createClient } = await import("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const app = new Hono();

// ✅ Middleware global de CORS para a rota /api/user
app.use(
  "/api/user",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "PATCH", "OPTIONS"],
  }),
);

// ✅ GET: retorna perfil do usuário autenticado
app.get("/api/user", async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const token = auth.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return c.json({ error: "User not found" }, 404);
  }

  const user = data.user;
  return c.json({
    email: user.email,
    name: user.user_metadata?.name ?? "",
    phone: user.user_metadata?.phone ?? "",
    avatar_url: user.user_metadata?.avatar_url ?? "",
  });
});

// ✅ PATCH: atualiza dados do usuário autenticado
app.patch("/api/user", async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const token = auth.replace("Bearer ", "");
  const body = await c.req.json();

  const { data: userData, error: getError } =
    await supabase.auth.getUser(token);
  if (getError || !userData?.user) {
    return c.json({ error: "User not found" }, 404);
  }

  const { data, error } = await supabase.auth.updateUser({
    email: body.email,
    data: {
      name: body.name,
      phone: body.phone,
      avatar_url: body.avatar_url,
    },
  });

  if (error) return c.json({ error: error.message }, 400);

  return c.json({ success: true });
});

// ✅ Exportações para Vercel
export const GET = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
