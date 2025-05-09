const setup = async () => {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });

  const { serve } = await import("@hono/node-server");
  const { app } = await import("./app");

  serve({ fetch: app.fetch, port: 3000 });
};

setup();

console.log("API Rodando");
