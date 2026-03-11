import { getSupabaseClient } from "../config/supabaseClient";
import { createBaseApp } from "../config/baseApp";

export const config = { runtime: "edge" };

const app = createBaseApp();

// GET - listar tipos de despesas
app.get("/api/expense-types", async (c) => {
    const supabase = getSupabaseClient(c);

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user)
        return c.json({ error: "Usuário não autenticado" }, 401);

    const { data, error } = await supabase
        .from("expense_types")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);
    return c.json(data || []);
});

// POST - criar novo tipo de despesa
app.post("/api/expense-types", async (c) => {
    const supabase = getSupabaseClient(c);

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user)
        return c.json({ error: "Usuário não autenticado" }, 401);

    const { nome } = await c.req.json();
    if (!nome) {
        return c.json({ error: "Nome do tipo de despesa é obrigatório" }, 400);
    }

    const { data, error } = await supabase
        .from("expense_types")
        .insert([{ user_id: user.id, nome }])
        .select();

    if (error) return c.json({ error: error.message }, 500);
    return c.json(data?.[0]);
});

export const GET = app.fetch;
export const POST = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
