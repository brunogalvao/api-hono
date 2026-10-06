import type { Context, Next } from "hono";

const REQUEST_ID_HEADER = "X-Request-Id";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 401 | 403 | 404 | 409 | 410 | 429 | 500 = 500,
    public readonly code = "internal_error",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getRequestId(c: Context): string {
  return c.res.headers.get(REQUEST_ID_HEADER)
    ?? c.req.header(REQUEST_ID_HEADER)
    ?? crypto.randomUUID();
}

export async function requestIdMiddleware(c: Context, next: Next) {
  const requestId = c.req.header(REQUEST_ID_HEADER) ?? crypto.randomUUID();
  c.header(REQUEST_ID_HEADER, requestId);
  await next();
  c.res.headers.set(REQUEST_ID_HEADER, requestId);
}

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
    const requestId = getRequestId(c);
    console.error(JSON.stringify({
      level: "error",
      event: "request_failed",
      requestId,
      method: c.req.method,
      path,
      error: error instanceof Error ? error.message : "unknown_error",
    }));

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
    const errorCode = error instanceof ApiError
      ? error.code
      : statusCode < 500
        ? "request_failed"
        : "internal_error";

    return c.json(
      {
        error: errorMessage,
        error_code: errorCode,
        request_id: requestId,
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
  console.log(JSON.stringify({
    level: "info",
    event: "request_completed",
    requestId: getRequestId(c),
    method,
    path,
    status,
    durationMs: duration,
  }));
}
