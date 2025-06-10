import { createClient } from "@supabase/supabase-js";

// export const createClientWithAuth = (token?: string | null) => {
//   return createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.SUPABASE_ANON_KEY!,
//     {
//       global: {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       },
//     },
//   );
// };

export const createClientWithAuth = (token?: string | null) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );
};
