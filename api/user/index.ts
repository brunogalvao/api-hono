import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// App
const app = new Hono();

// Middleware CORS
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
  const authHeader = c.req.header("Authorization");
  if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) return c.json({ error: "User not found" }, 404);

  const user = data.user;

  return c.json({
    email: user.email,
    name: user.user_metadata?.name ?? "",
    phone: user.user_metadata?.phone ?? "",
    avatar_url: user.user_metadata?.avatar_url ?? "",
  });
});

// PATCH /api/user
app.patch("/api/user", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

  const token = authHeader.replace("Bearer ", "");
  const body = await c.req.json();

  const { data: sessionData, error: getError } =
    await supabase.auth.getUser(token);
  if (getError || !sessionData?.user)
    return c.json({ error: "User not found" }, 404);

  const userId = sessionData.user.id;

  const updatePayload: Parameters<
    typeof supabaseAdmin.auth.admin.updateUserById
  >[1] = {
    email: body.email,
    user_metadata: {
      name: body.name,
      phone: body.phone,
      avatar_url: body.avatar_url,
    },
  };

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    updatePayload,
  );

  if (error) return c.json({ error: error.message }, 400);

  return c.json({ success: true, user: data.user });
});

// Fallback para qualquer OPTIONS
app.options("/api/user", (c) => {
  return c.text("OK", 204);
});

// Exports para Vercel
export const GET = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
