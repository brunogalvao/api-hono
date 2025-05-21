import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const app = new Hono();

// CORS
app.use(
  "/api/user",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "PATCH", "OPTIONS"],
  }),
);

// GET /api/user
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

// PATCH /api/user
app.patch("/api/user", async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const token = auth.replace("Bearer ", "");
  const body = await c.req.json();

  // get user (opcional, para validar o token)
  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return c.json({ error: "User not found" }, 404);
  }

  const { data, error } = await supabase.auth.admin.updateUserById(
    userData.user.id,
    {
      email: body.email,
      user_metadata: {
        name: body.name,
        phone: body.phone,
        avatar_url: body.avatar_url,
      },
    },
  );

  if (error) return c.json({ error: error.message }, 400);

  return c.json({ success: true, user: data.user });
});

// Export handlers
export const GET = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
