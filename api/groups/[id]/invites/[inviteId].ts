import { createAuthApp } from "../../../config/baseApp";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const config = { runtime: "edge" };

const app = createAuthApp();

const updateInviteAccessSchema = z.object({
  access_expenses: z.boolean().optional(),
  access_incomes: z.boolean().optional(),
  access_installments: z.boolean().optional(),
  access_advisor: z.boolean().optional(),
});

async function getOwnerGroup(
  supabase: ReturnType<typeof createClient>,
  groupId: string,
  userId: string
) {
  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  if (!group || group.owner_id !== userId) {
    return null;
  }

  return group;
}

app.patch("/api/groups/:id/invites/:inviteId", async (c) => {
  const groupId = c.req.param("id");
  const inviteId = c.req.param("inviteId");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const body = await c.req.json();
  const parsed = updateInviteAccessSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: "Nenhuma permissão foi informada." }, 400);
  }

  const group = await getOwnerGroup(supabase as any, groupId, user.id);
  if (!group) {
    return c.json({ error: "Apenas o owner pode atualizar convites." }, 403);
  }

  const serviceClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: invite, error } = await serviceClient
    .from("invites")
    .update(parsed.data)
    .eq("id", inviteId)
    .eq("group_id", groupId)
    .is("accepted_at", null)
    .select(`
      id,
      email,
      name,
      phone,
      token,
      expires_at,
      created_at,
      access_expenses,
      access_incomes,
      access_installments,
      access_advisor
    `)
    .single();

  if (error) return c.json({ error: error.message }, 500);

  return c.json(invite);
});

app.delete("/api/groups/:id/invites/:inviteId", async (c) => {
  const groupId = c.req.param("id");
  const inviteId = c.req.param("inviteId");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const group = await getOwnerGroup(supabase as any, groupId, user.id);
  if (!group) {
    return c.json({ error: "Apenas o owner pode revogar convites." }, 403);
  }

  const serviceClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await serviceClient
    .from("invites")
    .delete()
    .eq("id", inviteId)
    .eq("group_id", groupId)
    .is("accepted_at", null);

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ message: "Convite revogado com sucesso." });
});

export const PATCH = app.fetch;
export const DELETE = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
