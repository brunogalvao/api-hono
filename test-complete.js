// Script completo para testar todos os endpoints
import { serve } from "@hono/node-server";
import { Hono } from "hono";

// Importar todos os endpoints
import { GET as pingGet } from "./api/ping.js";
import { GET as testGet } from "./api/test.js";
import { GET as healthGet } from "./api/health.js";
import { GET as supabaseTestGet } from "./api/supabase-test.js";

const app = new Hono();

// Adicionar todas as rotas
app.get("/api/ping", pingGet);
app.get("/api/test", testGet);
app.get("/api/health", healthGet);
app.get("/api/supabase-test", supabaseTestGet);

// Rota para testar todos os endpoints
app.get("/api/test-all", async (c) => {
  const tests = [
    { name: "Ping", path: "/api/ping" },
    { name: "Test", path: "/api/test" },
    { name: "Health", path: "/api/health" },
    { name: "Supabase Test", path: "/api/supabase-test" }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const response = await fetch(`http://localhost:3002${test.path}`);
      const data = await response.text();
      
      results.push({
        name: test.name,
        status: response.status,
        success: response.ok,
        data: data.substring(0, 100) + (data.length > 100 ? "..." : "")
      });
    } catch (error) {
      results.push({
        name: test.name,
        status: "ERROR",
        success: false,
        error: error.message
      });
    }
  }
  
  return c.json({
    timestamp: new Date().toISOString(),
    totalTests: tests.length,
    passedTests: results.filter(r => r.success).length,
    failedTests: results.filter(r => !r.success).length,
    results
  });
});

const port = 3002;
console.log(`🧪 Test server running on http://localhost:${port}`);
console.log(`📋 Endpoints disponíveis:`);
console.log(`   GET /api/ping`);
console.log(`   GET /api/test`);
console.log(`   GET /api/health`);
console.log(`   GET /api/supabase-test`);
console.log(`   GET /api/test-all`);

serve({
  fetch: app.fetch,
  port
}); 