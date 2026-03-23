import { getSupabaseClient, getAuthenticatedUser } from "../config/supabaseClient";
import { createBaseApp } from "../config/baseApp";
import { createIncomeSchema, updateIncomeSchema } from "../model/income.schema";
import type { MonthlyTotal } from "../model/monthly-total.model";

export const config = { runtime: "edge" };

const app = createBaseApp();

// GET - listar rendimentos
app.get("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: userError,
  } = await getAuthenticatedUser(c);

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado" }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

// GET - total por mês
app.get("/api/incomes/total-por-mes", async (c) => {
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: userError,
  } = await getAuthenticatedUser(c);

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado" }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .select("mes, ano, valor")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  const totalsByMonth: Record<string, MonthlyTotal> = (data || []).reduce(
    (acc: Record<string, MonthlyTotal>, income: any) => {
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

// POST - cria novo rendimento
app.post("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: userError,
  } = await getAuthenticatedUser(c);

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado" }, 401);

  const body = await c.req.json();
  const parsed = createIncomeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  const { data, error } = await supabase
    .from("incomes")
    .insert([{ user_id: user.id, ...parsed.data }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data?.[0]);
});

// PATCH - atualiza rendimento existente
app.patch("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);

  const {
    data: { user },
    error: userError,
  } = await getAuthenticatedUser(c);

  if (userError || !user)
    return c.json({ error: "Usuário não autenticado" }, 401);

  const body = await c.req.json();
  const parsed = updateIncomeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  const { id, ...updateData } = parsed.data;

  const { data, error } = await supabase
    .from("incomes")
    .update(updateData)
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
