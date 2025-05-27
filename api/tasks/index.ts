import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";

const app = new Hono();

// app.options(
//   "/api/tasks",
//   () =>
//     new Response(null, {
//       status: 204,
//       headers: {
//         "Access-Control-Allow-Origin": "*",
//         "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//         "Access-Control-Allow-Headers": "Content-Type",
//       },
//     }),
// );

// ✅ Rota OPTIONS necessária para CORS
app.options("/api/incomes", () => handleOptions());

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
