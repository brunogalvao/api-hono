import { createAuthApp } from "../../config/baseApp";

export const config = { runtime: "edge" };

const app = createAuthApp();

// GET /api/groups/:id/members — lista membros de um grupo
app.get("/api/groups/:id/members", async (c) => {
  const groupId = c.req.param("id");
  const supabase = c.get("supabase");
  const user = c.get("user");

  // Verifica pertencimento — RLS garante, mas retornamos 403 explícito
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
    .select("user_id, role, joined_at")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error) return c.json({ error: error.message }, 500);

  return c.json(data ?? []);
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
