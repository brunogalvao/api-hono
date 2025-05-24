import { Hono } from "hono";

export const config = {
  runtime: "edge",
};

const app = new Hono();

app.options(
  "/api/income",
  () =>
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }),
);

app.get("/api/income", async (c) => {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase.from("incomes").select("*"); // ← aqui com "incomes"
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post("/api/income", async (c) => {
  const { createClient } = await import("@supabase/supabase-js");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return c.json({ error: "Não autenticado" }, 401);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return c.json({ error: "Usuário inválido" }, 401);
  }

  const uid = userData.user.id;
  const body = await c.req.json();
  const { descricao, valor, mes, ano } = body;

  if (!valor || !mes || !ano) {
    return c.json({ error: "Campos obrigatórios ausentes" }, 400);
  }

  const { data, error } = await supabase
    .from("incomes")
    .insert([{ user_id: uid, descricao, valor, mes, ano }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;

// Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IkhDRTUrSG85akVJTnVmNysiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3lvanV0ZmtmanhiY3p1eGVqYmlwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhNGQ5NzUyOC02OWRiLTQzZDYtOThiZS00NzJjMDFhOGZmNWIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ4MTExOTI1LCJpYXQiOjE3NDgxMDgzMjUsImVtYWlsIjoiYnJ1bm9fZ2FsdmFvQG91dGxvb2suY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJnaXRodWIiLCJwcm92aWRlcnMiOlsiZ2l0aHViIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2F2YXRhcnMuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvNTg5OTI1OD92PTQiLCJlbWFpbCI6ImJydW5vX2dhbHZhb0BvdXRsb29rLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJCcnVubyBHYWx2w6NvIiwiaXNzIjoiaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbSIsIm5hbWUiOiJCcnVubyBHYWx2w6NvIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJicnVub2dhbHZhbyIsInByb3ZpZGVyX2lkIjoiNTg5OTI1OCIsInN1YiI6IjU4OTkyNTgiLCJ1c2VyX25hbWUiOiJicnVub2dhbHZhbyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzQ3OTIyMTU5fV0sInNlc3Npb25faWQiOiJlYjg2M2ZjNi1kNDA5LTQ0NzAtOGY0OC00ZGMyYjU1ZWNhODIiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.4PBhdet4YZyHj6w59HIC3GwDoIEJZ_115uIxnU3vLcs
