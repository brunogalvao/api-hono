import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { z } from "zod";
import { getDolarRate } from "./api/utils/currency";
import { GET as getOpenApi } from "./api/openapi";
import { GET as getSwagger } from "./api/swagger";

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
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Extrai o JWT do header Authorization (remove "Bearer ")
function extractToken(c: any): string | undefined {
  const authHeader = c.req.header("Authorization") ?? "";
  return authHeader.replace("Bearer ", "") || undefined;
}

// Valida o JWT e retorna o usuário autenticado
// Usa cliente limpo (sem override de Authorization) para evitar conflito no auth.getUser()
async function getAuthenticatedUser(c: any) {
  const token = extractToken(c);

  if (!token) {
    console.warn("[getAuthenticatedUser] Token ausente no header Authorization");
    return { data: { user: null }, error: { message: "Token não encontrado no header Authorization" } };
  }

  const authClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const result = await authClient.auth.getUser(token);

  if (result.error) {
    console.error("[getAuthenticatedUser] Supabase auth error:", result.error.message);
  }

  return result;
}

function getPublicSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );
}

const createGroupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  type: z.enum(["personal", "shared"]).default("shared"),
});

const inviteSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  access_expenses: z.boolean().optional().default(true),
  access_incomes: z.boolean().optional().default(true),
  access_installments: z.boolean().optional().default(true),
  access_advisor: z.boolean().optional().default(true),
});

function buildInviteEmail(params: {
  inviteeName: string;
  ownerName: string;
  groupName: string;
  inviteUrl: string;
}) {
  const { inviteeName, ownerName, groupName, inviteUrl } = params;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Convite para grupo financeiro</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">💰 Finance</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Gestão financeira inteligente</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1e293b;padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#f1f5f9;">Você foi convidado!</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
                Olá, <strong style="color:#e2e8f0;">${inviteeName}</strong>!
                <strong style="color:#e2e8f0;">${ownerName}</strong> convidou você para participar do grupo financeiro:
              </p>
              <div style="background-color:#0f172a;border:1px solid #334155;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:6px;">Grupo</div>
                <div style="font-size:20px;font-weight:600;color:#f1f5f9;">${groupName}</div>
              </div>
              <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.6;">
                Ao aceitar o convite, você terá acesso compartilhado às finanças do grupo e poderá colaborar com os outros membros.
              </p>
              <div style="text-align:center;">
                <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                  Aceitar convite
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1e293b;padding:0 40px 16px;">
              <div style="border-top:1px solid #334155;padding-top:20px;">
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                <p style="margin:6px 0 0;font-size:12px;"><a href="${inviteUrl}" style="color:#0ea5e9;word-break:break-all;">${inviteUrl}</a></p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0f172a;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">Este convite expira em 7 dias. Se você não esperava receber este e-mail, pode ignorá-lo com segurança.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const updateAccessSchema = z.object({
  access_expenses: z.boolean().optional(),
  access_incomes: z.boolean().optional(),
  access_installments: z.boolean().optional(),
  access_advisor: z.boolean().optional(),
});

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
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
  if (userError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const body = await c.req.json();

  if (typeof body.mes !== "number" || typeof body.ano !== "number" || body.mes < 1 || body.mes > 12 || body.ano < 2000) {
    return c.json({ error: "Campos 'mes' e 'ano' inválidos." }, 400);
  }

  const { parcela_total, ...taskBody } = body;

  const { data, error } = await supabase
    .from("tasks")
    .insert([{ ...taskBody, user_id: user.id }])
    .select();

  if (error) return c.json({ error: error.message }, 500);

  // Replicação recorrente
  if (taskBody.recorrente) {
    const original = data[0];
    const copies = [];
    for (let m = 1; m <= 12; m++) {
      if (m === original.mes) continue;
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
    if (copies.length > 0) await supabase.from("tasks").insert(copies);
  }

  // Compra parcelada
  if (parcela_total && parcela_total >= 2) {
    const original = data[0];
    const parcela_group_id = crypto.randomUUID();

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ parcela_numero: 1, parcela_group_id, parcela_total })
      .eq("id", original.id)
      .eq("user_id", user.id);

    if (updateError) return c.json({ error: updateError.message }, 500);

    const basePrice = original.price ?? 0;
    const parcelaBase = Math.floor((basePrice / parcela_total) * 100) / 100;
    const totalBase = parcelaBase * (parcela_total - 1);
    const parcelaFinal = Math.round((basePrice - totalBase) * 100) / 100;

    function nextMonth(mes: number, ano: number, offset: number) {
      const totalMonth = mes - 1 + offset;
      return { mes: (totalMonth % 12) + 1, ano: ano + Math.floor(totalMonth / 12) };
    }

    const copies = [];
    for (let i = 2; i <= parcela_total; i++) {
      const { mes, ano } = nextMonth(original.mes, original.ano, i - 1);
      const price = i === parcela_total ? parcelaFinal : parcelaBase;
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
        parcela_total,
        parcela_group_id,
      });
    }

    if (copies.length > 0) {
      const { error: copiesError } = await supabase.from("tasks").insert(copies);
      if (copiesError) return c.json({ error: copiesError.message }, 500);
    }

    const { data: updated } = await supabase
      .from("tasks").select().eq("id", original.id).single();
    return c.json(updated ?? original);
  }

  return c.json(data[0]);
});

// PUT /api/tasks/:id
app.put("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const supabase = getSupabaseClient(c);

  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

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
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data.length) return c.json({ error: "Tarefa não encontrada." }, 404);

  const updated = data[0];

  // Trata mudança de recorrente
  if (body.recorrente !== undefined && body.recorrente !== current.recorrente) {
    if (!body.recorrente) {
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

// DELETE /api/tasks/:id
app.delete("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabaseClient(c);
  const cancelAll = c.req.query("cancel_all") === "true";

  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  if (cancelAll) {
    const { data: target } = await supabase
      .from("tasks").select("parcela_group_id").eq("id", id).eq("user_id", user.id).single();

    if (target?.parcela_group_id) {
      const { error } = await supabase
        .from("tasks").delete()
        .eq("parcela_group_id", target.parcela_group_id)
        .eq("user_id", user.id);
      if (error) return c.json({ error: error.message }, 500);
      return c.json({ message: "Todas as parcelas foram deletadas com sucesso." });
    }
  }

  const { data, error } = await supabase
    .from("tasks").delete().eq("id", id).eq("user_id", user.id).select();

  if (error) return c.json({ error: error.message }, 500);
  if (!data.length) return c.json({ error: "Tarefa não encontrada." }, 404);
  return c.json({ message: "Tarefa deletada com sucesso." });
});

// GET /api/tasks/total
app.get("/api/tasks/total", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
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
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { data, error } = await supabase
    .from("tasks")
    .select("price")
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  const total = (data || []).reduce((acc, item) => acc + Number(item.price ?? 0), 0);
  return c.json({ totalPrice: total });
});

// GET /api/tasks/total-paid
app.get("/api/tasks/total-paid", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
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
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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

  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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
    const { data: { user }, error: userError } = await getAuthenticatedUser(c);
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

    const cotacaoDolar = await getDolarRate();
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
  } catch (error: any) {
    return c.json({ error: "Erro interno", details: error.message }, 500);
  }
});

// ══════════════════════════════════════════════════════════
// PARCELAS
// ══════════════════════════════════════════════════════════

// GET /api/parcelas
app.get("/api/parcelas", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: userError } = await getAuthenticatedUser(c);
  if (userError || !user) return c.json({ error: "Usuário não autenticado" }, 401);

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .not("parcela_group_id", "is", null)
    .is("deleted_at", null);

  if (error) return c.json({ error: error.message }, 500);

  const groups: Record<string, typeof data> = {};
  for (const task of data ?? []) {
    const gid = task.parcela_group_id as string;
    if (!groups[gid]) groups[gid] = [];
    groups[gid].push(task);
  }

  const result = Object.entries(groups).map(([parcela_group_id, tasks]) => {
    const sorted = [...tasks].sort((a, b) => (a.parcela_numero ?? 0) - (b.parcela_numero ?? 0));
    const first = sorted[0];
    const parcela_total = first.parcela_total ?? tasks.length;
    const valor_parcela = first.price ?? 0;
    const valor_total = Math.round(valor_parcela * parcela_total * 100) / 100;
    const parcelas_pagas = tasks.filter((t) => t.done === "Pago").length;
    const status: "Ativo" | "Quitada" = parcelas_pagas === tasks.length ? "Quitada" : "Ativo";

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

// DELETE /api/parcelas/:id (soft delete)
app.delete("/api/parcelas/:id", async (c) => {
  const parcela_group_id = c.req.param("id");
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("parcela_group_id", parcela_group_id)
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

// PUT /api/parcelas/:id
app.put("/api/parcelas/:id", async (c) => {
  const parcela_group_id = c.req.param("id");
  const body = await c.req.json();
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.type !== undefined) update.type = body.type;
  if (body.price !== undefined) update.price = body.price;

  if (Object.keys(update).length === 0) {
    return c.json({ error: "Nenhum campo para atualizar." }, 400);
  }

  const { error } = await supabase
    .from("tasks")
    .update(update)
    .eq("parcela_group_id", parcela_group_id)
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
});

// ══════════════════════════════════════════════════════════
// GROUPS
// ══════════════════════════════════════════════════════════

app.get("/api/groups", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { data, error } = await supabase
    .from("group_members")
    .select("role, joined_at, groups(id, name, type, owner_id, created_at)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error) return c.json({ error: error.message }, 500);

  const groups = (data ?? []).map((row: any) => ({
    ...row.groups,
    role: row.role,
    joined_at: row.joined_at,
  }));

  return c.json(groups);
});

app.post("/api/groups", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const body = await c.req.json();
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert([{ ...parsed.data, owner_id: user.id }])
    .select()
    .single();

  if (groupError) return c.json({ error: groupError.message }, 500);

  const { error: memberError } = await supabase
    .from("group_members")
    .insert([{
      group_id: group.id,
      user_id: user.id,
      role: "owner",
      access_expenses: true,
      access_incomes: true,
      access_installments: true,
      access_advisor: true,
    }]);

  if (memberError) return c.json({ error: memberError.message }, 500);

  return c.json({
    ...group,
    role: "owner",
    joined_at: new Date().toISOString(),
  }, 201);
});

app.get("/api/groups/:id/members", async (c) => {
  const groupId = c.req.param("id");
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return c.json({ error: "Grupo não encontrado ou acesso negado." }, 403);
  }

  const { data, error } = await supabase
    .from("group_members")
    .select(`
      user_id,
      role,
      joined_at,
      access_expenses,
      access_incomes,
      access_installments,
      access_advisor,
      user_profiles (
        display_name,
        avatar_url,
        email
      )
    `)
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error) return c.json({ error: error.message }, 500);

  const members = (data ?? []).map((row: any) => ({
    user_id: row.user_id,
    role: row.role,
    joined_at: row.joined_at,
    access_expenses: row.access_expenses ?? true,
    access_incomes: row.access_incomes ?? true,
    access_installments: row.access_installments ?? true,
    access_advisor: row.access_advisor ?? true,
    display_name: row.user_profiles?.display_name ?? null,
    avatar_url: row.user_profiles?.avatar_url ?? null,
    email: row.user_profiles?.email ?? null,
  }));

  return c.json(members);
});

app.patch("/api/groups/:id/members/:userId", async (c) => {
  const groupId = c.req.param("id");
  const targetUserId = c.req.param("userId");
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const body = await c.req.json();
  const parsed = updateAccessSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: "Nenhuma permissão foi informada." }, 400);
  }

  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return c.json({ error: "Apenas o owner pode atualizar permissões." }, 403);
  }

  if (targetUserId === user.id) {
    return c.json({ error: "O owner não pode alterar as próprias permissões." }, 400);
  }

  const { data: updatedMember, error } = await supabase
    .from("group_members")
    .update(parsed.data)
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .select("user_id, role, joined_at, access_expenses, access_incomes, access_installments, access_advisor")
    .single();

  if (error) return c.json({ error: error.message }, 500);

  return c.json(updatedMember);
});

app.delete("/api/groups/:id/members/:userId", async (c) => {
  const groupId = c.req.param("id");
  const targetUserId = c.req.param("userId");
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return c.json({ error: "Apenas o owner pode remover membros." }, 403);
  }

  if (targetUserId === user.id) {
    return c.json({ error: "O owner não pode ser removido do grupo." }, 400);
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ message: "Membro removido com sucesso." });
});

app.get("/api/groups/:id/invites", async (c) => {
  const groupId = c.req.param("id");
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return c.json({ error: "Apenas o owner pode visualizar convites." }, 403);
  }

  const serviceClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await serviceClient
    .from("invites")
    .select(`
      id,
      email,
      name,
      phone,
      token,
      expires_at,
      created_at,
      access_expenses,
      access_incomes,
      access_installments,
      access_advisor
    `)
    .eq("group_id", groupId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);

  return c.json(data ?? []);
});

app.post("/api/groups/:id/invite", async (c) => {
  const groupId = c.req.param("id");
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const body = await c.req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, owner_id")
    .eq("id", groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return c.json({ error: "Apenas o owner pode convidar membros." }, 403);
  }

  const serviceClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: ownerProfile } = await serviceClient
    .from("user_profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const ownerName = (ownerProfile as any)?.display_name || (ownerProfile as any)?.email || "Um membro";

  const { data: invite, error } = await serviceClient
    .from("invites")
    .insert([{
      group_id: groupId,
      email: parsed.data.email,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      invited_by: user.id,
      access_expenses: parsed.data.access_expenses,
      access_incomes: parsed.data.access_incomes,
      access_installments: parsed.data.access_installments,
      access_advisor: parsed.data.access_advisor,
    }])
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);

  const frontendUrl = process.env.FRONTEND_URL ?? "https://front-hono.vercel.app";
  const inviteUrl = `${frontendUrl}/invite/${(invite as any).token}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM ?? "Finance App <onboarding@resend.dev>";

  const inviteHtml = buildInviteEmail({
    inviteeName: parsed.data.name,
    ownerName,
    groupName: group.name,
    inviteUrl,
  });

  const { error: emailError } = await resend.emails.send({
    from: fromEmail,
    to: parsed.data.email,
    subject: `${ownerName} te convidou para o grupo "${group.name}"`,
    html: inviteHtml,
  });

  if (emailError) {
    await serviceClient.from("invites").delete().eq("id", (invite as any).id);
    return c.json({ error: `Falha ao enviar e-mail: ${(emailError as any).message}` }, 500);
  }

  return c.json({ message: "Convite enviado com sucesso.", invite_id: (invite as any).id }, 201);
});

app.patch("/api/groups/:id/invites/:inviteId", async (c) => {
  const groupId = c.req.param("id");
  const inviteId = c.req.param("inviteId");
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const body = await c.req.json();
  const parsed = updateAccessSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: "Nenhuma permissão foi informada." }, 400);
  }

  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return c.json({ error: "Apenas o owner pode atualizar convites." }, 403);
  }

  const serviceClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: invite, error } = await serviceClient
    .from("invites")
    .update(parsed.data)
    .eq("id", inviteId)
    .eq("group_id", groupId)
    .is("accepted_at", null)
    .select(`
      id,
      email,
      name,
      phone,
      token,
      expires_at,
      created_at,
      access_expenses,
      access_incomes,
      access_installments,
      access_advisor
    `)
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(invite);
});

app.delete("/api/groups/:id/invites/:inviteId", async (c) => {
  const groupId = c.req.param("id");
  const inviteId = c.req.param("inviteId");
  const supabase = getSupabaseClient(c);
  const { data: { user }, error: authError } = await getAuthenticatedUser(c);
  if (authError || !user) return c.json({ error: "Usuário não autenticado." }, 401);

  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return c.json({ error: "Apenas o owner pode revogar convites." }, 403);
  }

  const serviceClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await serviceClient
    .from("invites")
    .delete()
    .eq("id", inviteId)
    .eq("group_id", groupId)
    .is("accepted_at", null);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ message: "Convite revogado com sucesso." });
});

// ══════════════════════════════════════════════════════════
// SWAGGER / OPENAPI
// ══════════════════════════════════════════════════════════

app.get("/api/openapi", () => getOpenApi());
app.get("/api/swagger", () => getSwagger());

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
