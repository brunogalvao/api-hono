const isLocal = !process.env.VERCEL;

if (isLocal) {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
}

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

console.log("API rodando em ambiente:", process.env.NODE_ENV || "Local");
