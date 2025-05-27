import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

const app = new Hono();

// 🔄 Suporte a OPTIONS com CORS global
app.options("/api/tasks/:id", () => handleOptions());

// 🔐 Helper: cria supabase client com o token do usuário
function getSupabaseClient(c: any) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: c.req.header("Authorization") ?? "",
        },
      },
    },
  );
}

// ✅ PUT /api/tasks/:id — Atualizar somente se for dono
app.put("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return c.json({ error: "Usuário não autenticado." }, 401);
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data.length) return c.json({ error: "Tarefa não encontrada." }, 404);

  return c.json(data[0]);
});

// ✅ DELETE /api/tasks/:id — Remover somente se for dono
app.delete("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return c.json({ error: "Usuário não autenticado." }, 401);
  }

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data.length) return c.json({ error: "Tarefa não encontrada." }, 404);

  return c.json({ message: "Tarefa deletada com sucesso." });
});

// Exporta os handlers
export const OPTIONS = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;
