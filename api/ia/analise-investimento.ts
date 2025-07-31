import { Hono } from "hono";
import { getSupabaseClient } from "../config/supabaseClient";

export const config = { runtime: "edge" };
const app = new Hono();

app.post("/api/ia/analise-investimento", async (c) => {
  try {
    const supabase = getSupabaseClient(c);

    // Verificar autenticação
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return c.json({ error: "Usuário não autenticado" }, 401);
    }

    const requestBody = await c.req.json();
    const { mes, ano } = requestBody;

    const currentDate = new Date();
    const targetMonth = mes || currentDate.getMonth() + 1;
    const targetYear = ano || currentDate.getFullYear();

    // Buscar rendimentos
    const { data: incomes } = await supabase
      .from("incomes")
      .select("*")
      .eq("user_id", user.id);

    // Buscar tarefas
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id);

    // Filtros
    const rendimentosDoMes =
      incomes?.filter(
        (income) => income.mes === targetMonth && income.ano === targetYear,
      ) || [];
    const rendimentoMes = rendimentosDoMes.reduce(
      (total, income) => total + parseFloat(income.valor || "0"),
      0,
    );

    const tarefasDoMes =
      tasks?.filter(
        (task) => task.mes === targetMonth && task.ano === targetYear,
      ) || [];
    const tarefasPagas = tarefasDoMes
      .filter((task) => task.done)
      .reduce((total, task) => total + parseFloat(task.price || "0"), 0);
    const tarefasPendentes = tarefasDoMes
      .filter((task) => !task.done)
      .reduce((total, task) => total + parseFloat(task.price || "0"), 0);

    const totalTarefas = tarefasPagas + tarefasPendentes;
    const rendimentoDisponivel = rendimentoMes - totalTarefas;
    const percentualGasto =
      rendimentoMes > 0 ? (totalTarefas / rendimentoMes) * 100 : 0;
    const percentualDisponivel = 100 - percentualGasto;

    // Dica simples: 30% do disponível
    const dicasEconomia = rendimentoDisponivel * 0.3;

    // Resultado Liquido
    const resultadoLiquido = rendimentoMes - tarefasPagas;

    // Dollar
    const dolarResponse = await fetch(
      "https://economia.awesomeapi.com.br/last/USD-BRL",
    );
    const dolarData = await dolarResponse.json();
    const cotacaoDolar = parseFloat(dolarData.USDBRL.bid);

    return c.json(
      {
        tarefasPagas,
        tarefasPendentes,
        totalTarefas,
        rendimentoMes,
        percentualDisponivel,
        percentualGasto,
        dicasEconomia,
        resultadoLiquido,
        cotacaoDolar,
      },
      200,
    );
  } catch (error: any) {
    return c.json({ error: "Erro interno", details: error.message }, 500);
  }
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
