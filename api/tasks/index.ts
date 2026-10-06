import { createAuthApp } from "../config/baseApp";
import { createTaskSchema } from "../model/task.schema";
import { createTask, listTasks } from "../../lib/tasks/task-service";

export const config = { runtime: "edge" };

const app = createAuthApp();

app.get("/api/tasks", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const month = Number(c.req.query("month"));
  const year = Number(c.req.query("year"));

  if (!month || !year) {
    return c.json({ error: "Parâmetros 'month' e 'year' são obrigatórios." }, 400);
  }
  if (month < 1 || month > 12 || year < 2000) {
    return c.json({ error: "Parâmetros 'month' ou 'year' inválidos." }, 400);
  }

  return c.json(await listTasks(supabase, user.id, month, year));
});

app.post("/api/tasks", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const body = await c.req.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400);
  }

  return c.json(await createTask(supabase, user.id, parsed.data), 201);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
