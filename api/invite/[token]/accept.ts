import { createAuthApp } from "../../config/baseApp";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

const app = createAuthApp();

// POST /api/invite/:token/accept — usuário autenticado aceita o convite
app.post("/api/invite/:token/accept", async (c) => {
  const token = c.req.param("token");
  const user = c.get("user");

  const serviceClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Valida o token
  const { data: invite, error } = await serviceClient
    .from("invites")
    .select("id, group_id, email, expires_at, accepted_at")
    .eq("token", token)
    .single();

  if (error || !invite) {
    return c.json({ error: "Convite não encontrado ou inválido." }, 404);
  }

  if (invite.accepted_at) {
    return c.json({ error: "Este convite já foi aceito." }, 410);
  }

  if (new Date(invite.expires_at) < new Date()) {
    return c.json({ error: "Este convite expirou." }, 410);
  }

  // Verifica se o usuário já é membro
  const { data: existingMember } = await serviceClient
    .from("group_members")
    .select("user_id")
    .eq("group_id", invite.group_id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    return c.json({ error: "Você já é membro deste grupo." }, 409);
  }

  // Adiciona ao grupo como member
  const { error: memberError } = await serviceClient
    .from("group_members")
    .insert([{ group_id: invite.group_id, user_id: user.id, role: "member" }]);

  if (memberError) return c.json({ error: memberError.message }, 500);

  // Marca o convite como aceito (single-use)
  await serviceClient
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return c.json({ message: "Convite aceito com sucesso.", group_id: invite.group_id });
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
