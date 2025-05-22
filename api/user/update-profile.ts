import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

app.post("/api/user/update-profile", async (c) => {
  const body = await c.req.json();
  const { nome, email, phone } = body;

  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Token não encontrado" }, 401);
  }

  // Cria client com o token do usuário
  const userClient = createClient(
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

  // Faz a atualização
  const { data, error } = await userClient.auth.updateUser({
    data: { nome },
    email,
    phone,
  });

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ message: "Usuário atualizado com sucesso", user: data.user });
});

export default app;
