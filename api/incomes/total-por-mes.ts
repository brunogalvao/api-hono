import { createAuthApp } from "../config/baseApp";
import type { MonthlyTotal } from "../model/monthly-total.model";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.get("/api/incomes/total-por-mes", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("incomes")
    .select("mes, ano, valor")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  const totalsByMonth: Record<string, MonthlyTotal> = (data || []).reduce(
    (acc: Record<string, MonthlyTotal>, income: { mes: string; ano: number; valor: string }) => {
      const key = `${income.mes}_${income.ano}`;
      if (!acc[key]) {
        acc[key] = { mes: income.mes, ano: income.ano, total: 0, quantidade: 0 };
      }
      acc[key].total += parseFloat(income.valor);
      acc[key].quantidade += 1;
      return acc;
    },
    {} as Record<string, MonthlyTotal>
  );

  const result = Object.values(totalsByMonth).sort((a, b) => {
    if (a.ano !== b.ano) return a.ano - b.ano;
    return Number(a.mes) - Number(b.mes);
  });

  return c.json(result);
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
