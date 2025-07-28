// Script para testar endpoints localmente
import { serve } from "@hono/node-server";
import { app } from "./app.ts";

const port = 3000;
console.log(`🚀 Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
}); 