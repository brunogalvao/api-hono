import { Hono } from "hono";

export const config = {
  runtime: "edge",
};

const app = new Hono();

app.get("/", (c) => {
  return c.text("pong 🏓");
});

export default app.fetch;
