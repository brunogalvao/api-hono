import { config } from "dotenv";
config({ path: ".env.local" }); // carrega variáveis antes de qualquer import dependente

import { serve } from "@hono/node-server";
import { app } from "./app"; // agora sim, depois do dotenv

serve({ fetch: app.fetch, port: 3000 });
