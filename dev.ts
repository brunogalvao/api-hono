import { config } from "dotenv";
config({ path: ".env.local" }); // carrega antes de qualquer import dependente

import { serve } from "@hono/node-server";
import { app } from "./app";

serve({ fetch: app.fetch, port: 3000 });
