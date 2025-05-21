import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

// Middleware CORS
app.use(
  "/api/user",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  }),
);

// PATCH /api/user
app.patch("/api/user", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
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

  const body = await c.req.json();

  // Atualiza o usuário autenticado com o token
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
