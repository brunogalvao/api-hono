import { createBaseApp } from "./config/baseApp";

export const config = { runtime: "edge" };

const app = createBaseApp();
app.get("/api/ping", (c) => c.text("pong 🏓"));

export const GET = app.fetch;
export const OPTIONS = app.fetch;
export default app.fetch;
