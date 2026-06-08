import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getClientSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getClientSupabaseEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookieValues) {
          try {
            cookieValues.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` was called from a Server Component, where cookies are
            // read-only. Safe to ignore: the middleware refreshes the session
            // cookie on every request. Without this guard, any logged-in user
            // loading a Server Component page (e.g. an experience page) 500s.
          }
        },
      },
    },
  );
}
