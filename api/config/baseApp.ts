import { Hono } from "hono";
import { corsMiddleware } from "./apiHeader";
import { errorHandler, requestLogger } from "./errorHandler";

export function createBaseApp() {
  const app = new Hono();

  app.use("*", corsMiddleware);
  app.use("*", errorHandler);
  app.use("*", requestLogger);

  return app;
}
