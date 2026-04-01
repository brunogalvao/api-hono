import { createAuthApp } from "../config/baseApp";
import { getDolarRate } from "../utils/currency";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.post("/api/ia/analise-investimento", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const requestBody = await c.req.json();
  const { mes, ano } = requestBody;

  const currentDate = new Date();
  const targetMonth = mes || currentDate.getMonth() + 1;
  const targetYear = ano || currentDate.getFullYear();

  const [incomesResult, tasksResult, cotacaoDolar] = await Promise.all([
    supabase
      .from("incomes")
      .select("valor, mes, ano")
      .eq("user_id", user.id)
      .eq("mes", targetMonth)
      .eq("ano", targetYear),
    supabase
      .from("tasks")
      .select("price, done, mes, ano")
      .eq("user_id", user.id)
      .eq("mes", targetMonth)
      .eq("ano", targetYear),
    getDolarRate(),
  ]);

  if (incomesResult.error) return c.json({ error: incomesResult.error.message }, 500);
  if (tasksResult.error) return c.json({ error: tasksResult.error.message }, 500);

  const incomes = incomesResult.data ?? [];
  const tasks = tasksResult.data ?? [];

  const rendimentoMes = incomes.reduce(
    (total, income) => total + parseFloat(income.valor || "0"),
    0,
  );

  const tarefasPagas = tasks
    .filter((task) => task.done === "Pago")
    .reduce((total, task) => total + parseFloat(task.price || "0"), 0);

  const tarefasPendentes = tasks
    .filter((task) => task.done === "Pendente")
    .reduce((total, task) => total + parseFloat(task.price || "0"), 0);

  const totalTarefas = tarefasPagas + tarefasPendentes;
  const rendimentoDisponivel = rendimentoMes - totalTarefas;
  const percentualGasto = rendimentoMes > 0 ? (totalTarefas / rendimentoMes) * 100 : 0;
  const percentualDisponivel = 100 - percentualGasto;
  const dicasEconomia = rendimentoDisponivel * 0.3;
  const resultadoLiquido = rendimentoMes - tarefasPagas;

  let quantidadeDolar = 0;
  if (resultadoLiquido >= rendimentoMes * 0.3) {
    quantidadeDolar = (resultadoLiquido * 0.3) / cotacaoDolar;
  }

  return c.json({
    tarefasPagas,
    tarefasPendentes,
    totalTarefas,
    rendimentoMes,
    percentualDisponivel,
    percentualGasto,
    dicasEconomia,
    resultadoLiquido,
    cotacaoDolar,
    quantidadeDolar,
  });
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
