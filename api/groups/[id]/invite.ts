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

  // Cria o invite — service role para bypassar RLS no insert
  const serviceClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: invite, error: inviteError } = await serviceClient
    .from("invites")
    .insert([{
      group_id:   groupId,
      email:      parsed.data.email,
      name:       parsed.data.name,
      phone:      parsed.data.phone ?? null,
      invited_by: user.id,
    }])
    .select()
    .single();

  if (inviteError) return c.json({ error: inviteError.message }, 500);

  // Envia e-mail via Resend (graceful degradation se RESEND_API_KEY não estiver configurado)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resend = new Resend(resendKey);
    const frontendUrl = process.env.FRONTEND_URL ?? "https://front-hono.vercel.app";
    const inviteUrl = `${frontendUrl}/invite/${invite.token}`;

    const inviterName = user.user_metadata?.displayName || user.email;

    await resend.emails.send({
      from: "Finance <noreply@resend.dev>",
      to: [parsed.data.email],
      subject: `${inviterName} convidou você para o grupo "${group.name}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 12px;">
          <h2 style="color: #111; margin-bottom: 8px;">Convite para o Finance</h2>
          <p style="color: #555; font-size: 15px;">
            Olá, <strong>${parsed.data.name}</strong>!
          </p>
          <p style="color: #555; font-size: 15px;">
            <strong>${inviterName}</strong> convidou você para colaborar no grupo
            <strong>"${group.name}"</strong>.
          </p>
          <p style="color: #555; font-size: 15px;">
            Com acesso ao grupo você pode visualizar e adicionar despesas,
            rendimentos e compras a prazo em conjunto.
          </p>
          <a href="${inviteUrl}"
             style="display: inline-block; margin-top: 24px; padding: 12px 28px;
                    background: #7c3aed; color: #fff; border-radius: 8px;
                    text-decoration: none; font-weight: 600; font-size: 15px;">
            Aceitar convite
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            Este link expira em 48 horas. Se você não esperava este convite, ignore este e-mail.
          </p>
        </div>
      `,
    });
  }

  return c.json({ message: "Convite enviado com sucesso.", invite_id: invite.id }, 201);
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
