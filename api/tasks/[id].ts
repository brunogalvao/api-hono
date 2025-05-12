import { Hono } from "hono";
import { supabase } from "../../supabase/client";

const app = new Hono();

// ✅ Handler para OPTIONS (CORS preflight)
app.options("/:id", (c) =>
  c.body(null, 204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }),
);

// ✅ PUT para atualizar tarefa
app.put("/:id", async (c) => {
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

// ✅ DELETE para remover tarefa
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// ✅ Exporte todos os handlers
export const OPTIONS = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;
