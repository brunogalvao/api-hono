import { Hono } from "hono";
import { handleOptions } from "../config/apiHeader";
import { getSupabaseClient } from "../config/supabaseClient";

export const config = { runtime: "edge" };

const app = new Hono();

// ✅ Rota OPTIONS necessária para CORS
app.options("/api/user", () => handleOptions());

// ✅ GET - obter perfil do usuário
app.get("/api/user", async (c) => {
    const supabase = getSupabaseClient(c);

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return c.json({ error: "Usuário não autenticado" }, 401);
    }

    return c.json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || "",
        phone: user.user_metadata?.phone || "",
        avatar_url: user.user_metadata?.avatar_url || "",
        created_at: user.created_at,
        updated_at: user.updated_at,
    });
});

// ✅ PATCH - atualizar perfil do usuário
app.patch("/api/user", async (c) => {
    const supabase = getSupabaseClient(c);

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return c.json({ error: "Usuário não autenticado" }, 401);
    }

    const { email, name, phone, avatar_url } = await c.req.json();

    try {
        const { data, error } = await supabase.auth.updateUser({
            email,
            phone,
            data: {
                name,
                phone,
                avatar_url,
            },
        });

        if (error) {
            return c.json({ error: error.message }, 400);
        }

        return c.json({
            success: true,
            user: {
                id: data.user?.id,
                email: data.user?.email,
                name: data.user?.user_metadata?.name || "",
                phone: data.user?.user_metadata?.phone || "",
                avatar_url: data.user?.user_metadata?.avatar_url || "",
                updated_at: data.user?.updated_at,
            },
        });
    } catch (error: any) {
        return c.json(
            { error: error.message || "Erro interno do servidor" },
            500,
        );
    }
});

export const GET = app.fetch;
export const PATCH = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
