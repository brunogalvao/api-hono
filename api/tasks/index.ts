import { Hono } from "hono";

const app = new Hono();

// Handler neutro para OPTIONS (CORS)
app.options("/api/tasks", (c) => {
  return c.body(null, 204);
});

app.get("/api/tasks", async (c) => {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase.from("tasks").select("*");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post("/api/tasks", async (c) => {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  const body = await c.req.json();
  const { data, error } = await supabase.from("tasks").insert([body]).select();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
