import { Hono } from "hono";
import { cors } from "hono/cors";
import { supabase } from "@/supabase/client";

const app = new Hono();

// ✅ Middleware de CORS antes de tudo
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"] }));

// ✅ Handler para OPTIONS (sem depender de rota específica)
app.options("*", (c) =>
  c.text("ok", 200, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }),
);

// ✅ Rota principal com prefixo manual
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

// ✅ Exportações obrigatórias
export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
