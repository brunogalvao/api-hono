import { Hono } from "hono";
import { supabase } from "../../supabase/client";

const app = new Hono();

app.get("/api/tasks/total-items", async (c) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("sum:price")
    .single();

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ total: data.sum ?? 0 });
});

export const GET = app.fetch;
