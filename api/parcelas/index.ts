import { createAuthApp } from "../config/baseApp";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.get("/api/parcelas", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .not("parcela_group_id", "is", null);

  if (error) return c.json({ error: error.message }, 500);

  // Agrupa por parcela_group_id
  const groups: Record<string, typeof data> = {};
  for (const task of data ?? []) {
    const gid = task.parcela_group_id as string;
    if (!groups[gid]) groups[gid] = [];
    groups[gid].push(task);
  }

  const result = Object.entries(groups).map(([parcela_group_id, tasks]) => {
    const sorted = [...tasks].sort(
      (a, b) => (a.parcela_numero ?? 0) - (b.parcela_numero ?? 0)
    );
    const first = sorted[0];
    const parcela_total = first.parcela_total ?? tasks.length;
    const valor_parcela = first.price ?? 0;
    const valor_total = Math.round(valor_parcela * parcela_total * 100) / 100;
    const parcelas_pagas = tasks.filter((t) => t.done === "Pago").length;
    const status: "Ativo" | "Quitada" =
      parcelas_pagas === tasks.length ? "Quitada" : "Ativo";

    return {
      parcela_group_id,
      title: first.title,
      valor_total,
      parcela_total,
      parcelas_pagas,
      valor_parcela,
      status,
      mes_inicio: first.mes,
      ano_inicio: first.ano,
      type: first.type,
    };
  });

  return c.json(result);
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
