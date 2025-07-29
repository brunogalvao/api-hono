import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { getSupabaseClient } from "../config/supabaseClient";

export const config = { runtime: "edge" };

const app = new Hono();

// ✅ Rota OPTIONS necessária para CORS
app.options("/api/incomes", () => handleOptions());

// ✅ GET - listar rendimento
app.get("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado" }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

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
  const totalsByMonth: Record<string, MonthlyTotal> = (data || []).reduce((acc: Record<string, MonthlyTotal>, income: any) => {
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

// ✅ POST - cria novo rendimento
app.post("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado" }, 401);

  const { descricao, valor, mes, ano } = await c.req.json();
  if (!valor || !mes || !ano) {
    return c.json({ error: "Campos obrigatórios ausentes" }, 400);
  }

  const { data, error } = await supabase
    .from("incomes")
    .insert([{ user_id: user.id, descricao, valor, mes, ano }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data?.[0]);
});

// ✅ PATCH - atualiza rendimento existente
app.patch("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado" }, 401);

  const { id, descricao, valor, mes, ano } = await c.req.json();
  if (!id) return c.json({ error: "ID do rendimento ausente" }, 400);

  const { data, error } = await supabase
    .from("incomes")
    .update({ descricao, valor, mes, ano })
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data || !data.length) return c.json({ error: "Rendimento não encontrado" }, 404);

  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
