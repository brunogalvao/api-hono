import { Hono } from "hono";
import { corsMiddleware } from "./apiHeader";
import {
  errorHandler,
  requestIdMiddleware,
  requestLogger,
} from "./errorHandler";
import { authMiddleware, type AuthVariables } from "./authMiddleware";

export type { AuthVariables };

async function securityHeaders(
  c: Parameters<typeof corsMiddleware>[0],
  next: () => Promise<void>,
) {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("Referrer-Policy", "no-referrer");
  c.res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  c.res.headers.set("Cache-Control", "no-store");
}

const sharedMiddleware = [
  requestIdMiddleware,
  corsMiddleware,
  securityHeaders,
  errorHandler,
  requestLogger,
] as const;

export function createBaseApp() {
  const app = new Hono();
  sharedMiddleware.forEach((m) => app.use("*", m));
  return app;
}

// App com autenticação já aplicada em todas as rotas.
// Nas rotas, use c.get("user") e c.get("supabase") diretamente.
export function createAuthApp() {
  const app = new Hono<{ Variables: AuthVariables }>();
  [...sharedMiddleware, authMiddleware].forEach((m) => app.use("*", m));
  return app;
}
