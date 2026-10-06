import "dotenv/config";
import { serve } from "@hono/node-server";
import { createLocalApp } from "./server/app";

const port = Number(process.env.PORT ?? 3000);
const app = createLocalApp();

serve({ fetch: app.fetch, port }, ({ port: activePort }) => {
  console.log(`API disponível em http://localhost:${activePort}`);
});
