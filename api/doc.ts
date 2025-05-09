export const config = {
  runtime: "edge",
};

import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

const app = new OpenAPIHono();

// Gera a documentação OpenAPI (JSON)
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "API Hono Supabase CRUD",
    version: "1.0.0",
  },
});

// Gera a interface Swagger visual
app.get("/ui", swaggerUI({ url: "/api/doc" }));

export const GET = app.fetch;
