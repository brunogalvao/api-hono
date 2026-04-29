import { createAuthApp } from "../../../config/baseApp";

export const config = { runtime: "edge" };

const app = createAuthApp();

// DELETE /api/groups/:id/members/:userId — owner remove um membro
app.delete("/api/groups/:id/members/:userId", async (c) => {
  const groupId = c.req.param("id");
  const targetUserId = c.req.param("userId");
  const supabase = c.get("supabase");
  const user = c.get("user");

  // Verifica se o requester é owner
  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return c.json({ error: "Apenas o owner pode remover membros." }, 403);
  }

  // Owner não pode remover a si mesmo
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

export const DELETE = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
