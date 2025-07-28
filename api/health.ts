export const config = { runtime: "edge" };

import { getPublicSupabaseClient } from "./config/supabaseClient";

export const GET = async () => {
  const startTime = Date.now();
  
  try {
    // Teste de conexão com Supabase
    const supabase = getPublicSupabaseClient();
    const { data: supabaseTest, error: supabaseError } = await supabase
      .from('tasks')
      .select('count')
      .limit(1);
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      services: {
        supabase: {
          status: supabaseError ? 'error' : 'connected',
          error: supabaseError?.message || null
        }
      },
      environment: {
        node: process.version,
        platform: process.platform,
        runtime: 'edge'
      },
      endpoints: [
        '/api/ping',
        '/api/test',
        '/api/health',
        '/api/supabase-test',
        '/api/tasks',
        '/api/incomes',
        '/api/user'
      ]
    };
    
    const statusCode = supabaseError ? 503 : 200;
    
    return new Response(
      JSON.stringify(healthStatus, null, 2),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
    
  } catch (error) {
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      uptime: Date.now() - startTime
    };
    
    return new Response(
      JSON.stringify(errorResponse, null, 2),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}; 