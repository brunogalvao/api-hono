import { Hono } from "hono";
import { cors } from "hono/cors";
import { supabase } from "@/supabase/client";

const app = new Hono().basePath("/api/tasks");

// ✅ Middleware de CORS no início
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"] }));

// ✅ Handler explícito para OPTIONS
app.options("/", (c) => {
  return c.text("ok", 200, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
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

// ✅ Exportações obrigatórias
export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
