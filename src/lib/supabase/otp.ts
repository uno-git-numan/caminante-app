import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getClientSupabaseEnv } from "@/lib/supabase/env";

/**
 * Cliente SÓLO para MANDAR la liga mágica por correo (`signInWithOtp`).
 *
 * ⚠️ Por qué no es el cliente SSR: `@supabase/ssr` fuerza el flujo PKCE aunque
 * se le pida `flowType: "implicit"` (medido el 7 nov 2026: el token del correo
 * salía `pkce_…` igual). Un token PKCE sólo se canjea desde el navegador que
 * pidió la liga, porque el verificador vive en SU cookie. En el teléfono el
 * correo se abre en Mail/Gmail/Safari, no en el Chrome que la pidió, y la liga
 * moría con «No pudimos completar el inicio de sesión» — así quedó Luis fuera
 * desde su iPhone. Con este cliente (sin cookies, sin sesión) el token sale
 * plano y `auth/confirm` lo canjea desde cualquier dispositivo.
 */
export function createSupabaseOtpClient() {
  const env = getClientSupabaseEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
