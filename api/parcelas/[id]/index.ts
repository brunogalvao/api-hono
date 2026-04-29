import { createAuthApp } from "../../config/baseApp";
import { z } from "zod";

export const config = { runtime: "edge" };

const app = createAuthApp();

const updateParcelaSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.string().optional(),
  price: z.number().positive().optional(),
});

app.put("/api/parcelas/:id", async (c) => {
  const parcela_group_id = c.req.param("id");
  const body = await c.req.json();
  const supabase = c.get("supabase");
  const user = c.get("user");

  const parsed = updateParcelaSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.type !== undefined) update.type = parsed.data.type;
  if (parsed.data.price !== undefined) update.price = parsed.data.price;

  if (Object.keys(update).length === 0) {
    return c.json({ error: "Nenhum campo para atualizar." }, 400);
  }

  const { error } = await supabase
    .from("tasks")
    .update(update)
    .eq("parcela_group_id", parcela_group_id)
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ ok: true });
});

app.delete("/api/parcelas/:id", async (c) => {
  const parcela_group_id = c.req.param("id");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("parcela_group_id", parcela_group_id)
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ ok: true });
});

export const PUT = app.fetch;
export const DELETE = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
