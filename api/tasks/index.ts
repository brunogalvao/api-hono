import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { getSupabaseClient } from "../config/supabaseClient";

export const config = { runtime: "edge" };

const app = new Hono();

app.options("/api/tasks", () => handleOptions());

// GET
app.get("/api/tasks", async (c) => {
  const supabase = getSupabaseClient(c);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado." }, 401);

  const url = new URL(c.req.url);
  const month = Number(url.searchParams.get("month"));
  const year = Number(url.searchParams.get("year"));

  if (!month || !year) {
    return c.json(
      { error: "Parâmetros 'month' e 'year' são obrigatórios." },
      400,
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("mes", month)
    .eq("ano", year)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// POST
app.post("/api/tasks", async (c) => {
  const supabase = getSupabaseClient(c);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado." }, 401);

  const body = await c.req.json();

  // você pode validar aqui também se quiser
  if (
    typeof body.mes !== "number" ||
    typeof body.ano !== "number" ||
    body.mes < 1 ||
    body.mes > 12 ||
    body.ano < 2000
  ) {
    return c.json({ error: "Campos 'mes' e 'ano' inválidos." }, 400);
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert([{ ...body, user_id: user.id }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
