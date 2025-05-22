import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

// Criação do client com anon key — NÃO use service_role aqui!
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

app.post("/api/user/update-profile", async (c) => {
  const body = await c.req.json();
  const { nome, email, phone } = body;

  // Extrai o token JWT do header Authorization
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Token não encontrado" }, 401);
  }

  // Cria um client com o token do usuário
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

  const { data, error } = await userClient.auth.updateUser({
    data: { nome }, // Atualiza user_metadata
    email,
    phone,
  });

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ message: "Perfil atualizado com sucesso!", user: data.user });
});

export default app;
