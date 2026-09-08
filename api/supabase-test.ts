export const config = { runtime: "edge" };

import { createAuthApp } from "./config/baseApp";

const app = createAuthApp();

app.get("/api/supabase-test", async (c) => {
  if (process.env.DIAGNOSTICS_ENABLED !== "true") {
    return c.json({ error: "Not found" }, 404);
  }

  try {
    const supabase = c.get("supabase");

    // Teste simples de conexão
    const { data, error } = await supabase
      .from("tasks")
      .select("count")
      .limit(1);

    if (error) {
      console.error("[supabase-test] query failed:", error.code);
      return c.json(
        { status: "error", message: "Connection test failed" },
        500,
      );
    }

    return c.json({ status: "success", rowVisible: data.length > 0 });
  } catch (error) {
    console.error("[supabase-test] unexpected error:", error);
    return c.json({ status: "error", message: "Connection test failed" }, 500);
  }
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
