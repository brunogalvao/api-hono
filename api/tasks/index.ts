import { Hono } from "hono";
import { supabase } from "@/supabase/client";

const app = new Hono();

// ⚠️ NÃO use `cors()` aqui — Vercel já aplica via `vercel.json`

// ✅ handler neutro para evitar o 500
app.options("/api/tasks", (c) => {
  return c.body(null, 204);
});

app.get("/api/tasks", async (c) => {
  const { data, error } = await supabase.from("tasks").select("*");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post("/api/tasks", async (c) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("tasks").insert([body]).select();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
