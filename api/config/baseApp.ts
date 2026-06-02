import { Hono } from "hono";
import { corsMiddleware } from "./apiHeader";
import { errorHandler, requestLogger } from "./errorHandler";
import { authMiddleware, type AuthVariables } from "./authMiddleware";

export type { AuthVariables };

const sharedMiddleware = [corsMiddleware, errorHandler, requestLogger] as const;

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
