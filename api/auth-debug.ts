export const config = { runtime: "edge" };

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Content-Type": "application/json",
  "Cache-Control": "no-cache",
};

export const OPTIONS = async () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET = async (req: Request) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "") || null;

  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "❌ MISSING",
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey
        ? `${supabaseServiceKey.substring(0, 20)}... (len=${supabaseServiceKey.length})`
        : "❌ MISSING",
      SUPABASE_ANON_KEY: supabaseAnonKey
        ? `${supabaseAnonKey.substring(0, 20)}... (len=${supabaseAnonKey.length})`
        : "❌ MISSING",
    },
    request: {
      has_authorization_header: !!authHeader,
      token_prefix: token ? token.substring(0, 30) + "..." : null,
      token_length: token?.length ?? 0,
    },
    auth_test: null as unknown,
  };

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ ...result, fatal: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, null, 2),
      { status: 500, headers: CORS_HEADERS }
    );
  }

  if (!token) {
    return new Response(
      JSON.stringify({ ...result, auth_test: "Skipped — no token in Authorization header" }, null, 2),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const authClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await authClient.auth.getUser(token);

    result.auth_test = {
      success: !error,
      user_id: data?.user?.id ?? null,
      user_email: data?.user?.email ?? null,
      error_message: error?.message ?? null,
      error_status: (error as any)?.status ?? null,
      error_code: (error as any)?.code ?? null,
    };
  } catch (err) {
    result.auth_test = {
      success: false,
      exception: err instanceof Error ? err.message : String(err),
    };
  }

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: CORS_HEADERS,
  });
};
