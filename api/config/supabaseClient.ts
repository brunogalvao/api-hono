import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";

// Validação das variáveis de ambiente no nível do módulo
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
}

// Extrai o token JWT do header Authorization
export function extractToken(c: Context): string | undefined {
  const authHeader = c.req.header("Authorization") ?? "";
  return authHeader.replace("Bearer ", "") || undefined;
}

// Cliente para operações que precisam de autenticação (via header Authorization)
export function getSupabaseClient(c: Context) {
  const authHeader = c.req.header("Authorization") ?? "";

  return createClient(supabaseUrl!, supabaseServiceKey!, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Valida o JWT do request e retorna o usuário autenticado.
// Usa auth.getUser(token) explicitamente, pois clientes criados
// por request não têm sessão interna armazenada.
export async function getAuthenticatedUser(c: Context) {
  const token = extractToken(c);
  const supabase = getSupabaseClient(c);
  return supabase.auth.getUser(token);
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
