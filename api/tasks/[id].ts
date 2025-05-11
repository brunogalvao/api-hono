import { Hono } from "hono";
import { supabase } from "../../supabase/client";

// Corrige o prefixo para funcionar no Vercel
const app = new Hono().basePath("/api/tasks");

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

app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

export const PUT = app.fetch;
export const DELETE = app.fetch;
