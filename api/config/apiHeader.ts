import type { Context, Next } from "hono";

// Em produção, defina FRONTEND_URL para restringir CORS ao domínio do frontend.
// Em desenvolvimento (sem a variável), permite qualquer origem.
const allowedOrigin = process.env.FRONTEND_URL ?? "*";

export const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function corsMiddleware(c: Context, next: Next) {
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  await next();

  c.res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  c.res.headers.set("Access-Control-Max-Age", "86400");
}
