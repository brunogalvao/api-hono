import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { createClientWithAuth } from "../config/creatClient";

export const config = { runtime: "edge" };

const app = new Hono();

const path = "/api/incomes/total-incomes";

// Tratamento de requisição OPTIONS para CORS
app.options(path, () => handleOptions());

// Rota GET para somar os rendimentos
app.get(path, async (c) => {
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
      .from("incomes")
      .select("valor")
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao buscar rendimentos:", error.message);
      return c.json({ error: error.message }, 500);
    }

    if (!Array.isArray(data)) {
      console.error("Dados retornados não são uma lista:", data);
      return c.json({ error: "Dados inválidos." }, 500);
    }

    const totalRendimento = data.reduce(
      (acc, item) => acc + (item.valor ?? 0),
      0,
    );

    return c.json({ total_incomes: totalRendimento });
  } catch (e: any) {
    console.error("Erro inesperado:", e.message);
    return c.json({ error: "Erro interno no servidor." }, 500);
  }
});

// ✅ Exporta apenas o handler padrão
export default app.fetch;
