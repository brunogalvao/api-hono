export const config = {
  runtime: "edge",
};

import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono();

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "API Hono Supabase CRUD",
    version: "1.0.0",
  },
});

export const GET = app.fetch;
