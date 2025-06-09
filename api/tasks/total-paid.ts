import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { createClientWithAuth } from "../config/creatClient";

export const config = { runtime: "edge" };

const app = new Hono();

// CORS
app.options("/api/tasks/total-paid", () => handleOptions());

app.get("/api/tasks/total-paid", async (c) => {
  try {
    const token = c.req.header("Authorization");
    const supabase = createClientWithAuth(token);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Erro de autenticação:", authError?.message);
      return c.json({ error: "Usuário não autenticado." }, 401);
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("price")
      .eq("user_id", user.id)
      .eq("done", true);

    if (error) {
      console.error("Erro ao buscar tasks:", error.message);
      return c.json({ error: error.message }, 500);
    }

    if (!Array.isArray(data)) {
      console.error("Dados retornados não são uma lista:", data);
      return c.json({ error: "Dados inválidos." }, 500);
    }

    const totalPago = data.reduce((acc, item) => acc + (item.price ?? 0), 0);
    return c.json({ total_paid: totalPago });
  } catch (e: any) {
    console.error("Erro inesperado:", e.message);
    return c.json({ error: "Erro interno no servidor." }, 500);
  }
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
