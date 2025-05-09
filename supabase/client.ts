// import { config } from "dotenv";
// config({ path: ".env.local" }); // ⚠️ isso força carregar .env.local

import { createClient } from "@supabase/supabase-js";

// console.log("🔍 SUPABASE_URL:", process.env.SUPABASE_URL);
// console.log("API está rodando");

// const url = process.env.SUPABASE_URL!;
// const key = process.env.SUPABASE_ANON_KEY!;

// export const supabase = createClient(url, key);

const url = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL!;
const key = import.meta.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);
