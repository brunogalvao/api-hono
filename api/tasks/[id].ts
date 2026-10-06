import { createAuthApp } from "../config/baseApp";
import { updateTaskSchema } from "../model/task.schema";
import { deleteTask, updateTask } from "../../lib/tasks/task-service";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.put("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const supabase = c.get("supabase");
  const user = c.get("user");

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  return c.json(await updateTask(supabase, user.id, id, parsed.data));
});

app.delete("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const cancelAll = c.req.query("cancel_all") === "true";

  return c.json(await deleteTask(supabase, user.id, id, cancelAll));
});

export const OPTIONS = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;
export default app.fetch;
