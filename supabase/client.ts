// Apenas carrega dotenv se estiver fora da Vercel (local)
if (!process.env.VERCEL) {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
}

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);
