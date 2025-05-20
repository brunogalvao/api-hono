import { Hono } from "hono";
import { createClient, type User } from "@supabase/supabase-js";

// Tipagem para contexto
type Variables = {
  user: User;
};

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const app = new Hono<{ Variables: Variables }>();

// Middleware de autenticação
app.use(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Token ausente" }, 401);
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return c.json({ error: "Usuário inválido" }, 401);
  }

  c.set("user", data.user);
  await next();
});

// GET /api/user → Dados do usuário autenticado
app.get("/api/user", async (c) => {
  const user = c.get("user");

  return c.json({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || "",
    avatar_url: user.user_metadata?.avatar_url || "",
  });
});

// PUT /api/user → Atualiza nome e avatar
app.put("/api/user", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const updates = {
    data: {
      name: body.name || user.user_metadata?.name,
      avatar_url: body.avatar_url || user.user_metadata?.avatar_url,
    },
  };

  const { error } = await supabase.auth.updateUser(updates);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true });
});

export const GET = app.fetch;
export const PUT = app.fetch;
