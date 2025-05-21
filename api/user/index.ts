// /api/user/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// CORS global
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

  const token = auth.replace("Bearer ", "");
  const body = await c.req.json();

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user)
    return c.json({ error: "User not found" }, 404);

  const { email, name, phone, avatar_url } = body;

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userData.user.id,
    {
      email,
      user_metadata: { name, phone, avatar_url },
    },
  );

  if (error) return c.json({ error: error.message }, 400);

  return c.json({ success: true, user: data.user });
});

// ✅ Export único para funcionar na Vercel
export const handler = app.fetch;
