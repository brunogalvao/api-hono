import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Função para criar client dinâmico com o token do usuário
export function createClientWithAuth(token?: string) {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: token ?? "",
        },
      },
    },
  );
}
