// Script para testar todos os endpoints
import { serve } from "@hono/node-server";
import { Hono } from "hono";

// Importar todos os endpoints
import { GET as pingGet } from "./api/ping.js";
import { GET as testGet } from "./api/test.js";
import { GET as supabaseTestGet } from "./api/supabase-test.js";

const app = new Hono();

// Adicionar rotas de teste
app.get("/api/ping", pingGet);
app.get("/api/test", testGet);
app.get("/api/supabase-test", supabaseTestGet);

// Rota para listar todos os endpoints disponíveis
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    endpoints: [
      "/api/ping",
      "/api/test", 
      "/api/supabase-test",
      "/api/health"
    ],
    timestamp: new Date().toISOString()
  });
});

const port = 3001;
console.log(`🧪 Test server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
}); 