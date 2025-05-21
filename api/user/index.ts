import { Hono } from "hono";
import { cors } from "hono/cors";
const { createClient } = await import("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const app = new Hono();

// ✅ Middleware de CORS global na rota /api/user/*
app.use(
  "/api/user",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  }),
);

// GET perfil
app.get("/api/user", async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const { data, error } = await supabase.auth.getUser(auth);
  if (error || !data.user) return c.json({ error: "User not found" }, 404);

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

  const body = await c.req.json();

  supabase.auth.setSession({
    access_token: auth.replace("Bearer ", ""),
    refresh_token: "",
  });

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

// ✅ Exportações corretas para Vercel
export const GET = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
