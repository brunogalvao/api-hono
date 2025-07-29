import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { getSupabaseClient } from "../config/supabaseClient";

export const config = { runtime: "edge" };

const app = new Hono();

// ✅ Rota OPTIONS necessária para CORS
app.options("/api/incomes/total-por-mes", () => handleOptions());

// ✅ GET - total por mês
app.get("/api/incomes/total-por-mes", async (c) => {
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado" }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .select("mes, ano, valor")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  // Define o tipo para o objeto de agrupamento
  type MonthlyTotal = {
    mes: string;
    ano: number;
    total: number;
    quantidade: number;
  };

  // Agrupa por mês e ano, somando os valores
  const totalsByMonth: Record<string, MonthlyTotal> = data.reduce((acc, income) => {
    const key = `${income.mes}_${income.ano}`;
    if (!acc[key]) {
      acc[key] = {
        mes: income.mes,
        ano: income.ano,
        total: 0,
        quantidade: 0
      };
    }
    acc[key].total += parseFloat(income.valor);
    acc[key].quantidade += 1;
    return acc;
  }, {} as Record<string, MonthlyTotal>);

  // Converte para array e ordena por ano e mês
  const result = Object.values(totalsByMonth).sort((a: MonthlyTotal, b: MonthlyTotal) => {
    if (a.ano !== b.ano) return a.ano - b.ano;
    return a.mes.localeCompare(b.mes);
  });

  return c.json(result);
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch; 