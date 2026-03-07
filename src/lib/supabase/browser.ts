import { createBrowserClient } from "@supabase/ssr";
import { getClientSupabaseEnv } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const env = getClientSupabaseEnv();

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
