import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { esSesionMuerta } from "@/lib/auth/sesion-rota";

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();

  // ⚠️ `getUser()` no siempre devuelve `{error}`: con un refresh token muerto
  // LANZA. Esto lo lee `caminante/layout.tsx` en CADA página, así que sin el
  // try/catch una cookie caduca tumbaba el sitio entero. Ver auth/sesion-rota.ts.
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch (e) {
    if (!esSesionMuerta(e)) throw e;
    return null;
  }
});
