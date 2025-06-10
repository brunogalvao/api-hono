import { createClient } from "@supabase/supabase-js";

export const createClientWithAuth = (token?: string) => {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: token ?? "",
        },
      },
    },
  );
};
