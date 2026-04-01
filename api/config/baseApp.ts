import { Hono } from "hono";
import { corsMiddleware } from "./apiHeader";
import { errorHandler, requestLogger } from "./errorHandler";
import { authMiddleware, type AuthVariables } from "./authMiddleware";

export type { AuthVariables };

export function createBaseApp() {
  const app = new Hono();
  app.use("*", corsMiddleware);
  app.use("*", errorHandler);
  app.use("*", requestLogger);
  return app;
}

// App com autenticação já aplicada em todas as rotas.
// Nas rotas, use c.get("user") e c.get("supabase") diretamente.
export function createAuthApp() {
  const app = new Hono<{ Variables: AuthVariables }>();
  app.use("*", corsMiddleware);
  app.use("*", errorHandler);
  app.use("*", requestLogger);
  app.use("*", authMiddleware);
  return app;
}
