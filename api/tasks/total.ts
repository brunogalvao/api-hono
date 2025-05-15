import { supabase } from "../../supabase/client";
import { Hono } from "hono";

const app = new Hono();

app.options(
  "/api/tasks",
  () =>
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }),
);

app.get("api/tasks/total", async (c) => {
  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ total: count ?? 0 });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
