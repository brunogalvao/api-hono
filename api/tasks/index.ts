import { Hono } from "hono";
import { cors } from "hono/cors";
import { supabase } from "@/supabase/client";

const app = new Hono().basePath("/api/tasks");

// ✅ Middleware CORS aplicado corretamente
app.use(
  "*",
  cors({
    origin: "http://localhost:5173", // ou '*' se quiser liberar geral
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

// ✅ handler explícito para OPTIONS (necessário na Vercel)
app.options("/", (c) => c.body(null, 204));

// ✅ GET tarefas
app.get("/", async (c) => {
  const { data, error } = await supabase.from("tasks").select("*");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// ✅ POST tarefas
app.post("/", async (c) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("tasks").insert([body]).select();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

// ✅ exportações obrigatórias
export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
