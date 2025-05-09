import { serve } from "@hono/node-server";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

const app = new OpenAPIHono();

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "API Local Dev CRUD",
    version: "1.0.0",
  },
});

app.get("/ui", swaggerUI({ url: "/doc" }));

serve({ fetch: app.fetch, port: 3000 });

console.log("API Rodando");
