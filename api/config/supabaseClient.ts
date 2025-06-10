import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";

export function getSupabaseClient(c: Context) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: c.req.header("Authorization") ?? "",
        },
      },
    },
  );
}
