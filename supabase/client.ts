import { createClient } from "@supabase/supabase-js";

if (!process.env.VERCEL) {
  // IIFE assíncrona para usar await import
  await (async () => {
    const { config } = await import("dotenv");
    config({ path: ".env.local" });
  })();
}

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);
