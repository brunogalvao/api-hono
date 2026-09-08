import { createAuthApp } from "../../config/baseApp";

export const config = { runtime: "edge" };

const app = createAuthApp();

// POST /api/invite/:token/accept — usuário autenticado aceita o convite
app.post("/api/invite/:token/accept", async (c) => {
  const token = c.req.param("token");
  const supabase = c.get("supabase");

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      token,
    )
  ) {
    return c.json({ error: "Convite não encontrado ou inválido." }, 404);
  }

  const { data, error } = await supabase.rpc("accept_legacy_group_invite", {
    p_token: token,
  });

  if (error) {
    console.error("[legacy-invite] RPC failed:", error.code);
    return c.json({ error: "Não foi possível aceitar o convite." }, 500);
  }

  const result = data as { status?: string; group_id?: string } | null;
  switch (result?.status) {
    case "accepted_successfully":
      return c.json({
        message: "Convite aceito com sucesso.",
        group_id: result.group_id,
      });
    case "accepted":
      return c.json({ error: "Este convite já foi aceito." }, 410);
    case "expired":
      return c.json({ error: "Este convite expirou." }, 410);
    case "email_mismatch":
      return c.json({ error: "Este convite pertence a outro e-mail." }, 403);
    case "already_member":
      return c.json({ error: "Você já é membro deste grupo." }, 409);
    default:
      return c.json({ error: "Convite não encontrado ou inválido." }, 404);
  }
});

export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
