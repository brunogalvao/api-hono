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
// Usa um cliente limpo (sem override de Authorization) para evitar
// conflito entre o header global do cliente de dados e o token do usuário
// no auth.getUser() — especialmente no Vercel Edge Runtime.
export async function getAuthenticatedUser(c: Context) {
  const token = extractToken(c);

  if (!token) {
    console.warn("[getAuthenticatedUser] Token ausente no header Authorization");
    return { data: { user: null }, error: { message: "Token não encontrado no header Authorization" } };
  }

  // Cliente limpo: sem global.headers.Authorization — o SDK usa apenas apikey
  // e auth.getUser(token) define seu próprio Authorization: Bearer {token}
  const authClient = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const result = await authClient.auth.getUser(token);

  if (result.error) {
    console.error("[getAuthenticatedUser] Supabase auth error:", result.error.message, result.error);
  }

  return result;
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
