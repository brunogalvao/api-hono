import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";

// Cliente para operações que precisam de autenticação
export function getSupabaseClient(c: Context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: c.req.header("Authorization") ?? "",
      },
    },
  });
}

// Cliente para operações públicas (sem autenticação)
export function getPublicSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios");
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Cliente com token manual (útil para rotas dinâmicas)
export function createClientWithAuth(token: string | null = "") {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: token ?? "",
      },
    },
  });
}
