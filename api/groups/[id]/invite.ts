import { createAuthApp } from "../../config/baseApp";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const config = { runtime: "edge" };

const app = createAuthApp();

const inviteSchema = z.object({
  name:  z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  access_expenses: z.boolean().optional().default(true),
  access_incomes: z.boolean().optional().default(true),
  access_installments: z.boolean().optional().default(true),
  access_advisor: z.boolean().optional().default(true),
});

// POST /api/groups/:id/invite — owner envia convite por e-mail
app.post("/api/groups/:id/invite", async (c) => {
  const groupId = c.req.param("id");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const body = await c.req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  // Verifica se o usuário é owner do grupo
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, owner_id")
    .eq("id", groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return c.json({ error: "Apenas o owner pode convidar membros." }, 403);
  }

  // Verifica se o e-mail já é membro
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("user_id, user_profiles(email)")
    .eq("group_id", groupId) as any;

  const emails = (existingMember ?? []).map((m: any) => m.user_profiles?.email).filter(Boolean);
  if (emails.includes(parsed.data.email)) {
    return c.json({ error: "Este usuário já é membro do grupo." }, 409);
  }

  const serviceClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Cria o registro do convite no banco
  const { data: invite, error: inviteError } = await serviceClient
    .from("invites")
    .insert([{
      group_id:            groupId,
      email:               parsed.data.email,
      name:                parsed.data.name,
      phone:               parsed.data.phone ?? null,
      access_expenses:     parsed.data.access_expenses,
      access_incomes:      parsed.data.access_incomes,
      access_installments: parsed.data.access_installments,
      access_advisor:      parsed.data.access_advisor,
      invited_by:          user.id,
    }])
    .select()
    .single();

  if (inviteError) return c.json({ error: inviteError.message }, 500);

  // Envia convite via Supabase Auth — cria o usuário se não existir
  // e envia email nativo com link que já autentica o convidado
  const frontendUrl = process.env.FRONTEND_URL ?? "https://front-hono.vercel.app";
  const redirectTo = `${frontendUrl}/invite/${invite.token}`;

  const { error: authError } = await serviceClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    { redirectTo, data: { displayName: parsed.data.name } }
  );

  if (authError) {
    const alreadyExists =
      authError.message.toLowerCase().includes("already") ||
      authError.message.toLowerCase().includes("registered") ||
      authError.message.toLowerCase().includes("exists");

    if (!alreadyExists) {
      // Erro real (URL não permitida, API key inválida, etc.) — reverte o invite
      await serviceClient.from("invites").delete().eq("id", invite.id);
      return c.json({ error: `Falha ao enviar e-mail: ${authError.message}` }, 500);
    }
    // Usuário já tem conta: convite DB válido, ele pode acessar pelo link diretamente
    return c.json({
      message: "Convite criado. O usuário já possui conta — compartilhe o link de acesso.",
      invite_id: invite.id,
      invite_url: redirectTo,
    }, 201);
  }

  return c.json({ message: "Convite enviado com sucesso.", invite_id: invite.id }, 201);
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
