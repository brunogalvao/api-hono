import { Hono } from "hono";
import { supabase } from "./supabase/client";

export const app = new Hono();

app.get("/api/tasks", async (c) => {
  const { data, error } = await supabase.from("tasks").select("*");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});
