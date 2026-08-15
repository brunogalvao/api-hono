import type { Context, Next } from "hono";

// Defina ALLOWED_ORIGINS com origens separadas por vírgula para restringir CORS.
// Exemplo: ALLOWED_ORIGINS=https://finance.aivision.app.br,https://app.aivision.app.br
// Se não definido, permite qualquer origem em desenvolvimento.
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS ?? process.env.FRONTEND_URL ?? "*";

const allowedOrigins: string[] =
  rawAllowedOrigins === "*"
    ? ["*"]
    : rawAllowedOrigins.split(",").map((o) => o.trim()).filter(Boolean);

const staticCorsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

function resolveOrigin(requestOrigin: string | undefined): string {
  if (allowedOrigins.includes("*")) return "*";
  if (!requestOrigin) return allowedOrigins[0] ?? "*";
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0] ?? "*";
}

// Mantido para compatibilidade — usa a primeira origem da lista (ou *)
export const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins[0] ?? "*",
  ...staticCorsHeaders,
};

export function handleOptions(requestOrigin?: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": resolveOrigin(requestOrigin),
      ...staticCorsHeaders,
    },
  });
}

export async function corsMiddleware(c: Context, next: Next) {
  const requestOrigin = c.req.header("origin");
  const origin = resolveOrigin(requestOrigin);

  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        ...staticCorsHeaders,
      },
    });
  }

  await next();

  c.res.headers.set("Access-Control-Allow-Origin", origin);
  for (const [key, value] of Object.entries(staticCorsHeaders)) {
    c.res.headers.set(key, value);
  }
}
