import { supabase } from "../../supabase/client";
import { Hono } from "hono";

const app = new Hono();

// CORS para a rota total
app.options(
  "/api/tasks/total",
  () =>
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }),
);

// ✅ Corrige o caminho da rota
app.get("/api/tasks/total", async (c) => {
  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ total: count ?? 0 });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
