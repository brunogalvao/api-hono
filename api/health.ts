import { createBaseApp } from "./config/baseApp";
import { getPublicSupabaseClient } from "./config/supabaseClient";

export const config = { runtime: "edge" };

const app = createBaseApp();

app.get("/api/health", async (c) => {
  const startedAt = Date.now();

  try {
    const supabase = getPublicSupabaseClient();
    const { error } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .limit(1)
      .abortSignal(AbortSignal.timeout(3_000));

    const healthy = !error;
    return c.json(
      {
        status: healthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
        services: {
          database: {
            status: healthy ? "connected" : "unavailable",
            code: error?.code ?? null,
          },
        },
      },
      healthy ? 200 : 503,
    );
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "health_check_failed",
      error: error instanceof Error ? error.message : "unknown_error",
    }));
    return c.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
        services: {
          database: { status: "unavailable", code: "health_check_failed" },
        },
      },
      503,
    );
  }
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
