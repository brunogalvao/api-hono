import { Hono } from "hono";

export const config = { runtime: "edge" };

const app = new Hono();

app.get("/", (c) => c.text("✔️ income clean"));

export default app.fetch;
