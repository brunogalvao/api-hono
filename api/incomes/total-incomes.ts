import { createAuthApp } from "../config/baseApp";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.get("/api/incomes/total-incomes", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("incomes")
    .select("valor")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  const total = (data ?? []).reduce(
    (acc, item: { valor?: number | null }) => acc + (item.valor ?? 0),
    0,
  );

  return c.json({ total_incomes: total });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
