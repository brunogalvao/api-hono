import { createAuthApp } from "../../../config/baseApp";
import { z } from "zod";

export const config = { runtime: "edge" };

const app = createAuthApp();

const updateMemberAccessSchema = z.object({
  access_expenses: z.boolean().optional(),
  access_incomes: z.boolean().optional(),
  access_installments: z.boolean().optional(),
  access_advisor: z.boolean().optional(),
});

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

// PATCH /api/groups/:id/members/:userId — owner atualiza permissões do membro
app.patch("/api/groups/:id/members/:userId", async (c) => {
  const groupId = c.req.param("id");
  const targetUserId = c.req.param("userId");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const body = await c.req.json();
  const parsed = updateMemberAccessSchema.safeParse(body);

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

export const DELETE = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
