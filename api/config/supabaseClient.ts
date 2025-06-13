import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";

export function getSupabaseClient(c: Context) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          Authorization: c.req.header("Authorization") ?? "",
        },
      },
    },
  );
}

// Quando você só tem o token manualmente (útil para rotas dinâmicas como /:id)
export function createClientWithAuth(token: string | null = "") {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          Authorization: token ?? "",
        },
      },
    },
  );
}
