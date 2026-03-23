import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { getSupabaseClient, getAuthenticatedUser } from "./supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

type AuthVariables = {
  user: User;
  supabase: SupabaseClient;
};

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const supabase = getSupabaseClient(c);
    const {
      data: { user },
      error,
    } = await getAuthenticatedUser(c);

    if (error || !user) {
      return c.json({ error: "Usuário não autenticado" }, 401);
    }

    c.set("user", user);
    c.set("supabase", supabase);

    return next();
  }
);
