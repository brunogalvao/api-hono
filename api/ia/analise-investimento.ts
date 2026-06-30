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

  const start = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  const end = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [transactionsResult, cotacaoDolar] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, status, amount")
      .eq("created_by", user.id)
      .gte("date", start)
      .lte("date", end),
    getDolarRate(),
  ]);

  if (transactionsResult.error) {
    console.error("[analise-investimento] Supabase error:", transactionsResult.error.message);
    return c.json({ error: transactionsResult.error.message }, 500);
  }

  const transactions = transactionsResult.data ?? [];
  console.log(`[analise-investimento] user=${user.id} range=${start}→${end} rows=${transactions.length}`, transactions.slice(0, 3));

  const rendimentoMes = transactions
    .filter((tx) => tx.type === "receita")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const tarefasPagas = transactions
    .filter((tx) => tx.type === "despesa" && tx.status === "pago")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const tarefasPendentes = transactions
    .filter((tx) => tx.type === "despesa" && tx.status === "pendente")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalTarefas = tarefasPagas + tarefasPendentes;
  const percentualGasto = rendimentoMes > 0 ? (totalTarefas / rendimentoMes) * 100 : 0;
  const percentualDisponivel = 100 - percentualGasto;
  const resultadoLiquido = rendimentoMes - tarefasPagas;
  const valorLivre = rendimentoMes - totalTarefas;

  let quantidadeDolar = 0;
  if (cotacaoDolar > 0 && valorLivre > 0) {
    quantidadeDolar = valorLivre / cotacaoDolar;
  }

  return c.json({
    tarefasPagas,
    tarefasPendentes,
    totalTarefas,
    rendimentoMes,
    percentualDisponivel,
    percentualGasto,
    resultadoLiquido,
    valorLivre,
    cotacaoDolar,
    quantidadeDolar,
  });
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
