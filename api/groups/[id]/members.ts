import { createAuthApp } from "../../config/baseApp";

export const config = { runtime: "edge" };

const app = createAuthApp();

// GET /api/groups/:id/members — lista membros com dados de perfil
app.get("/api/groups/:id/members", async (c) => {
  const groupId = c.req.param("id");
  const supabase = c.get("supabase");
  const user = c.get("user");

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
    display_name: row.user_profiles?.display_name ?? null,
    avatar_url: row.user_profiles?.avatar_url ?? null,
    email: row.user_profiles?.email ?? null,
  }));

  return c.json(members);
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
