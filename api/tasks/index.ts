import { createAuthApp } from "../config/baseApp";
import { createTaskSchema } from "../model/task.schema";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.get("/api/tasks", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const month = Number(c.req.query("month"));
  const year = Number(c.req.query("year"));

  if (!month || !year) {
    return c.json({ error: "Parâmetros 'month' e 'year' são obrigatórios." }, 400);
  }
  if (month < 1 || month > 12 || year < 2000) {
    return c.json({ error: "Parâmetros 'month' ou 'year' inválidos." }, 400);
  }

  // Busca tasks do mês solicitado
  const { data: monthTasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("mes", month)
    .eq("ano", year)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);

  return c.json(monthTasks);
});

app.post("/api/tasks", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const body = await c.req.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert([{ ...parsed.data, user_id: user.id }])
    .select();

  if (error) return c.json({ error: error.message }, 500);

  // Replicação imediata: cria cópias para todos os outros meses do ano
  if (parsed.data.recorrente) {
    const original = data[0];
    const copies = [];

    for (let m = 1; m <= 12; m++) {
      if (m === original.mes) continue; // mês original já existe
      copies.push({
        user_id: user.id,
        title: original.title,
        price: original.price,
        done: "Pendente",
        type: original.type,
        mes: m,
        ano: original.ano,
        fixo_source_id: original.id,
        recorrente: false,
      });
    }

    if (copies.length > 0) {
      await supabase.from("tasks").insert(copies);
    }
  }

  // Compra parcelada: cria N-1 cópias mensais
  if (parsed.data.parcela_total && parsed.data.parcela_total >= 2) {
    const original = data[0];
    const parcelaTotal = parsed.data.parcela_total;
    const parcela_group_id = crypto.randomUUID();

    // Atualiza a task original com parcela_numero: 1 e parcela_group_id
    await supabase
      .from("tasks")
      .update({ parcela_numero: 1, parcela_group_id, parcela_total: parcelaTotal })
      .eq("id", original.id)
      .eq("user_id", user.id);

    const basePrice = original.price ?? 0;
    const parcelaBase = Math.floor((basePrice / parcelaTotal) * 100) / 100;
    const totalBase = parcelaBase * (parcelaTotal - 1);
    const parcelaFinal = Math.round((basePrice - totalBase) * 100) / 100;

    function nextMonth(mes: number, ano: number, offset: number) {
      const totalMonth = mes - 1 + offset; // 0-based
      return {
        mes: (totalMonth % 12) + 1,
        ano: ano + Math.floor(totalMonth / 12),
      };
    }

    const copies = [];
    for (let i = 2; i <= parcelaTotal; i++) {
      const { mes, ano } = nextMonth(original.mes, original.ano, i - 1);
      const price = i === parcelaTotal ? parcelaFinal : parcelaBase;
      copies.push({
        user_id: user.id,
        title: original.title,
        price,
        done: "Pendente",
        type: original.type,
        mes,
        ano,
        recorrente: false,
        fixo_source_id: null,
        parcela_numero: i,
        parcela_total: parcelaTotal,
        parcela_group_id,
      });
    }

    if (copies.length > 0) {
      await supabase.from("tasks").insert(copies);
    }

    // Retorna a task atualizada com os campos de parcela
    const { data: updatedOriginal } = await supabase
      .from("tasks")
      .select()
      .eq("id", original.id)
      .single();

    return c.json(updatedOriginal ?? original);
  }

  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
