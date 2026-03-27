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

  // Busca todas as fontes recorrentes do usuário (recorrente = true, sem fixo_source_id = são originais)
  const { data: recorrenteSources } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("recorrente", true)
    .is("fixo_source_id", null);

  if (recorrenteSources && recorrenteSources.length > 0) {
    // IDs de fontes que já têm cópia no mês solicitado
    const alreadyCopied = new Set(
      (monthTasks ?? [])
        .filter((t) => t.fixo_source_id !== null)
        .map((t) => t.fixo_source_id)
    );

    // Fontes do próprio mês já estão em monthTasks — não precisam de cópia
    const toReplicate = recorrenteSources.filter(
      (src) =>
        !alreadyCopied.has(src.id) &&
        !(src.mes === month && src.ano === year)
    );

    if (toReplicate.length > 0) {
      const copies = toReplicate.map((src) => ({
        user_id: user.id,
        title: src.title,
        price: src.price,
        done: "Pendente",
        type: src.type,
        mes: month,
        ano: year,
        fixo_source_id: src.id,
        recorrente: false,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("tasks")
        .insert(copies)
        .select();

      if (!insertError && inserted) {
        return c.json([...inserted, ...(monthTasks ?? [])]);
      }
    }
  }

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

  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
