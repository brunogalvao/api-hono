import type { Context, Next } from "hono";

function safePath(rawUrl: string): string {
  try {
    return new URL(rawUrl).pathname
      .replace(/(\/api\/invite\/)[^/]+/i, "$1[redacted]")
      .replace(/(\/api\/workspace-invites\/)[^/]+/i, "$1[redacted]");
  } catch {
    return "[invalid-url]";
  }
}

// Middleware para tratamento centralizado de erros
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    const path = safePath(c.req.url);
    console.error(`Request failed: ${c.req.method} ${path}`, error);

    const candidateStatus =
      error instanceof Error && "status" in error
        ? Number((error as Error & { status?: unknown }).status)
        : 500;
    const statusCode =
      Number.isInteger(candidateStatus) &&
      candidateStatus >= 400 &&
      candidateStatus < 600
        ? candidateStatus
        : 500;
    const errorMessage =
      statusCode < 500 && error instanceof Error
        ? error.message
        : "Erro interno do servidor";

    return c.json(
      {
        error: errorMessage,
        timestamp: new Date().toISOString(),
        path,
      },
      statusCode as 400 | 401 | 403 | 404 | 409 | 410 | 429 | 500,
    );
  }
}

// Middleware para logging de requisições (ignora OPTIONS/preflight)
export async function requestLogger(c: Context, next: Next) {
  if (c.req.method === "OPTIONS") return next();

  const start = Date.now();
  const method = c.req.method;
  const path = safePath(c.req.url);

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(`${method} ${path} → ${status} (${duration}ms)`);
}
