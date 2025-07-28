export const config = { runtime: "edge" };

import { getPublicSupabaseClient } from "./config/supabaseClient";

export const GET = async () => {
  try {
    const supabase = getPublicSupabaseClient();
    
    // Teste simples de conexão
    const { data, error } = await supabase
      .from('tasks')
      .select('count')
      .limit(1);
    
    if (error) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: error.message,
          hint: 'Verifique as variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY'
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'Conexão com Supabase estabelecida com sucesso!',
        data: data
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}; 