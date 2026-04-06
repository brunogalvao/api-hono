import { createAuthApp } from "../config/baseApp";
import { updateTaskSchema } from "../model/task.schema";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.put("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const supabase = c.get("supabase");
  const user = c.get("user");

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  // Busca estado atual para detectar mudança de recorrente
  const { data: current } = await supabase
    .from("tasks")
    .select("recorrente, mes, ano, title, price, type")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!current) return c.json({ error: "Tarefa não encontrada." }, 404);

  const { data, error } = await supabase
    .from("tasks")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data.length) return c.json({ error: "Tarefa não encontrada." }, 404);

  const updated = data[0];

  // Trata mudança de recorrente
  if (parsed.data.recorrente !== undefined && parsed.data.recorrente !== current.recorrente) {
    if (!parsed.data.recorrente) {
      // recorrente true → false: remove todas as cópias
      await supabase
        .from("tasks")
        .delete()
        .eq("fixo_source_id", id)
        .eq("user_id", user.id);
    } else {
      // recorrente false → true: cria cópias para os outros 11 meses
      const mes = updated.mes;
      const ano = updated.ano;
      const copies = [];
      for (let m = 1; m <= 12; m++) {
        if (m === mes) continue;
        copies.push({
          user_id: user.id,
          title: updated.title,
          price: updated.price,
          done: "Pendente",
          type: updated.type,
          mes: m,
          ano,
          fixo_source_id: updated.id,
          recorrente: false,
        });
      }
      if (copies.length > 0) {
        await supabase.from("tasks").insert(copies);
      }
    }
  }

  return c.json(updated);
});

app.delete("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const cancelAll = c.req.query("cancel_all") === "true";

  // Busca a task antes de deletar para verificar se é original recorrente ou parcelada
  const { data: target } = await supabase
    .from("tasks")
    .select("recorrente, fixo_source_id, parcela_group_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  // Se cancel_all=true e a task tem parcela_group_id, deleta todas as parcelas do grupo
  if (cancelAll && target?.parcela_group_id) {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("parcela_group_id", target.parcela_group_id)
      .eq("user_id", user.id);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ message: "Todas as parcelas foram deletadas com sucesso." });
  }

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data.length)
    return c.json({ error: "Tarefa não encontrada ou acesso negado." }, 404);

  // Se era uma task original recorrente, deleta todas as cópias em cascata
  if (target?.recorrente && !target?.fixo_source_id) {
    await supabase
      .from("tasks")
      .delete()
      .eq("fixo_source_id", id)
      .eq("user_id", user.id);
  }

  return c.json({ message: "Tarefa deletada com sucesso." });
});

export const OPTIONS = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;
export default app.fetch;
