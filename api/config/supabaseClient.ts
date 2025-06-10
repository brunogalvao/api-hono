// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";

export function getSupabaseClient(c: Context) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ou ANON_KEY conforme necessidade
    {
      global: {
        headers: {
          Authorization: c.req.header("Authorization") ?? "",
        },
      },
    },
  );
}

export async function getUserOrThrow(c: Context) {
  const supabase = getSupabaseClient(c);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Usuário não autenticado.");
  return { supabase, user };
}
