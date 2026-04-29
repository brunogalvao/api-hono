import { createAuthApp } from "../config/baseApp";
import { z } from "zod";

export const config = { runtime: "edge" };

const app = createAuthApp();

const createGroupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  type: z.enum(["personal", "shared"]).default("shared"),
});

// GET /api/groups — lista os grupos do usuário autenticado
app.get("/api/groups", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("group_members")
    .select("role, joined_at, groups(id, name, type, owner_id, created_at)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (error) return c.json({ error: error.message }, 500);

  const groups = (data ?? []).map((row: any) => ({
    ...row.groups,
    role: row.role,
    joined_at: row.joined_at,
  }));

  return c.json(groups);
});

// POST /api/groups — cria novo grupo compartilhado
app.post("/api/groups", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const body = await c.req.json();
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert([{ ...parsed.data, owner_id: user.id }])
    .select()
    .single();

  if (groupError) return c.json({ error: groupError.message }, 500);

  // Adiciona o criador como owner automaticamente
  const { error: memberError } = await supabase
    .from("group_members")
    .insert([{ group_id: group.id, user_id: user.id, role: "owner" }]);

  if (memberError) return c.json({ error: memberError.message }, 500);

  return c.json(group, 201);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
