export const config = {
  runtime: "edge",
};

import { Hono } from "hono";
import { cors } from "hono/cors";
import { supabase } from "../../supabase/client";

const app = new Hono().basePath("/api/tasks");

// ✅ CORRETO para Edge na Vercel
app.use(cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"] }));

// 🔥 Trata a preflight request (OPTIONS)
app.options("/", (c) => {
  return c.text("ok");
});

app.get("/", async (c) => {
  const { data, error } = await supabase.from("tasks").select("*");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("tasks").insert([body]).select();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

export const POST = app.fetch;
export const GET = app.fetch;
