import { createBaseApp } from "../../config/baseApp";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

const app = createBaseApp();

// GET /api/invite/:token — rota pública: retorna dados do convite para a página de aceite
app.get("/api/invite/:token", async (c) => {
  const token = c.req.param("token");

  const serviceClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: invite, error } = await serviceClient
    .from("invites")
    .select("id, email, expires_at, accepted_at, groups(id, name)")
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

  return c.json({
    email: invite.email,
    group: invite.groups,
    expires_at: invite.expires_at,
  });
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
