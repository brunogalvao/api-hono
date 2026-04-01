import { createAuthApp } from "../config/baseApp";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.get("/api/tasks/total-paid", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("tasks")
    .select("price")
    .eq("user_id", user.id)
    .eq("done", "Pago");

  if (error) return c.json({ error: error.message }, 500);

  const totalPago = (data ?? []).reduce(
    (acc, item) => acc + Number(item.price ?? 0),
    0,
  );

  return c.json({ total_paid: totalPago });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
