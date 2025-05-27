import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

const app = new Hono();

// CORS
app.options("/api/tasks", () => handleOptions());

// Helper para instanciar o Supabase com autenticação do request
function getSupabaseClient(c: any) {
  const supabase = createClient(
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
  return supabase;
}

// GET /api/tasks – apenas tarefas do usuário autenticado
app.get("/api/tasks", async (c) => {
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return c.json({ error: "Usuário não autenticado." }, 401);
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// POST /api/tasks – cria tarefa para o usuário autenticado
app.post("/api/tasks", async (c) => {
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return c.json({ error: "Usuário não autenticado." }, 401);
  }

  const body = await c.req.json();

  const { data, error } = await supabase
    .from("tasks")
    .insert([{ ...body, user_id: user.id }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

// Exporta os métodos
export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
