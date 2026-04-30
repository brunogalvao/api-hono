import { createAuthApp } from "../../config/baseApp";

export const config = { runtime: "edge" };

const app = createAuthApp();

// GET /api/groups/:id/invites — owner lista convites pendentes do grupo
app.get("/api/groups/:id/invites", async (c) => {
  const groupId = c.req.param("id");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  if (!group || group.owner_id !== user.id) {
    return c.json({ error: "Apenas o owner pode visualizar convites." }, 403);
  }

  const { data, error } = await supabase
    .from("invites")
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
    .eq("group_id", groupId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);

  return c.json(data ?? []);
});

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
