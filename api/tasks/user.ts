import { Hono } from "hono";
const { createClient } = await import("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const app = new Hono();

app.options(
  "/api/user",
  (c) =>
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
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

  const { data, error } = await supabase.auth.updateUser(auth, {
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

export const GET = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
