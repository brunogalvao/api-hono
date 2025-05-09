export const config = {
  runtime: "edge",
};

import { Hono } from "hono";
import { supabase } from "../../supabase/client";

const app = new Hono();

app.get("/", async (c) => {
  const { data, error } = await supabase.from("tasks").select("*");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post("/", async (c) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("tasks").insert([body]).select();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
