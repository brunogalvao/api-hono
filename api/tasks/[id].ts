import { Hono } from "hono";
// import { supabase } from "../../supabase/client";
const { createClient } = await import("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const app = new Hono();

// ✅ Adiciona handler explícito para OPTIONS na rota dinâmica
app.options("/api/tasks/:id", (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
});

app.put("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("tasks")
    .update(body)
    .eq("id", id)
    .select();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

app.delete("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

export const PUT = app.fetch;
export const DELETE = app.fetch;
export const OPTIONS = app.fetch;
