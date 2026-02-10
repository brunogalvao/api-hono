import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

// ── CORS ────────────────────────────────────────────────
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

// ── Helper: cria Supabase client autenticado ────────────
function getSupabaseClient(c: any) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: c.req.header("Authorization") ?? "",
      },
    },
  });
}

function getPublicSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );
}

// ── Ping ────────────────────────────────────────────────
app.get("/api/ping", (c) => c.text("pong 🏓"));

// ── Health ──────────────────────────────────────────────
app.get("/api/health", async (c) => {
  try {
    const supabase = getPublicSupabaseClient();
    const { error: supabaseError } = await supabase
      .from("tasks")
      .select("count")
      .limit(1);

    return c.json({
      status: supabaseError ? "unhealthy" : "healthy",
      timestamp: new Date().toISOString(),
      services: {
        supabase: {
          status: supabaseError ? "error" : "connected",
          error: supabaseError?.message || null,
        },
      },
    });
  } catch (error: any) {
    return c.json({ status: "unhealthy", error: error.message }, 500);
  }
});

// ══════════════════════════════════════════════════════════
// TASKS
// ══════════════════════════════════════════════════════════

// GET /api/tasks
app.get("/api/tasks", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const url = new URL(c.req.url);
  const month = Number(url.searchParams.get("month"));
  const year = Number(url.searchParams.get("year"));

  if (!month || !year || month < 1 || month > 12 || year < 2000) {
    return c.json({ error: "Parâmetros 'month' e 'year' inválidos." }, 400);
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("mes", month)
    .eq("ano", year)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// POST /api/tasks
app.post("/api/tasks", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const body = await c.req.json();

  if (typeof body.mes !== "number" || typeof body.ano !== "number" || body.mes < 1 || body.mes > 12 || body.ano < 2000) {
    return c.json({ error: "Campos 'mes' e 'ano' inválidos." }, 400);
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert([{ ...body, user_id: user.id }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

// PUT /api/tasks/:id
app.put("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const supabase = getSupabaseClient(c);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { data, error } = await supabase
    .from("tasks")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data.length) return c.json({ error: "Tarefa não encontrada." }, 404);
  return c.json(data[0]);
});

// DELETE /api/tasks/:id
app.delete("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabaseClient(c);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data.length) return c.json({ error: "Tarefa não encontrada." }, 404);
  return c.json({ message: "Tarefa deletada com sucesso." });
});

// GET /api/tasks/total
app.get("/api/tasks/total", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ total: count ?? 0 });
});

// GET /api/tasks/total-price
app.get("/api/tasks/total-price", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { data, error } = await supabase
    .from("tasks")
    .select("price")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  const total = (data || []).reduce((acc, item) => acc + Number(item.price ?? 0), 0);
  return c.json({ total_price: total });
});

// GET /api/tasks/total-paid
app.get("/api/tasks/total-paid", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { data, error } = await supabase
    .from("tasks")
    .select("price")
    .eq("user_id", user.id)
    .eq("done", "Pago");

  if (error) return c.json({ error: error.message }, 500);

  const totalPago = (data || []).reduce((acc, item) => acc + Number(item.price ?? 0), 0);
  return c.json({ total_paid: totalPago });
});

// ══════════════════════════════════════════════════════════
// INCOMES
// ══════════════════════════════════════════════════════════

// GET /api/incomes
app.get("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado" }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

// POST /api/incomes
app.post("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado" }, 401);

  const { descricao, valor, mes, ano } = await c.req.json();
  if (!valor || !mes || !ano) return c.json({ error: "Campos obrigatórios ausentes" }, 400);

  const { data, error } = await supabase
    .from("incomes")
    .insert([{ user_id: user.id, descricao, valor, mes, ano }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data?.[0]);
});

// PATCH /api/incomes
app.patch("/api/incomes", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado" }, 401);

  const { id, descricao, valor, mes, ano } = await c.req.json();
  if (!id) return c.json({ error: "ID do rendimento ausente" }, 400);

  const { data, error } = await supabase
    .from("incomes")
    .update({ descricao, valor, mes, ano })
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data?.length) return c.json({ error: "Rendimento não encontrado" }, 404);
  return c.json(data[0]);
});

// DELETE /api/incomes/:id
app.delete("/api/incomes/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabaseClient(c);

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data?.length) return c.json({ error: "Rendimento não encontrado." }, 404);
  return c.json({ success: true });
});

// GET /api/incomes/total-incomes
app.get("/api/incomes/total-incomes", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado" }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .select("valor")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  const total = (data || []).reduce((acc, item) => acc + (item.valor ?? 0), 0);
  return c.json({ total_incomes: total });
});

// GET /api/incomes/total-por-mes
app.get("/api/incomes/total-por-mes", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado" }, 401);

  const { data, error } = await supabase
    .from("incomes")
    .select("mes, ano, valor")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  type MonthlyTotal = { mes: string; ano: number; total: number; quantidade: number };
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
    {} as Record<string, MonthlyTotal>,
  );

  const result = Object.values(totalsByMonth).sort((a, b) => {
    if (a.ano !== b.ano) return a.ano - b.ano;
    return String(a.mes).localeCompare(String(b.mes));
  });

  return c.json(result);
});

// ══════════════════════════════════════════════════════════
// EXPENSE TYPES
// ══════════════════════════════════════════════════════════

// GET /api/expense-types
app.get("/api/expense-types", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado" }, 401);

  const { data, error } = await supabase
    .from("expense_types")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

// POST /api/expense-types
app.post("/api/expense-types", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado" }, 401);

  const { nome } = await c.req.json();
  if (!nome) return c.json({ error: "Nome do tipo de despesa é obrigatório" }, 400);

  const { data, error } = await supabase
    .from("expense_types")
    .insert([{ user_id: user.id, nome }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data?.[0]);
});

// ══════════════════════════════════════════════════════════
// USER
// ══════════════════════════════════════════════════════════

// GET /api/user
app.get("/api/user", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado" }, 401);

  return c.json({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || "",
    phone: user.user_metadata?.phone || "",
    avatar_url: user.user_metadata?.avatar_url || "",
    created_at: user.created_at,
    updated_at: user.updated_at,
  });
});

// PATCH /api/user
app.patch("/api/user", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return c.json({ error: "Usuário não autenticado" }, 401);

  const { email, name, phone, avatar_url } = await c.req.json();

  const { data, error } = await supabase.auth.updateUser({
    email,
    phone,
    data: { name, phone, avatar_url },
  });

  if (error) return c.json({ error: error.message }, 400);

  return c.json({
    success: true,
    user: {
      id: data.user?.id,
      email: data.user?.email,
      name: data.user?.user_metadata?.name || "",
      phone: data.user?.user_metadata?.phone || "",
      avatar_url: data.user?.user_metadata?.avatar_url || "",
      updated_at: data.user?.updated_at,
    },
  });
});

// ══════════════════════════════════════════════════════════
// IA / ANÁLISE DE INVESTIMENTO
// ══════════════════════════════════════════════════════════

app.post("/api/ia/analise-investimento", async (c) => {
  try {
    const supabase = getSupabaseClient(c);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return c.json({ error: "Usuário não autenticado" }, 401);

    const requestBody = await c.req.json();
    const { mes, ano } = requestBody;

    const currentDate = new Date();
    const targetMonth = mes || currentDate.getMonth() + 1;
    const targetYear = ano || currentDate.getFullYear();

    const { data: incomes } = await supabase.from("incomes").select("*").eq("user_id", user.id);
    const { data: tasks } = await supabase.from("tasks").select("*").eq("user_id", user.id);

    const rendimentosDoMes = incomes?.filter(
      (income) => income.mes === targetMonth && income.ano === targetYear,
    ) || [];
    const rendimentoMes = rendimentosDoMes.reduce(
      (total, income) => total + parseFloat(income.valor || "0"), 0,
    );

    const tarefasDoMes = tasks?.filter(
      (task) => task.mes === targetMonth && task.ano === targetYear,
    ) || [];
    const tarefasPagas = tarefasDoMes
      .filter((task) => task.done === "Pago")
      .reduce((total, task) => total + parseFloat(task.price || "0"), 0);
    const tarefasPendentes = tarefasDoMes
      .filter((task) => task.done === "Pendente")
      .reduce((total, task) => total + parseFloat(task.price || "0"), 0);

    const totalTarefas = tarefasPagas + tarefasPendentes;
    const rendimentoDisponivel = rendimentoMes - totalTarefas;
    const percentualGasto = rendimentoMes > 0 ? (totalTarefas / rendimentoMes) * 100 : 0;
    const percentualDisponivel = 100 - percentualGasto;
    const dicasEconomia = rendimentoDisponivel * 0.3;
    const resultadoLiquido = rendimentoMes - tarefasPagas;

    let cotacaoDolar = 0;
    let quantidadeDolar = 0;
    try {
      const dolarResponse = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL");
      const dolarData = await dolarResponse.json();
      cotacaoDolar = parseFloat(dolarData.USDBRL.bid);
      if (resultadoLiquido >= rendimentoMes * 0.3) {
        quantidadeDolar = (resultadoLiquido * 0.3) / cotacaoDolar;
      }
    } catch {
      console.warn("Erro ao buscar cotação do dólar");
    }

    return c.json({
      data: {
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
      },
    });
  } catch (error: any) {
    return c.json({ error: "Erro interno", details: error.message }, 500);
  }
});

// ══════════════════════════════════════════════════════════
// HOMEPAGE
// ══════════════════════════════════════════════════════════

app.get("/", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>API Finance - Dev Server</title>
      <style>
        body { font-family: system-ui; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #1e293b; border-radius: 16px; padding: 40px; max-width: 500px; text-align: center; }
        h1 { color: #38bdf8; margin-bottom: 8px; }
        p { color: #94a3b8; }
        .badge { display: inline-block; background: #22c55e; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-top: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>API Finance</h1>
        <p>Dev server conectado ao Supabase</p>
        <div class="badge">Rodando na porta 3000</div>
      </div>
    </body>
    </html>
  `);
});

// ── Start ───────────────────────────────────────────────
serve({ fetch: app.fetch, port: 3000 });
console.log("🚀 API rodando em http://localhost:3000");
console.log("🔗 Supabase:", process.env.SUPABASE_URL);
