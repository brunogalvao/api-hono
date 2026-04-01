import { createAuthApp } from "../config/baseApp";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.get("/api/tasks/total", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ total: count ?? 0 });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
