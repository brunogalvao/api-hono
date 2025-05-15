import { Hono } from "hono";
const { createClient } = await import("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const app = new Hono();

// CORS para a rota total-price
app.options(
  "/api/tasks/total-price",
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

// GET: Soma da coluna "price"
app.get("/api/tasks/total-price", async (c) => {
  const { data, error } = await supabase.from("tasks").select("price");

  if (error) return c.json({ error: error.message }, 500);

  const total =
    data?.reduce((sum: number, item: any) => sum + (item.price || 0), 0) ?? 0;

  return c.json({ totalPrice: total });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
