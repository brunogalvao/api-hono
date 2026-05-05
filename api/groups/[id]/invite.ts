import { createAuthApp } from "../../config/baseApp";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
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

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">💰 Finance</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Gestão financeira inteligente</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#1e293b;padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#f1f5f9;">
                Você foi convidado!
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
                Olá, <strong style="color:#e2e8f0;">${inviteeName}</strong>!
                <strong style="color:#e2e8f0;">${ownerName}</strong> convidou você para participar do grupo financeiro:
              </p>

              <!-- Group Card -->
              <div style="background-color:#0f172a;border:1px solid #334155;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:6px;">Grupo</div>
                <div style="font-size:20px;font-weight:600;color:#f1f5f9;">${groupName}</div>
              </div>

              <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.6;">
                Ao aceitar o convite, você terá acesso compartilhado às finanças do grupo e poderá colaborar com os outros membros.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;">
                <a href="${inviteUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                  Aceitar convite
                </a>
              </div>
            </td>
          </tr>

          <!-- Divider + Footer link -->
          <tr>
            <td style="background-color:#1e293b;padding:0 40px 16px;">
              <div style="border-top:1px solid #334155;padding-top:20px;">
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                  Se o botão não funcionar, copie e cole este link no seu navegador:
                </p>
                <p style="margin:6px 0 0;font-size:12px;">
                  <a href="${inviteUrl}" style="color:#0ea5e9;word-break:break-all;">${inviteUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f172a;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                Este convite expira em 7 dias. Se você não esperava receber este e-mail, pode ignorá-lo com segurança.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// POST /api/groups/:id/invite — owner envia convite por e-mail via Resend
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

  // Busca o nome do owner para usar no e-mail
  const { data: ownerProfile } = await serviceClient
    .from("user_profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const ownerName = ownerProfile?.display_name || ownerProfile?.email || "Um membro";

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

  const frontendUrl = process.env.FRONTEND_URL ?? "https://front-hono.vercel.app";
  const inviteUrl = `${frontendUrl}/invite/${invite.token}`;

  // Envia o e-mail de convite via Resend
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM ?? "Finance App <onboarding@resend.dev>";

  const { error: emailError } = await resend.emails.send({
    from: fromEmail,
    to: parsed.data.email,
    subject: `${ownerName} te convidou para o grupo "${group.name}"`,
    html: buildInviteEmail({
      inviteeName: parsed.data.name,
      ownerName,
      groupName: group.name,
      inviteUrl,
    }),
  });

  if (emailError) {
    await serviceClient.from("invites").delete().eq("id", invite.id);
    return c.json({ error: `Falha ao enviar e-mail: ${emailError.message}` }, 500);
  }

  return c.json({ message: "Convite enviado com sucesso.", invite_id: invite.id }, 201);
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
