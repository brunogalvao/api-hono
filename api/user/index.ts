import { createAuthApp } from "../config/baseApp";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.get("/api/user", async (c) => {
  const user = c.get("user");

  return c.json({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || "",
    phone: user.user_metadata?.phone || "",
    avatar_url: user.user_metadata?.avatar_url || "",
    created_at: user.created_at,
    updated_at: user.updated_at,
  });
});

app.patch("/api/user", async (c) => {
  const supabase = c.get("supabase");

  const { email, name, phone, avatar_url } = await c.req.json();

  const { data, error } = await supabase.auth.updateUser({
    email,
    phone,
    data: { name, phone, avatar_url },
  });

  if (error) return c.json({ error: error.message }, 400);

  return c.json({
    success: true,
    user: {
      id: data.user?.id,
      email: data.user?.email,
      name: data.user?.user_metadata?.name || "",
      phone: data.user?.user_metadata?.phone || "",
      avatar_url: data.user?.user_metadata?.avatar_url || "",
      updated_at: data.user?.updated_at,
    },
  });
});

export const GET = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
