import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";

// Validação das variáveis de ambiente no nível do módulo
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
}

// Cliente para operações que precisam de autenticação (via header Authorization)
export function getSupabaseClient(c: Context) {
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    global: {
      headers: {
        Authorization: c.req.header("Authorization") ?? "",
      },
    },
  });
}

// Cliente para operações públicas (sem autenticação)
export function getPublicSupabaseClient() {
  if (!supabaseAnonKey) {
    throw new Error("SUPABASE_ANON_KEY é obrigatória");
  }
  return createClient(supabaseUrl!, supabaseAnonKey);
}

// Cliente com token manual (útil para rotas dinâmicas)
export function createClientWithAuth(token: string | null = "") {
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    global: {
      headers: {
        Authorization: token ?? "",
      },
    },
  });
}
